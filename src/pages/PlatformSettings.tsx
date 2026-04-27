import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Link2, Check, AlertCircle, ExternalLink, Loader2, Trash2, BarChart3 } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type PlatformAuth = Tables<'user_platform_auth'>;

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  abbr: string;
  color: string;
  bgColor: string;
  description: string;
  authType: 'oauth' | 'token' | 'manual';
  authUrl?: string;
  docsUrl: string;
  fields: { key: string; label: string; placeholder: string; type?: string }[];
  manualReason?: string;
  setupSteps?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
}

const platforms: PlatformConfig[] = [
  {
    id: 'github',
    name: 'GitHub',
    icon: 'GitHub',
    abbr: 'GH',
    color: '#FFFFFF',
    bgColor: 'bg-[#333333]',
    description: '发布到 GitHub Discussions 或创建 Release',
    authType: 'token',
    docsUrl: 'https://github.com/settings/tokens',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: 'Personal Access Token', placeholder: 'ghp_xxxxxxxxxxxxxxxxxxxx', type: 'password' },
      { key: 'repo', label: '仓库名 (格式: owner/repo)', placeholder: 'username/repo-name' },
    ],
    setupSteps: [
      '访问 GitHub Settings → Developer settings → Personal access tokens',
      '点击 Generate new token (classic)',
      '勾选 repo 和 discussions 权限',
      '生成后复制 Token 粘贴到上方输入框',
      '填写要发布的仓库名（格式：用户名/仓库名）',
      '点击保存完成授权',
    ],
  },
  {
    id: 'juejin',
    name: '掘金',
    icon: '掘金',
    abbr: '掘金',
    color: '#1E80FF',
    bgColor: 'bg-[#1E80FF]',
    description: '发布技术文章到掘金社区',
    authType: 'token',
    docsUrl: 'https://juejin.cn/user/settings/token',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: '掘金 API Token', placeholder: '从掘金设置页获取', type: 'password' },
    ],
    setupSteps: [
      '访问掘金官网并登录',
      '进入个人设置页 → 账号设置 → API Token',
      '点击生成 Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'v2ex',
    name: 'V2EX',
    icon: 'V2EX',
    abbr: 'V2',
    color: '#1E80FF',
    bgColor: 'bg-[#1E80FF]',
    description: '发布到V2EX技术社区',
    authType: 'token',
    docsUrl: 'https://www.v2ex.com/settings/tokens',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: 'V2EX Token', placeholder: '从V2EX设置页获取', type: 'password' },
    ],
    setupSteps: [
      '访问V2EX并登录',
      '进入设置页 → Personal Access Token',
      '生成 Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'devto',
    name: 'Dev.to',
    icon: 'DEV',
    abbr: 'DEV',
    color: '#FFFFFF',
    bgColor: 'bg-[#0D0D0D]',
    description: '发布到Dev.to开发者社区',
    authType: 'token',
    docsUrl: 'https://dev.to/settings/extensions',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: 'Dev.to API Key', placeholder: '从Dev.to设置页获取', type: 'password' },
    ],
    setupSteps: [
      '访问 Dev.to 并登录',
      '进入 Settings → Extensions',
      '生成 API Key',
      '复制 Key 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'medium',
    name: 'Medium',
    icon: 'M',
    abbr: 'M',
    color: '#FFFFFF',
    bgColor: 'bg-[#121212]',
    description: '发布到Medium',
    authType: 'token',
    docsUrl: 'https://medium.com/me/settings',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: 'Medium Integration Token', placeholder: '从Medium设置页获取', type: 'password' },
    ],
    setupSteps: [
      '访问 Medium 并登录',
      '进入 Settings → Integration tokens',
      '生成 Integration Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'hackernews',
    name: 'Hacker News',
    icon: 'HN',
    abbr: 'HN',
    color: '#FF6600',
    bgColor: 'bg-[#FF6600]',
    description: '发布到Hacker News',
    authType: 'token',
    docsUrl: 'https://github.com/HackerNews/API',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: 'Hacker News Token', placeholder: '可选，用于更高频次发布', type: 'password' },
    ],
    setupSteps: [
      'Hacker News 使用公开 API',
      'Token 可选，用于更高频次发布',
      '如需 Token，联系 HN 管理员',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'weibo',
    name: '微博',
    icon: '微博',
    abbr: '微博',
    color: '#E6162D',
    bgColor: 'bg-[#E6162D]',
    description: '发布到微博',
    authType: 'token',
    docsUrl: 'https://open.weibo.com/',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: '微博 Access Token', placeholder: '从微博开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问微博开放平台并登录',
      '创建应用并获取 App Key 和 App Secret',
      '通过 OAuth2 授权获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'xiaohongshu',
    name: '小红书',
    icon: '小红书',
    abbr: '小红书',
    color: '#FF2442',
    bgColor: 'bg-[#FF2442]',
    description: '发布笔记到小红书',
    authType: 'token',
    docsUrl: 'https://open.xiaohongshu.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '小红书 Access Token', placeholder: '从小红书开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问小红书开放平台并登录',
      '注册开发者账号并创建应用',
      '提交审核获取 API 权限（个人较难通过）',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'zhihu',
    name: '知乎',
    icon: '知乎',
    abbr: '知乎',
    color: '#0084FF',
    bgColor: 'bg-[#0084FF]',
    description: '发布回答或文章到知乎',
    authType: 'token',
    docsUrl: 'https://open.zhihu.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '知乎 Access Token', placeholder: '从知乎开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问知乎开放平台并登录',
      '注册开发者账号并创建应用',
      '申请内容发布权限（需企业资质）',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'jike',
    name: '即刻',
    icon: '即刻',
    abbr: '即刻',
    color: '#FFE411',
    bgColor: 'bg-[#FFE411]',
    description: '发布动态到即刻',
    authType: 'token',
    docsUrl: 'https://developer.okjike.com/',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: '即刻 Access Token', placeholder: '从即刻开发者平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问即刻开发者平台并登录',
      '创建应用获取 App Key 和 App Secret',
      '通过 OAuth2 授权流程获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'csdn',
    name: 'CSDN',
    icon: 'CSDN',
    abbr: 'CSDN',
    color: '#FC5531',
    bgColor: 'bg-[#FC5531]',
    description: '发布技术博客到CSDN',
    authType: 'token',
    docsUrl: 'https://open.csdn.net/',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'CSDN Access Token', placeholder: '从CSDN开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问CSDN开放平台并登录',
      '注册开发者账号并创建应用',
      '申请内容发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'segmentfault',
    name: 'SegmentFault',
    icon: '思否',
    abbr: 'SF',
    color: '#009A61',
    bgColor: 'bg-[#009A61]',
    description: '发布技术问答到思否',
    authType: 'token',
    docsUrl: 'https://segmentfault.com/user/settings',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'SegmentFault Token', placeholder: '从思否设置页获取', type: 'password' },
    ],
    setupSteps: [
      '访问SegmentFault并登录',
      '进入个人设置页',
      '生成 Personal Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'jianshu',
    name: '简书',
    icon: '简书',
    abbr: '简书',
    color: '#EA6F5A',
    bgColor: 'bg-[#EA6F5A]',
    description: '发布文章到简书',
    authType: 'token',
    docsUrl: 'https://www.jianshu.com/settings',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: '简书 Token', placeholder: '从简书设置页获取', type: 'password' },
    ],
    setupSteps: [
      '访问简书并登录',
      '进入设置页',
      '生成 API Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'bilibili',
    name: 'Bilibili',
    icon: 'B站',
    abbr: 'B站',
    color: '#00A1D6',
    bgColor: 'bg-[#00A1D6]',
    description: '发布专栏到B站',
    authType: 'token',
    docsUrl: 'https://open.bilibili.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: 'B站 Access Token', placeholder: '从B站开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问B站开放平台并登录',
      '注册开发者账号并创建应用',
      '申请专栏发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'toutiao',
    name: '头条号',
    icon: '头条',
    abbr: '头条',
    color: '#ED4040',
    bgColor: 'bg-[#ED4040]',
    description: '发布到今日头条',
    authType: 'token',
    docsUrl: 'https://open.douyin.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '头条 Access Token', placeholder: '从字节开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问字节跳动开放平台并登录',
      '注册开发者账号并创建应用',
      '申请内容发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'baijiahao',
    name: '百家号',
    icon: '百家',
    abbr: '百家',
    color: '#2932E1',
    bgColor: 'bg-[#2932E1]',
    description: '发布到百度百家号',
    authType: 'token',
    docsUrl: 'https://baijiahao.baidu.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '百家号 Token', placeholder: '从百家号开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问百家号开放平台并登录',
      '注册开发者账号并创建应用',
      '申请内容发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'sohu',
    name: '搜狐号',
    icon: '搜狐',
    abbr: '搜狐',
    color: '#FF8200',
    bgColor: 'bg-[#FF8200]',
    description: '发布到搜狐自媒体',
    authType: 'token',
    docsUrl: 'https://mp.sohu.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '搜狐号 Token', placeholder: '从搜狐号开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问搜狐号开放平台并登录',
      '注册开发者账号并创建应用',
      '申请内容发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'netease',
    name: '网易号',
    icon: '网易',
    abbr: '网易',
    color: '#C41E3A',
    bgColor: 'bg-[#C41E3A]',
    description: '发布到网易自媒体',
    authType: 'token',
    docsUrl: 'https://mp.163.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '网易号 Token', placeholder: '从网易号开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问网易号开放平台并登录',
      '注册开发者账号并创建应用',
      '申请内容发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    icon: 'X',
    abbr: 'X',
    color: '#FFFFFF',
    bgColor: 'bg-[#000000]',
    description: '发布到Twitter',
    authType: 'token',
    docsUrl: 'https://developer.twitter.com/',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'Twitter Bearer Token', placeholder: '从Twitter开发者平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问 Twitter Developer Portal 并登录',
      '创建 Project 和 App',
      '生成 Bearer Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    icon: 'in',
    abbr: 'in',
    color: '#0A66C2',
    bgColor: 'bg-[#0A66C2]',
    description: '发布到LinkedIn',
    authType: 'token',
    docsUrl: 'https://developer.linkedin.com/',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'LinkedIn Access Token', placeholder: '从LinkedIn开发者平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问 LinkedIn Developer Portal 并登录',
      '创建应用',
      '申请分享权限 (w_member_social)',
      '通过 OAuth2 获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'producthunt',
    name: 'Product Hunt',
    icon: 'PH',
    abbr: 'PH',
    color: '#DA552F',
    bgColor: 'bg-[#DA552F]',
    description: '发布产品到Product Hunt',
    authType: 'token',
    docsUrl: 'https://api.producthunt.com/v2/docs',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'Product Hunt Token', placeholder: '从Product Hunt开发者设置获取', type: 'password' },
    ],
    setupSteps: [
      '访问 Product Hunt 开发者设置',
      '创建应用获取 API Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'reddit',
    name: 'Reddit',
    icon: 'Reddit',
    abbr: 'R',
    color: '#FF4500',
    bgColor: 'bg-[#FF4500]',
    description: '发布到Reddit社区',
    authType: 'token',
    docsUrl: 'https://www.reddit.com/prefs/apps',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'Reddit Access Token', placeholder: '从Reddit应用设置获取', type: 'password' },
    ],
    setupSteps: [
      '访问 Reddit 应用设置',
      '创建应用获取 Client ID 和 Secret',
      '通过 OAuth2 获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'discord',
    name: 'Discord',
    icon: 'Discord',
    abbr: 'D',
    color: '#5865F2',
    bgColor: 'bg-[#5865F2]',
    description: '发布到Discord频道',
    authType: 'token',
    docsUrl: 'https://discord.com/developers/applications',
    difficulty: 'medium',
    fields: [
      { key: 'access_token', label: 'Discord Bot Token', placeholder: '从Discord开发者平台获取', type: 'password' },
      { key: 'channel_id', label: '频道ID', placeholder: '要发布的频道ID' },
    ],
    setupSteps: [
      '访问 Discord Developer Portal',
      '创建应用并添加 Bot',
      '复制 Bot Token',
      '邀请 Bot 到目标服务器',
      '获取频道 ID',
      '粘贴 Token 和频道ID到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'telegram',
    name: 'Telegram',
    icon: 'TG',
    abbr: 'TG',
    color: '#26A5E4',
    bgColor: 'bg-[#26A5E4]',
    description: '发布到Telegram频道',
    authType: 'token',
    docsUrl: 'https://core.telegram.org/bots',
    difficulty: 'easy',
    fields: [
      { key: 'access_token', label: 'Bot Token', placeholder: '格式: token:chat_id', type: 'password' },
    ],
    setupSteps: [
      '在 Telegram 中联系 @BotFather',
      '创建新 Bot 获取 Token',
      '将 Bot 添加到目标频道',
      '获取频道 ID（可使用 @userinfobot）',
      '格式：token:chat_id 粘贴到上方',
      '点击保存完成授权',
    ],
  },
  {
    id: 'wechat',
    name: '微信公众号',
    icon: '微信',
    abbr: '微信',
    color: '#07C160',
    bgColor: 'bg-[#07C160]',
    description: '发布文章到公众号',
    authType: 'manual',
    docsUrl: '#',
    difficulty: 'hard',
    fields: [],
    manualReason: '微信未开放公众号文章发布API，需使用复制功能手动粘贴到公众号后台',
  },
  {
    id: 'pengyouquan',
    name: '朋友圈',
    icon: '朋友圈',
    abbr: '朋友圈',
    color: '#07C160',
    bgColor: 'bg-[#07C160]',
    description: '分享到朋友圈',
    authType: 'manual',
    docsUrl: '#',
    difficulty: 'hard',
    fields: [],
    manualReason: '微信严格限制第三方访问朋友圈，技术上无法实现自动发布',
  },
  {
    id: 'douyin',
    name: '抖音',
    icon: '抖音',
    abbr: '抖音',
    color: '#000000',
    bgColor: 'bg-[#1a1a1a]',
    description: '发布图文到抖音',
    authType: 'token',
    docsUrl: 'https://open.douyin.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '抖音 Access Token', placeholder: '从抖音开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问抖音开放平台并登录',
      '注册开发者账号并创建应用',
      '申请图文发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
  {
    id: 'kuaishou',
    name: '快手',
    icon: '快手',
    abbr: '快手',
    color: '#FF5000',
    bgColor: 'bg-[#FF5000]',
    description: '发布图文到快手',
    authType: 'token',
    docsUrl: 'https://open.kuaishou.com/',
    difficulty: 'hard',
    fields: [
      { key: 'access_token', label: '快手 Access Token', placeholder: '从快手开放平台获取', type: 'password' },
    ],
    setupSteps: [
      '访问快手开放平台并登录',
      '注册开发者账号并创建应用',
      '申请图文发布权限',
      '审核通过后获取 Access Token',
      '复制 Token 粘贴到上方输入框',
      '点击保存完成授权',
    ],
  },
];

export function PlatformSettings() {
  const navigate = useNavigate();
  const [auths, setAuths] = useState<PlatformAuth[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [formData, setFormData] = useState<Record<string, string>>({});

  useEffect(() => {
    fetchAuths();
  }, []);

  async function fetchAuths() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('user_platform_auth')
        .select('*')
        .eq('user_id', userData.user.id);

      if (error) throw error;
      setAuths(data || []);
    } catch (error) {
      console.error('Error fetching auths:', error);
    } finally {
      setLoading(false);
    }
  }

  function getAuthForPlatform(platformId: string): PlatformAuth | undefined {
    return auths.find(a => a.platform === platformId && a.is_active);
  }

  function startEditing(platform: PlatformConfig) {
    const existing = getAuthForPlatform(platform.id);
    const initialData: Record<string, string> = {};

    platform.fields.forEach(field => {
      initialData[field.key] = existing?.config?.[field.key] as string || '';
    });

    if (platform.id === 'github' && existing?.config?.repo) {
      initialData.repo = existing.config.repo as string;
    }

    setFormData(initialData);
    setEditingPlatform(platform.id);
  }

  async function saveAuth(platform: PlatformConfig) {
    setSaving(platform.id);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert('请先登录');
        return;
      }

      const config: Record<string, string> = {};
      platform.fields.forEach(field => {
        if (formData[field.key]) {
          config[field.key] = formData[field.key];
        }
      });

      const existing = getAuthForPlatform(platform.id);

      if (existing) {
        const { error } = await supabase
          .from('user_platform_auth')
          .update({
            access_token: formData.access_token || existing.access_token,
            config: { ...existing.config, ...config },
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);

        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('user_platform_auth')
          .insert({
            user_id: userData.user.id,
            platform: platform.id,
            access_token: formData.access_token || null,
            config,
            is_active: true,
          });

        if (error) throw error;
      }

      await fetchAuths();
      setEditingPlatform(null);
      setFormData({});
    } catch (error) {
      console.error('Error saving auth:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(null);
    }
  }

  async function disconnectPlatform(platformId: string) {
    if (!confirm('确定要断开此平台的连接吗？')) return;

    try {
      const auth = getAuthForPlatform(platformId);
      if (!auth) return;

      const { error } = await supabase
        .from('user_platform_auth')
        .delete()
        .eq('id', auth.id);

      if (error) throw error;
      await fetchAuths();
    } catch (error) {
      console.error('Error disconnecting:', error);
      alert('断开连接失败');
    }
  }

  function renderAuthButton(platform: PlatformConfig) {
    const auth = getAuthForPlatform(platform.id);

    if (editingPlatform === platform.id) {
      return (
        <div className="space-y-3 mt-4">
          {platform.fields.map(field => (
            <div key={field.key}>
              <label className="block text-sm text-white/60 mb-1">{field.label}</label>
              <input
                type={field.type || 'text'}
                value={formData[field.key] || ''}
                onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                placeholder={field.placeholder}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
              />
            </div>
          ))}

          {platform.setupSteps && (
            <div className="mt-4 p-3 bg-blue-500/10 border border-blue-500/20 rounded-lg">
              <p className="text-sm font-medium text-blue-400 mb-2">配置步骤：</p>
              <ol className="text-sm text-white/60 space-y-1 list-decimal list-inside">
                {platform.setupSteps.map((step, index) => (
                  <li key={index}>{step}</li>
                ))}
              </ol>
            </div>
          )}

          <div className="flex gap-2">
            <button
              onClick={() => saveAuth(platform)}
              disabled={saving === platform.id}
              className="flex-1 bg-orange-500 hover:bg-orange-600 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-1"
            >
              {saving === platform.id ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  保存
                </>
              )}
            </button>
            <button
              onClick={() => { setEditingPlatform(null); setFormData({}); }}
              className="flex-1 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg"
            >
              取消
            </button>
          </div>
        </div>
      );
    }

    if (auth) {
      return (
        <div className="flex items-center gap-2 mt-4">
          <div className="flex-1 flex items-center gap-2 text-green-400 text-sm">
            <Check className="w-4 h-4" />
            <span>已连接</span>
            {auth.platform_username && (
              <span className="text-white/40">({auth.platform_username})</span>
            )}
          </div>
          <button
            onClick={() => startEditing(platform)}
            className="text-white/60 hover:text-white text-sm px-3 py-1 bg-white/10 rounded-lg"
          >
            编辑
          </button>
          <button
            onClick={() => disconnectPlatform(platform.id)}
            className="text-red-400 hover:text-red-300 text-sm p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>
      );
    }

    if (platform.authType === 'manual') {
      return (
        <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <div className="flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
            <div className="text-sm text-white/60">
              <p className="font-medium text-yellow-400 mb-1">暂不支持自动发布</p>
              <p>{platform.manualReason || '请使用复制功能手动发布'}</p>
            </div>
          </div>
        </div>
      );
    }

    return (
      <button
        onClick={() => startEditing(platform)}
        className="w-full mt-4 bg-white/10 hover:bg-white/20 text-white text-sm py-2 rounded-lg flex items-center justify-center gap-2 transition-colors"
      >
        <Link2 className="w-4 h-4" />
        连接账号
      </button>
    );
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/promotion')}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回推广中心
          </button>
          <h1 className="text-2xl font-bold">平台授权设置</h1>
          <p className="text-white/60 mt-2">连接你的社交媒体账号，实现一键发布功能</p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 p-4 bg-white/5 border border-white/10 rounded-xl"
          >
            <h3 className="font-medium mb-3 flex items-center gap-2 text-sm">
              <BarChart3 className="w-4 h-4 text-[#8B5CF6]" />
              平台难度说明
            </h3>
            <div className="space-y-2 text-sm text-white/60">
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full flex-shrink-0">简单</span>
                <p className="text-xs">开发者友好平台，Token获取流程简单直接，通常只需在平台设置页面生成 Personal Access Token 即可</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full flex-shrink-0">中等</span>
                <p className="text-xs">需要一定配置步骤，可能需要创建应用、填写基本信息，部分平台需要简单审核</p>
              </div>
              <div className="flex items-start gap-2">
                <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full flex-shrink-0">较难</span>
                <p className="text-xs">配置流程复杂，通常需要企业资质或严格审核，个人开发者较难获得发布权限</p>
              </div>
            </div>
            <p className="text-xs text-white/40 mt-3">
              建议：新手开发者建议从标记为"简单"的平台开始配置
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-4 p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl"
          >
            <h3 className="font-medium mb-2 flex items-center gap-2 text-sm">
              <AlertCircle className="w-4 h-4 text-blue-400" />
              安全提示
            </h3>
            <ul className="text-white/60 text-xs space-y-1 list-disc list-inside">
              <li>你的 Token 仅存储在加密的数据库中，不会泄露给第三方</li>
              <li>建议为虾蛋星球单独创建 Token，不要与其他应用共用</li>
              <li>如需撤销授权，可在对应平台删除 Token 或在此页面断开连接</li>
            </ul>
          </motion.div>
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            {platforms.map((platform) => (
              <div
                key={platform.id}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl ${platform.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white font-bold text-sm">{platform.abbr}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{platform.name}</h3>
                      {platform.authType === 'manual' && (
                        <span className="px-2 py-0.5 bg-yellow-500/20 text-yellow-400 text-xs rounded-full">
                          手动
                        </span>
                      )}
                      {platform.difficulty === 'easy' && (
                        <span className="px-2 py-0.5 bg-green-500/20 text-green-400 text-xs rounded-full">
                          简单
                        </span>
                      )}
                      {platform.difficulty === 'medium' && (
                        <span className="px-2 py-0.5 bg-orange-500/20 text-orange-400 text-xs rounded-full">
                          中等
                        </span>
                      )}
                      {platform.difficulty === 'hard' && (
                        <span className="px-2 py-0.5 bg-red-500/20 text-red-400 text-xs rounded-full">
                          较难
                        </span>
                      )}
                    </div>
                    <p className="text-white/60 text-sm mt-1">{platform.description}</p>

                    {platform.authType !== 'manual' && (
                      <a
                        href={platform.docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-orange-500 hover:text-orange-400 text-xs mt-2"
                      >
                        <ExternalLink className="w-3 h-3" />
                        查看获取 Token 教程
                      </a>
                    )}

                    {renderAuthButton(platform)}
                  </div>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </div>
    </div>
  );
}
