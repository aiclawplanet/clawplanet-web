import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Clock, DollarSign, Eye, MessageSquare, Edit2, Trash2, AlertCircle, CheckCircle, Clock4, XCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Demand = Tables['demands']['Row'];

interface DemandWithStats extends Demand {
  quote_count: number;
}

const statusConfig = {
  pending: { label: '审核中', color: 'bg-yellow-500/20 text-yellow-400', icon: Clock4 },
  approved: { label: '已发布', color: 'bg-green-500/20 text-green-400', icon: CheckCircle },
  rejected: { label: '已拒绝', color: 'bg-red-500/20 text-red-400', icon: XCircle },
  completed: { label: '已完成', color: 'bg-blue-500/20 text-blue-400', icon: CheckCircle },
  closed: { label: '已关闭', color: 'bg-gray-500/20 text-gray-400', icon: XCircle },
};

export function MyDemands() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<DemandWithStats[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'active' | 'completed'>('all');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    fetchMyDemands();
  }, [activeTab]);

  async function fetchMyDemands() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/profile');
        return;
      }

      let query = supabase
        .from('demands')
        .select(`
          *,
          quotes:quotes(count)
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (activeTab === 'active') {
        query = query.in('status', ['pending', 'approved']);
      } else if (activeTab === 'completed') {
        query = query.in('status', ['completed', 'closed']);
      }

      const { data, error } = await query;

      if (error) throw error;

      const demandsWithStats = (data || []).map(d => ({
        ...d,
        quote_count: Array.isArray(d.quotes) ? d.quotes.length : 0
      }));

      setDemands(demandsWithStats);
    } catch (error) {
      console.error('Error fetching demands:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(id: string) {
    try {
      const { error } = await supabase
        .from('demands')
        .delete()
        .eq('id', id);

      if (error) throw error;

      setDemands(demands.filter(d => d.id !== id));
      setDeleteConfirm(null);
    } catch (error) {
      console.error('Error deleting demand:', error);
      alert('删除失败，请重试');
    }
  }

  async function handleClose(id: string) {
    try {
      const { error } = await supabase
        .from('demands')
        .update({ status: 'closed' })
        .eq('id', id);

      if (error) throw error;

      fetchMyDemands();
    } catch (error) {
      console.error('Error closing demand:', error);
      alert('操作失败，请重试');
    }
  }

  function getBudgetText(demand: Demand) {
    if (demand.budget_type === 'negotiable') return '预算面议';
    if (demand.budget_min && demand.budget_max) {
      return `¥${demand.budget_min.toLocaleString()} - ¥${demand.budget_max.toLocaleString()}`;
    }
    if (demand.budget_min) return `¥${demand.budget_min.toLocaleString()}起`;
    if (demand.budget_max) return `¥${demand.budget_max.toLocaleString()}以内`;
    return '预算面议';
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

  const filteredDemands = demands;

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">我的需求</h1>
              <p className="text-white/60">管理您发布的所有开发需求</p>
            </div>
            <button
              onClick={() => navigate('/demand/publish')}
              className="flex items-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5 mr-2" />
              发布新需求
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-2">
            {[
              { id: 'all', label: '全部', count: demands.length },
              { id: 'active', label: '进行中', count: demands.filter(d => ['pending', 'approved'].includes(d.status)).length },
              { id: 'completed', label: '已结束', count: demands.filter(d => ['completed', 'closed'].includes(d.status)).length },
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

        {/* Demands List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredDemands.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A2E] rounded-full flex items-center justify-center">
              <AlertCircle className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">
              {activeTab === 'all' ? '还没有发布过需求' : activeTab === 'active' ? '没有进行中的需求' : '没有已结束的需求'}
            </h3>
            <p className="text-white/60 mb-6">发布您的第一个需求，找到合适的开发者</p>
            <button
              onClick={() => navigate('/demand/publish')}
              className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
            >
              发布需求
            </button>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredDemands.map((demand, index) => {
              const status = statusConfig[demand.status as keyof typeof statusConfig];
              const StatusIcon = status?.icon || Clock4;

              return (
                <motion.div
                  key={demand.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 hover:border-[#8B5CF6]/30 transition-all"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className={`px-3 py-1 rounded-full text-xs flex items-center ${status.color}`}>
                          <StatusIcon className="w-3 h-3 mr-1" />
                          {status.label}
                        </span>
                        <span className="text-white/40 text-sm">
                          {new Date(demand.created_at).toLocaleDateString('zh-CN')}
                        </span>
                      </div>
                      <h3 className="text-lg font-semibold text-white mb-2">{demand.title}</h3>
                      <p className="text-white/60 text-sm line-clamp-2">{demand.description}</p>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-[#8B5CF6] mb-1">
                        {getBudgetText(demand)}
                      </div>
                      <div className="text-white/40 text-sm">
                        {getPeriodText(demand.period)}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-4 border-t border-white/10">
                    <div className="flex items-center space-x-6 text-white/40 text-sm">
                      <span className="flex items-center">
                        <Eye className="w-4 h-4 mr-1" />
                        {demand.view_count || 0} 浏览
                      </span>
                      <span className="flex items-center">
                        <MessageSquare className="w-4 h-4 mr-1" />
                        {demand.quote_count} 报价
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      {demand.status === 'approved' && (
                        <>
                          <button
                            onClick={() => navigate(`/demand/${demand.id}`)}
                            className="px-4 py-2 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-lg text-sm hover:bg-[#8B5CF6]/30 transition-colors"
                          >
                            查看详情
                          </button>
                          <button
                            onClick={() => navigate(`/demand/boost/${demand.id}`)}
                            className="px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-lg text-sm hover:opacity-90"
                          >
                            置顶推广
                          </button>
                          <button
                            onClick={() => handleClose(demand.id)}
                            className="px-4 py-2 bg-[#0F0F1A] border border-white/20 text-white/70 rounded-lg text-sm hover:bg-[#252542] transition-colors"
                          >
                            关闭需求
                          </button>
                        </>
                      )}
                      {demand.status === 'pending' && (
                        <span className="text-yellow-400 text-sm">等待审核</span>
                      )}
                      {demand.status === 'rejected' && (
                        <span className="text-red-400 text-sm">审核未通过</span>
                      )}
                      <button
                        onClick={() => setDeleteConfirm(demand.id)}
                        className="p-2 text-white/40 hover:text-red-400 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-sm w-full"
          >
            <div className="text-center mb-6">
              <div className="w-12 h-12 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
                <AlertCircle className="w-6 h-6 text-red-400" />
              </div>
              <h3 className="text-lg font-semibold text-white mb-2">确认删除</h3>
              <p className="text-white/60">删除后无法恢复，是否继续？</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={() => setDeleteConfirm(null)}
                className="flex-1 py-3 bg-[#0F0F1A] border border-white/20 text-white rounded-xl font-medium hover:bg-[#252542] transition-colors"
              >
                取消
              </button>
              <button
                onClick={() => handleDelete(deleteConfirm)}
                className="flex-1 py-3 bg-red-500 text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
              >
                确认删除
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}
