import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformConfig {
  name: string;
  fields: {
    title?: { maxLength: number; required: boolean; label: string };
    summary?: { maxLength: number; required: boolean; label: string };
    content: { maxLength: number; required: boolean; label: string };
    tags?: { maxLength: number; required: boolean; label: string };
  };
  style: string;
  emoji: boolean;
}

const platformConfigs: Record<string, PlatformConfig> = {
  // 微信公众号：需要标题、摘要、正文
  wechat: {
    name: '微信公众号',
    fields: {
      title: { maxLength: 64, required: true, label: '标题' },
      summary: { maxLength: 120, required: false, label: '摘要' },
      content: { maxLength: 5000, required: true, label: '正文' },
    },
    style: '深度长文，专业分析，结构清晰，适合用Markdown格式',
    emoji: false,
  },
  // 小红书：需要标题、正文、标签
  xiaohongshu: {
    name: '小红书',
    fields: {
      title: { maxLength: 20, required: true, label: '标题' },
      content: { maxLength: 1000, required: true, label: '正文' },
      tags: { maxLength: 200, required: true, label: '话题标签' },
    },
    style: '种草笔记，亲切自然，多用emoji，正文分段清晰',
    emoji: true,
  },
  // 即刻：短平快
  jike: {
    name: '即刻',
    fields: {
      content: { maxLength: 500, required: true, label: '正文' },
    },
    style: '短平快，极简风格，轻松随意，适合用emoji',
    emoji: true,
  },
  // 知乎：需要标题、正文
  zhihu: {
    name: '知乎',
    fields: {
      title: { maxLength: 100, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
    },
    style: '专业问答，逻辑清晰，有深度，适合用Markdown格式',
    emoji: false,
  },
  // 朋友圈：只有正文
  pengyouquan: {
    name: '朋友圈',
    fields: {
      content: { maxLength: 2000, required: true, label: '正文' },
    },
    style: '社交分享，亲切自然，避免营销感，适合用emoji',
    emoji: true,
  },
  // 微博：正文+标签
  weibo: {
    name: '微博',
    fields: {
      content: { maxLength: 500, required: true, label: '正文' },
      tags: { maxLength: 100, required: true, label: '话题标签' },
    },
    style: '热点话题，简洁有力，互动性强，适合用emoji',
    emoji: true,
  },
  // 掘金：标题、正文、标签
  juejin: {
    name: '掘金',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
      tags: { maxLength: 100, required: true, label: '标签' },
    },
    style: '技术社区，开发者视角，代码友好，用Markdown格式',
    emoji: false,
  },
  // GitHub：README格式
  github: {
    name: 'GitHub',
    fields: {
      content: { maxLength: 2000, required: true, label: 'README内容' },
    },
    style: '英文，README格式，简洁专业，用Markdown',
    emoji: false,
  },
  // CSDN：标题、正文、标签
  csdn: {
    name: 'CSDN',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
      tags: { maxLength: 100, required: true, label: '标签' },
    },
    style: '技术博客，教程风格，详细实用，用Markdown格式',
    emoji: false,
  },
  // V2EX：只有正文
  v2ex: {
    name: 'V2EX',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 2000, required: true, label: '正文' },
    },
    style: '技术社区，简洁直接，开发者交流',
    emoji: false,
  },
  // SegmentFault：标题、正文、标签
  segmentfault: {
    name: 'SegmentFault',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
      tags: { maxLength: 100, required: true, label: '标签' },
    },
    style: '技术问答，专业详细，代码友好，用Markdown格式',
    emoji: false,
  },
  // 简书：标题、正文、标签
  jianshu: {
    name: '简书',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
      tags: { maxLength: 100, required: false, label: '标签' },
    },
    style: '文艺清新，故事性强，适合分享，适合用emoji',
    emoji: true,
  },
  // B站：标题、简介、正文
  bilibili: {
    name: 'Bilibili',
    fields: {
      title: { maxLength: 80, required: true, label: '标题' },
      summary: { maxLength: 250, required: true, label: '视频简介' },
      content: { maxLength: 1000, required: true, label: '动态文案' },
    },
    style: '视频平台，年轻化，弹幕文化，适合用emoji',
    emoji: true,
  },
  // 抖音：文案（短视频平台以视频为主，文案辅助）
  douyin: {
    name: '抖音',
    fields: {
      content: { maxLength: 500, required: true, label: '文案' },
      tags: { maxLength: 100, required: true, label: '话题标签' },
    },
    style: '短视频，节奏快，吸引眼球，适合用emoji',
    emoji: true,
  },
  // 快手：类似抖音
  kuaishou: {
    name: '快手',
    fields: {
      content: { maxLength: 500, required: true, label: '文案' },
      tags: { maxLength: 100, required: true, label: '话题标签' },
    },
    style: '短视频，接地气，真实感，适合用emoji',
    emoji: true,
  },
  // 头条号：标题、正文、标签
  toutiao: {
    name: '头条号',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
      tags: { maxLength: 100, required: false, label: '标签' },
    },
    style: '资讯平台，标题吸引人，热点追踪',
    emoji: false,
  },
  // 百家号：标题、正文、标签
  baijiahao: {
    name: '百家号',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
      tags: { maxLength: 100, required: false, label: '标签' },
    },
    style: '百度生态，SEO友好，内容丰富',
    emoji: false,
  },
  // 搜狐号：标题、正文
  sohu: {
    name: '搜狐号',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
    },
    style: '资讯门户，专业权威，新闻风格',
    emoji: false,
  },
  // 网易号：标题、正文
  netease: {
    name: '网易号',
    fields: {
      title: { maxLength: 50, required: true, label: '标题' },
      content: { maxLength: 5000, required: true, label: '正文' },
    },
    style: '品质内容，深度阅读，用户粘性高',
    emoji: false,
  },
  // Twitter/X：正文、标签
  twitter: {
    name: 'Twitter/X',
    fields: {
      content: { maxLength: 280, required: true, label: '推文' },
      tags: { maxLength: 100, required: false, label: '话题标签' },
    },
    style: '短文本，实时性强，话题标签，适合用emoji',
    emoji: true,
  },
  // LinkedIn：正文
  linkedin: {
    name: 'LinkedIn',
    fields: {
      title: { maxLength: 100, required: true, label: '标题' },
      content: { maxLength: 3000, required: true, label: '正文' },
    },
    style: '职业社交，专业商务，B2B导向',
    emoji: false,
  },
  // Product Hunt：标题、正文
  producthunt: {
    name: 'Product Hunt',
    fields: {
      title: { maxLength: 60, required: true, label: '产品名称' },
      content: { maxLength: 260, required: true, label: '产品简介' },
    },
    style: '产品发布，英文社区，创业者聚集，用英文',
    emoji: false,
  },
  // Hacker News：标题、正文
  hackernews: {
    name: 'Hacker News',
    fields: {
      title: { maxLength: 80, required: true, label: '标题' },
      content: { maxLength: 1000, required: false, label: '说明' },
    },
    style: '技术新闻，简洁直接，开发者社区',
    emoji: false,
  },
  // Reddit：标题、正文
  reddit: {
    name: 'Reddit',
    fields: {
      title: { maxLength: 300, required: true, label: '标题' },
      content: { maxLength: 40000, required: false, label: '正文' },
    },
    style: '社区讨论，细分话题，英文为主',
    emoji: false,
  },
  // Dev.to：标题、正文、标签
  devto: {
    name: 'Dev.to',
    fields: {
      title: { maxLength: 100, required: true, label: '标题' },
      content: { maxLength: 10000, required: true, label: '正文' },
      tags: { maxLength: 100, required: true, label: '标签' },
    },
    style: '开发者博客，友好社区，技术分享，用Markdown',
    emoji: true,
  },
  // Medium：标题、正文、标签
  medium: {
    name: 'Medium',
    fields: {
      title: { maxLength: 100, required: true, label: '标题' },
      content: { maxLength: 10000, required: true, label: '正文' },
      tags: { maxLength: 100, required: false, label: '标签' },
    },
    style: '长文平台，深度阅读，英文为主，用英文',
    emoji: false,
  },
  // Discord：正文
  discord: {
    name: 'Discord',
    fields: {
      content: { maxLength: 2000, required: true, label: '消息内容' },
    },
    style: '社群聊天，即时互动，频道文化，适合用emoji',
    emoji: true,
  },
  // Telegram：正文、标签
  telegram: {
    name: 'Telegram',
    fields: {
      content: { maxLength: 4096, required: true, label: '频道内容' },
      tags: { maxLength: 100, required: false, label: '标签' },
    },
    style: '频道广播，即时通讯，隐私友好，适合用emoji',
    emoji: true,
  },
};

