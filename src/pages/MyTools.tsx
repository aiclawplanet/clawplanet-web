import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Wrench, ChevronLeft, Clock, CheckCircle, XCircle, Edit, Trash2,
  Eye, ExternalLink, Plus, Filter, Search, AlertCircle, Megaphone, Users
} from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type Category = Tables<'categories'>;

interface ToolWithCategory extends Tool {
  category?: Category;
}

export function MyTools() {
  const [tools, setTools] = useState<ToolWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [toolToDelete, setToolToDelete] = useState<ToolWithCategory | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchMyTools();
  }, []);

  async function fetchMyTools() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();
      if (!authUser) {
        setLoading(false);
        return;
      }

      const { data: toolsData, error } = await supabase
        .from('tools')
        .select('*, category:category_id(*)')
        .eq('developer_id', authUser.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching tools:', error);
        return;
      }

      if (toolsData) {
        setTools(toolsData as ToolWithCategory[]);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleDeleteTool() {
    if (!toolToDelete) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', toolToDelete.id);

      if (error) {
        console.error('Error deleting tool:', error);
        return;
      }

      setTools(tools.filter(t => t.id !== toolToDelete.id));
      setDeleteModalOpen(false);
      setToolToDelete(null);
    } catch (error) {
      console.error('Error:', error);
    }
  }

  const filteredTools = tools.filter(tool => {
    const matchesStatus = filterStatus === 'all' || tool.status === filterStatus;
    const matchesSearch = !searchQuery || 
      tool.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tool.description?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const statusCounts = {
    all: tools.length,
    pending: tools.filter(t => t.status === 'pending').length,
    approved: tools.filter(t => t.status === 'approved').length,
    rejected: tools.filter(t => t.status === 'rejected').length,
  };

  if (loading) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => navigate('/profile')}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <ChevronLeft className="w-6 h-6" />
            </button>
            <div>
              <h1 className="text-2xl font-bold">我的工具</h1>
              <p className="text-white/60 text-sm">管理我提交的工具产品</p>
            </div>
          </div>
          <Link
            to="/join"
            className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" />
            <span>提交新工具</span>
          </Link>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6"
      >
        <div className="flex flex-wrap gap-2">
          {[
            { id: 'all', label: '全部', count: statusCounts.all, color: 'bg-white/10' },
            { id: 'approved', label: '已上线', count: statusCounts.approved, color: 'bg-green-500/20 text-green-400' },
            { id: 'pending', label: '审核中', count: statusCounts.pending, color: 'bg-yellow-500/20 text-yellow-400' },
            { id: 'rejected', label: '未通过', count: statusCounts.rejected, color: 'bg-red-500/20 text-red-400' },
          ].map((status) => (
            <button
              key={status.id}
              onClick={() => setFilterStatus(status.id)}
              className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm transition-all ${
                filterStatus === status.id
                  ? 'bg-[#8B5CF6] text-white'
                  : `bg-[#1A1A2E] border border-white/10 hover:border-white/30 ${status.color}`
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
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
        className="mb-6"
      >
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索工具名称..."
            className="w-full pl-12 pr-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        {tools.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
            <Wrench className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-medium mb-2">还没有提交过工具</h3>
            <p className="text-white/60 mb-6">成为开发者，提交你的工具产品</p>
            <Link
              to="/join"
              className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity"
            >
              <Plus className="w-5 h-5" />
              <span>立即入驻</span>
            </Link>
          </div>
        ) : filteredTools.length === 0 ? (
          <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
            <Filter className="w-16 h-16 mx-auto mb-4 text-white/20" />
            <h3 className="text-xl font-medium mb-2">没有找到匹配的工具</h3>
            <p className="text-white/60">尝试调整筛选条件或搜索关键词</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 hover:border-white/20 transition-colors"
              >
                <div className="flex items-start space-x-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
                    {tool.icon_url ? (
                      <img
                        src={tool.icon_url}
                        alt={tool.name}
                        className="w-12 h-12 rounded-lg"
                      />
                    ) : (
                      <Wrench className="w-8 h-8 text-[#8B5CF6]" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="font-bold text-lg mb-1">{tool.name}</h3>
                        <p className="text-white/60 text-sm line-clamp-2 mb-2">
                          {tool.description || '暂无描述'}
                        </p>
                        <div className="flex items-center space-x-3 text-sm">
                          <StatusBadge status={tool.status || 'pending'} />
                          {tool.category && (
                            <span className="text-white/40">{tool.category.name}</span>
                          )}
                          <span className="text-white/40">
                            提交于 {new Date(tool.created_at || '').toLocaleDateString('zh-CN')}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {tool.status === 'approved' && (
                          <>
                            <Link
                              to={`/promotion?toolId=${tool.id}`}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-orange-500 to-orange-600 rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                              title="进入智能推广中心"
                            >
                              <Megaphone className="w-4 h-4" />
                              <span>智能推广</span>
                            </Link>
                            <button
                              onClick={() => alert('寻求星推官功能即将上线，敬请期待！')}
                              className="inline-flex items-center space-x-1 px-3 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                              title="寻求星推官"
                            >
                              <Users className="w-4 h-4" />
                              <span>寻求星推官</span>
                            </button>
                            <Link
                              to={`/tool/${tool.id}`}
                              className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                              title="查看详情"
                            >
                              <Eye className="w-5 h-5 text-white/60" />
                            </Link>
                          </>
                        )}
                        <Link
                          to={`/tool/${tool.id}/edit`}
                          className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                          title="编辑工具"
                        >
                          <Edit className="w-5 h-5 text-white/60" />
                        </Link>
                        <button
                          onClick={() => {
                            setToolToDelete(tool);
                            setDeleteModalOpen(true);
                          }}
                          className="p-2 hover:bg-red-500/20 rounded-lg transition-colors"
                          title="删除工具"
                        >
                          <Trash2 className="w-5 h-5 text-red-400" />
                        </button>
                      </div>
                    </div>

                    {tool.status === 'rejected' && (
                      <div className="mt-4 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                        <div className="flex items-start space-x-2">
                          <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-red-400 font-medium text-sm">审核未通过</p>
                            <p className="text-white/60 text-sm mt-1">
                              请修改后重新提交，或联系管理员了解详情
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {tool.status === 'pending' && (
                      <div className="mt-4 p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-xl">
                        <div className="flex items-start space-x-2">
                          <Clock className="w-5 h-5 text-yellow-400 flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-yellow-400 font-medium text-sm">审核中</p>
                            <p className="text-white/60 text-sm mt-1">
                              管理员正在审核你的工具申请，请耐心等待
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {tool.status === 'approved' && (
                      <div className="mt-4 flex items-center space-x-6 text-sm">
                        <div className="flex items-center space-x-2">
                          <Eye className="w-4 h-4 text-white/40" />
                          <span className="text-white/60">{tool.view_count || 0} 次浏览</span>
                        </div>
                        <div className="flex items-center space-x-2">
                          <ExternalLink className="w-4 h-4 text-white/40" />
                          <span className="text-white/60">{tool.jump_count || 0} 次跳转</span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>

      {deleteModalOpen && toolToDelete && (
        <DeleteConfirmModal
          tool={toolToDelete}
          onClose={() => {
            setDeleteModalOpen(false);
            setToolToDelete(null);
          }}
          onConfirm={handleDeleteTool}
        />
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
    pending: {
      text: '审核中',
      className: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
      icon: <Clock className="w-3 h-3" />,
    },
    approved: {
      text: '已上线',
      className: 'bg-green-500/20 text-green-400 border-green-500/30',
      icon: <CheckCircle className="w-3 h-3" />,
    },
    rejected: {
      text: '未通过',
      className: 'bg-red-500/20 text-red-400 border-red-500/30',
      icon: <XCircle className="w-3 h-3" />,
    },
  };

  const config = configs[status] || configs.pending;

  return (
    <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs border ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
}

interface DeleteConfirmModalProps {
  tool: ToolWithCategory;
  onClose: () => void;
  onConfirm: () => void;
}

function DeleteConfirmModal({ tool, onClose, onConfirm }: DeleteConfirmModalProps) {
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
          确定要删除工具 <span className="font-medium text-white">"{tool.name}"</span> 吗？
          删除后将无法恢复。
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
