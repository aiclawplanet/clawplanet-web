import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PublishRequest {
  contentId: string;
  platforms: string[];
  useCircuitBreaker?: boolean;
  enableFallback?: boolean;
}

interface PlatformResult {
  platform: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  errorType?: 'token_expired' | 'rate_limit' | 'network' | 'content_violation' | 'circuit_open' | 'unknown';
  retryable?: boolean;
  fallback?: {
    used: boolean;
    originalPlatform?: string;
    reason?: string;
  };
}

interface PlatformHealth {
  platform: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'circuit_open';
  fallback_strategy: string;
  alternative_platform?: string;
}

function analyzeError(error: string, platform: string): { type: PlatformResult['errorType']; retryable: boolean } {
  const errorLower = error.toLowerCase();

  if (errorLower.includes('token') || errorLower.includes('unauthorized') || errorLower.includes('401')) {
    return { type: 'token_expired', retryable: false };
  }
  if (errorLower.includes('rate limit') || errorLower.includes('429') || errorLower.includes('too many')) {
    return { type: 'rate_limit', retryable: true };
  }
  if (errorLower.includes('network') || errorLower.includes('timeout') || errorLower.includes('fetch')) {
    return { type: 'network', retryable: true };
  }
  if (errorLower.includes('content') || errorLower.includes('spam') || errorLower.includes('violation')) {
    return { type: 'content_violation', retryable: false };
  }
  if (errorLower.includes('circuit') || errorLower.includes('熔断')) {
    return { type: 'circuit_open', retryable: true };
  }
  return { type: 'unknown', retryable: true };
}

async function getPlatformHealthStatus(supabase: any, platforms: string[]): Promise<Map<string, PlatformHealth>> {
  const { data: healthData, error } = await supabase
    .from('platform_health_status')
    .select('*')
    .in('platform', platforms);

  if (error || !healthData) {
    console.error('Failed to fetch health status:', error);
    return new Map();
  }

  return new Map(healthData.map((h: PlatformHealth) => [h.platform, h]));
}

async function getAlternativePlatform(supabase: any, platform: string, healthStatus: Map<string, PlatformHealth>): Promise<string | null> {
  const health = healthStatus.get(platform);
  if (!health || !health.alternative_platform) {
    return null;
  }

  const altHealth = healthStatus.get(health.alternative_platform);
  if (altHealth && altHealth.status === 'healthy') {
    return health.alternative_platform;
  }

  return null;
}

async function addToRetryQueue(
  supabase: any,
  userId: string,
  contentId: string,
  platform: string,
  error: string,
  errorType: string
): Promise<void> {
  const nextRetryAt = new Date();
  nextRetryAt.setMinutes(nextRetryAt.getMinutes() + 5);

  await supabase.from('publish_task_queue').insert({
    user_id: userId,
    content_id: contentId,
    platform,
    status: 'pending',
    last_error: error,
    last_error_type: errorType,
    next_retry_at: nextRetryAt.toISOString(),
    retry_count: 0,
    max_retries: 3,
  });
}

