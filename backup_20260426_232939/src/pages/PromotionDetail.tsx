import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Copy, Check, Edit3, Trash2, Loader2, Rocket, ExternalLink, AlertCircle, Settings } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type PromotionContent = Tables<'promotion_contents'>;
type PlatformAuth = Tables<'user_platform_auth'>;
type PublishLog = Tables<'promotion_publish_logs'>;

interface PublishResult {
  platform: string;
  success: boolean;
  postId?: string;
  postUrl?: string;
  error?: string;
  errorType?: 'token_expired' | 'rate_limit' | 'network' | 'content_violation' | 'unknown';
  retryable?: boolean;
}

const errorTypeMessages: Record<string, string> = {
  token_expired: 'Token已过期，请重新授权',
  rate_limit: '发布频率受限，请稍后重试',
  network: '网络连接问题，已自动重试',
  content_violation: '内容违规，请检查文案',
  unknown: '未知错误',
};

const platformNames: Record<string, string> = {
  wechat: '微信公众号',
  xiaohongshu: '小红书',
  jike: '即刻',
  zhihu: '知乎',
  pengyouquan: '朋友圈',
  weibo: '微博',
  juejin: '掘金',
  github: 'GitHub',
  csdn: 'CSDN',
  v2ex: 'V2EX',
  segmentfault: 'SegmentFault',
  jianshu: '简书',
  bilibili: 'Bilibili',
  douyin: '抖音',
  kuaishou: '快手',
  toutiao: '头条号',
  baijiahao: '百家号',
  sohu: '搜狐号',
  netease: '网易号',
  twitter: 'Twitter/X',
  linkedin: 'LinkedIn',
  producthunt: 'Product Hunt',
  hackernews: 'Hacker News',
  reddit: 'Reddit',
  devto: 'Dev.to',
  medium: 'Medium',
  discord: 'Discord',
  telegram: 'Telegram',
};

const platformIcons: Record<string, { abbr: string; bgColor: string }> = {
  wechat: { abbr: '微信', bgColor: 'bg-[#07C160]' },
  xiaohongshu: { abbr: '小红书', bgColor: 'bg-[#FF2442]' },
  jike: { abbr: '即刻', bgColor: 'bg-[#FFE411]' },
  zhihu: { abbr: '知乎', bgColor: 'bg-[#0084FF]' },
  pengyouquan: { abbr: '朋友圈', bgColor: 'bg-[#07C160]' },
  weibo: { abbr: '微博', bgColor: 'bg-[#E6162D]' },
  juejin: { abbr: '掘金', bgColor: 'bg-[#1E80FF]' },
  github: { abbr: 'GH', bgColor: 'bg-[#333333]' },
  csdn: { abbr: 'CSDN', bgColor: 'bg-[#FC5531]' },
  v2ex: { abbr: 'V2', bgColor: 'bg-[#1E80FF]' },
  segmentfault: { abbr: 'SF', bgColor: 'bg-[#009A61]' },
  jianshu: { abbr: '简书', bgColor: 'bg-[#EA6F5A]' },
  bilibili: { abbr: 'B站', bgColor: 'bg-[#00A1D6]' },
  douyin: { abbr: '抖音', bgColor: 'bg-[#1a1a1a]' },
  kuaishou: { abbr: '快手', bgColor: 'bg-[#FF5000]' },
  toutiao: { abbr: '头条', bgColor: 'bg-[#ED4040]' },
  baijiahao: { abbr: '百家', bgColor: 'bg-[#2932E1]' },
  sohu: { abbr: '搜狐', bgColor: 'bg-[#FF8200]' },
  netease: { abbr: '网易', bgColor: 'bg-[#C41E3A]' },
  twitter: { abbr: 'X', bgColor: 'bg-[#000000]' },
  linkedin: { abbr: 'in', bgColor: 'bg-[#0A66C2]' },
  producthunt: { abbr: 'PH', bgColor: 'bg-[#DA552F]' },
  hackernews: { abbr: 'HN', bgColor: 'bg-[#FF6600]' },
  reddit: { abbr: 'R', bgColor: 'bg-[#FF4500]' },
  devto: { abbr: 'DEV', bgColor: 'bg-[#0D0D0D]' },
  medium: { abbr: 'M', bgColor: 'bg-[#121212]' },
  discord: { abbr: 'D', bgColor: 'bg-[#5865F2]' },
  telegram: { abbr: 'TG', bgColor: 'bg-[#26A5E4]' },
};

