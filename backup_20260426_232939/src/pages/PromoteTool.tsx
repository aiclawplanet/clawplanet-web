import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Plus, Target, Users, DollarSign, TrendingUp,
  Clock, Check, AlertCircle, Sparkles, ChevronRight,
  Megaphone, Award, Wallet, BarChart3, ExternalLink,
  Edit, Trash2, Eye, PauseCircle, PlayCircle
} from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type ToolPromotionSetting = Tables<'tool_promotion_settings'>;
type PromotionTask = Tables<'promotion_tasks'>;

interface ToolWithSetting extends Tool {
  promotion_setting?: ToolPromotionSetting;
}

export function PromoteTool() {
  const navigate = useNavigate();
  const [tools, setTools] = useState<ToolWithSetting[]>([]);
  const [promotionTasks, setPromotionTasks] = useState<PromotionTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedTool, setSelectedTool] = useState<ToolWithSetting | null>(null);
  const [activeTab, setActiveTab] = useState<'tasks' | 'tools'>('tasks');

  const [formData, setFormData] = useState({
    reward_amount: 5,
    target_clicks: 100,
    duration_days: 7,
  });
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/profile');
        return;
      }

      const { data: toolsData } = await supabase
        .from('tools')
        .select('*, promotion_setting:tool_promotion_settings(*)')
        .eq('developer_id', user.id)
        .eq('status', 'approved')
        .order('created_at', { ascending: false });

      if (toolsData) {
        setTools(toolsData);
      }

      const { data: tasksData } = await supabase
        .from('promotion_tasks')
        .select('*')
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false });

      if (tasksData) {
        setPromotionTasks(tasksData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function createPromotionTask() {
    if (!selectedTool) return;
    setCreating(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/profile');
        return;
      }

      const endDate = new Date();
      endDate.setDate(endDate.getDate() + formData.duration_days);

      const totalBudget = formData.reward_amount * formData.target_clicks;

      const { data, error } = await supabase
        .from('promotion_tasks')
        .insert({
          tool_id: selectedTool.id,
          developer_id: user.id,
          reward_amount: formData.reward_amount,
          target_clicks: formData.target_clicks,
          current_clicks: 0,
          total_budget: totalBudget,
          spent_amount: 0,
          status: 'active',
          start_date: new Date().toISOString(),
          end_date: endDate.toISOString(),
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating task:', error);
        return;
      }

      if (data) {
        setPromotionTasks([data, ...promotionTasks]);
        setShowCreateModal(false);
        setSelectedTool(null);
        setFormData({ reward_amount: 5, target_clicks: 100, duration_days: 7 });
      }
    } catch (error) {
      console.error('Error creating task:', error);
    } finally {
      setCreating(false);
    }
  }

  async function toggleTaskStatus(taskId: string, currentStatus: string) {
    const newStatus = currentStatus === 'active' ? 'paused' : 'active';
    
    const { error } = await supabase
      .from('promotion_tasks')
      .update({ status: newStatus })
      .eq('id', taskId);

    if (!error) {
      setPromotionTasks(tasks => 
        tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t)
      );
    }
  }

  function calculateTotalCost() {
    return formData.reward_amount * formData.target_clicks;
  }

  function calculatePlatformFee() {
    return calculateTotalCost() * 0.1;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">发布推广悬赏</h1>
            <p className="text-white/60 text-sm">设置悬赏任务，让星推官帮您推广</p>
          </div>
        </div>
        <button
          onClick={() => setShowCreateModal(true)}
          className="flex items-center px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          发布悬赏
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
      >
        <StatCard
          label="进行中的悬赏"
          value={promotionTasks.filter(t => t.status === 'active').length}
          icon={Target}
          color="text-[#8B5CF6]"
        />
        <StatCard
          label="总悬赏金额"
          value={`¥${promotionTasks.reduce((sum, t) => sum + t.total_budget, 0).toFixed(2)}`}
          icon={Wallet}
          color="text-green-400"
        />
        <StatCard
          label="累计获得点击"
          value={promotionTasks.reduce((sum, t) => sum + t.current_clicks, 0)}
          icon={TrendingUp}
          color="text-blue-400"
        />
        <StatCard
          label="参与星推官"
          value="0"
          icon={Users}
          color="text-orange-400"
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="flex space-x-4 mb-6"
      >
        <button
          onClick={() => setActiveTab('tasks')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'tasks'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          我的悬赏
        </button>
        <button
          onClick={() => setActiveTab('tools')}
          className={`px-4 py-2 rounded-xl font-medium transition-colors ${
            activeTab === 'tools'
              ? 'bg-[#8B5CF6] text-white'
              : 'bg-white/5 text-white/60 hover:bg-white/10'
          }`}
        >
          可推广作品
        </button>
      </motion.div>

      {activeTab === 'tasks' ? (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {promotionTasks.length === 0 ? (
            <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
              <Megaphone className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-xl font-bold mb-2">还没有发布悬赏</h3>
              <p className="text-white/60 mb-6">发布推广悬赏，让星推官帮您推广作品</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
              >
                <Plus className="w-5 h-5 mr-2" />
                发布第一个悬赏
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {promotionTasks.map((task, index) => (
                <TaskCard 
                  key={task.id} 
                  task={task} 
                  index={index} 
                  tools={tools}
                  onToggleStatus={() => toggleTaskStatus(task.id, task.status)}
                />
              ))}
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {tools.length === 0 ? (
            <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
              <AlertCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
              <h3 className="text-xl font-bold mb-2">没有可推广的作品</h3>
              <p className="text-white/60 mb-6">先入驻并提交作品，才能发布推广悬赏</p>
              <Link
                to="/join"
                className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
              >
                <Sparkles className="w-5 h-5 mr-2" />
                立即入驻
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tools.map((tool, index) => (
                <ToolCard
                  key={tool.id}
                  tool={tool}
                  index={index}
                  onPromote={() => {
                    setSelectedTool(tool);
                    setShowCreateModal(true);
                  }}
                />
              ))}
            </div>
          )}
        </motion.div>
      )}

      <AnimatePresence>
        {showCreateModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowCreateModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">发布推广悬赏</h2>
              <p className="text-white/60 mb-6">设置悬赏金额，吸引星推官帮您推广</p>

              {!selectedTool && tools.length > 0 && (
                <div className="mb-6">
                  <label className="block text-sm font-medium mb-3">选择要推广的作品</label>
                  <div className="space-y-2">
                    {tools.map((tool) => (
                      <button
                        key={tool.id}
                        onClick={() => setSelectedTool(tool)}
                        className="w-full flex items-center p-3 bg-[#0F0F1A] border border-white/10 rounded-xl hover:border-[#8B5CF6]/50 transition-colors"
                      >
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center mr-3">
                          {tool.icon_url ? (
                            <img src={tool.icon_url} alt={tool.name} className="w-8 h-8 rounded" />
                          ) : (
                            <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                          )}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium">{tool.name}</p>
                          <p className="text-xs text-white/40">
                            {tool.view_count || 0} 浏览 · {tool.jump_count || 0} 使用
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {selectedTool && (
                <>
                  <div className="flex items-center p-3 bg-[#0F0F1A] border border-white/10 rounded-xl mb-6">
                    <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center mr-3">
                      {selectedTool.icon_url ? (
                        <img src={selectedTool.icon_url} alt={selectedTool.name} className="w-8 h-8 rounded" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-[#8B5CF6]" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{selectedTool.name}</p>
                    </div>
                    <button
                      onClick={() => setSelectedTool(null)}
                      className="text-sm text-[#8B5CF6] hover:underline"
                    >
                      更换
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        单次点击悬赏金额 (¥)
                      </label>
                      <input
                        type="number"
                        min="1"
                        step="0.1"
                        value={formData.reward_amount}
                        onChange={(e) => setFormData({
                          ...formData,
                          reward_amount: parseFloat(e.target.value) || 0
                        })}
                        className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                      />
                      <p className="text-xs text-white/40 mt-1">
                        建议设置 ¥3-10，越高越能吸引星推官
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        目标点击次数
                      </label>
                      <input
                        type="number"
                        min="10"
                        value={formData.target_clicks}
                        onChange={(e) => setFormData({
                          ...formData,
                          target_clicks: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        悬赏有效期 (天)
                      </label>
                      <input
                        type="number"
                        min="1"
                        max="30"
                        value={formData.duration_days}
                        onChange={(e) => setFormData({
                          ...formData,
                          duration_days: parseInt(e.target.value) || 1
                        })}
                        className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                      />
                    </div>
                  </div>

                  <div className="mt-6 p-4 bg-[#0F0F1A] border border-white/10 rounded-xl">
                    <h4 className="font-medium mb-3">费用明细</h4>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/60">
                        <span>悬赏总额</span>
                        <span>¥{calculateTotalCost().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between text-white/60">
                        <span>平台服务费 (10%)</span>
                        <span>¥{calculatePlatformFee().toFixed(2)}</span>
                      </div>
                      <div className="flex justify-between border-t border-white/10 pt-2">
                        <span className="font-medium">总计</span>
                        <span className="font-bold text-[#8B5CF6]">
                          ¥{(calculateTotalCost() + calculatePlatformFee()).toFixed(2)}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex space-x-3 mt-6">
                    <button
                      onClick={() => setShowCreateModal(false)}
                      className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                    >
                      取消
                    </button>
                    <button
                      onClick={createPromotionTask}
                      disabled={creating || formData.reward_amount <= 0 || formData.target_clicks <= 0}
                      className="flex-1 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                    >
                      {creating ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                          创建中...
                        </>
                      ) : (
                        <>
                          <Check className="w-4 h-4 mr-2" />
                          发布悬赏
                        </>
                      )}
                    </button>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
      <div className="flex items-center space-x-3 mb-2">
        <div className={`w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

function TaskCard({ 
  task, 
  index, 
  tools,
  onToggleStatus 
}: { 
  task: PromotionTask; 
  index: number;
  tools: ToolWithSetting[];
  onToggleStatus: () => void;
}) {
  const progress = Math.round((task.current_clicks / task.target_clicks) * 100);
  const isExpired = new Date(task.end_date) < new Date();
  const tool = tools.find(t => t.id === task.tool_id);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
    >
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-4">
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
            {tool?.icon_url ? (
              <img src={tool.icon_url} alt={tool.name} className="w-10 h-10 rounded-lg" />
            ) : (
              <Sparkles className="w-7 h-7 text-[#8B5CF6]" />
            )}
          </div>
          <div>
            <div className="flex items-center space-x-2 mb-1">
              <h3 className="font-bold">{tool?.name || '未知工具'}</h3>
              <StatusBadge status={isExpired ? 'expired' : task.status} />
            </div>
            <div className="flex items-center space-x-4 text-sm text-white/60">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1" />
                ¥{task.reward_amount}/点击
              </span>
              <span className="flex items-center">
                <Target className="w-4 h-4 mr-1" />
                {task.current_clicks}/{task.target_clicks} 点击
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                {isExpired ? '已过期' : `${Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))} 天剩余`}
              </span>
            </div>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            <Eye className="w-4 h-4" />
          </button>
          <button className="p-2 bg-white/5 border border-white/10 rounded-lg hover:bg-white/10 transition-colors">
            <Edit className="w-4 h-4" />
          </button>
          {task.status === 'active' ? (
            <button 
              onClick={onToggleStatus}
              className="p-2 bg-yellow-500/10 border border-yellow-500/30 text-yellow-400 rounded-lg hover:bg-yellow-500/20 transition-colors"
            >
              <PauseCircle className="w-4 h-4" />
            </button>
          ) : (
            <button 
              onClick={onToggleStatus}
              className="p-2 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg hover:bg-green-500/20 transition-colors"
            >
              <PlayCircle className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      <div className="mt-4">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-white/60">推广进度</span>
          <span className="font-medium">{progress}%</span>
        </div>
        <div className="h-2 bg-white/10 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 mt-4 pt-4 border-t border-white/10">
        <div>
          <p className="text-xs text-white/40 mb-1">已消耗金额</p>
          <p className="font-medium">¥{task.spent_amount.toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">剩余预算</p>
          <p className="font-medium">¥{(task.total_budget - task.spent_amount).toFixed(2)}</p>
        </div>
        <div>
          <p className="text-xs text-white/40 mb-1">参与星推官</p>
          <p className="font-medium">0 人</p>
        </div>
      </div>
    </motion.div>
  );
}

function ToolCard({
  tool,
  index,
  onPromote
}: {
  tool: ToolWithSetting;
  index: number;
  onPromote: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 hover:border-[#8B5CF6]/30 transition-colors"
    >
      <div className="flex items-start space-x-4 mb-4">
        <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
          {tool.icon_url ? (
            <img src={tool.icon_url} alt={tool.name} className="w-10 h-10 rounded-lg" />
          ) : (
            <Sparkles className="w-7 h-7 text-[#8B5CF6]" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold mb-1">{tool.name}</h3>
          <p className="text-sm text-white/60 line-clamp-2">{tool.description}</p>
        </div>
      </div>

      <div className="flex items-center space-x-4 text-sm text-white/40 mb-4">
        <span className="flex items-center">
          <Eye className="w-4 h-4 mr-1" />
          {tool.view_count || 0}
        </span>
        <span className="flex items-center">
          <ExternalLink className="w-4 h-4 mr-1" />
          {tool.jump_count || 0}
        </span>
      </div>

      {tool.promotion_setting?.is_active ? (
        <div className="flex items-center justify-between p-3 bg-green-500/10 border border-green-500/30 rounded-xl mb-4">
          <div className="flex items-center text-sm">
            <Award className="w-4 h-4 mr-2 text-green-400" />
            <span className="text-green-400">已启用星推官推广</span>
          </div>
          <span className="text-sm text-white/60">
            ¥{tool.promotion_setting.pay_per_conversion}/点击
          </span>
        </div>
      ) : (
        <div className="flex items-center p-3 bg-white/5 border border-white/10 rounded-xl mb-4">
          <AlertCircle className="w-4 h-4 mr-2 text-white/40" />
          <span className="text-sm text-white/40">未设置推广奖励</span>
        </div>
      )}

      <div className="flex space-x-2">
        <Link
          to={`/tool/${tool.id}/manage`}
          className="flex-1 py-2 bg-white/5 border border-white/10 rounded-xl text-sm font-medium hover:bg-white/10 transition-colors text-center"
        >
          管理
        </Link>
        <button
          onClick={onPromote}
          className="flex-1 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl text-sm font-medium hover:opacity-90 transition-opacity"
        >
          发布悬赏
        </button>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'bg-green-500/20 text-green-400',
    paused: 'bg-yellow-500/20 text-yellow-400',
    completed: 'bg-blue-500/20 text-blue-400',
    expired: 'bg-red-500/20 text-red-400',
  };

  const labels: Record<string, string> = {
    active: '进行中',
    paused: '已暂停',
    completed: '已完成',
    expired: '已过期',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${styles[status] || styles.active}`}>
      {labels[status] || status}
    </span>
  );
}