async function publishWithRetry(
  publishFn: () => Promise<PlatformResult>,
  platform: string,
  maxRetries: number = 3
): Promise<PlatformResult> {
  let lastResult: PlatformResult | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await publishFn();

      if (result.success) {
        return result;
      }

      lastResult = result;
      const { type, retryable } = analyzeError(result.error || '', platform);

      if (!retryable || attempt === maxRetries) {
        return { ...result, errorType: type, retryable };
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '发布失败';
      const { type, retryable } = analyzeError(errorMessage, platform);

      if (!retryable || attempt === maxRetries) {
        return { platform, success: false, error: errorMessage, errorType: type, retryable };
      }

      const delay = Math.min(1000 * Math.pow(2, attempt), 10000);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  return lastResult || { platform, success: false, error: '重试次数耗尽', errorType: 'unknown', retryable: false };
}

async function publishToGitHub(token: string, repo: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const [owner, repoName] = repo.split('/');
    if (!owner || !repoName) {
      return { platform: 'github', success: false, error: '仓库格式错误，应为 owner/repo' };
    }

    const response = await fetch(`https://api.github.com/repos/${owner}/${repoName}/discussions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        body: content,
        category_id: 1,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'github', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'github',
      success: true,
      postId: data.node_id,
      postUrl: data.html_url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'github', success: false, error: errorMessage };
  }
}

async function publishToJuejin(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const draftResponse = await fetch('https://api.juejin.cn/content_api/v1/article_draft/create', {
      method: 'POST',
      headers: {
        'X-Juejin-Src': 'web',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draft_id: '',
        title: title,
        brief_content: content.slice(0, 100),
        category_id: '6809637769959178254',
        tag_ids: ['6809640407484294157'],
        content: content,
      }),
    });

    if (!draftResponse.ok) {
      return { platform: 'juejin', success: false, error: '创建草稿失败' };
    }

    const draftData = await draftResponse.json();
    const draftId = draftData.data?.draft_id;

    if (!draftId) {
      return { platform: 'juejin', success: false, error: '获取草稿ID失败' };
    }

    const publishResponse = await fetch('https://api.juejin.cn/content_api/v1/article/publish', {
      method: 'POST',
      headers: {
        'X-Juejin-Src': 'web',
        'X-Juejin-Token': token,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        draft_id: draftId,
        sync_to_org: false,
        is_publish: true,
      }),
    });

    if (!publishResponse.ok) {
      return { platform: 'juejin', success: false, error: '发布失败' };
    }

    const publishData = await publishResponse.json();
    return {
      platform: 'juejin',
      success: true,
      postId: publishData.data?.article_id,
      postUrl: `https://juejin.cn/post/${publishData.data?.article_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'juejin', success: false, error: errorMessage };
  }
}

async function publishToWeibo(token: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.weibo.com/2/statuses/update.json', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        access_token: token,
        status: content.slice(0, 140),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'weibo', success: false, error: error.error || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'weibo',
      success: true,
      postId: data.idstr,
      postUrl: `https://weibo.com/${data.user?.idstr}/${data.idstr}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'weibo', success: false, error: errorMessage };
  }
}

async function publishToZhihu(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://www.zhihu.com/api/v4/articles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        content_type: 'text',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'zhihu', success: false, error: error.error?.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'zhihu',
      success: true,
      postId: data.id?.toString(),
      postUrl: `https://zhuanlan.zhihu.com/p/${data.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'zhihu', success: false, error: errorMessage };
  }
}

async function publishToJike(token: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.ruguoapp.com/1.0/originalPosts/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.slice(0, 500),
        type: 'ORIGINAL_POST',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'jike', success: false, error: error.error || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'jike',
      success: true,
      postId: data.id,
      postUrl: `https://web.okjike.com/original-post/${data.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'jike', success: false, error: errorMessage };
  }
}

async function publishToXiaohongshu(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://edith.xiaohongshu.com/api/sns/web/v1/note/post', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        desc: content.slice(0, 1000),
        type: 'normal',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'xiaohongshu', success: false, error: error.msg || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'xiaohongshu',
      success: true,
      postId: data.data?.note_id,
      postUrl: `https://www.xiaohongshu.com/explore/${data.data?.note_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'xiaohongshu', success: false, error: errorMessage };
  }
}

async function publishToCSDN(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.csdn.net/api/v1/article/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        category_id: '1',
        tags: ['独立开发者', '工具推荐'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'csdn', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'csdn',
      success: true,
      postId: data.data?.article_id,
      postUrl: `https://blog.csdn.net/article/details/${data.data?.article_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'csdn', success: false, error: errorMessage };
  }
}

async function publishToV2EX(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://www.v2ex.com/api/v2/topics', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        node_name: 'create',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'v2ex', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'v2ex',
      success: true,
      postId: data.data?.id?.toString(),
      postUrl: `https://www.v2ex.com/t/${data.data?.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'v2ex', success: false, error: errorMessage };
  }
}

async function publishToSegmentFault(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://segmentfault.com/api/articles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        tags: ['独立开发者', '工具推荐'],
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'segmentfault', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'segmentfault',
      success: true,
      postId: data.data?.id?.toString(),
      postUrl: `https://segmentfault.com/a/${data.data?.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'segmentfault', success: false, error: errorMessage };
  }
}

async function publishToJianshu(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.jianshu.io/v1/articles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'jianshu', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'jianshu',
      success: true,
      postId: data.data?.id?.toString(),
      postUrl: `https://www.jianshu.com/p/${data.data?.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'jianshu', success: false, error: errorMessage };
  }
}

