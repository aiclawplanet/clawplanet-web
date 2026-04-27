import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Heart, Share2, ExternalLink, MessageCircle, Eye, Award, ChevronLeft, Send, Smartphone, Globe, AppWindow, Sparkles, Star, ThumbsUp, ThumbsDown, X, Download, Check, Wrench, User, Rocket } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type Comment = Tables<'comments'>;
type Profile = Tables<'profiles'>;
type PlatformLink = Tables<'tool_platform_links'>;
type PromotionLink = Tables<'promotion_links'>;

interface CommentWithLikes extends Comment {
  user?: Profile;
  likes_count?: number;
  user_liked?: boolean;
}

export function ToolDetail() {
  const { id } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const promotionCode = searchParams.get('ref');
  const [tool, setTool] = useState<Tool & { developer?: Profile; certificate?: { certificate_code: string }; rating?: number; rating_count?: number } | null>(null);
  const [platformLinks, setPlatformLinks] = useState<PlatformLink[]>([]);
  const [comments, setComments] = useState<CommentWithLikes[]>([]);
  const [likedComments, setLikedComments] = useState<Set<string>>(new Set());
  const [relatedTools, setRelatedTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isFavorited, setIsFavorited] = useState(false);
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [showShareModal, setShowShareModal] = useState(false);
  const [shareImageUrl, setShareImageUrl] = useState<string | null>(null);
  const [isGeneratingImage, setIsGeneratingImage] = useState(false);
  const [promotionLink, setPromotionLink] = useState<PromotionLink | null>(null);
  const [showQrModal, setShowQrModal] = useState(false);
  const [selectedQrLink, setSelectedQrLink] = useState<PlatformLink | null>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  // 需要二维码的平台列表
  const QR_CODE_PLATFORMS = [
    'wechat_miniprogram', 'alipay_miniprogram', 'baidu_miniprogram',
    'bytedance_miniprogram', 'qq_miniprogram', 'kuaishou_miniprogram',
    'android_360', 'android_baidu', 'android_wandoujia'
  ];

  function needsQrCode(platform: string): boolean {
    return QR_CODE_PLATFORMS.includes(platform);
  }

  useEffect(() => {
    if (id) {
      fetchToolDetail();
      incrementViewCount();
      // If promotion code exists, record landing page view and fetch promotion link
      if (promotionCode) {
        recordLandingPageView();
        fetchPromotionLink();
      }
    }
  }, [id, promotionCode]);

  async function fetchPromotionLink() {
    if (!promotionCode) return;
    try {
      const { data } = await supabase
        .from('promotion_links')
        .select('*')
        .eq('code', promotionCode)
        .single();
      if (data) {
        setPromotionLink(data);
      }
    } catch (error) {
      console.error('Error fetching promotion link:', error);
    }
  }

  async function recordLandingPageView() {
    if (!promotionCode || !id) return;
    try {
      // Record landing page click
      await supabase.rpc('record_promotion_landing_view', {
        promotion_code: promotionCode,
        tool_id: id,
        ip_address: null,
        user_agent: navigator.userAgent
      });
    } catch (error) {
      console.error('Error recording landing page view:', error);
    }
  }

  async function fetchToolDetail() {
    try {
      // Fetch tool with developer info
      const { data: toolData } = await supabase
        .from('tools')
        .select('*, developer:developer_id(*), certificate:tool_certificates(certificate_code)')
        .eq('id', id)
        .single();

      if (toolData) {
        setTool(toolData);
      }

      // Fetch platform links
      const { data: linksData } = await supabase
        .from('tool_platform_links')
        .select('*')
        .eq('tool_id', id)
        .eq('is_active', true)
        .order('sort_order', { ascending: true });

      if (linksData) {
        setPlatformLinks(linksData);
      }

      // Fetch comments
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, user:user_id(*)')
        .eq('tool_id', id)
        .is('parent_id', null)
        .order('created_at', { ascending: false });

      if (commentsData) {
        setComments(commentsData);
      }

      // Check if favorited and load liked comments
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: favData } = await supabase
          .from('favorites')
          .select('*')
          .eq('tool_id', id)
          .eq('user_id', user.id)
          .single();
        setIsFavorited(!!favData);

        // Load user's liked comments from localStorage
        const savedLikes = localStorage.getItem(`liked_comments_${user.id}`);
        if (savedLikes) {
          setLikedComments(new Set(JSON.parse(savedLikes)));
        }
      }

      // Fetch related tools
      if (toolData?.category_id) {
        await fetchRelatedTools(toolData.category_id, id);
      }
    } catch (error) {
      console.error('Error fetching tool detail:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchRelatedTools(categoryId: string, currentToolId: string) {
    try {
      const { data: relatedData } = await supabase
        .from('tools')
        .select('*, developer:developer_id(username)')
        .eq('category_id', categoryId)
        .eq('status', 'approved')
        .neq('id', currentToolId)
        .order('view_count', { ascending: false })
        .limit(4);

      if (relatedData) {
        setRelatedTools(relatedData);
      }
    } catch (error) {
      console.error('Error fetching related tools:', error);
    }
  }

  async function incrementViewCount() {
    if (!id) return;
    await supabase.rpc('increment_tool_view', { tool_id: id });
  }

  async function handleFavorite() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('请先登录');
      return;
    }

    if (isFavorited) {
      await supabase
        .from('favorites')
        .delete()
        .eq('tool_id', id)
        .eq('user_id', user.id);
      setIsFavorited(false);
    } else {
      await supabase.from('favorites').insert({
        tool_id: id,
        user_id: user.id,
      });
      setIsFavorited(true);
    }
  }

  async function handleSubmitComment(e: React.FormEvent) {
    e.preventDefault();
    if (!newComment.trim() || !id) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('请先登录');
      return;
    }

    setIsSubmitting(true);
    try {
      const { data: commentData } = await supabase
        .from('comments')
        .insert({
          tool_id: id,
          user_id: user.id,
          content: newComment.trim(),
        })
        .select('*, user:user_id(*)')
        .single();

      if (commentData) {
        setComments([commentData, ...comments]);
        setNewComment('');
      }
    } catch (error) {
      console.error('Error submitting comment:', error);
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleJump(url: string, linkId?: string, platform?: string, qrCodeUrl?: string | null) {
    if (!tool) return;

    // Debug log
    console.log('Jumping to:', { url, platform, linkId, qrCodeUrl });

    // 如果有二维码，显示二维码弹窗
    if (qrCodeUrl && needsQrCode(platform || '')) {
      const link = platformLinks.find(l => l.id === linkId);
      if (link) {
        setSelectedQrLink(link);
        setShowQrModal(true);
        return;
      }
    }

    // Detect platform type and handle accordingly
    // Check both URL patterns and platform parameter
    const isWechatMiniprogram = platform?.includes('wechat') || platform?.includes('miniprogram') || url.includes('weixin.qq.com') || url.includes('servicewechat.com') || url.startsWith('#小程序://') || url.startsWith('小程序://') || url.startsWith('weixin://');
    const isAlipayMiniprogram = platform?.includes('alipay') || url.startsWith('alipays://');
    const isBaiduMiniprogram = platform?.includes('baidu') || url.startsWith('baiduboxapp://');
    const isMiniprogram = isWechatMiniprogram || isAlipayMiniprogram || isBaiduMiniprogram;
    const isAppStore = platform?.includes('ios') || url.startsWith('itms-apps://') || url.startsWith('https://apps.apple.com');
    const isAndroidStore = platform?.includes('android') && (url.startsWith('market://') || url.includes('play.google.com'));

    // For WeChat mini-programs with special URL format (#小程序:// or 小程序://)
    if (url.startsWith('#小程序://') || url.startsWith('小程序://')) {
      // WeChat mini-program URL scheme - try to open via WeChat
      // Use the original format as WeChat expects
      window.location.href = url;
      return;
    } else if (url.startsWith('weixin://')) {
      // Direct WeChat protocol
      window.location.href = url;
      return;
    } else if (isMiniprogram || isAppStore || isAndroidStore) {
      // Try to open the URL directly (for app schemes)
      window.location.href = url;

      // Also try opening in new tab as fallback for web URLs
      if (url.startsWith('http')) {
        setTimeout(() => {
          window.open(url, '_blank');
        }, 100);
      }
    } else {
      // Regular web link
      window.open(url, '_blank');
    }

    // Record tool jump (second jump - this is the billing point)
    await supabase.rpc('increment_tool_jump', { tool_id: tool.id });

    // If this is from a promotion link, record conversion for promoter
    if (promotionLink && promotionCode) {
      try {
        await supabase.rpc('record_promotion_conversion', {
          promotion_code: promotionCode,
          tool_id: tool.id,
          promoter_id: promotionLink.promoter_id,
          ip_address: null,
          user_agent: navigator.userAgent
        });
      } catch (error) {
        console.error('Error recording promotion conversion:', error);
      }
    }
  }

  async function handleLikeComment(commentId: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      alert('请先登录');
      return;
    }

    const isLiked = likedComments.has(commentId);
    const newLikedComments = new Set(likedComments);

    if (isLiked) {
      newLikedComments.delete(commentId);
      // Update comment likes count
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, likes_count: Math.max(0, (c.likes_count || 0) - 1), user_liked: false }
          : c
      ));
    } else {
      newLikedComments.add(commentId);
      // Update comment likes count
      setComments(prev => prev.map(c =>
        c.id === commentId
          ? { ...c, likes_count: (c.likes_count || 0) + 1, user_liked: true }
          : c
      ));
    }

    setLikedComments(newLikedComments);
    localStorage.setItem(`liked_comments_${user.id}`, JSON.stringify(Array.from(newLikedComments)));

    // Update in database
    const comment = comments.find(c => c.id === commentId);
    if (comment) {
      const newLikesCount = isLiked
        ? Math.max(0, (comment.likes_count || 0) - 1)
        : (comment.likes_count || 0) + 1;

      await supabase
        .from('comments')
        .update({ likes_count: newLikesCount })
        .eq('id', commentId);
    }
  }

  function getPlatformIcon(platform: string) {
    if (platform.includes('miniprogram')) return { abbr: '小程序', bgColor: '#07C160' };
    if (platform.includes('ios')) return { abbr: 'iOS', bgColor: '#007AFF' };
    if (platform.includes('android')) return { abbr: 'Android', bgColor: '#3DDC84' };
    if (platform.includes('web')) return { abbr: 'Web', bgColor: '#8B5CF6' };
    return { abbr: '链接', bgColor: '#6B7280' };
  }

  function getPlatformCategory(platform: string): string {
    if (platform.includes('miniprogram')) return '小程序';
    if (platform.includes('app') || platform.includes('ios') || platform.includes('android')) return 'APP';
    return '网页';
  }

  async function generateSharePoster() {
    if (!tool) return;
    setIsGeneratingImage(true);

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 600;
      canvas.height = 800;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Background gradient
      const gradient = ctx.createLinearGradient(0, 0, 600, 800);
      gradient.addColorStop(0, '#1A1A2E');
      gradient.addColorStop(1, '#0F0F1A');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 600, 800);

      // Border
      ctx.strokeStyle = '#8B5CF6';
      ctx.lineWidth = 4;
      ctx.strokeRect(20, 20, 560, 760);

      // Title
      ctx.fillStyle = '#FFFFFF';
      ctx.font = 'bold 36px -apple-system, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(tool.name, 300, 100);

      // Description
      ctx.fillStyle = '#9CA3AF';
      ctx.font = '24px -apple-system, sans-serif';
      const desc = tool.description?.slice(0, 60) + (tool.description?.length > 60 ? '...' : '') || '暂无描述';
      ctx.fillText(desc, 300, 160);

      // QR Code placeholder
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(200, 250, 200, 200);
      ctx.fillStyle = '#000000';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.fillText('扫码访问', 300, 360);

      // Tool info
      ctx.fillStyle = '#8B5CF6';
      ctx.font = '20px -apple-system, sans-serif';
      ctx.fillText(`浏览: ${tool.view_count || 0}  使用: ${tool.jump_count || 0}`, 300, 520);

      // Developer
      ctx.fillStyle = '#6B7280';
      ctx.font = '18px -apple-system, sans-serif';
      ctx.fillText(`开发者: ${tool.developer?.username || '匿名开发者'}`, 300, 580);

      // Brand
      ctx.fillStyle = '#8B5CF6';
      ctx.font = 'bold 28px -apple-system, sans-serif';
      ctx.fillText('虾蛋星球', 300, 700);
      ctx.fillStyle = '#6B7280';
      ctx.font = '16px -apple-system, sans-serif';
      ctx.fillText('发现独立开发者的宝藏工具', 300, 740);

      const dataUrl = canvas.toDataURL('image/png');
      setShareImageUrl(dataUrl);
      setShowShareModal(true);
    } catch (error) {
      console.error('Error generating poster:', error);
    } finally {
      setIsGeneratingImage(false);
    }
  }

  function downloadPoster() {
    if (!shareImageUrl) return;
    const link = document.createElement('a');
    link.download = `${tool?.name || 'tool'}-poster.png`;
    link.href = shareImageUrl;
    link.click();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2">工具未找到</h2>
        <p className="text-white/60 mb-6">该工具可能已被删除或尚未审核通过</p>
        <Link to="/" className="px-6 py-3 bg-[#8B5CF6] rounded-xl">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Back Button */}
      <Link
        to="/"
        className="inline-flex items-center text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        返回首页
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Tool Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start space-x-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                {tool.icon_url ? (
                  <img src={tool.icon_url} alt={tool.name} className="w-16 h-16 rounded-xl" />
                ) : (
                  <Wrench className="w-12 h-12 text-[#8B5CF6]" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h1 className="text-2xl font-bold">{tool.name}</h1>
                  {tool.is_premium && (
                    <span className="px-2 py-1 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-lg text-xs font-medium">
                      精品
                    </span>
                  )}
                </div>
                <p className="text-white/60 mb-4">{tool.description}</p>

                {/* Rating Display */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="flex items-center">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        className={`w-4 h-4 ${
                          star <= (tool.rating || 0)
                            ? 'text-yellow-400 fill-yellow-400'
                            : 'text-white/20'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-white/60">
                    {tool.rating?.toFixed(1) || '0.0'} ({tool.rating_count || 0} 评价)
                  </span>
                </div>

                <div className="flex items-center space-x-4 text-sm text-white/40">
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {tool.view_count} 浏览
                  </span>
                  <span className="flex items-center">
                    <ExternalLink className="w-4 h-4 mr-1" />
                    {tool.jump_count} 使用
                  </span>
                  {tool.certificate && (
                    <span className="flex items-center text-[#8B5CF6]">
                      <Award className="w-4 h-4 mr-1" />
                      已确权
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* User Rating Section */}
            <div className="mt-6 pt-6 border-t border-white/10">
              <h3 className="text-sm font-medium text-white/60 mb-3">为这个工具评分</h3>
              <div className="flex items-center space-x-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setUserRating(star)}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                  >
                    <Star
                      className={`w-6 h-6 ${
                        star <= (hoverRating || userRating)
                          ? 'text-yellow-400 fill-yellow-400'
                          : 'text-white/20'
                      }`}
                    />
                  </button>
                ))}
                <span className="ml-3 text-sm text-white/60">
                  {userRating > 0 ? ['很差', '一般', '不错', '很好', '非常棒'][userRating - 1] : '点击评分'}
                </span>
              </div>
            </div>

            {/* Platform Links */}
            {platformLinks.length > 0 && (
              <div className="mt-6 pt-6 border-t border-white/10">
                <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center">
                  <Smartphone className="w-4 h-4 mr-2" />
                  选择平台使用
                </h3>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                  {platformLinks.map((link, index) => (
                    <motion.button
                      key={link.id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05 }}
                      onClick={() => handleJump(link.url, link.id, link.platform, link.qr_code_url)}
                      className="group flex items-center p-3 bg-[#0F0F1A] border border-white/10 rounded-xl hover:border-[#8B5CF6]/50 hover:bg-[#8B5CF6]/5 transition-all"
                    >
                      <span className="text-2xl mr-3">{link.icon || (
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getPlatformIcon(link.platform).bgColor }}
                        >
                          {getPlatformIcon(link.platform).abbr}
                        </span>
                      )}</span>
                      <div className="flex-1 text-left min-w-0">
                        <p className="font-medium text-white/90 text-sm truncate">{link.platform_name}</p>
                        <p className="text-xs text-white/40">{getPlatformCategory(link.platform)}</p>
                      </div>
                      <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-[#8B5CF6] transition-colors" />
                    </motion.button>
                  ))}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-3 mt-6">
              {platformLinks.length > 0 ? (
                <button
                  onClick={() => handleJump(platformLinks[0].url, platformLinks[0].id, platformLinks[0].platform, platformLinks[0].qr_code_url)}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  立即使用
                </button>
              ) : (
                <button
                  onClick={() => handleJump(tool.jump_url, undefined, tool.jump_type || 'web')}
                  className="flex-1 flex items-center justify-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  <ExternalLink className="w-5 h-5 mr-2" />
                  立即使用
                </button>
              )}
              <button
                onClick={handleFavorite}
                className={`flex items-center justify-center px-6 py-3 border rounded-xl font-medium transition-colors ${
                  isFavorited
                    ? 'bg-red-500/20 border-red-500/50 text-red-400'
                    : 'bg-white/5 border-white/20 hover:bg-white/10'
                }`}
              >
                <Heart className={`w-5 h-5 mr-2 ${isFavorited ? 'fill-current' : ''}`} />
                {isFavorited ? '已收藏' : '收藏'}
              </button>
              <button
                onClick={generateSharePoster}
                disabled={isGeneratingImage}
                className="flex items-center justify-center px-6 py-3 bg-white/5 border border-white/20 rounded-xl font-medium hover:bg-white/10 transition-colors disabled:opacity-50"
              >
                {isGeneratingImage ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <Share2 className="w-5 h-5 mr-2" />
                )}
                分享
              </button>
            </div>
          </motion.div>

          {/* Developer Story */}
          {tool.developer_story && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <h2 className="text-lg font-bold mb-4 flex items-center">
                <span className="w-1 h-5 bg-gradient-to-b from-[#8B5CF6] to-[#3B82F6] rounded-full mr-3"></span>
                开发者故事
              </h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-white/80 whitespace-pre-wrap">{tool.developer_story}</p>
              </div>
            </motion.div>
          )}

          {/* Comments Section */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-lg font-bold mb-4 flex items-center">
              <span className="w-1 h-5 bg-gradient-to-b from-[#8B5CF6] to-[#3B82F6] rounded-full mr-3"></span>
              用户反馈
              <span className="ml-2 text-sm text-white/40">({comments.length})</span>
            </h2>

            {/* Comment Form */}
            <form onSubmit={handleSubmitComment} className="mb-6">
              <div className="flex space-x-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="分享你的使用体验或建议..."
                  className="flex-1 px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                >
                  <Send className="w-5 h-5" />
                </button>
              </div>
            </form>

            {/* Comments List */}
            <div className="space-y-4">
              {comments.length === 0 ? (
                <div className="text-center py-8 text-white/40">
                  <MessageCircle className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p>暂无评论，来发表第一条评论吧！</p>
                </div>
              ) : (
                comments.map((comment, index) => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="flex space-x-3 p-4 bg-[#0F0F1A] rounded-xl"
                  >
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/30 flex items-center justify-center flex-shrink-0">
                      {comment.user?.avatar_url ? (
                        <img
                          src={comment.user.avatar_url}
                          alt={comment.user.username || ''}
                          className="w-10 h-10 rounded-full"
                        />
                      ) : (
                        <span className="text-lg">👤</span>
                      )}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-1">
                        <span className="font-medium text-white/90">
                          {comment.user?.username || '匿名用户'}
                        </span>
                        <span className="text-xs text-white/40">
                          {new Date(comment.created_at || '').toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-white/70">{comment.content}</p>
                      <div className="flex items-center space-x-4 mt-2">
                        <button
                          onClick={() => handleLikeComment(comment.id)}
                          className={`flex items-center space-x-1 text-xs transition-colors ${
                            likedComments.has(comment.id)
                              ? 'text-[#8B5CF6]'
                              : 'text-white/40 hover:text-[#8B5CF6]'
                          }`}
                        >
                          <ThumbsUp className={`w-3 h-3 ${likedComments.has(comment.id) ? 'fill-current' : ''}`} />
                          <span>{comment.likes_count || 0}</span>
                        </button>
                      </div>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Developer Info */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <h3 className="text-sm font-medium text-white/60 mb-4">开发者</h3>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/30 flex items-center justify-center">
                {tool.developer?.avatar_url ? (
                  <img
                    src={tool.developer.avatar_url}
                    alt={tool.developer.username || ''}
                    className="w-12 h-12 rounded-full"
                  />
                ) : (
                  <User className="w-6 h-6 text-[#8B5CF6]" />
                )}
              </div>
              <div>
                <p className="font-medium">{tool.developer?.username || '匿名开发者'}</p>
                <p className="text-sm text-white/40">{tool.developer?.bio || '独立开发者'}</p>
              </div>
            </div>
          </motion.div>

          {/* IP Certificate */}
          {tool.certificate && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 border border-[#8B5CF6]/30 rounded-2xl p-6"
            >
              <div className="flex items-center space-x-2 mb-3">
                <Award className="w-5 h-5 text-[#8B5CF6]" />
                <h3 className="font-medium text-[#8B5CF6]">数字IP确权</h3>
              </div>
              <p className="text-sm text-white/60 mb-3">
                该作品已完成轻量级数字确权，具有唯一确权编码。
              </p>
              <div className="bg-[#0F0F1A] rounded-lg p-3 font-mono text-xs text-white/40 break-all">
                {tool.certificate.certificate_code}
              </div>
            </motion.div>
          )}

          {/* Available Platforms */}
          {platformLinks.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-white/60 mb-4">已发布平台</h3>
              <div className="space-y-3">
                {platformLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => handleJump(link.url, link.id, link.platform, link.qr_code_url)}
                    className="w-full flex items-center p-3 bg-[#0F0F1A] rounded-xl hover:bg-[#8B5CF6]/10 transition-colors group"
                  >
                    <span className="text-xl mr-3">{link.icon || (
                        <span
                          className="inline-flex items-center justify-center px-2 py-1 rounded text-xs font-medium text-white"
                          style={{ backgroundColor: getPlatformIcon(link.platform).bgColor }}
                        >
                          {getPlatformIcon(link.platform).abbr}
                        </span>
                      )}</span>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-medium text-white/90">{link.platform_name}</p>
                    </div>
                    <ExternalLink className="w-4 h-4 text-white/30 group-hover:text-[#8B5CF6]" />
                  </button>
                ))}
              </div>
            </motion.div>
          )}

          {/* Tags */}
          {tool.tags && tool.tags.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-white/60 mb-4">标签</h3>
              <div className="flex flex-wrap gap-2">
                {tool.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-3 py-1 bg-white/5 border border-white/10 rounded-full text-sm text-white/70"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </motion.div>
          )}

          {/* Related Tools */}
          {relatedTools.length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <h3 className="text-sm font-medium text-white/60 mb-4 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-[#8B5CF6]" />
                相关推荐
              </h3>
              <div className="space-y-3">
                {relatedTools.map((relatedTool, index) => (
                  <Link
                    key={relatedTool.id}
                    to={`/tool/${relatedTool.id}`}
                    className="flex items-center p-3 bg-[#0F0F1A] rounded-xl hover:bg-[#8B5CF6]/10 transition-colors group"
                  >
                    <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center mr-3 flex-shrink-0">
                      {relatedTool.icon_url ? (
                        <img
                          src={relatedTool.icon_url}
                          alt={relatedTool.name}
                          className="w-10 h-10 rounded-lg"
                        />
                      ) : (
                        <Wrench className="w-6 h-6 text-[#8B5CF6]" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-white/90 text-sm truncate group-hover:text-[#8B5CF6] transition-colors">
                        {relatedTool.name}
                      </p>
                      <p className="text-xs text-white/40 truncate">
                        @{relatedTool.developer?.username || '匿名开发者'}
                      </p>
                    </div>
                    <div className="text-xs text-white/30 ml-2 flex items-center gap-1">
                      <Eye className="w-3 h-3" />
                      {relatedTool.view_count || 0}
                    </div>
                  </Link>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Share Modal */}
      <AnimatePresence>
        {showShareModal && shareImageUrl && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowShareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">分享海报</h3>
                <button
                  onClick={() => setShowShareModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <div className="bg-white rounded-lg overflow-hidden mb-4">
                <img
                  src={shareImageUrl}
                  alt="分享海报"
                  className="w-full h-auto"
                />
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={downloadPoster}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
                >
                  <Download className="w-5 h-5 mr-2" />
                  下载海报
                </button>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(window.location.href);
                    alert('链接已复制到剪贴板');
                  }}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-white/10 border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  <Check className="w-5 h-5 mr-2" />
                  复制链接
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* QR Code Modal */}
      <AnimatePresence>
        {showQrModal && selectedQrLink && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowQrModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-bold">{selectedQrLink.platform_name}</h3>
                <button
                  onClick={() => setShowQrModal(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="text-center mb-6">
                <p className="text-white/60 text-sm mb-4">
                  该{getPlatformCategory(selectedQrLink.platform)}无法通过网页直接跳转
                </p>

                {selectedQrLink.qr_code_url ? (
                  <div className="bg-white rounded-xl p-4 mb-4">
                    <img
                      src={selectedQrLink.qr_code_url}
                      alt={`${selectedQrLink.platform_name}二维码`}
                      className="w-48 h-48 mx-auto object-contain"
                    />
                  </div>
                ) : (
                  <div className="bg-white/5 border border-white/10 rounded-xl p-8 mb-4">
                    <Smartphone className="w-16 h-16 text-white/30 mx-auto mb-3" />
                    <p className="text-white/40 text-sm">暂无二维码</p>
                  </div>
                )}

                <div className="space-y-2 text-sm text-white/60">
                  <p className="flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center text-xs mr-2">1</span>
                    长按保存二维码到相册
                  </p>
                  <p className="flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center text-xs mr-2">2</span>
                    打开{selectedQrLink.platform_name.includes('微信') ? '微信' : selectedQrLink.platform_name}扫一扫
                  </p>
                  <p className="flex items-center justify-center">
                    <span className="w-5 h-5 rounded-full bg-[#8B5CF6]/20 text-[#8B5CF6] flex items-center justify-center text-xs mr-2">3</span>
                    从相册选择二维码图片
                  </p>
                </div>
              </div>

              <div className="flex space-x-3">
                {selectedQrLink.qr_code_url && (
                  <button
                    onClick={() => {
                      const link = document.createElement('a');
                      link.href = selectedQrLink.qr_code_url!;
                      link.download = `${tool?.name || 'tool'}-qrcode.jpg`;
                      link.click();
                    }}
                    className="flex-1 flex items-center justify-center px-4 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
                  >
                    <Download className="w-5 h-5 mr-2" />
                    保存二维码
                  </button>
                )}
                <button
                  onClick={() => setShowQrModal(false)}
                  className="flex-1 flex items-center justify-center px-4 py-3 bg-white/10 border border-white/20 rounded-xl font-medium hover:bg-white/20 transition-colors"
                >
                  关闭
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
