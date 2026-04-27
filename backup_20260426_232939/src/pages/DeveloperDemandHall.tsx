import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Filter, Clock, DollarSign, Eye, MessageSquare, CheckCircle, AlertCircle, Briefcase, Code, Palette, Megaphone, FileText, Wrench, Star, TrendingUp } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Demand = Tables['demands']['Row'];
type Profile = Tables['profiles']['Row'];

interface DemandWithUser extends Demand {
  user?: Profile;
  quote_count: number;
  hasQuoted?: boolean;
}

const demandTypes = [
  { id: 'all', name: '全部', icon: Briefcase },
  { id: 'website', name: '网站开发', icon: Code },
  { id: 'app', name: 'APP开发', icon: Code },
  { id: 'design', name: 'UI/UX设计', icon: Palette },
  { id: 'promotion', name: '推广运营', icon: Megaphone },
  { id: 'content', name: '内容创作', icon: FileText },
  { id: 'other', name: '其他服务', icon: Wrench },
];

const budgetRanges = [
  { id: 'all', name: '全部预算' },
  { id: 'under_500', name: '500元以下' },
  { id: '500_2000', name: '500-2000元' },
  { id: '2000_5000', name: '2000-5000元' },
  { id: '5000_10000', name: '5000-10000元' },
  { id: 'above_10000', name: '10000元以上' },
  { id: 'negotiable', name: '面议' },
];

const sortOptions = [
  { id: 'newest', name: '最新发布' },
  { id: 'budget_high', name: '预算从高到低' },
  { id: 'budget_low', name: '预算从低到高' },
  { id: 'quotes', name: '报价数最少' },
];

