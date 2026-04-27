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

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[60vh] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#1A1A2E] border border-white/10 flex items-center justify-center mb-6">
          <Sparkles className="w-10 h-10 text-[#F59E0B]" />
        </div>
        <h1 className="text-2xl font-bold mb-3">星推官中心</h1>
        <p className="text-white/60 mb-6 max-w-md">
          推广功能暂未开放，敬请期待
        </p>
        <div className="px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white/40 text-sm">
          暂未开放
        </div>
      </motion.div>
    </div>
  );
}
