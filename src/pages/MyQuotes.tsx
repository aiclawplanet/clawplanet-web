import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, MessageSquare, CheckCircle, XCircle, Clock4, Eye, AlertCircle, TrendingUp, Target, Award } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Quote = Tables['quotes']['Row'];
type Demand = Tables['demands']['Row'];

interface QuoteWithDemand extends Quote {
  demand?: Demand;
}

const statusConfig = {
  pending: { label: '待查看', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock4 },
  viewed: { label: '已查看', color: 'bg-blue-500/20 text-blue-400', icon: Eye },
  connected: { label: '已对接', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  expired: { label: '已过期', color: 'bg-gray-500/20 text-gray-400', icon: Clock4 },
};

export function MyQuotes() {
  const navigate = useNavigate();
  const [quotes, setQuotes] = useState<QuoteWithDemand[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'pending' | 'connected' | 'rejected'>('all');
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    connected: 0,
    rejected: 0,
    successRate: 0,
    totalAmount: 0,
  });

  useEffect(() => {
    fetchMyQuotes();
  }, [activeTab]);

  async function fetchMyQuotes() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/profile');
        return;
      }

      let query = supabase
        .from('quotes')
        .select(`
          *,
          demand:demands!demand_id(*)
        `)
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab !== 'all') {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;

      if (error) throw error;

      setQuotes(data || []);

      const allQuotes = await supabase
        .from('quotes')
        .select('status, amount')
        .eq('developer_id', user.id);

      const all = allQuotes.data || [];
      const connected = all.filter(q => q.status === 'connected').length;
      const totalAmount = all
        .filter(q => q.status === 'connected')
        .reduce((sum, q) => sum + (q.amount || 0), 0);

      setStats({
        total: all.length,
        pending: all.filter(q => q.status === 'pending' || q.status === 'viewed').length,
        connected: connected,
        rejected: all.filter(q => q.status === 'rejected').length,
        successRate: all.length > 0 ? Math.round((connected / all.length) * 100) : 0,
        totalAmount: totalAmount,
      });
    } catch (error) {
      console.error('Error fetching quotes:', error);
    } finally {
      setLoading(false);
    }
  }

  function getPeriodText(period: string) {
    const periodMap: Record<string, string> = {
      '1_week': '1周内',
      '2_weeks': '2周内',
      '1_month': '1个月内',
      '2_months': '2个月内',
      'negotiable': '可协商',
    };
    return periodMap[period] || period;
  }

  const filteredQuotes = quotes;

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
            onClick={() => navigate('/dashboard')}
            className="flex items-center text-white/60 hover:text-white mb-6 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回开发者中心
          </button>

          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">我的报价</h1>
              <p className="text-white/60">管理您提交的所有报价</p>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
                <span className="text-2xl font-bold text-white">{stats.total}</span>
              </div>
              <p className="text-white/60 text-sm">总报价数</p>
            </div>
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.successRate}%</span>
              </div>
              <p className="text-white/60 text-sm">成功率</p>
            </div>
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <CheckCircle className="w-5 h-5 text-green-400" />
                <span className="text-2xl font-bold text-white">{stats.connected}</span>
              </div>
              <p className="text-white/60 text-sm">成功对接</p>
            </div>
            <div className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="w-5 h-5 text-[#8B5CF6]" />
                <span className="text-2xl font-bold text-white">¥{(stats.totalAmount / 10000).toFixed(1)}万</span>
              </div>
              <p className="text-white/60 text-sm">累计成交</p>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2">
            {[
              { id: 'all', label: '全部', count: stats.total },
              { id: 'pending', label: '进行中', count: stats.pending },
              { id: 'connected', label: '已对接', count: stats.connected },
              { id: 'rejected', label: '已拒绝', count: stats.rejected },
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`px-6 py-3 rounded-xl font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-[#1A1A2E] text-white/70 hover:bg-[#252542]'
                }`}
              >
                {tab.label}
                <span className="ml-2 text-sm opacity-70">({tab.count})</span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Quotes List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredQuotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A2E] rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'all' ? '还没有提交过报价' : '暂无相关报价'}
            </h3>
            <p className="text-white/60 mb-6">去需求大厅发现合适的项目吧</p>
            <button
              onClick={() => navigate('/developer/demands')}
              className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
            >
              浏览需求大厅
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredQuotes.map((quote, index) => {
              const status = statusConfig[quote.status as keyof typeof statusConfig];
              const StatusIcon = status?.icon || Clock4;

              return (
                <motion.div
                  key={quote.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => quote.demand && navigate(`/demand/${quote.demand.id}`)}
                  className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 cursor-pointer hover:border-[#8B5CF6]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs flex items-center ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                        <span className="text-white/40 text-sm">
                          {new Date(quote.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">
                        {quote.demand?.title || '需求已删除'}
                      </h3>
                      {quote.remark && (
                        <p className="text-white/60 text-sm line-clamp-2">{quote.remark}</p>
                      )}
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-[#8B5CF6] mb-1">
                        ¥{quote.amount.toLocaleString()}
                      </div>
                      <div className="text-white/40 text-sm">
                        {getPeriodText(quote.period)}
                      </div>
                    </div>
                  </div>

                  {quote.demand && (
                    <div className="flex items-center justify-between pt-4 border-t border-white/10">
                      <div className="flex items-center space-x-4 text-white/40 text-sm">
                        <span className="flex items-center">
                          <Eye className="w-4 h-4 mr-1" />
                          {quote.demand.view_count || 0} 浏览
                        </span>
                        <span className="flex items-center">
                          <MessageSquare className="w-4 h-4 mr-1" />
                          {quote.demand.quote_count || 0} 报价
                        </span>
                      </div>
                      {quote.status === 'connected' && (
                        <span className="text-green-400 text-sm flex items-center">
                          <Award className="w-4 h-4 mr-1" />
                          恭喜！需求方已选择您
                        </span>
                      )}
                      {quote.status === 'pending' && (
                        <span className="text-yellow-400 text-sm">
                          等待需求方查看
                        </span>
                      )}
                    </div>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
