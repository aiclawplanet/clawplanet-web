import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { DollarSign, MousePointer, TrendingUp, Wallet, ArrowUpRight, Calendar, BarChart3, PieChart } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Cell } from 'recharts';

type PromotionLink = Tables<'promotion_links'>;
type Tool = Tables<'tools'>;
type CommissionWithdrawal = Tables<'commission_withdrawals'>;

interface LinkWithTool extends PromotionLink {
  tool?: Tool;
}

interface ChartData {
  name: string;
  clicks: number;
  conversions: number;
  commission: number;
}

interface ToolDistribution {
  name: string;
  value: number;
}

const COLORS = ['#8B5CF6', '#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function PromoterStats() {
  const [links, setLinks] = useState<LinkWithTool[]>([]);
  const [withdrawals, setWithdrawals] = useState<CommissionWithdrawal[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<Tables<'profiles'> | null>(null);
  const [withdrawAmount, setWithdrawAmount] = useState('');
  const [showWithdrawForm, setShowWithdrawForm] = useState(false);
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [toolDistribution, setToolDistribution] = useState<ToolDistribution[]>([]);

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
      setLoading(false);
    }
  }

  async function fetchData(userId: string) {
    try {
      const { data: linksData } = await supabase
        .from('promotion_links')
        .select('*, tool:tool_id(*)')
        .eq('promoter_id', userId)
        .order('created_at', { ascending: false });

      const { data: withdrawalsData } = await supabase
        .from('commission_withdrawals')
        .select('*')
        .eq('promoter_id', userId)
        .order('created_at', { ascending: false });

      if (linksData) {
        setLinks(linksData);

        const last7Days = Array.from({ length: 7 }, (_, i) => {
          const date = new Date();
          date.setDate(date.getDate() - (6 - i));
          return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
        });

        const trendData = last7Days.map((date, index) => ({
          name: date,
          clicks: Math.floor(Math.random() * 100) + 20 + (index * 10),
          conversions: Math.floor(Math.random() * 30) + 5 + (index * 3),
          commission: Math.floor(Math.random() * 50) + 10 + (index * 5),
        }));
        setChartData(trendData);

        const toolMap = new Map<string, number>();
        linksData.forEach(link => {
          const toolName = link.tool?.name || '未知工具';
          toolMap.set(toolName, (toolMap.get(toolName) || 0) + (link.click_count || 0));
        });

        const distribution = Array.from(toolMap.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([name, value]) => ({ name, value }));
        setToolDistribution(distribution);
      }
      if (withdrawalsData) setWithdrawals(withdrawalsData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleWithdraw(e: React.FormEvent) {
    e.preventDefault();
    if (!user || !withdrawAmount) return;

    const amount = parseFloat(withdrawAmount);
    const totalCommission = links.reduce((sum, link) => sum + (link.commission_earned || 0), 0);
    const pendingWithdrawals = withdrawals
      .filter(w => w.status === 'pending')
      .reduce((sum, w) => sum + w.amount, 0);
    const availableBalance = totalCommission - pendingWithdrawals;

    if (amount > availableBalance) {
      alert('提现金额超过可用余额');
      return;
    }

    const { error } = await supabase.from('commission_withdrawals').insert({
      promoter_id: user.id,
      amount: amount,
      status: 'pending',
    });

    if (!error) {
      setShowWithdrawForm(false);
      setWithdrawAmount('');
      fetchData(user.id);
    }
  }

  const totalClicks = links.reduce((sum, link) => sum + (link.click_count || 0), 0);
  const totalConversions = links.reduce((sum, link) => sum + (link.conversion_count || 0), 0);
  const totalCommission = links.reduce((sum, link) => sum + (link.commission_earned || 0), 0);
  const pendingWithdrawals = withdrawals
    .filter(w => w.status === 'pending')
    .reduce((sum, w) => sum + w.amount, 0);
  const availableBalance = totalCommission - pendingWithdrawals;

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[50vh] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#1A1A2E] border border-white/10 flex items-center justify-center mb-6">
          <BarChart3 className="w-10 h-10 text-[#8B5CF6]" />
        </div>
        <h1 className="text-2xl font-bold mb-3">推广数据看板</h1>
        <p className="text-white/60 mb-6 max-w-md">
          推广数据统计功能暂未开放，敬请期待
        </p>
        <div className="px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white/40 text-sm">
          暂未开放
        </div>
      </motion.div>
    </div>
  );
}
