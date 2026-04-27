import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Plus, FileText, Calendar, Trash2, Edit3, ExternalLink, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';
import { PublishFailedSummary } from '../components/PublishFailedSummary';

type PromotionContent = Tables<'promotion_contents'>;

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

const platformNames: Record<string, string> = {
  wechat: '微信公众号',
  xiaohongshu: '小红书',
  jike: '即刻',
  zhihu: '知乎',
  pengyouquan: '朋友圈',
  weibo: '微博',
  juejin: '掘金',
  github: 'GitHub',
};

export function PromotionList() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<PromotionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [showFailedSummary, setShowFailedSummary] = useState(false);
  const [selectedPromotionId, setSelectedPromotionId] = useState<string | null>(null);
  const [failedCounts, setFailedCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchPromotions();
  }, []);

  useEffect(() => {
    if (promotions.length > 0) {
      fetchFailedCounts();
    }
  }, [promotions]);

  async function fetchPromotions() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) {
        setLoading(false);
        return;
      }

      let query = supabase
        .from('promotion_contents')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false });

      if (filter !== 'all') {
        query = query.eq('status', filter);
      }

      const { data, error } = await query;

      if (error) throw error;
      setPromotions(data || []);
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchFailedCounts() {
    try {
      const { data: userData } = await supabase.auth.getUser();
      if (!userData.user) return;

      const contentIds = promotions.map(p => p.id);
      if (contentIds.length === 0) return;

      const { data, error } = await supabase
        .from('promotion_publish_logs')
        .select('content_id')
        .eq('user_id', userData.user.id)
        .eq('status', 'failed')
        .in('content_id', contentIds);

      if (error) throw error;

      const counts: Record<string, number> = {};
      data?.forEach((log: { content_id: string }) => {
        counts[log.content_id] = (counts[log.content_id] || 0) + 1;
      });
      setFailedCounts(counts);
    } catch (error) {
      console.error('Error fetching failed counts:', error);
    }
  }

  function openFailedSummary(contentId: string) {
    setSelectedPromotionId(contentId);
    setShowFailedSummary(true);
  }

  async function deletePromotion(id: string) {
    if (!confirm('确定要删除这个推广内容吗？')) return;

    try {
      const { error } = await supabase
        .from('promotion_contents')
        .delete()
        .eq('id', id);

      if (error) throw error;
      setPromotions(prev => prev.filter(p => p.id !== id));
    } catch (error) {
      console.error('Error deleting promotion:', error);
      alert('删除失败');
    }
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

  function getPlatformIcons(content: Record<string, any>) {
    const platforms = Object.keys(content || {});
    return platforms.slice(0, 4).map(p => platformIcons[p] || { abbr: p.slice(0, 2).toUpperCase(), bgColor: 'bg-white/20' });
  }

  const filteredPromotions = promotions;

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white">
      <div className="max-w-6xl mx-auto px-4 py-8">
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
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold mb-1">我的推广</h1>
              <p className="text-white/60">管理所有推广内容和发布状态</p>
            </div>
            <button
              onClick={() => navigate('/promotion/create')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"
            >
              <Plus className="w-4 h-4" />
              新建推广
            </button>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex gap-2 mb-6"
        >
          {[
            { id: 'all', label: '全部' },
            { id: 'draft', label: '草稿' },
            { id: 'scheduled', label: '待发布' },
            { id: 'published', label: '已发布' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setFilter(item.id)}
              className={`px-4 py-2 rounded-lg text-sm transition-colors ${
                filter === item.id
                  ? 'bg-orange-500 text-white'
                  : 'bg-white/10 text-white/60 hover:bg-white/20'
              }`}
            >
              {item.label}
            </button>
          ))}
        </motion.div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        ) : filteredPromotions.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <FileText className="w-16 h-16 text-white/20 mx-auto mb-4" />
            <p className="text-white/60 mb-4">
              {filter === 'all' ? '还没有创建推广内容' : '该状态下没有推广内容'}
            </p>
            <button
              onClick={() => navigate('/promotion/create')}
              className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-3 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              创建第一个推广
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredPromotions.map((promotion, index) => (
              <motion.div
                key={promotion.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white/5 border border-white/10 rounded-xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{promotion.title}</h3>
                      {getStatusBadge(promotion.status)}
                    </div>
                    <div className="flex items-center gap-4 text-sm text-white/60 mb-4">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(promotion.created_at || '').toLocaleDateString('zh-CN')}
                      </span>
                      <span className="flex items-center gap-1">
                        {getPlatformIcons(promotion.content as Record<string, any>).map((icon, i) => (
                          <div key={i} className={`w-5 h-5 rounded ${icon.bgColor} flex items-center justify-center flex-shrink-0`}>
                            <span className="text-white text-[8px] font-bold">{icon.abbr}</span>
                          </div>
                        ))}
                      </span>
                    </div>
                    <div className="flex gap-2">
                      {Object.keys(promotion.content as Record<string, any> || {}).map((platform) => (
                        <span
                          key={platform}
                          className="px-2 py-1 bg-white/10 rounded text-xs text-white/60"
                        >
                          {platformNames[platform] || platform}
                        </span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {failedCounts[promotion.id] > 0 && (
                      <button
                        onClick={() => openFailedSummary(promotion.id)}
                        className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors flex items-center gap-1"
                        title="查看发布失败详情"
                      >
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-xs">{failedCounts[promotion.id]}</span>
                      </button>
                    )}
                    <button
                      onClick={() => navigate(`/promotion/${promotion.id}`)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="查看详情"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => navigate(`/promotion/${promotion.id}/edit`)}
                      className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                      title="编辑"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deletePromotion(promotion.id)}
                      className="p-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded-lg transition-colors"
                      title="删除"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {showFailedSummary && selectedPromotionId && (
        <PublishFailedSummary
          contentId={selectedPromotionId}
          onClose={() => {
            setShowFailedSummary(false);
            setSelectedPromotionId(null);
            fetchFailedCounts();
          }}
        />
      )}
    </div>
  );
}
