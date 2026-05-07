import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Check, Copy, Search, Link2, X, Wrench, Rocket, Briefcase, Lock } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;

const platforms = [
  { id: 'wechat', name: '微信公众号', icon: '微信', abbr: '微信', description: '深度长文，适合详细解读', color: '#07C160', bgColor: 'bg-[#07C160]' },
  { id: 'xiaohongshu', name: '小红书', icon: '小红书', abbr: '小红书', description: '种草笔记，图文结合', color: '#FF2442', bgColor: 'bg-[#FF2442]' },
  { id: 'jike', name: '即刻', icon: '即刻', abbr: '即刻', description: '短平快，极简风格', color: '#FFE411', bgColor: 'bg-[#FFE411]' },
  { id: 'zhihu', name: '知乎', icon: '知乎', abbr: '知乎', description: '专业问答，有深度', color: '#0084FF', bgColor: 'bg-[#0084FF]' },
  { id: 'pengyouquan', name: '朋友圈', icon: '朋友圈', abbr: '朋友圈', description: '社交分享，亲切自然', color: '#07C160', bgColor: 'bg-[#07C160]' },
  { id: 'weibo', name: '微博', icon: '微博', abbr: '微博', description: '热点话题，互动性强', color: '#E6162D', bgColor: 'bg-[#E6162D]' },
  { id: 'juejin', name: '掘金', icon: '掘金', abbr: '掘金', description: '技术社区，开发者视角', color: '#1E80FF', bgColor: 'bg-[#1E80FF]' },
  { id: 'github', name: 'GitHub', icon: 'GitHub', abbr: 'GH', description: '英文开源社区', color: '#FFFFFF', bgColor: 'bg-[#333333]' },
  { id: 'csdn', name: 'CSDN', icon: 'CSDN', abbr: 'CSDN', description: '技术博客，教程分享', color: '#FC5531', bgColor: 'bg-[#FC5531]' },
  { id: 'v2ex', name: 'V2EX', icon: 'V2EX', abbr: 'V2', description: '开发者社区，高质量交流', color: '#1E80FF', bgColor: 'bg-[#1E80FF]' },
  { id: 'segmentfault', name: '思否', icon: '思否', abbr: 'SF', description: '技术问答，专业详细', color: '#009A61', bgColor: 'bg-[#009A61]' },
  { id: 'jianshu', name: '简书', icon: '简书', abbr: '简书', description: '文艺清新，故事性强', color: '#EA6F5A', bgColor: 'bg-[#EA6F5A]' },
  { id: 'bilibili', name: 'B站', icon: 'B站', abbr: 'B站', description: '视频平台，年轻化', color: '#00A1D6', bgColor: 'bg-[#00A1D6]' },
  { id: 'douyin', name: '抖音', icon: '抖音', abbr: '抖音', description: '短视频，节奏快', color: '#000000', bgColor: 'bg-[#1a1a1a]' },
  { id: 'kuaishou', name: '快手', icon: '快手', abbr: '快手', description: '短视频，接地气', color: '#FF5000', bgColor: 'bg-[#FF5000]' },
  { id: 'toutiao', name: '头条号', icon: '头条', abbr: '头条', description: '资讯平台，热点追踪', color: '#ED4040', bgColor: 'bg-[#ED4040]' },
  { id: 'baijiahao', name: '百家号', icon: '百家', abbr: '百家', description: '百度生态，SEO友好', color: '#2932E1', bgColor: 'bg-[#2932E1]' },
  { id: 'sohu', name: '搜狐号', icon: '搜狐', abbr: '搜狐', description: '资讯门户，专业权威', color: '#FF8200', bgColor: 'bg-[#FF8200]' },
  { id: 'netease', name: '网易号', icon: '网易', abbr: '网易', description: '品质内容，深度阅读', color: '#C41E3A', bgColor: 'bg-[#C41E3A]' },
  { id: 'twitter', name: 'Twitter/X', icon: 'X', abbr: 'X', description: '全球社交，实时话题', color: '#FFFFFF', bgColor: 'bg-[#000000]' },
  { id: 'linkedin', name: 'LinkedIn', icon: 'in', abbr: 'in', description: '职业社交，B2B推广', color: '#0A66C2', bgColor: 'bg-[#0A66C2]' },
  { id: 'producthunt', name: 'Product Hunt', icon: 'PH', abbr: 'PH', description: '产品发布，创业者聚集', color: '#DA552F', bgColor: 'bg-[#DA552F]' },
  { id: 'hackernews', name: 'Hacker News', icon: 'HN', abbr: 'HN', description: '技术新闻，开发者社区', color: '#FF6600', bgColor: 'bg-[#FF6600]' },
  { id: 'reddit', name: 'Reddit', icon: 'Reddit', abbr: 'R', description: '社区讨论，细分话题', color: '#FF4500', bgColor: 'bg-[#FF4500]' },
  { id: 'devto', name: 'Dev.to', icon: 'DEV', abbr: 'DEV', description: '开发者博客，技术分享', color: '#FFFFFF', bgColor: 'bg-[#0D0D0D]' },
  { id: 'medium', name: 'Medium', icon: 'M', abbr: 'M', description: '长文平台，深度阅读', color: '#FFFFFF', bgColor: 'bg-[#121212]' },
  { id: 'discord', name: 'Discord', icon: 'Discord', abbr: 'D', description: '社群聊天，即时互动', color: '#5865F2', bgColor: 'bg-[#5865F2]' },
  { id: 'telegram', name: 'Telegram', icon: 'TG', abbr: 'TG', description: '频道广播，隐私友好', color: '#26A5E4', bgColor: 'bg-[#26A5E4]' },
];