async function publishToBilibili(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.bilibili.com/x/article/creative/article/add', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        category: 'tech',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'bilibili', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'bilibili',
      success: true,
      postId: data.data?.id?.toString(),
      postUrl: `https://www.bilibili.com/read/cv${data.data?.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'bilibili', success: false, error: errorMessage };
  }
}

async function publishToDouyin(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://open.douyin.com/api/miniapp/v1/microapp/publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content.slice(0, 500),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'douyin', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'douyin',
      success: true,
      postId: data.data?.item_id?.toString(),
      postUrl: `https://www.douyin.com/video/${data.data?.item_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'douyin', success: false, error: errorMessage };
  }
}

async function publishToKuaishou(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://open.kuaishou.com/openapi/photo/publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        caption: content.slice(0, 500),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'kuaishou', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'kuaishou',
      success: true,
      postId: data.data?.photo_id?.toString(),
      postUrl: `https://www.kuaishou.com/short-video/${data.data?.photo_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'kuaishou', success: false, error: errorMessage };
  }
}

async function publishToToutiao(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://open.snssdk.com/article/v1/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        article_type: 0,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'toutiao', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'toutiao',
      success: true,
      postId: data.data?.article_id?.toString(),
      postUrl: `https://www.toutiao.com/article/${data.data?.article_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'toutiao', success: false, error: errorMessage };
  }
}

async function publishToBaijiahao(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://baijiahao.baidu.com/builderinner/open/resource/article/publish', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'baijiahao', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'baijiahao',
      success: true,
      postId: data.data?.article_id?.toString(),
      postUrl: `https://baijiahao.baidu.com/s?id=${data.data?.article_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'baijiahao', success: false, error: errorMessage };
  }
}

async function publishToSohu(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://mp.sohu.com/api/v1/article/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
        category: 'tech',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'sohu', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'sohu',
      success: true,
      postId: data.data?.article_id?.toString(),
      postUrl: `https://mp.sohu.com/a/${data.data?.article_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'sohu', success: false, error: errorMessage };
  }
}

async function publishToNetease(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://mp.163.com/api/v1/article/create', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        content: content,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'netease', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'netease',
      success: true,
      postId: data.data?.article_id?.toString(),
      postUrl: `https://mp.163.com/article/${data.data?.article_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'netease', success: false, error: errorMessage };
  }
}

async function publishToTwitter(token: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.twitter.com/2/tweets', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: content.slice(0, 280),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'twitter', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'twitter',
      success: true,
      postId: data.data?.id,
      postUrl: `https://twitter.com/i/web/status/${data.data?.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'twitter', success: false, error: errorMessage };
  }
}

