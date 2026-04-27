import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface PlatformConfig {
  name: string;
  maxLength: number;
  style: string;
  emoji: boolean;
  hashtags: boolean;
}

const platformConfigs: Record<string, PlatformConfig> = {
  wechat: {
    name: '微信公众号（需手动发布）',
    maxLength: 2000,
    style: '深度长文，专业分析，结构清晰',
    emoji: false,
    hashtags: false,
  },
  xiaohongshu: {
    name: '小红书',
    maxLength: 1000,
    style: '种草笔记，亲切自然，多用emoji',
    emoji: true,
    hashtags: true,
  },
  jike: {
    name: '即刻',
    maxLength: 500,
    style: '短平快，极简风格，轻松随意',
    emoji: true,
    hashtags: false,
  },
  zhihu: {
    name: '知乎',
    maxLength: 1500,
    style: '专业问答，逻辑清晰，有深度',
    emoji: false,
    hashtags: false,
  },
  pengyouquan: {
    name: '朋友圈（需手动发布）',
    maxLength: 200,
    style: '社交分享，亲切自然，避免营销感',
    emoji: true,
    hashtags: false,
  },
  weibo: {
    name: '微博',
    maxLength: 500,
    style: '热点话题，简洁有力，互动性强',
    emoji: true,
    hashtags: true,
  },
  juejin: {
    name: '掘金',
    maxLength: 1000,
    style: '技术社区，开发者视角，代码友好',
    emoji: false,
    hashtags: true,
  },
  github: {
    name: 'GitHub',
    maxLength: 800,
    style: '英文开源社区，README格式，简洁专业',
    emoji: false,
    hashtags: false,
  },
  csdn: {
    name: 'CSDN',
    maxLength: 1500,
    style: '技术博客，教程风格，详细实用',
    emoji: false,
    hashtags: true,
  },
  v2ex: {
    name: 'V2EX',
    maxLength: 500,
    style: '技术社区，简洁直接，开发者交流',
    emoji: false,
    hashtags: false,
  },
  segmentfault: {
    name: 'SegmentFault',
    maxLength: 1500,
    style: '技术问答，专业详细，代码友好',
    emoji: false,
    hashtags: true,
  },
  jianshu: {
    name: '简书',
    maxLength: 2000,
    style: '文艺清新，故事性强，适合分享',
    emoji: true,
    hashtags: true,
  },
  bilibili: {
    name: 'Bilibili',
    maxLength: 800,
    style: '视频平台，年轻化，弹幕文化',
    emoji: true,
    hashtags: true,
  },
  douyin: {
    name: '抖音',
    maxLength: 500,
    style: '短视频，节奏快，吸引眼球',
    emoji: true,
    hashtags: true,
  },
  kuaishou: {
    name: '快手',
    maxLength: 500,
    style: '短视频，接地气，真实感',
    emoji: true,
    hashtags: true,
  },
  toutiao: {
    name: '头条号',
    maxLength: 2000,
    style: '资讯平台，标题党，热点追踪',
    emoji: false,
    hashtags: true,
  },
  baijiahao: {
    name: '百家号',
    maxLength: 2000,
    style: '百度生态，SEO友好，内容丰富',
    emoji: false,
    hashtags: true,
  },
  sohu: {
    name: '搜狐号',
    maxLength: 2000,
    style: '资讯门户，专业权威，新闻风格',
    emoji: false,
    hashtags: true,
  },
  netease: {
    name: '网易号',
    maxLength: 2000,
    style: '品质内容，深度阅读，用户粘性高',
    emoji: false,
    hashtags: true,
  },
  twitter: {
    name: 'Twitter/X',
    maxLength: 280,
    style: '短文本，实时性强，话题标签',
    emoji: true,
    hashtags: true,
  },
  linkedin: {
    name: 'LinkedIn',
    maxLength: 3000,
    style: '职业社交，专业商务，B2B导向',
    emoji: false,
    hashtags: true,
  },
  producthunt: {
    name: 'Product Hunt',
    maxLength: 260,
    style: '产品发布，英文社区，创业者聚集',
    emoji: false,
    hashtags: false,
  },
  hackernews: {
    name: 'Hacker News',
    maxLength: 2000,
    style: '技术新闻，简洁直接，开发者社区',
    emoji: false,
    hashtags: false,
  },
  reddit: {
    name: 'Reddit',
    maxLength: 40000,
    style: '社区讨论，细分话题，英文为主',
    emoji: true,
    hashtags: false,
  },
  devto: {
    name: 'Dev.to',
    maxLength: 10000,
    style: '开发者博客，友好社区，技术分享',
    emoji: true,
    hashtags: true,
  },
  medium: {
    name: 'Medium',
    maxLength: 10000,
    style: '长文平台，深度阅读，英文为主',
    emoji: false,
    hashtags: true,
  },
  discord: {
    name: 'Discord',
    maxLength: 2000,
    style: '社群聊天，即时互动，频道文化',
    emoji: true,
    hashtags: false,
  },
  telegram: {
    name: 'Telegram',
    maxLength: 4096,
    style: '频道广播，即时通讯，隐私友好',
    emoji: true,
    hashtags: true,
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
  const platformNames = req.platforms.map(p => platformConfigs[p]?.name || p).join('、');

  let prompt = `请为以下工具生成多平台推广文案：

工具名称：${req.toolName}
工具描述：${req.description}`;

  if (req.highlights) {
    prompt += `\n产品亮点：${req.highlights}`;
  }
  if (req.useCases) {
    prompt += `\n使用场景：${req.useCases}`;
  }
  if (req.targetUsers) {
    prompt += `\n目标用户：${req.targetUsers}`;
  }
  if (req.toolUrl) {
    prompt += `\n产品链接：${req.toolUrl}`;
  }
  if (req.screenshots && req.screenshots.length > 0) {
    prompt += `\n产品截图：已提供${req.screenshots.length}张产品截图用于参考`;
  }

  prompt += `\n\n需要生成以下平台的文案：${platformNames}

请为每个平台生成符合其风格的文案：

${req.platforms.map(p => {
  const config = platformConfigs[p];
  return `${config.name}：
- 字数限制：${config.maxLength}字以内
- 风格要求：${config.style}
- ${config.emoji ? '需要' : '不需要'}使用emoji
- ${config.hashtags ? '需要' : '不需要'}添加话题标签`;
}).join('\n\n')}

请以JSON格式返回，格式如下：
{
  "wechat": "公众号文案内容",
  "xiaohongshu": "小红书文案内容",
  "jike": "即刻文案内容",
  "zhihu": "知乎文案内容",
  "pengyouquan": "朋友圈文案内容",
  "weibo": "微博文案内容",
  "juejin": "掘金文案内容",
  "github": "GitHub英文文案内容",
  "csdn": "CSDN技术博客文案内容",
  "v2ex": "V2EX社区分享文案内容"
}

注意：
1. 只返回JSON，不要其他说明文字
2. 每个平台的文案要符合其特点
3. 文案要吸引人，有转化力，突出产品价值和差异化优势
4. 如果有产品链接，请在文案中自然地融入链接
5. GitHub版本请用英文`;

  return prompt;
}

function generateMockContent(prompt: string): Record<string, string> {
  const toolNameMatch = prompt.match(/工具名称：(.+)/);
  const descMatch = prompt.match(/工具描述：(.+)/);
  const toolName = toolNameMatch ? toolNameMatch[1].trim() : '这个工具';
  const description = descMatch ? descMatch[1].trim() : '一个很棒的工具';

  return {
    wechat: `【${toolName}】${description}\n\n作为独立开发者，你是否也在为推广发愁？\n\n${toolName}帮你解决这个痛点，让好工具被看见！\n\n核心功能：\n✓ 智能文案生成\n✓ 多平台一键发布\n✓ 数据效果追踪\n\n现在就来体验吧！`,
    xiaohongshu: `姐妹们！发现一个好用的工具 🎉\n\n${toolName}\n${description}\n\n✨ 亮点：\n- 操作简单\n- 效果超棒\n- 免费试用\n\n#工具推荐 #独立开发者 #效率工具`,
    jike: `${toolName} - ${description}\n\n推荐给所有独立开发者 ⚡`,
    zhihu: `如何高效推广独立开发者的工具？\n\n推荐 ${toolName}，${description}\n\n从实际使用体验来看，这个工具确实解决了推广难题...`,
    pengyouquan: `推荐一个超实用的工具：${toolName}\n${description}\n\n独立开发者必备！🚀`,
    weibo: `#工具推荐# ${toolName} - ${description}\n\n独立开发者的福音来了！\n\n@科技数码`,
    juejin: `## ${toolName}\n\n${description}\n\n作为独立开发者，推广一直是个难题。直到发现了这个工具...\n\n使用示例：\nconst result = await promote(tool);`,
    github: `## ${toolName}\n\n${description}\n\n### Features\n- Smart content generation\n- Multi-platform publishing\n- Analytics tracking\n\n### Quick Start\nnpm install ${toolName.toLowerCase().replace(/\s/g, '-')}`,
    csdn: `## ${toolName} - ${description}\n\n### 前言\n作为独立开发者，推广自己的产品一直是个难题。今天给大家推荐一个实用的工具。\n\n### 功能介绍\n- 智能文案生成\n- 多平台一键发布\n- 数据效果追踪\n\n### 使用体验\n经过实际使用，效果非常不错...`,
    v2ex: `${toolName} - ${description}\n\n推荐给各位独立开发者，推广利器！`,
    segmentfault: `## ${toolName}\n\n${description}\n\n### 问题背景\n独立开发者在推广产品时常常面临渠道分散、效率低下的问题。\n\n### 解决方案\n${toolName}提供了完整的推广解决方案...\n\n### 技术亮点\n- 智能内容生成\n- 多平台适配\n- 数据追踪分析`,
    jianshu: `# ${toolName} - 独立开发者的推广神器\n\n${description}\n\n作为一个独立开发者，我深知推广的不易。直到遇见了${toolName}...\n\n它改变了我的工作方式，让推广变得简单而高效。\n\n如果你也是独立开发者，强烈推荐试试！`,
    bilibili: `【独立开发者必看】${toolName} - ${description}\n\n家人们！发现一个好用的工具 🎉\n\n✨ 亮点：\n- 操作简单\n- 效果超棒\n- 免费试用\n\n#工具推荐 #独立开发者 #效率工具`,
    douyin: `🔥 独立开发者福音！${toolName}\n\n${description}\n\n✨ 太香了！\n👆 点击了解\n💬 评论区交流\n\n#独立开发者 #工具推荐 #效率神器`,
    kuaishou: `老铁们，推荐个好东西！${toolName}\n\n${description}\n\n真实好用，不忽悠！\n\n#独立开发者 #工具推荐`,
    toutiao: `【重磅推荐】${toolName} - ${description}\n\n独立开发者的福音来了！这个工具让推广变得超简单...\n\n核心功能：\n1. 智能文案生成\n2. 多平台一键发布\n3. 数据效果追踪\n\n#独立开发者 #工具推荐`,
    baijiahao: `## ${toolName} - ${description}\n\n作为独立开发者，推广一直是个难题。今天给大家推荐一个实用的解决方案。\n\n### 产品特色\n- AI智能生成推广文案\n- 支持多平台一键发布\n- 实时追踪推广效果\n\n### 适用人群\n独立开发者、创业者、产品经理\n\n### 使用建议\n建议结合产品特点，选择适合的平台进行推广...`,
    sohu: `## ${toolName} - ${description}\n\n### 产品推荐\n今天给大家推荐一个实用的独立开发者工具。\n\n### 核心功能\n- 智能文案生成\n- 多平台一键发布\n- 数据效果追踪\n\n### 使用体验\n经过实际测试，效果非常不错，值得推荐给各位开发者。`,
    netease: `## ${toolName} - ${description}\n\n### 深度体验\n作为独立开发者，我一直在寻找高效的推广工具。${toolName}给了我惊喜。\n\n### 产品亮点\n- 操作简单直观\n- 支持多平台同步\n- 数据分析全面\n\n### 总结\n这是一款值得尝试的推广利器。`,
    twitter: `🚀 ${toolName} - ${description}\n\nPerfect tool for indie developers!\n\n✨ Features:\n- AI content generation\n- Multi-platform publishing\n- Analytics tracking\n\n#IndieDev #DevTools #Productivity`,
    linkedin: `Excited to share ${toolName} - ${description}\n\nAs an indie developer, finding the right marketing tools is crucial. This solution has been a game-changer for me.\n\nKey benefits:\n✓ Streamlined content creation\n✓ Multi-platform distribution\n✓ Performance analytics\n\nPerfect for developers looking to grow their audience.\n\n#IndieDev #DeveloperTools #Marketing`,
    producthunt: `${toolName} - ${description}\n\nThe ultimate marketing tool for indie developers. Generate content and publish to multiple platforms with one click.`,
    hackernews: `${toolName} - ${description}\n\nA marketing automation tool designed specifically for indie developers.\n\nKey features:\n- AI-powered content generation\n- Multi-platform publishing\n- Analytics and tracking\n\nWould love to hear your thoughts!`,
    reddit: `Hey r/startups!\n\nI built ${toolName} - ${description}\n\nAs a solo developer, marketing was always my biggest challenge. So I created this tool to help fellow indie devs promote their products more efficiently.\n\nKey features:\n- AI content generation tailored for each platform\n- One-click publishing to 30+ platforms\n- Analytics to track performance\n\nWould love your feedback!`,
    devto: `---\ntitle: ${toolName} - ${description}\npublished: true\ntags: indiedev, marketing, tools\n---\n\n## Introduction\n\nAs an indie developer, marketing has always been the hardest part of building products.\n\n## The Solution\n\n${toolName} helps developers:\n\n- Generate platform-specific content\n- Publish to multiple channels\n- Track performance metrics\n\n## Conclusion\n\nIf you're struggling with marketing, give it a try!`,
    medium: `# ${toolName}: A Marketing Tool for Indie Developers\n\n${description}\n\n## The Problem\n\nMarketing is hard. Especially for developers who'd rather be coding than writing promotional content.\n\n## The Solution\n\n${toolName} automates the marketing workflow:\n\n1. **Content Generation** - AI creates platform-specific content\n2. **Multi-Platform Publishing** - Reach audiences everywhere\n3. **Analytics** - Track what works\n\n## Final Thoughts\n\nEvery indie developer should have this in their toolkit.`,
    discord: `🎉 **${toolName}**\n\n${description}\n\n✨ Perfect for indie developers!\n\nFeatures:\n• AI content generation\n• Multi-platform publishing\n• Analytics tracking\n\nCheck it out!`,
    telegram: `📢 <b>${toolName}</b>\n\n${description}\n\n✨ Features:\n• AI-powered content generation\n• One-click multi-platform publishing\n• Detailed analytics\n\nPerfect tool for indie developers!\n\n#indiedev #devtools`,
  };
}

async function callAI(prompt: string): Promise<Record<string, string>> {
  const apiKey = Deno.env.get('DASHSCOPE_API_KEY');
  if (!apiKey) {
    console.log('AI API key not configured, using mock data');
    return generateMockContent(prompt);
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
            { role: 'system', content: '你是一个专业的推广文案生成专家，擅长为不同平台生成符合其风格的推广文案。' },
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
      return generateMockContent(prompt);
    }

    const data = await response.json();
    const content = data.output?.choices?.[0]?.message?.content;

    if (!content) {
      console.log('AI response empty, using mock data');
      return generateMockContent(prompt);
    }

    try {
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        return JSON.parse(jsonMatch[0]);
      }
      throw new Error('Invalid JSON format');
    } catch {
      const result: Record<string, string> = {};
      const lines = content.split('\n');
      let currentPlatform = '';

      for (const line of lines) {
        const platformMatch = line.match(/^["']?(wechat|xiaohongshu|jike|zhihu|pengyouquan|weibo|juejin|github|csdn|v2ex|segmentfault|jianshu|bilibili|douyin|kuaishou|toutiao|baijiahao|sohu|netease|twitter|linkedin|producthunt|hackernews|reddit|devto|medium|discord|telegram)["']?\s*[:：]/);
        if (platformMatch) {
          currentPlatform = platformMatch[1];
          result[currentPlatform] = '';
        } else if (currentPlatform && line.trim()) {
          result[currentPlatform] += line + '\n';
        }
      }

      if (Object.keys(result).length === 0) {
        return generateMockContent(prompt);
      }

      return result;
    }
  } catch (error) {
    console.log('AI call failed, using mock data:', error);
    return generateMockContent(prompt);
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
    const generatedContent = await callAI(prompt);

    const result: Record<string, { content: string; title?: string }> = {};

    for (const platform of body.platforms) {
      const content = generatedContent[platform] || '';
      const lines = content.split('\n').filter(l => l.trim());
      const title = lines[0]?.replace(/^#+\s*/, '').replace(/[""]/g, '').trim();

      result[platform] = {
        content: content.trim(),
        title: title || `${body.toolName} - ${platformConfigs[platform]?.name || platform}`,
      };
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