interface PlatformContent {
  title?: string;
  summary?: string;
  content: string;
  tags?: string;
}

interface GeneratedContent {
  [platform: string]: PlatformContent;
}

// 前端平台字段配置（与 Edge Function 中的 platformConfigs.fields 保持一致）
const platformFieldConfig: Record<string, { title?: boolean; summary?: boolean; content: boolean; tags?: boolean }> = {
  wechat: { title: true, summary: true, content: true },
  xiaohongshu: { title: true, content: true, tags: true },
  jike: { content: true },
  zhihu: { title: true, content: true },
  pengyouquan: { content: true },
  weibo: { content: true, tags: true },
  juejin: { title: true, content: true, tags: true },
  github: { content: true },
  csdn: { title: true, content: true, tags: true },
  v2ex: { title: true, content: true },
  segmentfault: { title: true, content: true, tags: true },
  jianshu: { title: true, content: true, tags: true },
  bilibili: { title: true, summary: true, content: true },
  douyin: { content: true, tags: true },
  kuaishou: { content: true, tags: true },
  toutiao: { title: true, content: true, tags: true },
  baijiahao: { title: true, content: true, tags: true },
  sohu: { title: true, content: true },
  netease: { title: true, content: true },
  twitter: { content: true, tags: true },
  linkedin: { title: true, content: true },
  producthunt: { title: true, content: true },
  hackernews: { title: true, content: true },
  reddit: { title: true, content: true },
  devto: { title: true, content: true, tags: true },
  medium: { title: true, content: true, tags: true },
  discord: { content: true },
  telegram: { content: true, tags: true },
};

