import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Share2, DollarSign, TrendingUp, Eye, MousePointer, CheckCircle, Copy, AlertCircle, Briefcase } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Demand = Tables['demands']['Row'];
type PromoterLink = Tables['promoter_demand_links']['Row'];

interface DemandWithLink extends Demand {
  promoter_link?: PromoterLink;
}

export function PromoterDemandList() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<DemandWithLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isPromoter, setIsPromoter] = useState(false);
  const [stats, setStats] = useState({
    totalLinks: 0,
    totalClicks: 0,
    totalCommission: 0,
  });

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);

    if (user) {
      const { data: promoter } = await supabase
        .from('promoters')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (promoter && promoter.status === 'approved') {
        setIsPromoter(true);
        fetchDemands(user.id);
        fetchStats(user.id);
      }
    }
    setLoading(false);
  }

  async function fetchDemands(userId: string) {
    try {
      const { data: demandsData } = await supabase
        .from('demands')
        .select('*')
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      const { data: linksData } = await supabase
        .from('promoter_demand_links')
        .select('*')
        .eq('promoter_id', userId);

      const linksMap = new Map(linksData?.map(l => [l.demand_id, l]) || []);

      const demandsWithLinks = (demandsData || []).map(d => ({
        ...d,
        promoter_link: linksMap.get(d.id)
      }));

      setDemands(demandsWithLinks);
    } catch (error) {
      console.error('Error fetching demands:', error);
    }
  }

  async function fetchStats(userId: string) {
    const { data: links } = await supabase
      .from('promoter_demand_links')
      .select('*')
      .eq('promoter_id', userId);

    const totalLinks = links?.length || 0;
    const totalClicks = links?.reduce((sum, l) => sum + (l.click_count || 0), 0) || 0;
    const totalCommission = links?.reduce((sum, l) => sum + (l.commission_earned || 0), 0) || 0;

    setStats({ totalLinks, totalClicks, totalCommission });
  }

  async function createPromoLink(demandId: string) {
    if (!currentUser) return;

    try {
      const code = `PD${Date.now().toString(36).toUpperCase()}`;
      const { data, error } = await supabase
        .from('promoter_demand_links')
        .insert({
          demand_id: demandId,
          promoter_id: currentUser,
          code,
          click_count: 0,
          quote_count: 0,
          connected_count: 0,
          commission_earned: 0
        })
        .select()
        .single();

      if (error) throw error;

      setDemands(demands.map(d => 
        d.id === demandId ? { ...d, promoter_link: data } : d
      ));
    } catch (error) {
      console.error('Error creating promo link:', error);
      alert('创建推广链接失败');
    }
  }

  function copyLink(code: string) {
    const link = `${window.location.origin}/demand/promo/${code}`;
    navigator.clipboard.writeText(link);
    alert('链接已复制到剪贴板');
  }

  function getBudgetText(demand: Demand) {
    if (demand.budget_type === 'negotiable') return '预算面议';
    if (demand.budget_min && demand.budget_max) {
      return `¥${demand.budget_min.toLocaleString()} - ¥${demand.budget_max.toLocaleString()}`;
    }
    return '预算面议';
  }

  if (!isPromoter) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A2E] rounded-full flex items-center justify-center">
            <Share2 className="w-10 h-10 text-white/30" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">星推官专属</h2>
          <p className="text-white/60 mb-8">成为星推官后，可推广需求撮合订单赚取佣金</p>
          <button
            onClick={() => navigate('/promoter/join')}
            className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
          >
            申请成为星推官
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">推广需求撮合</h1>
          <p className="text-white/60">分享需求链接，赚取撮合佣金</p>
        </motion.div>

        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-3 gap-4 mb-8"
        >
          <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <Share2 className="w-5 h-5 text-[#8B5CF6]" />
              <span className="text-2xl font-bold text-white">{stats.totalLinks}</span>
            </div>
            <p className="text-white/60 text-sm">推广链接</p>
          </div>
          <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <MousePointer className="w-5 h-5 text-blue-400" />
              <span className="text-2xl font-bold text-white">{stats.totalClicks}</span>
            </div>
            <p className="text-white/60 text-sm">点击次数</p>
          </div>
          <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <DollarSign className="w-5 h-5 text-green-400" />
              <span className="text-2xl font-bold text-white">¥{stats.totalCommission.toFixed(2)}</span>
            </div>
            <p className="text-white/60 text-sm">累计佣金</p>
          </div>
        </motion.div>

        {/* Commission Rules */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-gradient-to-r from-[#8B5CF6]/20 to-[#7C3AED]/20 border border-[#8B5CF6]/30 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            佣金规则
          </h3>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-2xl font-bold text-[#8B5CF6] mb-1">¥5</p>
              <p className="text-sm text-white/60">每成功报价</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-green-400 mb-1">2%</p>
              <p className="text-sm text-white/60">成交佣金比例</p>
            </div>
            <div className="text-center">
              <p className="text-2xl font-bold text-yellow-400 mb-1">实时</p>
              <p className="text-sm text-white/60">佣金结算</p>
            </div>
          </div>
        </motion.div>

        {/* Demands List */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h3 className="text-lg font-bold text-white mb-4">可推广需求</h3>
          
          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
            </div>
          ) : demands.length === 0 ? (
            <div className="text-center py-20">
              <Briefcase className="w-16 h-16 mx-auto mb-4 text-white/30" />
              <p className="text-white/60">暂无可推广需求</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {demands.map((demand, index) => (
                <motion.div
                  key={demand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h4 className="text-lg font-semibold text-white mb-2">{demand.title}</h4>
                      <p className="text-[#8B5CF6] font-medium">{getBudgetText(demand)}</p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-white/50">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {demand.view_count || 0} 浏览
                        </span>
                        <span className="flex items-center">
                          <TrendingUp className="w-4 h-4 mr-1" />
                          {demand.quote_count || 0} 报价
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      {demand.promoter_link ? (
                        <div className="space-y-2">
                          <div className="flex items-center gap-2 text-sm text-white/60">
                            <MousePointer className="w-4 h-4" />
                            {demand.promoter_link.click_count} 点击
                          </div>
                          <button
                            onClick={() => copyLink(demand.promoter_link!.code)}
                            className="flex items-center px-4 py-2 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-lg text-sm hover:bg-[#8B5CF6]/30"
                          >
                            <Copy className="w-4 h-4 mr-1" />
                            复制链接
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => createPromoLink(demand.id)}
                          className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg text-sm font-medium hover:opacity-90"
                        >
                          生成链接
                        </button>
                      )}
                    </div>
                  </div>
                  
                  {demand.promoter_link && (
                    <div className="pt-4 border-t border-white/10">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-white/60">推广链接</span>
                        <code className="px-2 py-1 bg-[#0F0F1A] rounded text-white/70 text-xs">
                          {window.location.origin}/demand/promo/{demand.promoter_link.code}
                        </code>
                      </div>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
