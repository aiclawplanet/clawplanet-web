import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Plus, Eye, ExternalLink, Award, Settings, TrendingUp, Megaphone, BarChart3, Wrench, Rocket, Briefcase, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';

type Tool = Tables<'tools'>;
type Certificate = Tables<'tool_certificates'>;

interface ChartData {
  name: string;
  views: number;
  jumps: number;
}

export function DeveloperDashboard() {
  const [tools, setTools] = useState<(Tool & { certificate?: Certificate })[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalTools: 0,
    totalViews: 0,
    totalJumps: 0,
  });
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [toolStats, setToolStats] = useState<{name: string; views: number; jumps: number}[]>([]);

  useEffect(() => {
    fetchDeveloperTools();
  }, []);

  async function fetchDeveloperTools() {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setLoading(false);
        return;
      }

      const { data: toolsData } = await supabase
        .from('tools')
        .select('*, certificate:tool_certificates(*)')
        .eq('developer_id', user.id)
        .order('created_at', { ascending: false });

      if (toolsData) {
        setTools(toolsData);
        setStats({
          totalTools: toolsData.length,
          totalViews: toolsData.reduce((sum, t) => sum + (t.view_count || 0), 0),
          totalJumps: toolsData.reduce((sum, t) => sum + (t.jump_count || 0), 0),
        });

        // Generate mock trend data (last 7 days)
        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        });

        const trendData = last7Days.map((date, index) => ({
          name: date,
          views: Math.floor(Math.random() * 500) + 100 + (index * 50),
          jumps: Math.floor(Math.random() * 200) + 50 + (index * 20),
        }));
        setChartData(trendData);

        // Tool stats for bar chart
        const tStats = toolsData.slice(0, 5).map(t => ({
          name: t.name.length > 6 ? t.name.slice(0, 6) + '...' : t.name,
          views: t.view_count || 0,
          jumps: t.jump_count || 0,
        }));
        setToolStats(tStats);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
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
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">开发者后台</h1>
        <Link
          to="/join"
          className="flex items-center px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加新工具
        </Link>
      </div>

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-2 gap-4 mb-8"
      >
        <Link
          to="/developer/demands"
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 hover:border-cyan-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60 mb-1">需求大厅</p>
              <p className="text-lg font-bold text-white group-hover:text-cyan-400">浏览需求并报价</p>
            </div>
            <div className="w-12 h-12 bg-cyan-500/20 rounded-xl flex items-center justify-center">
              <Briefcase className="w-6 h-6 text-cyan-400" />
            </div>
          </div>
        </Link>
        <Link
          to="/my-quotes"
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 hover:border-pink-500/50 transition-all group"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/60 mb-1">我的报价</p>
              <p className="text-lg font-bold text-white group-hover:text-pink-400">查看报价状态</p>
            </div>
            <div className="w-12 h-12 bg-pink-500/20 rounded-xl flex items-center justify-center">
              <MessageSquare className="w-6 h-6 text-pink-400" />
            </div>
          </div>
        </Link>
      </motion.div>

      {/* Stats */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-white/60 mb-1">我的工具</p>
          <p className="text-3xl font-bold">{stats.totalTools}</p>
        </div>
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-white/60 mb-1">总浏览量</p>
          <p className="text-3xl font-bold">{stats.totalViews}</p>
        </div>
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <p className="text-sm text-white/60 mb-1">总使用次数</p>
          <p className="text-3xl font-bold">{stats.totalJumps}</p>
        </div>
      </motion.div>

      {/* Charts Section */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8"
        >
          {/* Traffic Trend Chart */}
          <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-[#8B5CF6]" />
                流量趋势
              </h3>
              <span className="text-xs text-white/40">近7天</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <defs>
                    <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorJumps" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" />
                  <XAxis dataKey="name" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A2E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Area type="monotone" dataKey="views" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorViews)" name="浏览量" />
                  <Area type="monotone" dataKey="jumps" stroke="#3B82F6" fillOpacity={1} fill="url(#colorJumps)" name="使用次数" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Tool Performance Bar Chart */}
          <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-bold flex items-center">
                <BarChart3 className="w-5 h-5 mr-2 text-[#8B5CF6]" />
                工具表现
              </h3>
              <span className="text-xs text-white/40">Top 5</span>
            </div>
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={toolStats} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" horizontal={false} />
                  <XAxis type="number" stroke="rgba(255,255,255,0.4)" fontSize={12} />
                  <YAxis dataKey="name" type="category" stroke="rgba(255,255,255,0.4)" fontSize={12} width={80} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1A1A2E',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      color: '#fff'
                    }}
                  />
                  <Bar dataKey="views" fill="#8B5CF6" name="浏览量" radius={[0, 4, 4, 0]} />
                  <Bar dataKey="jumps" fill="#3B82F6" name="使用次数" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </motion.div>
      )}

      {/* Quick Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-3 gap-4 mb-8"
      >
        <Link
          to="/promotion"
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl hover:border-orange-500/50 transition-colors"
        >
          <Megaphone className="w-5 h-5 text-orange-400" />
          <span className="font-medium">智能推广</span>
        </Link>
        <Link
          to="/promote"
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 border border-[#8B5CF6]/30 rounded-2xl hover:border-[#8B5CF6]/50 transition-colors"
        >
          <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
          <span className="font-medium">推广服务</span>
        </Link>
        <Link
          to="/promoter"
          className="flex items-center justify-center space-x-2 p-4 bg-gradient-to-r from-green-500/20 to-emerald-500/20 border border-green-500/30 rounded-2xl hover:border-green-500/50 transition-colors"
        >
          <Award className="w-5 h-5 text-green-400" />
          <span className="font-medium">成为推广者</span>
        </Link>
      </motion.div>

      {/* Tools List */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-lg font-bold mb-4">我的工具</h2>

        {tools.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A2E] border border-white/10 rounded-2xl">
            <Settings className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/60 mb-4">还没有提交任何工具</p>
            <Link
              to="/join"
              className="inline-block px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
            >
              立即入驻
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {tools.map((tool, index) => (
              <ToolRow key={tool.id} tool={tool} index={index} />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}

interface ToolRowProps {
  tool: Tool & { certificate?: Certificate };
  index: number;
}

function ToolRow({ tool, index }: ToolRowProps) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.05 }}
      className="flex items-center p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-[#8B5CF6]/30 transition-colors"
    >
      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 flex items-center justify-center flex-shrink-0 mr-4">
        {tool.icon_url ? (
          <img src={tool.icon_url} alt={tool.name} className="w-12 h-12 rounded-lg" />
        ) : (
          <Wrench className="w-8 h-8 text-[#8B5CF6]" />
        )}
      </div>
      
      <div className="flex-1 min-w-0">
        <div className="flex items-center space-x-2 mb-1">
          <h3 className="font-bold text-white">{tool.name}</h3>
          <StatusBadge status={tool.status || 'pending'} />
          {tool.certificate && (
            <span className="flex items-center text-xs text-[#8B5CF6]">
              <Award className="w-3 h-3 mr-1" />
              已确权
            </span>
          )}
        </div>
        <p className="text-white/60 text-sm line-clamp-1">{tool.description}</p>
        <div className="flex items-center space-x-4 mt-2 text-xs text-white/40">
          <span className="flex items-center">
            <Eye className="w-3 h-3 mr-1" />
            {tool.view_count || 0} 浏览
          </span>
          <span className="flex items-center">
            <ExternalLink className="w-3 h-3 mr-1" />
            {tool.jump_count || 0} 使用
          </span>
        </div>
      </div>

      <div className="flex items-center space-x-2 ml-4">
        <Link
          to={`/tool/${tool.id}`}
          className="px-3 py-2 bg-white/5 border border-white/10 rounded-lg text-sm hover:bg-white/10 transition-colors"
        >
          查看
        </Link>
        <Link
          to={`/tool/${tool.id}/manage`}
          className="px-3 py-2 bg-[#8B5CF6]/20 border border-[#8B5CF6]/30 text-[#8B5CF6] rounded-lg text-sm hover:bg-[#8B5CF6]/30 transition-colors"
        >
          管理
        </Link>
      </div>
    </motion.div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  const labels: Record<string, string> = {
    pending: '审核中',
    approved: '已通过',
    rejected: '未通过',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${styles[status] || styles.pending}`}>
      {labels[status] || '审核中'}
    </span>
  );
}