export function DeveloperDemandHall() {
  const navigate = useNavigate();
  const [demands, setDemands] = useState<DemandWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [developerStatus, setDeveloperStatus] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState('all');
  const [selectedBudget, setSelectedBudget] = useState('all');
  const [sortBy, setSortBy] = useState('newest');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [stats, setStats] = useState({
    totalDemands: 0,
    myQuotes: 0,
    successRate: 0,
  });

  useEffect(() => {
    checkUserAndDeveloper();
    fetchDemands();
  }, [selectedType, selectedBudget, sortBy]);

  async function checkUserAndDeveloper() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);

    if (user) {
      const { data: dev } = await supabase
        .from('developers')
        .select('id, status')
        .eq('user_id', user.id)
        .maybeSingle();

      if (dev) {
        setIsDeveloper(true);
        setDeveloperStatus(dev.status);
        fetchStats(user.id);
      }
    }
  }

  async function fetchStats(userId: string) {
    const { data: quotes } = await supabase
      .from('quotes')
      .select('status')
      .eq('developer_id', userId);

    const connected = quotes?.filter(q => q.status === 'connected').length || 0;
    const total = quotes?.length || 0;

    setStats({
      totalDemands: demands.length,
      myQuotes: total,
      successRate: total > 0 ? Math.round((connected / total) * 100) : 0,
    });
  }

  async function fetchDemands() {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      let query = supabase
        .from('demands')
        .select(`
          *,
          user:profiles!user_id(*),
          quotes:quotes(count)
        `)
        .eq('status', 'approved')
        .order('created_at', { ascending: sortBy === 'budget_low' });

      if (selectedType !== 'all') {
        query = query.eq('type', selectedType);
      }

      if (selectedBudget !== 'all') {
        query = query.eq('budget_type', selectedBudget);
      }

      if (sortBy === 'budget_high') {
        query = query.order('budget_max', { ascending: false });
      } else if (sortBy === 'budget_low') {
        query = query.order('budget_min', { ascending: true });
      }

      const { data, error } = await query;

      if (error) throw error;

      let demandsWithCount = (data || []).map(d => ({
        ...d,
        quote_count: Array.isArray(d.quotes) ? d.quotes.length : 0,
        hasQuoted: false
      }));

      if (user) {
        const { data: myQuotes } = await supabase
          .from('quotes')
          .select('demand_id')
          .eq('developer_id', user.id);

        const quotedDemandIds = new Set(myQuotes?.map(q => q.demand_id) || []);
        demandsWithCount = demandsWithCount.map(d => ({
          ...d,
          hasQuoted: quotedDemandIds.has(d.id)
        }));
      }

      setDemands(demandsWithCount);
    } catch (error) {
      console.error('Error fetching demands:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredDemands = demands.filter(demand => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      demand.title.toLowerCase().includes(query) ||
      demand.description.toLowerCase().includes(query) ||
      demand.category?.toLowerCase().includes(query)
    );
  });

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

  function getTypeName(type: string) {
    return demandTypes.find(t => t.id === type)?.name || type;
  }

  if (!isDeveloper) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A2E] rounded-full flex items-center justify-center">
            <Briefcase className="w-10 h-10 text-white/30" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">开发者专属区域</h2>
          <p className="text-white/60 mb-8">入驻成为开发者后，即可查看需求大厅并报价接单</p>
          <button
            onClick={() => navigate('/join')}
            className="px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            申请入驻
          </button>
        </div>
      </div>
    );
  }

  if (developerStatus !== 'approved') {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-yellow-500/20 rounded-full flex items-center justify-center">
            <Clock className="w-10 h-10 text-yellow-400" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-4">审核中</h2>
          <p className="text-white/60 mb-8">您的开发者申请正在审核中，通过后即可查看需求大厅</p>
          <button
            onClick={() => navigate('/dashboard')}
            className="px-6 py-3 bg-[#1A1A2E] border border-white/20 text-white rounded-xl font-medium"
          >
            查看申请状态
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header with Stats */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-3xl font-bold text-white mb-2">开发者需求大厅</h1>
              <p className="text-white/60">发现优质项目，展示您的专业能力</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="bg-[#1A1A2E] border border-white/10 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-[#8B5CF6]">{stats.myQuotes}</div>
                <div className="text-white/40 text-sm">我的报价</div>
              </div>
              <div className="bg-[#1A1A2E] border border-white/10 rounded-xl px-6 py-3">
                <div className="text-2xl font-bold text-green-400">{stats.successRate}%</div>
                <div className="text-white/40 text-sm">成功率</div>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative mb-6">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索需求标题、描述..."
              className="w-full pl-12 pr-4 py-4 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#8B5CF6] transition-colors"
            />
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <span className="text-white/60 text-sm">需求类型:</span>
              <div className="flex flex-wrap gap-2">
                {demandTypes.map(type => (
                  <button
                    key={type.id}
                    onClick={() => setSelectedType(type.id)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                      selectedType === type.id
                        ? 'bg-[#8B5CF6] text-white'
                        : 'bg-[#1A1A2E] text-white/70 hover:bg-[#252542]'
                    }`}
                  >
                    {type.name}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-white/60 text-sm">预算:</span>
              <select
                value={selectedBudget}
                onChange={(e) => setSelectedBudget(e.target.value)}
                className="px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
              >
                {budgetRanges.map(range => (
                  <option key={range.id} value={range.id}>{range.name}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center space-x-2">
              <span className="text-white/60 text-sm">排序:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
              >
                {sortOptions.map(option => (
                  <option key={option.id} value={option.id}>{option.name}</option>
                ))}
              </select>
            </div>
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
              <Search className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">暂无匹配需求</h3>
            <p className="text-white/60">试试调整筛选条件</p>
          </motion.div>
        ) : (
          <div className="grid gap-4">
            {filteredDemands.map((demand, index) => (
              <motion.div
                key={demand.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => navigate(`/demand/${demand.id}`)}
                className={`bg-[#1A1A2E] border rounded-xl p-6 cursor-pointer transition-all group ${
                  demand.hasQuoted
                    ? 'border-green-500/30 hover:border-green-500/50'
                    : 'border-white/10 hover:border-[#8B5CF6]/50'
                }`}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <span className="px-3 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded-full">
                        {getTypeName(demand.type)}
                      </span>
                      {demand.category && (
                        <span className="px-3 py-1 bg-white/10 text-white/70 text-xs rounded-full">
                          {demand.category}
                        </span>
                      )}
                      {demand.hasQuoted && (
                        <span className="px-3 py-1 bg-green-500/20 text-green-400 text-xs rounded-full flex items-center">
                          <CheckCircle className="w-3 h-3 mr-1" />
                          已报价
                        </span>
                      )}
                    </div>
                    <h3 className="text-lg font-semibold text-white group-hover:text-[#8B5CF6] transition-colors mb-2">
                      {demand.title}
                    </h3>
                    <p className="text-white/60 text-sm line-clamp-2 mb-4">
                      {demand.description}
                    </p>
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
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {demand.user?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <span className="text-white/70 text-sm">{demand.user?.username || '匿名用户'}</span>
                    </div>
                    <span className="text-white/40 text-sm">
                      {new Date(demand.created_at).toLocaleDateString('zh-CN')}
                    </span>
                  </div>
                  <div className="flex items-center space-x-4 text-white/40 text-sm">
                    <span className="flex items-center">
                      <Eye className="w-4 h-4 mr-1" />
                      {demand.view_count || 0}
                    </span>
                    <span className="flex items-center">
                      <MessageSquare className="w-4 h-4 mr-1" />
                      {demand.quote_count}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