const autoPublishPlatforms = ['github', 'juejin', 'weibo', 'zhihu', 'jike', 'xiaohongshu', 'csdn', 'v2ex', 'segmentfault', 'jianshu', 'bilibili', 'douyin', 'kuaishou', 'toutiao', 'baijiahao', 'sohu', 'netease', 'twitter', 'linkedin', 'producthunt', 'hackernews', 'reddit', 'devto', 'medium', 'discord', 'telegram'];

export function PromotionDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [promotion, setPromotion] = useState<PromotionContent | null>(null);
  const [loading, setLoading] = useState(true);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string>('');
  const [auths, setAuths] = useState<PlatformAuth[]>([]);
  const [publishLogs, setPublishLogs] = useState<PublishLog[]>([]);
  const [publishing, setPublishing] = useState(false);
  const [publishResults, setPublishResults] = useState<PublishResult[] | null>(null);
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>([]);

  useEffect(() => {
    if (id) {
      fetchPromotion(id);
      fetchAuths();
      fetchPublishLogs();
    }
  }, [id]);

  async function fetchPromotion(promotionId: string) {
    try {
      const { data, error } = await supabase
        .from('promotion_contents')
        .select('*')
        .eq('id', promotionId)
        .single();

      if (error) throw error;
      setPromotion(data);

      const platforms = Object.keys(data?.content as Record<string, any> || {});
      if (platforms.length > 0) {
        setActiveTab(platforms[0]);
      }
    } catch (error) {
      console.error('Error fetching promotion:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAuths() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const { data, error } = await supabase
        .from('user_platform_auth')
        .select('*')
        .eq('user_id', userData.user.id)
        .eq('is_active', true);

      if (error) throw error;
      setAuths(data || []);
    } catch (error) {
      console.error('Error fetching auths:', error);
    }
  }

  async function fetchPublishLogs() {
    if (!id) return;
    try {
      const { data, error } = await supabase
        .from('promotion_publish_logs')
        .select('*')
        .eq('content_id', id)
        .order('executed_at', { ascending: false });

      if (error) throw error;
      setPublishLogs(data || []);
    } catch (error) {
      console.error('Error fetching publish logs:', error);
    }
  }

  function getAuthForPlatform(platformId: string): PlatformAuth | undefined {
    return auths.find(a => a.platform === platformId);
  }

  function getPublishLogForPlatform(platformId: string): PublishLog | undefined {
    return publishLogs.find(l => l.platform === platformId && l.status === 'success');
  }

  async function deletePromotion() {
    if (!promotion) return;
    if (!confirm('确定要删除这个推广内容吗？')) return;

    try {
      const { error } = await supabase
        .from('promotion_contents')
        .delete()
        .eq('id', promotion.id);

      if (error) throw error;
      navigate('/promotion/list');
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('删除失败');
    }
  }

  function getPromotionLink(): string {
    const baseUrl = (window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin;
    return `${baseUrl}/#/promotion/${id}`;
  }

  async function copyContent(content: string, platform: string) {
    try {
      const manualPlatforms = ['wechat', 'pengyouquan'];
      let contentToCopy = content;

      if (manualPlatforms.includes(platform)) {
        const promotionLink = getPromotionLink();
        contentToCopy = `${content}\n\n---\n📎 查看完整推广内容：${promotionLink}`;
      }

      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(contentToCopy);
        setCopiedPlatform(platform);
        setTimeout(() => setCopiedPlatform(null), 2000);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = contentToCopy;
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

  async function publishToPlatforms() {
    if (!promotion || selectedPlatforms.length === 0) return;

    setPublishing(true);
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
          contentId: promotion.id,
          platforms: selectedPlatforms,
        }),
      });

      const result = await response.json();
      setPublishResults(result.results || []);
      await fetchPublishLogs();
    } catch (error) {
      console.error('Error publishing:', error);
      alert('发布失败，请稍后重试');
    } finally {
      setPublishing(false);
    }
  }

  function openPublishModal() {
    const content = promotion?.content as Record<string, any> || {};
    const availablePlatforms = Object.keys(content).filter(
      p => autoPublishPlatforms.includes(p) && !getPublishLogForPlatform(p)
    );
    setSelectedPlatforms(availablePlatforms);
    setShowPublishModal(true);
    setPublishResults(null);
  }

  function togglePlatform(platform: string) {
    setSelectedPlatforms(prev =>
      prev.includes(platform)
        ? prev.filter(p => p !== platform)
        : [...prev, platform]
    );
  }

  function getStatusBadge(status: string | null) {
    const statusMap: Record<string, { text: string; className: string }> = {
      draft: { text: '草稿', className: 'bg-gray-500/20 text-gray-400' },
      reviewing: { text: '审核中', className: 'bg-yellow-500/20 text-yellow-400' },
      approved: { text: '已通过', className: 'bg-green-500/20 text-green-400' },
      scheduled: { text: '已排期', className: 'bg-blue-500/20 text-blue-400' },
      published: { text: '已发布', className: 'bg-green-500/20 text-green-400' },
      archived: { text: '已归档', className: 'bg-gray-500/20 text-gray-400' },
    };
    const { text, className } = statusMap[status || 'draft'] || statusMap.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${className}`}>
        {text}
      </span>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
      </div>
    );
  }

  if (!promotion) {
    return (
      <div className="min-h-screen bg-[#0a0a0f] text-white">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-center py-20">
            <p className="text-white/60">推广内容不存在</p>
            <button
              onClick={() => navigate('/promotion/list')}
              className="mt-4 text-orange-500 hover:text-orange-400"
            >
              返回列表
            </button>
          </div>
        </div>
      </div>
    );
  }

  const content = promotion.content as Record<string, { content: string; title?: string }>;
  const platforms = Object.keys(content);
  const hasAutoPublishPlatforms = platforms.some(p => autoPublishPlatforms.includes(p));

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-4xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate('/promotion/list')}
            className="flex items-center gap-2 text-white/60 hover:text-white mb-4"
          >
            <ArrowLeft className="w-4 h-4" />
            返回列表
          </button>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold">{promotion.title}</h1>
              {getStatusBadge(promotion.status)}
            </div>
            <div className="flex gap-2">
              {hasAutoPublishPlatforms && (
                <button
                  onClick={openPublishModal}
                  className="px-4 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 text-white rounded-lg flex items-center gap-2 transition-colors"
                >
                  <Rocket className="w-4 h-4" />
                  一键发布
                </button>
              )}
              <button
                onClick={() => navigate('/promotion/settings')}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
              <button
                onClick={() => navigate(`/promotion/${promotion.id}/edit`)}
                className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
              >
                <Edit3 className="w-5 h-5" />
              </button>
              <button
                onClick={deletePromotion}
                className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-white/60 mt-2">
            创建于 {new Date(promotion.created_at || '').toLocaleDateString('zh-CN')}
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
            {platforms.map((platform) => {
              const iconInfo = platformIcons[platform] || { abbr: platform.slice(0, 2).toUpperCase(), bgColor: 'bg-white/20' };
              return (
                <button
                  key={platform}
                  onClick={() => setActiveTab(platform)}
                  className={`px-4 py-2 rounded-lg text-sm whitespace-nowrap transition-colors flex items-center gap-2 ${
                    activeTab === platform
                      ? 'bg-orange-500 text-white'
                      : 'bg-white/10 text-white/60 hover:bg-white/20'
                  }`}
                >
                  <div className={`w-5 h-5 rounded ${iconInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                    <span className="text-white text-[10px] font-bold">{iconInfo.abbr}</span>
                  </div>
                  <span>{platformNames[platform] || platform}</span>
                  {getPublishLogForPlatform(platform) && (
                    <Check className="w-3 h-3 text-green-400" />
                  )}
                </button>
              );
            })}
          </div>

          {activeTab && content[activeTab] && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white/5 border border-white/10 rounded-xl p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  {(() => {
                    const iconInfo = platformIcons[activeTab] || { abbr: activeTab.slice(0, 2).toUpperCase(), bgColor: 'bg-white/20' };
                    return (
                      <div className={`w-10 h-10 rounded-lg ${iconInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                        <span className="text-white font-bold text-sm">{iconInfo.abbr}</span>
                      </div>
                    );
                  })()}
                  <div>
                    <h3 className="font-medium">{platformNames[activeTab]}</h3>
                    {content[activeTab].title && (
                      <p className="text-white/60 text-sm">{content[activeTab].title}</p>
                    )}
                  </div>
                </div>
                <div className="flex gap-2">
                  {getPublishLogForPlatform(activeTab) ? (
                    <a
                      href={getPublishLogForPlatform(activeTab)?.platform_url || '#'}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-2 bg-green-500/20 text-green-400 rounded-lg flex items-center gap-2 text-sm hover:bg-green-500/30 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      查看已发布
                    </a>
                  ) : autoPublishPlatforms.includes(activeTab) ? (
                    <button
                      onClick={() => {
                        setSelectedPlatforms([activeTab]);
                        setShowPublishModal(true);
                        setPublishResults(null);
                      }}
                      className="px-3 py-2 bg-orange-500/20 text-orange-400 rounded-lg flex items-center gap-2 text-sm hover:bg-orange-500/30 transition-colors"
                    >
                      <Rocket className="w-4 h-4" />
                      发布
                    </button>
                  ) : null}
                  <button
                    onClick={() => copyContent(content[activeTab].content, activeTab)}
                    className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    {copiedPlatform === activeTab ? (
                      <Check className="w-4 h-4 text-green-400" />
                    ) : (
                      <Copy className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
              <div className="bg-white/5 rounded-lg p-4 whitespace-pre-wrap text-white/80 text-sm max-h-96 overflow-y-auto">
                {content[activeTab].content}
              </div>

              {!autoPublishPlatforms.includes(activeTab) && (
                <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="text-sm text-white/60">
                    <p className="font-medium text-yellow-400 mb-1">暂不支持自动发布</p>
                    <p>
                      {activeTab === 'wechat'
                        ? '微信未开放公众号文章发布API，点击复制按钮会自动附加虾蛋星球推广链接，粘贴到公众号后台即可'
                        : activeTab === 'pengyouquan'
                        ? '微信严格限制第三方访问朋友圈，点击复制按钮会自动附加虾蛋星球推广链接，手动分享到朋友圈即可'
                        : '该平台暂不支持自动发布，请复制内容后手动发布'}
                    </p>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </motion.div>

        {publishLogs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-8"
          >
            <h3 className="font-medium mb-4">发布记录</h3>
            <div className="space-y-2">
              {publishLogs.slice(0, 5).map((log) => {
                const iconInfo = platformIcons[log.platform] || { abbr: log.platform.slice(0, 2).toUpperCase(), bgColor: 'bg-white/20' };
                return (
                <div
                  key={log.id}
                  className="flex items-center justify-between p-3 bg-white/5 rounded-lg"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg ${iconInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                      <span className="text-white font-bold text-xs">{iconInfo.abbr}</span>
                    </div>
                    <div>
                      <p className="text-sm">{platformNames[log.platform]}</p>
                      <p className="text-xs text-white/40">
                        {new Date(log.executed_at || '').toLocaleString('zh-CN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {log.status === 'success' ? (
                      <>
                        <span className="px-2 py-1 bg-green-500/20 text-green-400 text-xs rounded-full">
                          成功
                        </span>
                        {log.platform_url && (
                          <a
                            href={log.platform_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-orange-500 hover:text-orange-400"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        )}
                      </>
                    ) : (
                      <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs rounded-full">
                        失败
                      </span>
                    )}
                  </div>
                </div>
              );
              })}
            </div>
          </motion.div>
        )}
      </div>

      {showPublishModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-[#1a1a1f] border border-white/10 rounded-xl p-6 max-w-md w-full"
          >
            <h3 className="text-lg font-bold mb-4">一键发布</h3>

            {!publishResults ? (
              <>
                <p className="text-white/60 text-sm mb-4">选择要发布的平台：</p>
                <div className="space-y-2 mb-6">
                  {platforms
                    .filter(p => autoPublishPlatforms.includes(p))
                    .map((platform) => {
                      const auth = getAuthForPlatform(platform);
                      const published = getPublishLogForPlatform(platform);
                      const isSelected = selectedPlatforms.includes(platform);

                      const iconInfo = platformIcons[platform] || { abbr: platform.slice(0, 2).toUpperCase(), bgColor: 'bg-white/20' };
                      return (
                        <button
                          key={platform}
                          onClick={() => !published && togglePlatform(platform)}
                          disabled={!!published || publishing}
                          className={`w-full flex items-center justify-between p-3 rounded-lg border transition-colors ${
                            published
                              ? 'bg-green-500/10 border-green-500/30 opacity-60'
                              : isSelected
                              ? 'bg-orange-500/20 border-orange-500'
                              : 'bg-white/5 border-white/10 hover:bg-white/10'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 rounded-lg ${iconInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                              <span className="text-white font-bold text-xs">{iconInfo.abbr}</span>
                            </div>
                            <span>{platformNames[platform]}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            {!auth && !published && (
                              <span className="text-xs text-yellow-400">未授权</span>
                            )}
                            {published ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : isSelected ? (
                              <div className="w-4 h-4 bg-orange-500 rounded-full flex items-center justify-center">
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            ) : (
                              <div className="w-4 h-4 border border-white/30 rounded-full" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                </div>

                <div className="flex gap-3">
                  <button
                    onClick={() => setShowPublishModal(false)}
                    disabled={publishing}
                    className="flex-1 py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                  <button
                    onClick={publishToPlatforms}
                    disabled={selectedPlatforms.length === 0 || publishing}
                    className="flex-1 py-2 bg-gradient-to-r from-orange-500 to-red-500 hover:from-orange-600 hover:to-red-600 disabled:opacity-50 rounded-lg flex items-center justify-center gap-2"
                  >
                    {publishing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        发布中...
                      </>
                    ) : (
                      <>
                        <Rocket className="w-4 h-4" />
                        发布 ({selectedPlatforms.length})
                      </>
                    )}
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="text-white/60 text-sm mb-4">发布结果：</p>
                <div className="space-y-2 mb-6">
                  {publishResults.map((result) => {
                    const iconInfo = platformIcons[result.platform] || { abbr: result.platform.slice(0, 2).toUpperCase(), bgColor: 'bg-white/20' };
                    return (
                    <div
                      key={result.platform}
                      className={`flex items-center justify-between p-3 rounded-lg ${
                        result.success
                          ? 'bg-green-500/10 border border-green-500/30'
                          : 'bg-red-500/10 border border-red-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`w-8 h-8 rounded-lg ${iconInfo.bgColor} flex items-center justify-center flex-shrink-0`}>
                          <span className="text-white font-bold text-xs">{iconInfo.abbr}</span>
                        </div>
                        <div>
                          <span>{platformNames[result.platform]}</span>
                          {!result.success && result.error && (
                            <p className="text-xs text-red-400">
                              {result.errorType && errorTypeMessages[result.errorType]
                                ? `${errorTypeMessages[result.errorType]}: ${result.error}`
                                : result.error}
                            </p>
                          )}
                          {!result.success && result.retryable && (
                            <p className="text-xs text-orange-400 mt-1">可重试</p>
                          )}
                        </div>
                      </div>
                      {result.success ? (
                        <Check className="w-5 h-5 text-green-400" />
                      ) : (
                        <AlertCircle className="w-5 h-5 text-red-400" />
                      )}
                    </div>
                  );
                  })}
                </div>
                <button
                  onClick={() => {
                    setShowPublishModal(false);
                    setPublishResults(null);
                  }}
                  className="w-full py-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                >
                  关闭
                </button>
              </>
            )}
          </motion.div>
        </div>
      )}
    </div>
  );
}