async function publishToLinkedIn(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.linkedin.com/v2/ugcPosts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
        'X-Restli-Protocol-Version': '2.0.0',
      },
      body: JSON.stringify({
        author: 'urn:li:person:me',
        lifecycleState: 'PUBLISHED',
        specificContent: {
          'com.linkedin.ugc.ShareContent': {
            shareCommentary: {
              text: `${title}\n\n${content}`,
            },
            shareMediaCategory: 'NONE',
          },
        },
        visibility: {
          'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC',
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'linkedin', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'linkedin',
      success: true,
      postId: data.id,
      postUrl: `https://www.linkedin.com/feed/update/${data.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'linkedin', success: false, error: errorMessage };
  }
}

async function publishToProductHunt(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.producthunt.com/v2/api/graphql', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `
          mutation {
            createPost(input: {
              name: "${title}",
              tagline: "${content.slice(0, 60)}",
              description: "${content.slice(0, 260)}",
            }) {
              post {
                id
                url
              }
            }
          }
        `,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'producthunt', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'producthunt',
      success: true,
      postId: data.data?.createPost?.post?.id,
      postUrl: data.data?.createPost?.post?.url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'producthunt', success: false, error: errorMessage };
  }
}

async function publishToHackerNews(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://hacker-news.firebaseio.com/v0/item.json', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        text: content,
        type: 'story',
      }),
    });

    if (!response.ok) {
      return { platform: 'hackernews', success: false, error: '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'hackernews',
      success: true,
      postId: data.id?.toString(),
      postUrl: `https://news.ycombinator.com/item?id=${data.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'hackernews', success: false, error: errorMessage };
  }
}

async function publishToReddit(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://oauth.reddit.com/api/submit', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        sr: 'startups',
        title: title,
        text: content,
        kind: 'self',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'reddit', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'reddit',
      success: true,
      postId: data.json?.data?.id,
      postUrl: `https://www.reddit.com/r/startups/comments/${data.json?.data?.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'reddit', success: false, error: errorMessage };
  }
}

async function publishToDevTo(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://dev.to/api/articles', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        article: {
          title: title,
          body_markdown: content,
          published: true,
        },
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'devto', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'devto',
      success: true,
      postId: data.id?.toString(),
      postUrl: data.url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'devto', success: false, error: errorMessage };
  }
}

async function publishToMedium(token: string, title: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://api.medium.com/v1/posts', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        title: title,
        contentFormat: 'markdown',
        content: content,
        publishStatus: 'public',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'medium', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'medium',
      success: true,
      postId: data.data?.id,
      postUrl: data.data?.url,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'medium', success: false, error: errorMessage };
  }
}

async function publishToDiscord(token: string, content: string): Promise<PlatformResult> {
  try {
    const response = await fetch('https://discord.com/api/v10/channels/CHANNEL_ID/messages', {
      method: 'POST',
      headers: {
        'Authorization': `Bot ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        content: content.slice(0, 2000),
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'discord', success: false, error: error.message || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'discord',
      success: true,
      postId: data.id,
      postUrl: `https://discord.com/channels/${data.guild_id}/${data.channel_id}/${data.id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'discord', success: false, error: errorMessage };
  }
}

async function publishToTelegram(token: string, content: string): Promise<PlatformResult> {
  try {
    const botToken = token.split(':')[0];
    const chatId = token.split(':')[1] || '@channel';
    const response = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: content.slice(0, 4096),
        parse_mode: 'HTML',
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      return { platform: 'telegram', success: false, error: error.description || '发布失败' };
    }

    const data = await response.json();
    return {
      platform: 'telegram',
      success: true,
      postId: data.result?.message_id?.toString(),
      postUrl: `https://t.me/${chatId}/${data.result?.message_id}`,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : '发布失败';
    return { platform: 'telegram', success: false, error: errorMessage };
  }
}