export function CreatePromotion() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const toolIdFromUrl = searchParams.get('toolId');
  const [step, setStep] = useState(1);
  const [toolName, setToolName] = useState('');
  const [description, setDescription] = useState('');
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(['wechat', 'xiaohongshu', 'jike']);
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<GeneratedContent | null>(null);
  const [editedContent, setEditedContent] = useState<GeneratedContent | null>(null);
  const [saving, setSaving] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [editingPlatform, setEditingPlatform] = useState<string | null>(null);
  const [tools, setTools] = useState<Tool[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showToolSelector, setShowToolSelector] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | null>(null);
  const [loadingTools, setLoadingTools] = useState(false);
  const [highlights, setHighlights] = useState('');
  const [useCases, setUseCases] = useState('');
  const [targetUsers, setTargetUsers] = useState('');
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);

  // 开发者身份拦截弹窗
  const [devCheckModal, setDevCheckModal] = useState<{
    open: boolean;
    reason: 'login' | 'not_developer';
  }>({ open: false, reason: 'login' });

  // 检查用户是否为已认证开发者（已登录 + role=developer 或 有 approved 申请 或 已发布工具）
  async function checkDeveloperAccess(): Promise<boolean> {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    // 方式1：profiles.role = 'developer'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role === 'developer') return true;

    // 方式2：developer_applications 有 approved 记录
    const { data: app } = await supabase
      .from('developer_applications')
      .select('status')
      .eq('user_id', user.id)
      .eq('status', 'approved')
      .single();

    if (app) return true;

    // 方式3：用户已有发布的工具（developer_id = user.id）
    const { data: toolsData } = await supabase
      .from('tools')
      .select('id')
      .eq('developer_id', user.id)
      .limit(1);

    if (toolsData && toolsData.length > 0) return true;

    return false;
  }

  useEffect(() => {
    fetchTools();
  }, []);

  useEffect(() => {
    // 优先使用 URL 参数中的 toolId，其次默认选第一个工具
    if (toolIdFromUrl) {
      const tool = tools.find(t => t.id === toolIdFromUrl);
      if (tool) selectTool(tool);
    } else if (tools.length > 0 && !selectedTool) {
      // 无 URL 参数时，默认选中第一个（通常是用户自己的工具）
      selectTool(tools[0]);
    }
  }, [toolIdFromUrl, tools]);

  async function fetchTools() {
    setLoadingTools(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // ✅ 只查询当前用户自己的已上线工具
      const { data, error } = await supabase
        .from('tools')
        .select('*')
        .eq('developer_id', userId!)
        .eq('status', 'approved')
        .order('view_count', { ascending: false });

      if (error) throw error;
      setTools(data || []);
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoadingTools(false);
    }
  }

  function getToolUrl(tool: Tool): string {
    const baseUrl = (window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin;
    return `${baseUrl}/#/tool/${tool.id}`;
  }

  async function selectTool(tool: Tool) {
    // 先检查开发者身份
    const isDeveloper = await checkDeveloperAccess();
    if (!isDeveloper) {
      // 未登录或非开发者 → 弹窗提示
      const { data: { user } } = await supabase.auth.getUser();
      setDevCheckModal({ open: true, reason: user ? 'not_developer' : 'login' });
      return;
    }
    // 开发者 → 正常选择工具
    setSelectedTool(tool);
    setToolName(tool.name);
    setDescription(tool.description || '');
    setHighlights(tool.tags?.join('、') || '');
    setUseCases('');
    setTargetUsers('');
    setScreenshots(tool.screenshots || []);
    setShowToolSelector(false);
  }

  function clearSelectedTool() {
    setSelectedTool(null);
    setToolName('');
    setDescription('');
    setHighlights('');
    setUseCases('');
    setTargetUsers('');
    setScreenshots([]);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingImage(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `promotion-screenshots/${fileName}`;

      // 统一走 /sb-api 代理上传（nginx 已配置支持 Storage 文件上传）
      const { data, error } = await supabase.storage
        .from('promotion-assets')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      // 获取公开 URL
      const { data: urlData } = supabase.storage
        .from('promotion-assets')
        .getPublicUrl(filePath);

      setScreenshots(prev => [...prev, urlData.publicUrl]);
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert(`上传失败：${error.message || '请重试'}`);
    } finally {
      setUploadingImage(false);
      e.target.value = '';
    }
  }

  function removeScreenshot(index: number) {
    setScreenshots(screenshots.filter((_, i) => i !== index));
  }

  const filteredTools = tools.filter(tool =>
    tool.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (tool.description && tool.description.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms(prev =>
      prev.includes(platformId)
        ? prev.filter(p => p !== platformId)
        : [...prev, platformId]
    );
  };

  async function generateContent() {
    if (!toolName.trim() || !description.trim() || selectedPlatforms.length === 0) return;

    // 先检查开发者身份
    const isDeveloper = await checkDeveloperAccess();
    if (!isDeveloper) {
      const { data: { user } } = await supabase.auth.getUser();
      setDevCheckModal({ open: true, reason: user ? 'not_developer' : 'login' });
      setGenerating(false);
      return;
    }

    setGenerating(true);
    try {
      const { data: session } = await supabase.auth.getSession();

      const supabaseUrl = (window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin;
      const functionUrl = `${supabaseUrl}/sb-api/functions/v1/generate-promotion-content`;

      const toolUrl = selectedTool ? getToolUrl(selectedTool) : '';
      const enhancedDescription = selectedTool
        ? `${description}\n\n产品链接：${toolUrl}`
        : description;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(session.session ? { Authorization: `Bearer ${session.session.access_token}` } : {}),
        },
        body: JSON.stringify({
          toolName,
          description: enhancedDescription,
          platforms: selectedPlatforms,
          toolUrl,
          highlights,
          useCases,
          targetUsers,
          screenshots,
        }),
      });

      if (!response.ok) throw new Error('生成失败');

      const result = await response.json();
      if (result.success) {
        setGeneratedContent(result.data);
        setEditedContent(result.data);
        setStep(2);
      }
    } catch (error: any) {
      console.error('Error generating content:', error);
      alert('生成失败：' + (error.message || '请稍后重试'));
    } finally {
      setGenerating(false);
    }
  }

  async function saveContent(publishAfterSave: boolean = false) {
    if (!editedContent) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert('请先登录');
        return;
      }

      const { data: insertedData, error } = await supabase.from('promotion_contents').insert({
        user_id: userData.user.id,
        title: toolName,
        source_type: 'ai_generate',
        content: editedContent,
        status: publishAfterSave ? 'published' : 'draft',
        tool_id: selectedTool?.id,
        images: screenshots.length > 0 ? screenshots : null,
      }).select().single();

      if (error) throw error;

      if (publishAfterSave && insertedData) {
        await publishToPlatforms(insertedData.id, selectedPlatforms);
      } else {
        navigate('/promotion/list');
      }
    } catch (error) {
      console.error('Error saving content:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
    }
  }

  async function publishToPlatforms(contentId: string, platforms: string[]) {
    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        alert('请先登录');
        return;
      }

      const supabaseUrl = (window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin;
      const functionUrl = `${supabaseUrl}/sb-api/functions/v1/publish-to-platforms`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          contentId: contentId,
          platforms: platforms,
        }),
      });

      const result = await response.json();
      if (result.results && result.results.length > 0) {
        const successCount = result.results.filter((r: any) => r.success).length;
        const failCount = result.results.length - successCount;
        if (successCount > 0) {
          alert(`发布完成！成功: ${successCount} 个平台，失败: ${failCount} 个平台`);
        } else {
          alert('发布失败，请检查平台授权设置');
        }
      }
      navigate(`/promotion/${contentId}`);
    } catch (error) {
      console.error('Error publishing:', error);
      alert('发布失败，请稍后重试');
    }
  }

  function updatePlatformContent(platform: string, newContent: string) {
    setEditedContent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          content: newContent,
        },
      };
    });
  }

  function updatePlatformTitle(platform: string, newTitle: string) {
    setEditedContent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          title: newTitle,
        },
      };
    });
  }

  // 通用字段更新函数
  function updatePlatformField(platform: string, field: string, value: string) {
    setEditedContent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        [platform]: {
          ...prev[platform],
          [field]: value,
        },
      };
    });
  }

  function buildCopyText(platform: string): string {
    const data = editedContent?.[platform];
    if (!data) return '';
    const parts: string[] = [];

    // 标题
    if (data.title) parts.push(data.title);

    // 摘要
    if (data.summary) parts.push(data.summary);

    // 正文
    if (data.content) parts.push(data.content);

    // 标签
    if (data.tags) parts.push(`标签：${data.tags}`);

    // 配图说明
    if (screenshots.length > 0) {
      const contentText = data.content || '';
      const hasScreenshotRef = contentText.includes('【配图') || contentText.includes('配图说明');
      if (!hasScreenshotRef) {
        const screenshotList = screenshots.map((_, i) => `配图${i + 1}=产品截图`).join('，');
        parts.push(`【配图说明】${screenshotList}`);
      }
    }

    return parts.join('\n\n');
  }

  async function copyContent(platform: string) {
    try {
      const textToCopy = buildCopyText(platform);
      if (!textToCopy) {
        alert('没有可复制的内容');
        return;
      }
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(textToCopy);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = textToCopy;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand('copy');
          setCopiedPlatform(platform);
          setTimeout(() => setCopiedPlatform(null), 2000);
        } catch (err) {
          console.error('Copy failed:', err);
          alert('复制失败，请手动复制');
        }
        document.body.removeChild(textArea);
      }
    } catch (err) {
      console.error('Copy failed:', err);
      alert('复制失败，请手动复制');
    }
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
            onClick={() => step === 1 ? navigate('/promotion') : setStep(1)}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回
          </button>
          <h1 className="text-2xl font-bold mb-2">创建推广内容</h1>
          <div className="flex items-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 1 ? 'bg-orange-500' : 'bg-white/20'}`}>1</div>
            <div className="w-16 h-0.5 bg-white/20">
              <div className={`h-full bg-orange-500 transition-all ${step >= 2 ? 'w-full' : 'w-0'}`} />
            </div>
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm ${step >= 2 ? 'bg-orange-500' : 'bg-white/20'}`}>2</div>
          </div>
        </motion.div>

        {step === 1 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">选择要推广的产品</label>

              {selectedTool ? (
                <div className="flex items-center gap-3 p-3 bg-orange-500/10 border border-orange-500/30 rounded-lg">
                  {selectedTool.icon_url ? (
                    <img
                      src={selectedTool.icon_url}
                      alt={selectedTool.name}
                      className="w-10 h-10 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                      <Wrench className="w-5 h-5 text-[#8B5CF6]" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedTool.name}</p>
                    <p className="text-xs text-white/40 truncate">{getToolUrl(selectedTool)}</p>
                  </div>
                  <button
                    onClick={() => setShowToolSelector(true)}
                    className="text-xs text-orange-500 hover:text-orange-400 px-2 py-1"
                  >
                    更换
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowToolSelector(true)}
                  className="w-full p-4 bg-white/5 border border-white/20 border-dashed rounded-lg hover:bg-white/10 hover:border-orange-500/50 transition-colors flex flex-col items-center gap-2"
                >
                  <Link2 className="w-6 h-6 text-orange-500" />
                  <span className="text-sm text-white/60">从虾蛋星球选择产品</span>
                  <span className="text-xs text-white/40">只能选择已发布的产品进行推广</span>
                </button>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-medium">功能描述</label>
                <span className="text-xs text-white/40">自动从产品信息获取，可编辑</span>
              </div>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={selectedTool ? '可补充描述产品亮点，或直接使用默认描述...' : '请先选择要推广的产品'}
                rows={4}
                disabled={!selectedTool}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              {selectedTool && (
                <p className="text-xs text-orange-400 mt-2 flex items-center gap-1">
                  <Link2 className="w-3 h-3" />
                  推广文案将自动包含虾蛋星球产品链接
                </p>
              )}
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">产品亮点</label>
              <textarea
                value={highlights}
                onChange={(e) => setHighlights(e.target.value)}
                placeholder="列出产品的核心亮点和特色功能，用顿号分隔..."
                rows={2}
                disabled={!selectedTool}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
              <p className="text-xs text-white/40 mt-1">自动从产品标签获取，可编辑补充</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">使用场景</label>
              <textarea
                value={useCases}
                onChange={(e) => setUseCases(e.target.value)}
                placeholder="描述产品适合在哪些场景下使用..."
                rows={2}
                disabled={!selectedTool}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-medium mb-2">目标用户</label>
              <textarea
                value={targetUsers}
                onChange={(e) => setTargetUsers(e.target.value)}
                placeholder="描述产品的目标用户群体..."
                rows={2}
                disabled={!selectedTool}
                className="w-full bg-white/10 border border-white/20 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:border-orange-500 resize-none disabled:opacity-50 disabled:cursor-not-allowed"
              />
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-medium mb-4">产品截图</label>
              {screenshots.length > 0 && (
                <div className="grid grid-cols-3 gap-3 mb-4">
                  {screenshots.map((url, index) => (
                    <div key={index} className="relative aspect-video bg-white/5 rounded-lg overflow-hidden group">
                      <img src={url} alt={`截图${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeScreenshot(index)}
                        className="absolute top-1 right-1 p-1 bg-red-500/80 hover:bg-red-500 rounded opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center gap-3">
                <button
                  onClick={() => document.getElementById('screenshot-upload')?.click()}
                  disabled={!selectedTool || uploadingImage}
                  className={`flex-1 p-3 border border-dashed border-white/20 rounded-lg flex items-center justify-center gap-2 hover:border-orange-500/50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${uploadingImage ? 'cursor-wait' : 'cursor-pointer'}`}
                >
                  {uploadingImage ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span className="text-sm text-white/60">上传中...</span>
                    </>
                  ) : (
                    <span className="text-sm text-white/60">上传截图</span>
                  )}
                </button>
                <input
                  id="screenshot-upload"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
                {selectedTool?.screenshots && selectedTool.screenshots.length > 0 && (
                  <button
                    onClick={() => setScreenshots(selectedTool.screenshots || [])}
                    disabled={!selectedTool}
                    className="px-4 py-3 bg-white/10 hover:bg-white/20 rounded-lg text-sm text-white/60 disabled:opacity-50"
                  >
                    使用产品自带截图
                  </button>
                )}
              </div>
              <p className="text-xs text-white/40 mt-2">截图将用于生成图文推广内容</p>
            </div>

            <div className="bg-white/5 border border-white/10 rounded-xl p-6">
              <label className="block text-sm font-medium mb-4">选择推广平台</label>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {platforms.map((platform) => (
                  <button
                    key={platform.id}
                    onClick={() => togglePlatform(platform.id)}
                    className={`p-4 rounded-lg border transition-all text-left ${
                      selectedPlatforms.includes(platform.id)
                        ? 'border-orange-500 bg-orange-500/20'
                        : 'border-white/10 bg-white/5 hover:bg-white/10'
                    }`}
                  >
                    <div className="text-2xl mb-2">{platform.icon}</div>
                    <div className="font-medium text-sm">{platform.name}</div>
                    <div className="text-white/40 text-xs mt-1">{platform.description}</div>
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={generateContent}
              disabled={!selectedTool || (!description.trim() && !highlights.trim()) || selectedPlatforms.length === 0 || generating}
              className="w-full bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {generating ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  AI生成中...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5" />
                  生成文案
                </>
              )}
            </button>
          </motion.div>
        )}

        {step === 2 && editedContent && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4 flex items-center gap-3">
              <Check className="w-5 h-5 text-green-400" />
              <span>文案生成成功！以下是各平台的适配版本，您可以直接编辑修改</span>
            </div>

            {screenshots.length > 0 && (
              <div className="bg-orange-500/10 border border-orange-500/30 rounded-xl p-4">
                <h4 className="text-sm font-medium text-orange-400 mb-3">📸 产品截图总览（共{screenshots.length}张）</h4>
                <p className="text-xs text-white/40 mb-3">AI 已在各平台文案中引用了对应截图，发布时请附带截图</p>
                <div className="grid grid-cols-3 gap-3">
                  {screenshots.map((url, index) => (
                    <div key={index} className="relative aspect-video bg-white/5 rounded-lg overflow-hidden">
                      <img src={url} alt={`截图${index + 1}`} className="w-full h-full object-cover" />
                      <div className="absolute bottom-1 right-1 bg-black/70 text-xs px-1.5 py-0.5 rounded">
                        配图{index + 1}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="space-y-4">
              {Object.entries(editedContent).map(([platform, data]) => {
                const platformInfo = platforms.find(p => p.id === platform);
                const isEditing = editingPlatform === platform;
                return (
                  <motion.div
                    key={platform}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-white/5 border border-white/10 rounded-xl p-6"
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-3">
                        <span className="text-2xl">{platformInfo?.icon}</span>
                        <div>
                          <h3 className="font-medium">{platformInfo?.name}</h3>
                          {data.title && !isEditing && (
                            <p className="text-white/60 text-sm">{data.title}</p>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={(e) => { e.stopPropagation(); setEditingPlatform(platform); }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="编辑"
                        >
                          <Wrench className="w-4 h-4" />
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); copyContent(platform); }}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="复制完整内容（标题+正文+标签）"
                        >
                          {copiedPlatform === platform ? (
                            <Check className="w-4 h-4 text-green-400" />
                          ) : (
                            <Copy className="w-4 h-4" />
                          )}
                        </button>
                      </div>
                    </div>

                    {isEditing ? (
                      <div className="space-y-3">
                        {platformFieldConfig[platform]?.title && (
                          <div>
                            <label className="block text-xs text-white/40 mb-1">标题</label>
                            <input
                              type="text"
                              value={data.title || ''}
                              onChange={(e) => updatePlatformField(platform, 'title', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                              placeholder="输入标题..."
                            />
                          </div>
                        )}
                        {platformFieldConfig[platform]?.summary && (
                          <div>
                            <label className="block text-xs text-white/40 mb-1">摘要</label>
                            <textarea
                              value={data.summary || ''}
                              onChange={(e) => updatePlatformField(platform, 'summary', e.target.value)}
                              rows={2}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                              placeholder="输入摘要..."
                            />
                          </div>
                        )}
                        <div>
                          <label className="block text-xs text-white/40 mb-1">正文</label>
                          <textarea
                            value={data.content}
                            onChange={(e) => updatePlatformField(platform, 'content', e.target.value)}
                            rows={6}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                            placeholder="输入推广文案... 可用【配图1】等标记引用截图"
                          />
                          {/* 编辑模式也显示截图 */}
                          {screenshots.length > 0 && (
                            <div className="mt-2 flex gap-2 flex-wrap">
                              {screenshots.map((url, i) => (
                                <div key={i} className="w-16 aspect-video bg-white/5 rounded overflow-hidden relative">
                                  <img src={url} alt={`配图${i+1}`} className="w-full h-full object-cover" />
                                  <div className="absolute bottom-0 right-0 bg-black/70 text-[9px] px-1 rounded-tl">
                                    配图{i+1}
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                        {platformFieldConfig[platform]?.tags && (
                          <div>
                            <label className="block text-xs text-white/40 mb-1">标签（逗号分隔）</label>
                            <input
                              type="text"
                              value={data.tags || ''}
                              onChange={(e) => updatePlatformField(platform, 'tags', e.target.value)}
                              className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                              placeholder="输入标签，用逗号分隔..."
                            />
                          </div>
                        )}
                        <div className="flex gap-2">
                          <button
                            onClick={() => setEditingPlatform(null)}
                            className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-lg text-sm font-medium"
                          >
                            完成编辑
                          </button>
                          <button
                            onClick={() => {
                              if (generatedContent?.[platform]) {
                                updatePlatformField(platform, 'content', generatedContent[platform].content);
                                if (generatedContent[platform].title !== undefined) {
                                  updatePlatformField(platform, 'title', generatedContent[platform].title || '');
                                }
                                if (generatedContent[platform].summary !== undefined) {
                                  updatePlatformField(platform, 'summary', generatedContent[platform].summary || '');
                                }
                                if (generatedContent[platform].tags !== undefined) {
                                  updatePlatformField(platform, 'tags', generatedContent[platform].tags || '');
                                }
                              }
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                          >
                            恢复原文
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {data.title && (
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-1">标题</h4>
                            <div className="text-white/80 text-sm">{data.title}</div>
                          </div>
                        )}
                        {data.summary && (
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-1">摘要</h4>
                            <div className="text-white/80 text-sm">{data.summary}</div>
                          </div>
                        )}
                        <div>
                          <h4 className="text-sm font-medium text-white/60 mb-1">正文</h4>
                          <div className="bg-white/5 rounded-lg p-4 whitespace-pre-wrap text-white/80 text-sm">
                            {/* 渲染正文，把【配图X】标记高亮显示 */}
                            {data.content.split(/(【配图\d+】)/g).map((part, i) =>
                              /^【配图\d+】$/.test(part) ? (
                                <span key={i} className="inline-block bg-orange-500/20 text-orange-400 text-xs px-1.5 py-0.5 rounded mr-1 mb-1 align-middle">
                                  {part}
                                </span>
                              ) : (
                                <span key={i}>{part}</span>
                              )
                            )}
                          </div>
                          {/* 本平台引用的截图 */}
                          {screenshots.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/5">
                              <p className="text-xs text-white/40 mb-2">📸 本文案配图：</p>
                              <div className="flex gap-2 flex-wrap">
                                {screenshots.map((url, i) => (
                                  <div key={i} className="w-20 aspect-video bg-white/5 rounded overflow-hidden relative">
                                    <img src={url} alt={`配图${i+1}`} className="w-full h-full object-cover" />
                                    <div className="absolute bottom-0 right-0 bg-black/70 text-[10px] px-1 rounded-tl">
                                      配图{i+1}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                        {data.tags && (
                          <div>
                            <h4 className="text-sm font-medium text-white/60 mb-1">标签</h4>
                            <div className="flex flex-wrap gap-1">
                              {data.tags.split(/,|，/).map((tag, idx) => (
                                <span key={idx} className="bg-orange-500/20 text-orange-400 text-xs px-2 py-1 rounded">
                                  {tag.trim()}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </motion.div>
                );
              })}
            </div>

            <div className="flex gap-4">
              <button
                onClick={() => setStep(1)}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-xl"
              >
                重新生成
              </button>
              <button
                onClick={() => saveContent(false)}
                disabled={saving}
                className="flex-1 bg-white/10 hover:bg-white/20 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存草稿'
                )}
              </button>
              <button
                onClick={() => saveContent(true)}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    发布中...
                  </>
                ) : (
                  <>
                    <Rocket className="w-5 h-5" />
                    保存并发布
                  </>
                )}
              </button>
            </div>
          </motion.div>
        )}
      </div>

      <AnimatePresence>
        {showToolSelector && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setShowToolSelector(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#1a1a1f] border border-white/10 rounded-xl w-full max-w-lg max-h-[80vh] overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-4 border-b border-white/10">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-semibold">选择虾蛋星球产品</h3>
                  <button
                    onClick={() => setShowToolSelector(false)}
                    className="p-1 hover:bg-white/10 rounded"
                  >
                    <X className="w-5 h-5 text-white/60" />
                  </button>
                </div>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="搜索产品名称..."
                    className="w-full bg-white/10 border border-white/20 rounded-lg pl-10 pr-4 py-2 text-white placeholder-white/40 focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="p-4 overflow-y-auto max-h-[50vh]">
                {loadingTools ? (
                  <div className="flex items-center justify-center py-8">
                    <Loader2 className="w-6 h-6 animate-spin text-orange-500" />
                  </div>
                ) : filteredTools.length === 0 ? (
                  <div className="text-center py-8 text-white/40">
                    <p>未找到匹配的产品</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredTools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => selectTool(tool)}
                        className="w-full flex items-center gap-3 p-3 bg-white/5 hover:bg-white/10 rounded-lg transition-colors text-left"
                      >
                        {tool.icon_url ? (
                          <img
                            src={tool.icon_url}
                            alt={tool.name}
                            className="w-10 h-10 rounded-lg object-cover"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                            <Wrench className="w-5 h-5 text-[#8B5CF6]" />
                          </div>
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{tool.name}</p>
                          <p className="text-xs text-white/40 truncate">
                            {tool.description?.slice(0, 60) || '暂无描述'}
                          </p>
                        </div>
                        <Link2 className="w-4 h-4 text-white/20" />
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 border-t border-white/10 bg-white/5">
                <p className="text-xs text-white/40 text-center">
                  选择产品后，推广文案将自动包含虾蛋星球产品链接
                </p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 开发者身份拦截弹窗 */}
      <AnimatePresence>
        {devCheckModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setDevCheckModal({ open: false, reason: 'login' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1a1a2e] rounded-2xl p-6 max-w-sm w-full text-center"
              onClick={e => e.stopPropagation()}
            >
              <div className="w-16 h-16 rounded-2xl bg-[#8B5CF6]/20 flex items-center justify-center mx-auto mb-4">
                {devCheckModal.reason === 'login' ? (
                  <Lock className="w-8 h-8 text-[#8B5CF6]" />
                ) : (
                  <Briefcase className="w-8 h-8 text-[#8B5CF6]" />
                )}
              </div>
              <h3 className="text-xl font-bold mb-2">
                {devCheckModal.reason === 'login' ? '请先登录' : '开发者专享功能'}
              </h3>
              <p className="text-white/60 text-sm mb-6">
                {devCheckModal.reason === 'login'
                  ? '登录后即可申请成为开发者，使用智能推广中心的所有功能'
                  : '智能推广中心仅对认证开发者开放，成为开发者后可为自己的工具生成多平台推广文案'}
              </p>
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setDevCheckModal({ open: false, reason: 'login' });
                    navigate('/join');
                  }}
                  className="w-full py-3 bg-[#8B5CF6] text-white rounded-xl font-medium hover:bg-[#7C3AED] transition-colors"
                >
                  立即注册 / 申请开发者
                </button>
                <button
                  onClick={() => setDevCheckModal({ open: false, reason: 'login' })}
                  className="w-full py-2 text-white/60 text-sm hover:text-white transition-colors"
                >
                  先看看，不急
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
