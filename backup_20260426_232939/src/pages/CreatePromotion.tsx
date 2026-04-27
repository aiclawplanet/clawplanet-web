import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Sparkles, Loader2, Check, Copy, Search, Link2, X, Wrench } from 'lucide-react';
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

interface GeneratedContent {
  [platform: string]: {
    content: string;
    title?: string;
  };
}

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

  useEffect(() => {
    fetchTools();
  }, []);

  // Auto-select tool from URL parameter
  useEffect(() => {
    if (toolIdFromUrl && tools.length > 0) {
      const tool = tools.find(t => t.id === toolIdFromUrl);
      if (tool) {
        selectTool(tool);
      }
    }
  }, [toolIdFromUrl, tools]);

  async function fetchTools() {
    setLoadingTools(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData.user?.id;

      // Fetch user's own approved tools first, then other approved tools
      let query = supabase
        .from('tools')
        .select('*')
        .eq('status', 'approved')
        .order('view_count', { ascending: false })
        .limit(50);

      const { data, error } = await query;

      if (error) throw error;

      // Sort tools: user's own tools first
      const sortedTools = (data || []).sort((a, b) => {
        const aIsMine = a.developer_id === userId ? -1 : 0;
        const bIsMine = b.developer_id === userId ? -1 : 0;
        return aIsMine - bIsMine;
      });

      setTools(sortedTools);
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

  function selectTool(tool: Tool) {
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

      const { error: uploadError } = await supabase.storage
        .from('promotion-assets')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('promotion-assets')
        .getPublicUrl(filePath);

      setScreenshots([...screenshots, publicUrl]);
    } catch (error) {
      console.error('Error uploading image:', error);
      alert('上传失败，请重试');
    } finally {
      setUploadingImage(false);
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

  async function saveContent() {
    if (!editedContent) return;

    setSaving(true);
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        alert('请先登录');
        return;
      }

      const { error } = await supabase.from('promotion_contents').insert({
        user_id: userData.user.id,
        title: toolName,
        source_type: 'ai_generate',
        content: editedContent,
        status: 'draft',
        tool_id: selectedTool?.id,
      });

      if (error) throw error;

      navigate('/promotion/list');
    } catch (error) {
      console.error('Error saving content:', error);
      alert('保存失败，请稍后重试');
    } finally {
      setSaving(false);
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

  async function copyContent(content: string, platform: string) {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(content);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = content;
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
                <label className="flex-1">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={!selectedTool || uploadingImage}
                    className="hidden"
                  />
                  <div className={`w-full p-3 border border-dashed border-white/20 rounded-lg flex items-center justify-center gap-2 cursor-pointer hover:border-orange-500/50 transition-colors ${!selectedTool ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    {uploadingImage ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <>
                        <span className="text-sm text-white/60">上传截图</span>
                      </>
                    )}
                  </div>
                </label>
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
                          onClick={() => copyContent(data.content, platform)}
                          className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                          title="复制"
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
                        <div>
                          <label className="block text-xs text-white/40 mb-1">标题</label>
                          <input
                            type="text"
                            value={data.title || ''}
                            onChange={(e) => updatePlatformTitle(platform, e.target.value)}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500"
                            placeholder="输入标题..."
                          />
                        </div>
                        <div>
                          <label className="block text-xs text-white/40 mb-1">内容</label>
                          <textarea
                            value={data.content}
                            onChange={(e) => updatePlatformContent(platform, e.target.value)}
                            rows={6}
                            className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-orange-500 resize-none"
                            placeholder="输入推广文案..."
                          />
                        </div>
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
                                updatePlatformContent(platform, generatedContent[platform].content);
                                updatePlatformTitle(platform, generatedContent[platform].title || '');
                              }
                            }}
                            className="px-4 py-2 bg-white/10 hover:bg-white/20 rounded-lg text-sm"
                          >
                            恢复原文
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div
                        onClick={() => setEditingPlatform(platform)}
                        className="bg-white/5 rounded-lg p-4 whitespace-pre-wrap text-white/80 text-sm max-h-48 overflow-y-auto cursor-pointer hover:bg-white/10 transition-colors group"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1">{data.content}</div>
                          <span className="text-xs text-white/20 group-hover:text-orange-400 transition-colors">点击编辑</span>
                        </div>
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
                onClick={saveContent}
                disabled={saving}
                className="flex-1 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white font-semibold py-4 rounded-xl flex items-center justify-center gap-2"
              >
                {saving ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    保存中...
                  </>
                ) : (
                  '保存到推广中心'
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
    </div>
  );
}