interface GenerateRequest {
  toolName: string;
  description: string;
  platforms: string[];
  toolUrl?: string;
  highlights?: string;
  useCases?: string;
  targetUsers?: string;
  screenshots?: string[];
}

function generatePrompt(req: GenerateRequest): string {
  let prompt = `你是一个专业的多平台推广文案生成专家。请为以下工具生成各平台的推广内容。

## 工具信息
- 工具名称：${req.toolName}
- 工具描述：${req.description}`;

  if (req.highlights) {
    prompt += `\n- 产品亮点：${req.highlights}`;
  }
  if (req.useCases) {
    prompt += `\n- 使用场景：${req.useCases}`;
  }
  if (req.targetUsers) {
    prompt += `\n- 目标用户：${req.targetUsers}`;
  }
  if (req.toolUrl) {
    prompt += `\n- 产品链接：${req.toolUrl}`;
  }
  if (req.screenshots && req.screenshots.length > 0) {
    prompt += `\n- 产品截图：已提供 ${req.screenshots.length} 张截图，截图URL如下：`;
    req.screenshots.forEach((url, i) => {
      prompt += `\n  - 截图${i + 1}：${url}`;
    });
    prompt += `\n\n⚠️ 截图引用要求（非常重要）：`;
    prompt += `\n1. 在正文中适当位置插入截图引用标记，格式为：【配图1】、【配图2】等`;
    prompt += `\n2. 引用要自然，比如"如下图所示【配图1】"、"效果见【配图2】"`;
    prompt += `\n3. 每个平台的正文至少引用1-2张截图（除非平台不支持图文，如Twitter）`;
    prompt += `\n4. 在正文末尾另起一行，列出"【配图说明】"，格式示例：`;
    prompt += `\n   【配图说明】配图1=产品主界面，配图2=功能演示`;
    prompt += `\n5. 这能让用户知道发布时需要附带哪些截图`;
    prompt += `\n6. 截图数量是 ${req.screenshots.length} 张，请合理分配到正文中`;
  }

  prompt += `\n\n## 各平台内容要求\n`;

  for (const p of req.platforms) {
    const config = platformConfigs[p];
    if (!config) continue;
    prompt += `\n### ${config.name}（ID: ${p}）\n`;

    if (config.fields.title) {
      prompt += `- 需要【标题】（最多${config.fields.title.maxLength}字）\n`;
    }
    if (config.fields.summary) {
      prompt += `- 需要【摘要】（最多${config.fields.summary.maxLength}字）\n`;
    }
    prompt += `- 需要【正文】（最多${config.fields.content.maxLength}字）\n`;
    if (config.fields.tags) {
      prompt += `- 需要【标签】（最多${config.fields.tags.maxLength}字，多个标签用逗号分隔）\n`;
    }
    prompt += `- 风格：${config.style}\n`;
    prompt += `- ${config.emoji ? '需要' : '不需要'}使用emoji\n`;
  }

  prompt += `\n## 输出格式要求
请以JSON格式返回，每个平台的内容是一个对象，包含所需字段。

示例格式：
{
  "wechat": {
    "title": "标题内容",
    "summary": "摘要内容",
    "content": "正文内容"
  },
  "xiaohongshu": {
    "title": "标题内容",
    "content": "正文内容",
    "tags": "标签1,标签2,标签3"
  },
  "jike": {
    "content": "正文内容"
  }
}

注意：
1. 只返回JSON，不要其他说明文字
2. 每个字段要严格控制在字数限制内
3. 文案要吸引人，有转化力，突出产品价值和差异化优势
4. 如果有产品链接，请在正文中自然地融入链接
5. GitHub/Product Hunt/Hacker News/Reddit/Medium 请用英文
6. 其他中文平台请用中文
7. 正文中的换行用\\n表示`;

  return prompt;
}

