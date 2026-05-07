import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, Wrench, MessageSquare, Eye, CheckCircle, XCircle, Clock, Shield,
  Code, Award, DollarSign, Briefcase, TrendingUp, ChevronRight, AlertCircle,
  UserCheck, UserX, Settings, BarChart3, User, Star, Trash2, Edit,
  ExternalLink, ArrowDownCircle
} from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type Profile = Tables<'profiles'>;
type Comment = Tables<'comments'>;
type DeveloperApplication = Tables<'developer_applications'>;
type Promoter = Tables<'promoters'>;
type CommissionWithdrawal = Tables<'commission_withdrawals'>;

interface ToolWithDeveloper extends Tool {
  developer?: Profile;
}

interface ApplicationWithUser extends DeveloperApplication {
  user?: Profile;
}

type AdminTab = 'overview' | 'tools' | 'applications' | 'promoters' | 'withdrawals' | 'users' | 'allTools';

export function AdminDashboard() {
  const [activeTab, setActiveTab] = useState<AdminTab>('overview');
  const [pendingTools, setPendingTools] = useState<ToolWithDeveloper[]>([]);
  const [allTools, setAllTools] = useState<ToolWithDeveloper[]>([]);
  const [applications, setApplications] = useState<ApplicationWithUser[]>([]);
  const [promoters, setPromoters] = useState<(Promoter & { profile?: Profile })[]>([]);
  const [withdrawals, setWithdrawals] = useState<(CommissionWithdrawal & { promoter?: Promoter & { profile?: Profile } })[]>([]);
  const [users, setUsers] = useState<Profile[]>([]);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalTools: 0,
    pendingTools: 0,
    pendingApplications: 0,
    totalPromoters: 0,
    pendingWithdrawals: 0,
    totalComments: 0,
    totalViews: 0,
  });
  const [loading, setLoading] = useState(true);

  // 拒绝/强制下线原因模态框
  const [reasonModal, setReasonModal] = useState<{
    open: boolean;
    type: 'reject' | 'forced_offline';
    toolId: string;
    toolName: string;
    reason: string;
  }>({ open: false, type: 'reject', toolId: '', toolName: '', reason: '' });

  useEffect(() => {
    fetchAllData();
  }, []);

  async function fetchAllData() {
    try {
      await Promise.all([
        fetchPendingTools(),
        fetchAllTools(),
        fetchApplications(),
        fetchPromoters(),
        fetchWithdrawals(),
        fetchStats(),
      ]);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPendingTools() {
    const { data, error } = await supabase
      .from('tools')
      .select('*, developer:developer_id(*)')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching pending tools:', error);
    }
    if (data) {
      setPendingTools(data);
    }
  }

  async function fetchAllTools() {
    const { data, error } = await supabase
      .from('tools')
      .select('*, developer:developer_id(*)')
      .order('created_at', { ascending: false });
    if (error) {
      console.error('Error fetching all tools:', error);
    }
    if (data) {
      setAllTools(data);
    }
  }

  async function fetchApplications() {
    const { data, error } = await supabase
      .from('developer_applications')
      .select('*, user:user_id(*)')
      .eq('status', 'pending')
      .order('applied_at', { ascending: false });
    if (error) {
      console.error('Error fetching applications:', error);
    }
    if (data) {
      setApplications(data);
    }
  }

  async function fetchPromoters() {
    const { data } = await supabase
      .from('promoters')
      .select('*, profile:user_id(*)')
      .order('joined_at', { ascending: false });
    if (data) setPromoters(data);
  }

  async function fetchWithdrawals() {
    const { data } = await supabase
      .from('commission_withdrawals')
      .select('*, promoter:promoter_id(*, profile:user_id(*))')
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    if (data) setWithdrawals(data);
  }

  async function fetchStats() {
    const { count: usersCount } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });

    const { count: toolsCount } = await supabase
      .from('tools')
      .select('*', { count: 'exact', head: true });

    const { count: pendingToolsCount } = await supabase
      .from('tools')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: pendingAppsCount } = await supabase
      .from('developer_applications')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: promotersCount } = await supabase
      .from('promoters')
      .select('*', { count: 'exact', head: true });

    const { count: pendingWithdrawalsCount } = await supabase
      .from('commission_withdrawals')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    const { count: commentsCount } = await supabase
      .from('comments')
      .select('*', { count: 'exact', head: true });

    const { data: toolsStats } = await supabase
      .from('tools')
      .select('view_count');

    const totalViews = toolsStats?.reduce((sum, tool) => sum + (tool.view_count || 0), 0) || 0;

    setStats({
      totalUsers: usersCount || 0,
      totalTools: toolsCount || 0,
      pendingTools: pendingToolsCount || 0,
      pendingApplications: pendingAppsCount || 0,
      totalPromoters: promotersCount || 0,
      pendingWithdrawals: pendingWithdrawalsCount || 0,
      totalComments: commentsCount || 0,
      totalViews: totalViews,
    });
  }

  async function handleApproveTool(toolId: string) {
    const { error } = await supabase
      .from('tools')
      .update({
        status: 'approved',
        updated_at: new Date().toISOString()
      })
      .eq('id', toolId);

    if (!error) {
      setPendingTools(pendingTools.filter(tool => tool.id !== toolId));
      await fetchAllTools();
      setStats({ ...stats, pendingTools: stats.pendingTools - 1 });
    }
  }

  async function handleRejectTool(toolId: string) {
    // 打开拒绝原因填写模态框
    const tool = pendingTools.find(t => t.id === toolId);
    if (tool) {
      setReasonModal({
        open: true,
        type: 'reject',
        toolId,
        toolName: tool.name,
        reason: ''
      });
    }
  }

  async function handleForcedOffline(toolId: string) {
    // 打开强制下线原因填写模态框
    const tool = allTools.find(t => t.id === toolId);
    if (tool) {
      setReasonModal({
        open: true,
        type: 'forced_offline',
        toolId,
        toolName: tool.name,
        reason: ''
      });
    }
  }

  async function confirmReasonSubmit() {
    if (!reasonModal.reason.trim()) return;

    if (reasonModal.type === 'reject') {
      const { error } = await supabase
        .from('tools')
        .update({
          status: 'rejected',
          rejection_reason: reasonModal.reason.trim(),
          updated_at: new Date().toISOString()
        })
        .eq('id', reasonModal.toolId);

      if (!error) {
        setPendingTools(pendingTools.filter(tool => tool.id !== reasonModal.toolId));
        await fetchAllTools();
        setStats({ ...stats, pendingTools: stats.pendingTools - 1 });
      }
    } else if (reasonModal.type === 'forced_offline') {
      const { error } = await supabase
        .from('tools')
        .update({
          status: 'forced_offline',
          offline_reason: reasonModal.reason.trim(),
          offline_reason_type: 'admin_forced',
          updated_at: new Date().toISOString()
        })
        .eq('id', reasonModal.toolId);

      if (!error) {
        await fetchAllTools();
      }
    }

    setReasonModal({ open: false, type: 'reject', toolId: '', toolName: '', reason: '' });
  }

  // 兼容旧的 handleUnpublishTool（改为强制下线）
  async function handleUnpublishTool(toolId: string) {
    await handleForcedOffline(toolId);
  }

  async function handleDeleteTool(toolId: string) {
    const { error } = await supabase
      .from('tools')
      .delete()
      .eq('id', toolId);

    if (!error) {
      await fetchAllTools();
      await fetchStats();
    }
  }

  async function handleTogglePremium(toolId: string, isPremium: boolean) {
    const { error } = await supabase
      .from('tools')
      .update({ is_premium: !isPremium })
      .eq('id', toolId);

    if (!error) {
      await fetchAllTools();
    }
  }

  async function handleApproveApplication(appId: string, userId: string) {
    const { error: updateError } = await supabase
      .from('developer_applications')
      .update({ status: 'approved', reviewed_at: new Date().toISOString() })
      .eq('id', appId);

    if (!updateError) {
      await supabase
        .from('profiles')
        .update({ role: 'developer' })
        .eq('id', userId);

      setApplications(applications.filter(app => app.id !== appId));
      setStats({ ...stats, pendingApplications: stats.pendingApplications - 1 });
    }
  }

  async function handleRejectApplication(appId: string) {
    const { error } = await supabase
      .from('developer_applications')
      .update({ status: 'rejected', reviewed_at: new Date().toISOString() })
      .eq('id', appId);

    if (!error) {
      setApplications(applications.filter(app => app.id !== appId));
      setStats({ ...stats, pendingApplications: stats.pendingApplications - 1 });
    }
  }

  async function handleApproveWithdrawal(withdrawalId: string) {
    const { error } = await supabase
      .from('commission_withdrawals')
      .update({ status: 'completed', processed_at: new Date().toISOString() })
      .eq('id', withdrawalId);

    if (!error) {
      setWithdrawals(withdrawals.filter(w => w.id !== withdrawalId));
      setStats({ ...stats, pendingWithdrawals: stats.pendingWithdrawals - 1 });
    }
  }

  async function handleRejectWithdrawal(withdrawalId: string, reason: string) {
    const { error } = await supabase
      .from('commission_withdrawals')
      .update({
        status: 'rejected',
        processed_at: new Date().toISOString(),
        rejection_reason: reason
      })
      .eq('id', withdrawalId);

    if (!error) {
      setWithdrawals(withdrawals.filter(w => w.id !== withdrawalId));
      setStats({ ...stats, pendingWithdrawals: stats.pendingWithdrawals - 1 });
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: '概览', icon: BarChart3 },
    { id: 'tools', label: '工具审核', icon: Wrench, badge: stats.pendingTools },
    { id: 'allTools', label: '工具管理', icon: Wrench },
    { id: 'applications', label: '开发者申请', icon: Briefcase, badge: stats.pendingApplications },
    { id: 'promoters', label: '星推官', icon: Award },
    { id: 'withdrawals', label: '提现审核', icon: DollarSign, badge: stats.pendingWithdrawals },
    { id: 'users', label: '用户管理', icon: Users },
  ];

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center space-x-3 mb-2">
          <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-red-400" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">管理员后台</h1>
            <p className="text-white/60">平台数据概览和用户管理</p>
          </div>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="flex flex-wrap gap-2 mb-8">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as AdminTab)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all ${
              activeTab === tab.id
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                : 'bg-[#1A1A2E] border border-white/10 text-white/60 hover:text-white hover:border-white/30'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            <span>{tab.label}</span>
            {tab.badge && tab.badge > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {tab.badge}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'overview' && (
          <OverviewTab key="overview" stats={stats} />
        )}
        {activeTab === 'tools' && (
          <ToolsTab
            key="tools"
            tools={pendingTools}
            onApprove={handleApproveTool}
            onReject={handleRejectTool}
          />
        )}
        {activeTab === 'allTools' && (
          <AllToolsTab
            key="allTools"
            tools={allTools}
            onUnpublish={handleUnpublishTool}
            onDelete={handleDeleteTool}
            onTogglePremium={handleTogglePremium}
          />
        )}
        {activeTab === 'applications' && (
          <ApplicationsTab
            key="applications"
            applications={applications}
            onApprove={handleApproveApplication}
            onReject={handleRejectApplication}
          />
        )}
        {activeTab === 'promoters' && (
          <PromotersTab key="promoters" promoters={promoters} />
        )}
        {activeTab === 'withdrawals' && (
          <WithdrawalsTab
            key="withdrawals"
            withdrawals={withdrawals}
            onApprove={handleApproveWithdrawal}
            onReject={handleRejectWithdrawal}
          />
        )}
        {activeTab === 'users' && (
          <UsersTab key="users" users={users} />
        )}
      </AnimatePresence>

      {/* 拒绝/强制下线原因填写模态框 */}
      <AnimatePresence>
        {reasonModal.open && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
            onClick={() => setReasonModal({ open: false, type: 'reject', toolId: '', toolName: '', reason: '' })}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h3 className="text-lg font-bold mb-2">
                {reasonModal.type === 'reject' ? '拒绝工具上线' : '强制下线工具'}
              </h3>
              <p className="text-white/60 text-sm mb-4">
                {reasonModal.toolName}
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-white/80 mb-2">
                  {reasonModal.type === 'reject' ? '拒绝原因（将告知开发者）' : '下线原因（将告知开发者）'}
                </label>
                <textarea
                  value={reasonModal.reason}
                  onChange={(e) => setReasonModal({ ...reasonModal, reason: e.target.value })}
                  placeholder="请输入原因，帮助开发者了解问题所在..."
                  rows={4}
                  className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-red-500 resize-none"
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setReasonModal({ open: false, type: 'reject', toolId: '', toolName: '', reason: '' })}
                  className="px-4 py-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={confirmReasonSubmit}
                  disabled={!reasonModal.reason.trim()}
                  className={`px-4 py-2 rounded-xl font-medium transition-colors ${
                    reasonModal.reason.trim()
                      ? 'bg-red-500 text-white hover:bg-red-600'
                      : 'bg-red-500/30 text-white/40 cursor-not-allowed'
                  }`}
                >
                  确认{reasonModal.type === 'reject' ? '拒绝' : '强制下线'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function OverviewTab({ stats }: { stats: any }) {
  const statCards = [
    { label: '总用户数', value: stats.totalUsers, icon: Users, color: 'from-[#8B5CF6] to-[#3B82F6]' },
    { label: '总工具数', value: stats.totalTools, icon: Wrench, color: 'from-[#3B82F6] to-[#06B6D4]' },
    { label: '待审核工具', value: stats.pendingTools, icon: Clock, color: 'from-yellow-500 to-orange-500' },
    { label: '待审核申请', value: stats.pendingApplications, icon: Briefcase, color: 'from-orange-500 to-red-500' },
    { label: '星推官数', value: stats.totalPromoters, icon: Award, color: 'from-green-500 to-emerald-500' },
    { label: '待处理提现', value: stats.pendingWithdrawals, icon: DollarSign, color: 'from-red-500 to-pink-500' },
    { label: '总评论数', value: stats.totalComments, icon: MessageSquare, color: 'from-purple-500 to-pink-500' },
    { label: '总浏览量', value: stats.totalViews, icon: Eye, color: 'from-pink-500 to-rose-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {statCards.map((card, index) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className={`w-10 h-10 rounded-xl bg-gradient-to-r ${card.color} bg-opacity-20 flex items-center justify-center mb-4`}>
              <card.icon className="w-5 h-5 text-white" />
            </div>
            <p className="text-sm text-white/60 mb-1">{card.label}</p>
            <p className="text-2xl font-bold">{card.value.toLocaleString()}</p>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function ToolsTab({ tools, onApprove, onReject }: { tools: ToolWithDeveloper[], onApprove: (id: string) => void, onReject: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Clock className="w-5 h-5 mr-2 text-[#8B5CF6]" />
        待审核工具
        <span className="ml-2 text-sm text-white/40">({tools.length})</span>
      </h2>

      <div className="space-y-4">
        {tools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                  {tool.icon_url ? (
                    <img src={tool.icon_url} alt={tool.name} className="w-12 h-12 rounded-lg" />
                  ) : (
                    <Wrench className="w-8 h-8 text-[#8B5CF6]" />
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-lg mb-1">{tool.name}</h3>
                  <p className="text-white/60 text-sm mb-2">{tool.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-white/40">
                    <span>开发者: {tool.developer?.username || '未知'}</span>
                    <span>类型: {tool.jump_type}</span>
                    <span>提交时间: {new Date(tool.created_at || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => onApprove(tool.id!)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                >
                  <CheckCircle className="w-4 h-4" />
                  <span>通过</span>
                </button>
                <button
                  onClick={() => onReject(tool.id!)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  <XCircle className="w-4 h-4" />
                  <span>拒绝</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {tools.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p>没有待审核的工具</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function AllToolsTab({ tools, onUnpublish, onDelete, onTogglePremium }: {
  tools: ToolWithDeveloper[],
  onUnpublish: (id: string) => void,
  onDelete: (id: string) => void,
  onTogglePremium: (id: string, isPremium: boolean) => void
}) {
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [selectedTool, setSelectedTool] = useState<ToolWithDeveloper | null>(null);
  const [editModalOpen, setEditModalOpen] = useState(false);

  const filteredTools = tools.filter(tool => {
    const matchesStatus = filterStatus === 'all' || tool.status === filterStatus;
    const matchesSearch = !searchQuery || tool.name?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: tools.length,
    approved: tools.filter(t => t.status === 'approved').length,
    pending: tools.filter(t => t.status === 'pending').length,
    rejected: tools.filter(t => t.status === 'rejected').length,
    offline: tools.filter(t => t.status === 'offline').length,
    forced_offline: tools.filter(t => t.status === 'forced_offline').length,
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Wrench className="w-5 h-5 mr-2 text-[#8B5CF6]" />
        工具管理
        <span className="ml-2 text-sm text-white/40">({tools.length})</span>
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: '全部', count: statusCounts.all },
          { id: 'approved', label: '已上线', count: statusCounts.approved },
          { id: 'pending', label: '审核中', count: statusCounts.pending },
          { id: 'rejected', label: '审核未通过', count: statusCounts.rejected },
          { id: 'offline', label: '主动下架', count: statusCounts.offline },
          { id: 'forced_offline', label: '强制下架', count: statusCounts.forced_offline },
        ].map((status) => (
          <button
            key={status.id}
            onClick={() => setFilterStatus(status.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-all ${
              filterStatus === status.id
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-[#1A1A2E] border border-white/10 text-white/60 hover:border-white/30'
            }`}
          >
            <span>{status.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              filterStatus === status.id ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {status.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索工具名称..."
          className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
        />
      </div>

      {/* Tools List */}
      <div className="space-y-4">
        {filteredTools.map((tool, index) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                  {tool.icon_url ? (
                    <img src={tool.icon_url} alt={tool.name} className="w-12 h-12 rounded-lg" />
                  ) : (
                    <Wrench className="w-8 h-8 text-[#8B5CF6]" />
                  )}
                </div>
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-bold text-lg">{tool.name}</h3>
                    {tool.is_premium && (
                      <span className="px-2 py-0.5 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full text-xs">
                        精品
                      </span>
                    )}
                    <StatusBadge status={tool.status || 'pending'} />
                  </div>
                  <p className="text-white/60 text-sm mb-2">{tool.description}</p>
                  <div className="flex items-center space-x-4 text-sm text-white/40">
                    <span>开发者: {tool.developer?.username || '未知'}</span>
                    <span>浏览: {tool.view_count || 0}</span>
                    <span>使用: {tool.jump_count || 0}</span>
                    <span>提交时间: {new Date(tool.created_at || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <Link
                  to={`/tool/${tool.id}`}
                  target="_blank"
                  className="flex items-center space-x-1 px-3 py-2 bg-white/5 text-white/60 rounded-xl hover:bg-white/10 transition-colors"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span className="text-sm">查看</span>
                </Link>
                <button
                  onClick={() => {
                    setSelectedTool(tool);
                    setEditModalOpen(true);
                  }}
                  className="flex items-center space-x-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-colors"
                >
                  <Edit className="w-4 h-4" />
                  <span className="text-sm">编辑</span>
                </button>
                {tool.status === 'approved' && (
                  <button
                    onClick={() => onTogglePremium(tool.id!, !!tool.is_premium)}
                    className={`flex items-center space-x-1 px-3 py-2 rounded-xl transition-colors ${
                      tool.is_premium
                        ? 'bg-yellow-500/20 text-yellow-400 hover:bg-yellow-500/30'
                        : 'bg-white/5 text-white/60 hover:bg-white/10'
                    }`}
                  >
                    <Star className="w-4 h-4" />
                    <span className="text-sm">{tool.is_premium ? '取消精品' : '设为精品'}</span>
                  </button>
                )}
                {tool.status === 'approved' && (
                  <button
                    onClick={() => onUnpublish(tool.id!)}
                    className="flex items-center space-x-1 px-3 py-2 bg-orange-500/20 text-orange-400 rounded-xl hover:bg-orange-500/30 transition-colors"
                  >
                    <ArrowDownCircle className="w-4 h-4" />
                    <span className="text-sm">强制下线</span>
                  </button>
                )}
                <button
                  onClick={() => setDeleteConfirmId(tool.id!)}
                  className="flex items-center space-x-1 px-3 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm">删除</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {filteredTools.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Wrench className="w-16 h-16 mx-auto mb-4" />
            <p>没有找到匹配的工具</p>
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <DeleteConfirmModal
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            onDelete(deleteConfirmId);
            setDeleteConfirmId(null);
          }}
        />
      )}

      {/* Edit Tool Modal */}
      {editModalOpen && selectedTool && (
        <EditToolModal
          tool={selectedTool}
          onClose={() => {
            setEditModalOpen(false);
            setSelectedTool(null);
          }}
          onSave={async (updatedTool) => {
            const { error } = await supabase
              .from('tools')
              .update(updatedTool)
              .eq('id', selectedTool.id);
            if (!error) {
              setEditModalOpen(false);
              setSelectedTool(null);
              window.location.reload();
            }
          }}
        />
      )}
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { text: string; className: string }> = {
    pending:      { text: '审核中',      className: 'bg-yellow-500/20 text-yellow-400' },
    approved:     { text: '已上线',      className: 'bg-green-500/20 text-green-400' },
    rejected:     { text: '审核未通过',  className: 'bg-red-500/20 text-red-400' },
    offline:      { text: '已下架',      className: 'bg-orange-500/20 text-orange-400' },
    forced_offline: { text: '被强制下架', className: 'bg-red-500/20 text-red-400' },
  };
  const config = configs[status] || { text: status, className: 'bg-white/10 text-white/60' };
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      {config.text}
    </span>
  );
}

function EditToolModal({ tool, onClose, onSave }: { tool: ToolWithDeveloper; onClose: () => void; onSave: (data: Partial<Tool>) => void }) {
  const [formData, setFormData] = useState({
    name: tool.name || '',
    description: tool.description || '',
    jump_url: tool.jump_url || '',
    jump_type: tool.jump_type || 'web',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center">
            <Edit className="w-6 h-6 text-blue-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">编辑工具</h3>
            <p className="text-white/60 text-sm">修改工具信息</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">工具名称</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">描述</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">跳转链接</label>
            <input
              type="text"
              value={formData.jump_url}
              onChange={(e) => setFormData({ ...formData, jump_url: e.target.value })}
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
              placeholder="https://... 或 #小程序://..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">跳转类型</label>
            <select
              value={formData.jump_type}
              onChange={(e) => setFormData({ ...formData, jump_type: e.target.value })}
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
            >
              <option value="web">网页</option>
              <option value="miniprogram">小程序</option>
              <option value="app">App</option>
            </select>
          </div>

          <div className="flex space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="flex-1 py-3 bg-blue-500 rounded-xl font-medium hover:bg-blue-600 transition-colors"
            >
              保存
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
}

function DeleteConfirmModal({ onClose, onConfirm }: { onClose: () => void; onConfirm: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-12 h-12 rounded-xl bg-red-500/20 flex items-center justify-center">
            <Trash2 className="w-6 h-6 text-red-400" />
          </div>
          <div>
            <h3 className="text-lg font-bold">确认删除</h3>
            <p className="text-white/60 text-sm">此操作不可撤销</p>
          </div>
        </div>
        <p className="text-white/80 mb-6">
          确定要删除这个工具吗？删除后将无法恢复。
        </p>
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 bg-white/10 rounded-xl font-medium hover:bg-white/20 transition-colors"
          >
            取消
          </button>
          <button
            onClick={onConfirm}
            className="flex-1 py-3 bg-red-500 rounded-xl font-medium hover:bg-red-600 transition-colors"
          >
            确认删除
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}

function ApplicationsTab({ applications, onApprove, onReject }: { applications: ApplicationWithUser[], onApprove: (id: string, userId: string) => void, onReject: (id: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Briefcase className="w-5 h-5 mr-2 text-[#8B5CF6]" />
        待审核开发者申请
        <span className="ml-2 text-sm text-white/40">({applications.length})</span>
      </h2>

      <div className="space-y-4">
        {applications.map((app, index) => (
          <motion.div
            key={app.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-lg">{app.contact_name}</h3>
                  {app.company_name && (
                    <span className="text-sm text-white/60">({app.company_name})</span>
                  )}
                </div>
                <p className="text-white/60 text-sm mb-2">{app.bio}</p>
                <div className="flex items-center space-x-4 text-sm text-white/40">
                  <span>申请人: {app.user?.username || '未知'}</span>
                  <span>电话: {app.contact_phone || '未填写'}</span>
                  <span>申请时间: {new Date(app.applied_at || '').toLocaleDateString()}</span>
                </div>
                {app.portfolio_url && (
                  <a
                    href={app.portfolio_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center text-sm text-[#8B5CF6] hover:underline mt-2"
                  >
                    查看作品集 <ChevronRight className="w-4 h-4 ml-1" />
                  </a>
                )}
              </div>
              <div className="flex space-x-3">
                <button
                  onClick={() => onApprove(app.id!, app.user_id)}
                  className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                >
                  <UserCheck className="w-4 h-4" />
                  <span>通过</span>
                </button>
                <button
                  onClick={() => onReject(app.id!)}
                  className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                >
                  <UserX className="w-4 h-4" />
                  <span>拒绝</span>
                </button>
              </div>
            </div>
          </motion.div>
        ))}
        {applications.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p>没有待审核的申请</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function PromotersTab({ promoters }: { promoters: (Promoter & { profile?: Profile })[] }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Award className="w-5 h-5 mr-2 text-[#8B5CF6]" />
        星推官列表
        <span className="ml-2 text-sm text-white/40">({promoters.length})</span>
      </h2>

      <div className="space-y-4">
        {promoters.map((promoter, index) => (
          <motion.div
            key={promoter.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#F59E0B]/20 to-[#EF4444]/20 flex items-center justify-center">
                  <Award className="w-6 h-6 text-[#F59E0B]" />
                </div>
                <div>
                  <h3 className="font-bold">{promoter.profile?.username || '未知用户'}</h3>
                  <p className="text-sm text-white/60">
                    加入时间: {new Date(promoter.joined_at || '').toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-6 text-sm">
                <div className="text-center">
                  <p className="text-white/40">佣金比例</p>
                  <p className="font-bold text-[#F59E0B]">{promoter.commission_rate}%</p>
                </div>
                <div className="text-center">
                  <p className="text-white/40">累计收益</p>
                  <p className="font-bold text-green-400">¥{promoter.total_earned?.toFixed(2) || '0.00'}</p>
                </div>
                <div className="text-center">
                  <p className="text-white/40">已提现</p>
                  <p className="font-bold">¥{promoter.total_withdrawn?.toFixed(2) || '0.00'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs ${
                  promoter.status === 'active'
                    ? 'bg-green-500/20 text-green-400'
                    : 'bg-red-500/20 text-red-400'
                }`}>
                  {promoter.status === 'active' ? '正常' : '已冻结'}
                </span>
              </div>
            </div>
          </motion.div>
        ))}
        {promoters.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Award className="w-16 h-16 mx-auto mb-4 text-[#F59E0B]" />
            <p>暂无星推官</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function WithdrawalsTab({ withdrawals, onApprove, onReject }: { withdrawals: any[], onApprove: (id: string) => void, onReject: (id: string, reason: string) => void }) {
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingId, setRejectingId] = useState<string | null>(null);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <DollarSign className="w-5 h-5 mr-2 text-[#8B5CF6]" />
        待处理提现申请
        <span className="ml-2 text-sm text-white/40">({withdrawals.length})</span>
      </h2>

      <div className="space-y-4">
        {withdrawals.map((withdrawal, index) => (
          <motion.div
            key={withdrawal.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h3 className="font-bold text-lg">{withdrawal.promoter?.profile?.username || '未知用户'}</h3>
                  <span className="text-2xl font-bold text-green-400">¥{withdrawal.amount?.toFixed(2)}</span>
                </div>
                <div className="flex items-center space-x-4 text-sm text-white/40">
                  <span>支付方式: {withdrawal.payment_method || '未指定'}</span>
                  <span>账号: {withdrawal.payment_account || '未填写'}</span>
                  <span>申请时间: {new Date(withdrawal.created_at || '').toLocaleDateString()}</span>
                </div>
              </div>
              <div className="flex space-x-3">
                {rejectingId === withdrawal.id ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={rejectReason}
                      onChange={(e) => setRejectReason(e.target.value)}
                      placeholder="拒绝原因"
                      className="px-3 py-2 bg-[#0F0F1A] border border-white/10 rounded-lg text-sm"
                    />
                    <button
                      onClick={() => {
                        onReject(withdrawal.id!, rejectReason);
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      className="px-3 py-2 bg-red-500 text-white rounded-lg text-sm"
                    >
                      确认
                    </button>
                    <button
                      onClick={() => {
                        setRejectingId(null);
                        setRejectReason('');
                      }}
                      className="px-3 py-2 border border-white/20 rounded-lg text-sm"
                    >
                      取消
                    </button>
                  </div>
                ) : (
                  <>
                    <button
                      onClick={() => onApprove(withdrawal.id!)}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-500/20 text-green-400 rounded-xl hover:bg-green-500/30 transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>通过</span>
                    </button>
                    <button
                      onClick={() => setRejectingId(withdrawal.id!)}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-colors"
                    >
                      <XCircle className="w-4 h-4" />
                      <span>拒绝</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        ))}
        {withdrawals.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <CheckCircle className="w-16 h-16 mx-auto mb-4 text-green-400" />
            <p>没有待处理的提现申请</p>
          </div>
        )}
      </div>
    </motion.div>
  );
}

function UsersTab({ users }: { users: Profile[] }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [editingUser, setEditingUser] = useState<Profile | null>(null);

  const filteredUsers = users.filter(user => {
    const matchesSearch = !searchQuery ||
      user.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesRole = roleFilter === 'all' || user.role === roleFilter;
    return matchesSearch && matchesRole;
  });

  const roleStats = {
    all: users.length,
    user: users.filter(u => u.role === 'user' || !u.role).length,
    developer: users.filter(u => u.role === 'developer').length,
    promoter: users.filter(u => u.role === 'promoter').length,
    admin: users.filter(u => u.role === 'admin').length,
  };

  async function handleUpdateUserRole(userId: string, newRole: string) {
    const { error } = await supabase
      .from('profiles')
      .update({ role: newRole })
      .eq('id', userId);

    if (!error) {
      window.location.reload();
    }
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
    >
      <h2 className="text-xl font-bold mb-6 flex items-center">
        <Users className="w-5 h-5 mr-2 text-[#8B5CF6]" />
        用户管理
        <span className="ml-2 text-sm text-white/40">({users.length})</span>
      </h2>

      {/* Filters */}
      <div className="flex flex-wrap gap-2 mb-6">
        {[
          { id: 'all', label: '全部', count: roleStats.all },
          { id: 'user', label: '普通用户', count: roleStats.user },
          { id: 'developer', label: '开发者', count: roleStats.developer },
          { id: 'promoter', label: '星推官', count: roleStats.promoter },
          { id: 'admin', label: '管理员', count: roleStats.admin },
        ].map((role) => (
          <button
            key={role.id}
            onClick={() => setRoleFilter(role.id)}
            className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-all ${
              roleFilter === role.id
                ? 'bg-[#8B5CF6] text-white'
                : 'bg-[#1A1A2E] border border-white/10 text-white/60 hover:border-white/30'
            }`}
          >
            <span>{role.label}</span>
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              roleFilter === role.id ? 'bg-white/20' : 'bg-white/10'
            }`}>
              {role.count}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="搜索用户名或邮箱..."
          className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
        />
      </div>

      {/* Users List */}
      <div className="space-y-3">
        {filteredUsers.map((user, index) => (
          <motion.div
            key={user.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.03 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                  <User className="w-6 h-6 text-white/60" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-medium">{user.username || '未设置用户名'}</h3>
                    <RoleBadge role={user.role || 'user'} />
                  </div>
                  <p className="text-sm text-white/40">{user.email || '无邮箱'}</p>
                  <p className="text-xs text-white/30">
                    注册时间: {new Date(user.created_at || '').toLocaleDateString('zh-CN')}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingUser(user)}
                className="p-2 hover:bg-white/10 rounded-lg transition-colors"
              >
                <Settings className="w-5 h-5 text-white/60" />
              </button>
            </div>
          </motion.div>
        ))}
        {filteredUsers.length === 0 && (
          <div className="text-center py-12 text-white/40">
            <Users className="w-16 h-16 mx-auto mb-4" />
            <p>没有找到匹配的用户</p>
          </div>
        )}
      </div>

      {/* Edit Modal */}
      {editingUser && (
        <UserEditModal
          user={editingUser}
          onClose={() => setEditingUser(null)}
          onUpdateRole={handleUpdateUserRole}
        />
      )}
    </motion.div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { text: string; className: string }> = {
    user: { text: '普通用户', className: 'bg-gray-500/20 text-gray-400' },
    developer: { text: '开发者', className: 'bg-[#8B5CF6]/20 text-[#8B5CF6]' },
    promoter: { text: '星推官', className: 'bg-green-500/20 text-green-400' },
    admin: { text: '管理员', className: 'bg-red-500/20 text-red-400' },
  };
  const config = configs[role] || configs.user;
  return (
    <span className={`px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      {config.text}
    </span>
  );
}

function UserEditModal({ user, onClose, onUpdateRole }: { user: Profile; onClose: () => void; onUpdateRole: (id: string, role: string) => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="text-xl font-bold mb-4">修改用户角色</h3>
        <p className="text-white/60 mb-6">用户: {user.username}</p>
        <div className="space-y-2">
          {[
            { id: 'user', label: '普通用户' },
            { id: 'developer', label: '开发者' },
            { id: 'promoter', label: '星推官' },
            { id: 'admin', label: '管理员' },
          ].map((role) => (
            <button
              key={role.id}
              onClick={() => {
                onUpdateRole(user.id, role.id);
                onClose();
              }}
              className={`w-full p-3 rounded-xl text-left transition-colors ${
                user.role === role.id
                  ? 'bg-[#8B5CF6] text-white'
                  : 'bg-white/5 hover:bg-white/10'
              }`}
            >
              {role.label}
            </button>
          ))}
        </div>
        <button
          onClick={onClose}
          className="w-full mt-4 py-3 border border-white/20 rounded-xl hover:bg-white/5 transition-colors"
        >
          取消
        </button>
      </motion.div>
    </motion.div>
  );
}