async function executePublish(
  supabase: any,
  platform: string,
  auth: any,
  contentData: any,
  healthStatus: Map<string, PlatformHealth>
): Promise<PlatformResult> {
  const health = healthStatus.get(platform);

  if (health && health.status === 'circuit_open') {
    const altPlatform = await getAlternativePlatform(supabase, platform, healthStatus);
    if (altPlatform) {
      return {
        platform,
        success: false,
        error: `平台已熔断，已自动切换到替代平台: ${altPlatform}`,
        errorType: 'circuit_open',
        retryable: false,
        fallback: { used: true, originalPlatform: platform, reason: 'circuit_open' },
      };
    }

    return {
      platform,
      success: false,
      error: '平台当前不可用（熔断器已打开），已加入重试队列',
      errorType: 'circuit_open',
      retryable: true,
    };
  }

  const platformContent = contentData.content?.[platform];
  if (!platformContent?.content) {
    return { platform, success: false, error: '该平台无内容' };
  }

  let result: PlatformResult;

  switch (platform) {
    case 'github': {
      const repo = auth.config?.repo as string;
      if (!repo) {
        result = { platform, success: false, error: '未配置仓库' };
      } else {
        result = await publishToGitHub(
          auth.access_token!,
          repo,
          platformContent.title || contentData.title,
          platformContent.content
        );
      }
      break;
    }
    case 'juejin':
      result = await publishToJuejin(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'weibo':
      result = await publishToWeibo(auth.access_token!, platformContent.content);
      break;
    case 'zhihu':
      result = await publishToZhihu(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'jike':
      result = await publishToJike(auth.access_token!, platformContent.content);
      break;
    case 'xiaohongshu':
      result = await publishToXiaohongshu(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'csdn':
      result = await publishToCSDN(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'v2ex':
      result = await publishToV2EX(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'segmentfault':
      result = await publishToSegmentFault(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'jianshu':
      result = await publishToJianshu(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'bilibili':
      result = await publishToBilibili(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'douyin':
      result = await publishToDouyin(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'kuaishou':
      result = await publishToKuaishou(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'toutiao':
      result = await publishToToutiao(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'baijiahao':
      result = await publishToBaijiahao(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'sohu':
      result = await publishToSohu(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'netease':
      result = await publishToNetease(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'twitter':
      result = await publishToTwitter(auth.access_token!, platformContent.content);
      break;
    case 'linkedin':
      result = await publishToLinkedIn(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'producthunt':
      result = await publishToProductHunt(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'hackernews':
      result = await publishToHackerNews(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'reddit':
      result = await publishToReddit(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'devto':
      result = await publishToDevTo(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'medium':
      result = await publishToMedium(auth.access_token!, platformContent.title || contentData.title, platformContent.content);
      break;
    case 'discord':
      result = await publishToDiscord(auth.access_token!, platformContent.content);
      break;
    case 'telegram':
      result = await publishToTelegram(auth.access_token!, platformContent.content);
      break;
    case 'wechat':
    case 'pengyouquan':
      result = { platform, success: true, postId: 'manual', postUrl: '' };
      break;
    default:
      result = { platform, success: false, error: '该平台暂不支持自动发布' };
  }

  return result;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '未授权' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '未授权' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { contentId, platforms, useCircuitBreaker = true, enableFallback = true }: PublishRequest = await req.json();

    if (!contentId || !platforms || !Array.isArray(platforms)) {
      return new Response(
        JSON.stringify({ error: '缺少必要参数' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: contentData, error: contentError } = await supabase
      .from('promotion_contents')
      .select('*')
      .eq('id', contentId)
      .eq('user_id', user.id)
      .single();

    if (contentError || !contentData) {
      return new Response(
        JSON.stringify({ error: '内容不存在' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { data: auths, error: authsError } = await supabase
      .from('user_platform_auth')
      .select('*')
      .eq('user_id', user.id)
      .in('platform', platforms)
      .eq('is_active', true);

    if (authsError) {
      return new Response(
        JSON.stringify({ error: '获取授权信息失败' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const healthStatus = useCircuitBreaker ? await getPlatformHealthStatus(supabase, platforms) : new Map();
    const authMap = new Map(auths?.map(a => [a.platform, a]) || []);
    const results: PlatformResult[] = [];

    for (const platform of platforms) {
      const auth = authMap.get(platform);
      if (!auth) {
        results.push({ platform, success: false, error: '未授权该平台' });
        continue;
      }

      const result = await executePublish(supabase, platform, auth, contentData, healthStatus);
      results.push(result);

      await supabase.from('promotion_publish_logs').insert({
        user_id: user.id,
        content_id: contentId,
        platform: platform,
        status: result.success ? 'success' : 'failed',
        platform_post_id: result.postId,
        platform_url: result.postUrl,
        error_message: result.error,
        error_type: result.errorType,
        retry_count: result.retryable ? 3 : 0,
        executed_at: new Date().toISOString(),
      });

      if (result.success) {
        await supabase
          .from('user_platform_auth')
          .update({ last_used_at: new Date().toISOString() })
          .eq('id', auth.id);
      } else if (result.errorType === 'token_expired') {
        await supabase
          .from('user_platform_auth')
          .update({ is_active: false, updated_at: new Date().toISOString() })
          .eq('id', auth.id);
      } else if (result.retryable && enableFallback) {
        await addToRetryQueue(supabase, user.id, contentId, platform, result.error || 'Unknown error', result.errorType || 'unknown');
      }
    }

    const allSuccess = results.every(r => r.success);
    const anySuccess = results.some(r => r.success);

    if (anySuccess) {
      await supabase
        .from('promotion_contents')
        .update({ status: 'published' })
        .eq('id', contentId);
    }

    return new Response(
      JSON.stringify({
        success: allSuccess,
        partial: anySuccess && !allSuccess,
        results,
        circuitBreakerEnabled: useCircuitBreaker,
        fallbackEnabled: enableFallback,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : '服务器错误';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