function generateMockContent(prompt: string, screenshots: string[] = []): Record<string, Record<string, string>> {
  const toolNameMatch = prompt.match(/工具名称：(.+)/);
  const descMatch = prompt.match(/工具描述：(.+)/);
  const toolName = toolNameMatch ? toolNameMatch[1].trim() : '这个工具';
  const description = descMatch ? descMatch[1].trim() : '一个很棒的工具';

  const result: Record<string, Record<string, string>> = {};

  // 截图引用文本（如果有截图）
  const screenshotRef = screenshots.length > 0
    ? `\n\n【配图说明】${screenshots.map((_, i) => `配图${i + 1}=产品截图`).join('，')}`
    : '';

  // 在正文中插入截图标记
  const insertScreenshot = (content: string, idx: number = 1) => {
    if (screenshots.length === 0) return content;
    const lines = content.split('\n');
    const insertPos = Math.min(Math.floor(lines.length / 2), lines.length - 1);
    lines.splice(insertPos, 0, `【配图${idx}】`);
    return lines.join('\n');
  };

  // 为每个平台生成结构化内容
  for (const [platformId, config] of Object.entries(platformConfigs)) {
    const platformData: Record<string, string> = {};

    if (config.fields.title) {
      platformData.title = `${toolName} - ${config.name}推广`;
      if (platformData.title.length > config.fields.title.maxLength) {
        platformData.title = platformData.title.slice(0, config.fields.title.maxLength);
      }
    }

    if (config.fields.summary) {
      platformData.summary = `${description}。一键生成多平台推广文案，让好工具被更多人发现。`;
      if (platformData.summary.length > config.fields.summary.maxLength) {
        platformData.summary = platformData.summary.slice(0, config.fields.summary.maxLength);
      }
    }

    let content = '';
    if (platformId === 'wechat') {
      content = `# ${toolName}\n\n${description}\n\n【配图1】\n\n作为独立开发者，推广一直是个难题。这个工具帮你解决！\n\n## 核心功能\n1. 智能文案生成\n2. 多平台一键发布\n3. 数据效果追踪\n\n让好工具被看见！${screenshotRef}`;
    } else if (platformId === 'xiaohongshu') {
      content = `姐妹们！发现一个超好用的工具 🎉\n\n${toolName}\n${description}\n\n【配图1】\n\n✨ 亮点：\n- 操作简单\n- 效果超棒\n- 免费试用\n\n推荐给所有独立开发者！${screenshotRef}`;
    } else if (platformId === 'github') {
      content = `## ${toolName}\n\n${description}\n\n### Features\n- AI-powered content generation\n- Multi-platform publishing\n- Analytics tracking\n\n### Quick Start\n\`\`\`bash\nnpm install ${toolName.toLowerCase().replace(/\s/g, '-')}\n\`\`\`${screenshotRef}`;
    } else {
      content = `${toolName} - ${description}\n\n【配图1】\n\n推荐给所有独立开发者！\n\n核心功能：\n✓ 智能文案生成\n✓ 多平台一键发布\n✓ 数据效果追踪${screenshotRef}`;
    }

    // 如果有多个截图，在正文中多插入几个引用
    if (screenshots.length > 1 && platformId !== 'github') {
      content = insertScreenshot(content, 2);
    }

    if (content.length > config.fields.content.maxLength) {
      content = content.slice(0, config.fields.content.maxLength);
    }
    platformData.content = content;

    if (config.fields.tags) {
      platformData.tags = '独立开发者,工具推荐,效率工具';
    }

    result[platformId] = platformData;
  }

  return result;
}

