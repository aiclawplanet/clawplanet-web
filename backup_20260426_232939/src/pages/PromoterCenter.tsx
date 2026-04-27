import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Link2, DollarSign, MousePointer, TrendingUp, Copy, Check, ArrowRight, Sparkles, ChevronRight, Wrench, Target, Clock } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type PromotionLink = Tables<'promotion_links'>;
type PromotionTask = Tables<'promotion_tasks'>;

interface TaskWithTool extends PromotionTask {
  tool: Tool;
  promotion_link?: PromotionLink;
}

export function PromoterCenter() {
  const [tasks, setTasks] = useState<TaskWithTool[]>([]);
  const [myLinks, setMyLinks] = useState<PromotionLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);
  const [user, setUser] = useState<Tables<'profiles'> | null>(null);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    const { data: { user: authUser } } = await supabase.auth.getUser();
    if (authUser) {
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', authUser.id)
        .single();
      setUser(profile);
      fetchData(authUser.id);
    } else {
      fetchTasks();
    }
  }

  async function fetchTasks() {
    try {
      const { data: tasksData } = await supabase
        .from('promotion_tasks')
        .select('*, tool:tools(*)')
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('reward_amount', { ascending: false })
        .limit(20);

      if (tasksData) {
        setTasks(tasksData as TaskWithTool[]);
      }
    } catch (error) {
      console.error('Error fetching tasks:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchData(userId: string) {
    try {
      const { data: tasksData } = await supabase
        .from('promotion_tasks')
        .select('*, tool:tools(*)')
        .eq('status', 'active')
        .gt('end_date', new Date().toISOString())
        .order('reward_amount', { ascending: false })
        .limit(20);

      const { data: linksData } = await supabase
        .from('promotion_links')
        .select('*')
        .eq('promoter_id', userId);

      if (tasksData) {
        const tasksWithLinks = tasksData.map(task => ({
          ...task,
          promotion_link: linksData?.find(link => link.tool_id === task.tool_id)
        }));
        setTasks(tasksWithLinks as TaskWithTool[]);
      }
      if (linksData) {
        setMyLinks(linksData);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function generateLink(toolId: string) {
    if (!user) return;

    const code = Math.random().toString(36).substring(2, 10).toUpperCase();
    
    const { data, error } = await supabase
      .from('promotion_links')
      .insert({
        tool_id: toolId,
        promoter_id: user.id,
        code: code,
      })
      .select()
      .single();

    if (!error && data) {
      setMyLinks([...myLinks, data]);
      setTasks(tasks.map(task => 
        task.tool_id === toolId ? { ...task, promotion_link: data } : task
      ));
    }
  }

  function copyLink(code: string) {
    const link = `${window.location.origin}/#/tool/${code}`;
    navigator.clipboard.writeText(link);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  }

  const totalClicks = myLinks.reduce((sum, link) => sum + (link.click_count || 0), 0);
  const totalCommission = myLinks.reduce((sum, link) => sum + (link.commission_earned || 0), 0);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-full blur-3xl opacity-30"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
              <Sparkles className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4"
            >
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] absolute top-0 left-1/2 -translate-x-1/2"></div>
              <div className="w-2 h-2 rounded-full bg-[#EF4444] absolute bottom-0 left-1/2 -translate-x-1/2"></div>
              <div className="w-2 h-2 rounded-full bg-[#F59E0B] absolute left-0 top-1/2 -translate-y-1/2"></div>
              <div className="w-2 h-2 rounded-full bg-[#EF4444] absolute right-0 top-1/2 -translate-y-1/2"></div>
            </motion.div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-3"
          >
            成为星推官
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 mb-2 text-center max-w-md"
          >
            加入星推官计划，推广优质工具，赚取丰厚佣金
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="flex items-center space-x-6 mb-8 text-sm text-white/40"
          >
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#F59E0B] mr-2"></span>
              专属推广链接
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#EF4444] mr-2"></span>
              实时数据追踪
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mr-2"></span>
              创作者社区
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to="/profile"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-xl font-medium text-lg hover:shadow-lg hover:shadow-[#F59E0B]/25 transition-all"
            >
              立即加入
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[50vh] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#1A1A2E] border border-white/10 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-[#F59E0B]" />
        </div>
        <h1 className="text-2xl font-bold mb-3">星推官推广中心</h1>
        <p className="text-white/60 mb-6 max-w-md">
          推广功能暂未开放，敬请期待
        </p>
        <div className="px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white/40 text-sm">
          暂未开放
        </div>
      </motion.div>
    </div>
  );

  /* 原功能代码暂时注释
  return (
    <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">星推官推广中心</h1>
        <p className="text-white/60">选择悬赏任务，推广赚取佣金</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <span className="text-white/60">推广链接</span>
          </div>
          <p className="text-3xl font-bold">{myLinks.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <span className="text-white/60">总点击量</span>
          </div>
          <p className="text-3xl font-bold">{totalClicks}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60">累计佣金</span>
          </div>
          <p className="text-3xl font-bold">¥{totalCommission.toFixed(2)}</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Target className="w-5 h-5 mr-2 text-[#8B5CF6]" />
          可接悬赏任务
        </h2>
        <Link
          to="/promoter/stats"
          className="flex items-center text-[#8B5CF6] hover:underline"
        >
          查看详细数据
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
          <Target className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-bold mb-2">暂无悬赏任务</h3>
          <p className="text-white/60">暂时没有可接的推广悬赏，请稍后再来</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                  {task.tool?.icon_url ? (
                    <img src={task.tool.icon_url} alt={task.tool.name} className="w-10 h-10 rounded-lg" />
                  ) : (
                    <Wrench className="w-7 h-7 text-[#8B5CF6]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1">{task.tool?.name}</h3>
                  <p className="text-sm text-white/60 line-clamp-2">{task.tool?.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-[#0F0F1A] rounded-xl">
                <div className="flex items-center text-green-400">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span className="font-bold">¥{task.reward_amount}</span>
                  <span className="text-white/40 text-sm ml-1">/点击</span>
                </div>
                <div className="flex items-center text-white/40 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/40 mb-4">
                <span>目标: {task.target_clicks}点击</span>
                <span>剩余: {task.target_clicks - task.current_clicks}点击</span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full transition-all"
                  style={{ width: `${Math.min((task.current_clicks / task.target_clicks) * 100, 100)}%` }}
                />
              </div>

              {task.promotion_link ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#0F0F1A] rounded-lg px-4 py-3">
                    <code className="text-sm text-[#8B5CF6] font-mono">
                      {task.promotion_link.code}
                    </code>
                    <button
                      onClick={() => copyLink(task.promotion_link!.code)}
                      className="flex items-center space-x-1 text-sm text-white/60 hover:text-white"
                    >
                      {copiedCode === task.promotion_link.code ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>点击: {task.promotion_link.click_count || 0}</span>
                    <span>转化: {task.promotion_link.conversion_count || 0}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => generateLink(task.tool_id)}
                  className="w-full py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  接单生成推广链接
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
  */

  return (
    <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">星推官推广中心</h1>
        <p className="text-white/60">选择悬赏任务，推广赚取佣金</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
              <Link2 className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <span className="text-white/60">推广链接</span>
          </div>
          <p className="text-3xl font-bold">{myLinks.length}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center">
              <MousePointer className="w-5 h-5 text-[#3B82F6]" />
            </div>
            <span className="text-white/60">总点击量</span>
          </div>
          <p className="text-3xl font-bold">{totalClicks}</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
        >
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-green-400" />
            </div>
            <span className="text-white/60">累计佣金</span>
          </div>
          <p className="text-3xl font-bold">¥{totalCommission.toFixed(2)}</p>
        </motion.div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold flex items-center">
          <Target className="w-5 h-5 mr-2 text-[#8B5CF6]" />
          可接悬赏任务
        </h2>
        <Link
          to="/promoter/stats"
          className="flex items-center text-[#8B5CF6] hover:underline"
        >
          查看详细数据
          <ArrowRight className="w-4 h-4 ml-1" />
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
          <Target className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-bold mb-2">暂无悬赏任务</h3>
          <p className="text-white/60">暂时没有可接的推广悬赏，请稍后再来</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tasks.map((task, index) => (
            <motion.div
              key={task.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                  {task.tool?.icon_url ? (
                    <img src={task.tool.icon_url} alt={task.tool.name} className="w-10 h-10 rounded-lg" />
                  ) : (
                    <Wrench className="w-7 h-7 text-[#8B5CF6]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1">{task.tool?.name}</h3>
                  <p className="text-sm text-white/60 line-clamp-2">{task.tool?.description}</p>
                </div>
              </div>

              <div className="flex items-center justify-between mb-4 p-3 bg-[#0F0F1A] rounded-xl">
                <div className="flex items-center text-green-400">
                  <DollarSign className="w-4 h-4 mr-1" />
                  <span className="font-bold">¥{task.reward_amount}</span>
                  <span className="text-white/40 text-sm ml-1">/点击</span>
                </div>
                <div className="flex items-center text-white/40 text-sm">
                  <Clock className="w-4 h-4 mr-1" />
                  {Math.ceil((new Date(task.end_date).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}天
                </div>
              </div>

              <div className="flex items-center justify-between text-sm text-white/40 mb-4">
                <span>目标: {task.target_clicks}点击</span>
                <span>剩余: {task.target_clicks - task.current_clicks}点击</span>
              </div>

              <div className="h-2 bg-white/10 rounded-full overflow-hidden mb-4">
                <div
                  className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full transition-all"
                  style={{ width: `${Math.min((task.current_clicks / task.target_clicks) * 100, 100)}%` }}
                />
              </div>

              {task.promotion_link ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between bg-[#0F0F1A] rounded-lg px-4 py-3">
                    <code className="text-sm text-[#8B5CF6] font-mono">
                      {task.promotion_link.code}
                    </code>
                    <button
                      onClick={() => copyLink(task.promotion_link!.code)}
                      className="flex items-center space-x-1 text-sm text-white/60 hover:text-white"
                    >
                      {copiedCode === task.promotion_link.code ? (
                        <>
                          <Check className="w-4 h-4 text-green-400" />
                          <span className="text-green-400">已复制</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-4 h-4" />
                          <span>复制</span>
                        </>
                      )}
                    </button>
                  </div>
                  <div className="flex items-center justify-between text-sm text-white/60">
                    <span>点击: {task.promotion_link.click_count || 0}</span>
                    <span>转化: {task.promotion_link.conversion_count || 0}</span>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => generateLink(task.tool_id)}
                  className="w-full py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity"
                >
                  接单生成推广链接
                </button>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