async function callAI(prompt: string, screenshots: string[] = []): Promise<Record<string, Record<string, string>>> {
  const apiKey = Deno.env.get('DASHSCOPE_API_KEY');
  if (!apiKey) {
    console.log('AI API key not configured, using mock data');
    return generateMockContent(prompt, screenshots);
  }

  try {
    const response = await fetch('https://dashscope.aliyuncs.com/api/v1/services/aigc/text-generation/generation', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'qwen-turbo',
        input: {
          messages: [
            { role: 'system', content: '你是一个专业的推广文案生成专家，擅长为不同平台生成符合其风格和推广规范的结构化内容。必须严格按照用户要求的JSON格式返回。' },
            { role: 'user', content: prompt },
          ],
        },
        parameters: {
          result_format: 'message',
          max_tokens: 4000,
          temperature: 0.7,
        },
      }),
    });

    if (!response.ok) {
      console.log('AI API error, using mock data:', response.status);
      return generateMockContent(prompt, screenshots);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content;

    if (!content) {
      console.log('AI response empty, using mock data');
      return generateMockContent(prompt, screenshots);
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        for (const key of Object.keys(parsed)) {
          if (typeof parsed[key] === 'string') {
            parsed[key] = { content: parsed[key] };
          }
        }
        return parsed;
      }
      throw new Error('Invalid JSON format');
    } catch (e) {
      console.log('Failed to parse AI response, using mock data:', e);
      return generateMockContent(prompt, screenshots);
    }
  } catch (error) {
    console.log('AI call failed, using mock data:', error);
    return generateMockContent(prompt, screenshots);
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const body: GenerateRequest = await req.json();

    if (!body.toolName || !body.description || !body.platforms || !Array.isArray(body.platforms)) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: toolName, description, platforms' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const prompt = generatePrompt(body);
    const generatedContent = await callAI(prompt, body.screenshots || []);

    const result: Record<string, Record<string, string>> = {};

    for (const platform of body.platforms) {
      const config = platformConfigs[platform];
      const platformData = generatedContent[platform] || {};

      // 确保每个平台都有必要的字段
      const normalizedData: Record<string, string> = {};

      // title
      if (config?.fields.title) {
        normalizedData.title = platformData.title || `${body.toolName} - ${config.name}`;
      }

      // summary
      if (config?.fields.summary) {
        normalizedData.summary = platformData.summary || '';
      }

      // content (必需)
      normalizedData.content = platformData.content || `${body.toolName}\n\n${body.description}`;

      // tags
      if (config?.fields.tags) {
        normalizedData.tags = platformData.tags || '';
      }

      result[platform] = normalizedData;
    }

    return new Response(
      JSON.stringify({ success: true, data: result }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
