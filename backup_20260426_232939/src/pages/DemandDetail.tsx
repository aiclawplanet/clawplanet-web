import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Clock, DollarSign, User, Calendar, Eye, MessageSquare, Send, X, CheckCircle, AlertCircle, Phone, Mail, Loader2 } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Demand = Tables['demands']['Row'];
type Quote = Tables['quotes']['Row'];
type Profile = Tables['profiles']['Row'];

interface QuoteWithDeveloper extends Quote {
  developer?: Profile;
}

export function DemandDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [quotes, setQuotes] = useState<QuoteWithDeveloper[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [quoteForm, setQuoteForm] = useState({
    amount: '',
    period: '1_week',
    remark: '',
  });
  const [submitting, setSubmitting] = useState(false);
  const [hasQuoted, setHasQuoted] = useState(false);
  const [myQuote, setMyQuote] = useState<Quote | null>(null);

  useEffect(() => {
    checkUser();
    if (id) {
      fetchDemandDetail();
      incrementViewCount();
    }
  }, [id]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);

    if (user) {
      const { data: dev } = await supabase
        .from('developers')
        .select('id')
        .eq('user_id', user.id)
        .eq('status', 'approved')
        .maybeSingle();
      setIsDeveloper(!!dev);
    }
  }

  async function incrementViewCount() {
    if (!id) return;
    await supabase.rpc('increment_demand_view', { demand_id: id });
  }

  async function fetchDemandDetail() {
    setLoading(true);
    try {
      const { data: demandData, error: demandError } = await supabase
        .from('demands')
        .select(`
          *,
          user:profiles!user_id(*)
        `)
        .eq('id', id)
        .maybeSingle();

      if (demandError) throw demandError;
      setDemand(demandData);

      if (demandData?.status === 'approved') {
        const { data: quotesData } = await supabase
          .from('quotes')
          .select(`
            *,
            developer:profiles!developer_id(*)
          `)
          .eq('demand_id', id)
          .order('created_at', { ascending: false });

        setQuotes(quotesData || []);

        if (currentUser) {
          const myQuoteData = quotesData?.find(q => q.developer_id === currentUser);
          if (myQuoteData) {
            setHasQuoted(true);
            setMyQuote(myQuoteData);
          }
        }
      }
    } catch (error) {
      console.error('Error fetching demand:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmitQuote(e: React.FormEvent) {
    e.preventDefault();
    if (!currentUser || !id || !quoteForm.amount) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('quotes')
        .insert({
          demand_id: id,
          developer_id: currentUser,
          amount: parseFloat(quoteForm.amount),
          period: quoteForm.period,
          remark: quoteForm.remark,
          status: 'pending',
        });

      if (error) throw error;

      await supabase.rpc('increment_demand_quote_count', { demand_id: id });

      setShowQuoteModal(false);
      setHasQuoted(true);
      fetchDemandDetail();
    } catch (error) {
      console.error('Error submitting quote:', error);
      alert('提交报价失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  function getBudgetText() {
    if (!demand) return '';
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
    const typeMap: Record<string, string> = {
      'website': '网站开发',
      'app': 'APP开发',
      'design': 'UI/UX设计',
      'promotion': '推广运营',
      'content': '内容创作',
      'other': '其他服务',
    };
    return typeMap[type] || type;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!demand) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
        <div className="max-w-4xl mx-auto px-4 text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-white/30" />
          <h2 className="text-2xl font-bold text-white mb-2">需求不存在</h2>
          <p className="text-white/60 mb-6">该需求可能已被删除或尚未通过审核</p>
          <button
            onClick={() => navigate('/demands')}
            className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
          >
            返回需求大厅
          </button>
        </div>
      </div>
    );
  }

  const isOwner = currentUser === demand.user_id;
  const canQuote = isDeveloper && !isOwner && !hasQuoted && demand.status === 'approved';

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Back Button */}
        <motion.button
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/demands')}
          className="flex items-center text-white/60 hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回需求大厅
        </motion.button>

        {/* Demand Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl overflow-hidden mb-6"
        >
          {/* Header */}
          <div className="p-6 border-b border-white/10">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-sm rounded-full">
                  {getTypeName(demand.type)}
                </span>
                {demand.category && (
                  <span className="px-3 py-1 bg-white/10 text-white/70 text-sm rounded-full">
                    {demand.category}
                  </span>
                )}
              </div>
              <span className="text-white/40 text-sm">
                {new Date(demand.created_at).toLocaleDateString('zh-CN')}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white mb-4">{demand.title}</h1>
            <div className="flex flex-wrap items-center gap-6 text-white/60">
              <span className="flex items-center">
                <DollarSign className="w-4 h-4 mr-1 text-[#8B5CF6]" />
                {getBudgetText()}
              </span>
              <span className="flex items-center">
                <Clock className="w-4 h-4 mr-1 text-[#8B5CF6]" />
                {getPeriodText(demand.period)}
              </span>
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {demand.view_count || 0} 浏览
              </span>
              <span className="flex items-center">
                <MessageSquare className="w-4 h-4 mr-1" />
                {quotes.length} 报价
              </span>
            </div>
          </div>

          {/* Content */}
          <div className="p-6">
            <h3 className="text-lg font-semibold text-white mb-3">需求描述</h3>
            <p className="text-white/70 whitespace-pre-wrap mb-6">{demand.description}</p>

            {demand.images && demand.images.length > 0 && (
              <div className="mb-6">
                <h3 className="text-lg font-semibold text-white mb-3">相关图片</h3>
                <div className="grid grid-cols-3 gap-4">
                  {demand.images.map((image, index) => (
                    <img
                      key={index}
                      src={image}
                      alt={`需求图片 ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Contact Info */}
            {demand.contact_info && (
              <div className="bg-[#0F0F1A] rounded-xl p-4">
                <h3 className="text-sm font-medium text-white/60 mb-2">联系方式</h3>
                <p className="text-white">{demand.contact_info}</p>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="p-6 border-t border-white/10 bg-[#0F0F1A]/50">
            {isOwner ? (
              <div className="flex items-center justify-between">
                <span className="text-white/60">这是您发布的需求</span>
                <button
                  onClick={() => navigate('/my-demands')}
                  className="px-6 py-3 bg-[#1A1A2E] border border-white/20 text-white rounded-xl hover:bg-[#252542] transition-colors"
                >
                  管理我的需求
                </button>
              </div>
            ) : canQuote ? (
              <button
                onClick={() => setShowQuoteModal(true)}
                className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium hover:opacity-90 transition-opacity flex items-center justify-center"
              >
                <Send className="w-5 h-5 mr-2" />
                立即报价
              </button>
            ) : hasQuoted ? (
              <div className="flex items-center justify-between">
                <span className="text-white/60 flex items-center">
                  <CheckCircle className="w-5 h-5 mr-2 text-green-400" />
                  您已报价，等待需求方查看
                </span>
                <span className="text-[#8B5CF6] font-medium">
                  报价金额: ¥{myQuote?.amount}
                </span>
              </div>
            ) : !isDeveloper ? (
              <div className="text-center">
                <p className="text-white/60 mb-4">入驻成为开发者后即可报价</p>
                <button
                  onClick={() => navigate('/join')}
                  className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
                >
                  申请入驻
                </button>
              </div>
            ) : null}
          </div>
        </motion.div>

        {/* Quotes Section (Only visible to owner) */}
        {isOwner && quotes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
          >
            <h2 className="text-xl font-bold text-white mb-6">收到的报价 ({quotes.length})</h2>
            <div className="space-y-4">
              {quotes.map((quote) => (
                <div
                  key={quote.id}
                  className="bg-[#0F0F1A] rounded-xl p-4 border border-white/10"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-medium">
                        {quote.developer?.username?.[0]?.toUpperCase() || 'D'}
                      </div>
                      <div>
                        <p className="text-white font-medium">{quote.developer?.username || '开发者'}</p>
                        <p className="text-white/40 text-sm">
                          {new Date(quote.created_at).toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-[#8B5CF6]">¥{quote.amount.toLocaleString()}</p>
                      <p className="text-white/40 text-sm">{getPeriodText(quote.period)}</p>
                    </div>
                  </div>
                  {quote.remark && (
                    <p className="text-white/60 text-sm mb-3">{quote.remark}</p>
                  )}
                  <div className="flex items-center justify-between">
                    <span className={`px-3 py-1 rounded-full text-xs ${
                      quote.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      quote.status === 'viewed' ? 'bg-blue-500/20 text-blue-400' :
                      quote.status === 'connected' ? 'bg-green-500/20 text-green-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {quote.status === 'pending' ? '待查看' :
                       quote.status === 'viewed' ? '已查看' :
                       quote.status === 'connected' ? '已对接' : '已拒绝'}
                    </span>
                    {quote.status === 'pending' && (
                      <div className="flex space-x-2">
                        <button
                          onClick={async () => {
                            const { data: { user } } = await supabase.auth.getUser();
                            if (!user) {
                              navigate('/profile');
                              return;
                            }
                            const { data: conv } = await supabase
                              .from('chat_conversations')
                              .select('id')
                              .eq('demand_id', demand.id)
                              .eq('developer_id', quote.developer_id)
                              .maybeSingle();
                            if (conv) {
                              navigate(`/chat/${conv.id}`);
                            } else {
                              const { data: newConv } = await supabase
                                .from('chat_conversations')
                                .insert({
                                  demand_id: demand.id,
                                  user_id: user.id,
                                  developer_id: quote.developer_id,
                                  quote_id: quote.id
                                })
                                .select()
                                .single();
                              if (newConv) navigate(`/chat/${newConv.id}`);
                            }
                          }}
                          className="px-4 py-2 bg-[#8B5CF6] text-white rounded-lg text-sm hover:opacity-90"
                        >
                          联系开发者
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </div>

      {/* Quote Modal */}
      <AnimatePresence>
        {showQuoteModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl w-full max-w-lg p-6"
            >
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-white">提交报价</h2>
                <button
                  onClick={() => setShowQuoteModal(false)}
                  className="p-2 text-white/60 hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmitQuote} className="space-y-4">
                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    报价金额 (元) <span className="text-red-400">*</span>
                  </label>
                  <input
                    type="number"
                    value={quoteForm.amount}
                    onChange={(e) => setQuoteForm({ ...quoteForm, amount: e.target.value })}
                    placeholder="请输入您的报价"
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#8B5CF6]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    预计周期
                  </label>
                  <select
                    value={quoteForm.period}
                    onChange={(e) => setQuoteForm({ ...quoteForm, period: e.target.value })}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="1_week">1周内</option>
                    <option value="2_weeks">2周内</option>
                    <option value="1_month">1个月内</option>
                    <option value="2_months">2个月内</option>
                    <option value="negotiable">可协商</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm font-medium mb-2">
                    备注说明
                  </label>
                  <textarea
                    value={quoteForm.remark}
                    onChange={(e) => setQuoteForm({ ...quoteForm, remark: e.target.value })}
                    placeholder="简要说明您的优势、经验等（选填）"
                    rows={4}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#8B5CF6] resize-none"
                  />
                </div>

                <div className="bg-yellow-500/10 border border-yellow-500/30 rounded-lg p-4">
                  <p className="text-yellow-400 text-sm">
                    <AlertCircle className="w-4 h-4 inline mr-1" />
                    报价提交后不可修改，请确认信息准确
                  </p>
                </div>

                <div className="flex space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowQuoteModal(false)}
                    className="flex-1 py-3 bg-[#0F0F1A] border border-white/20 text-white rounded-xl font-medium hover:bg-[#252542] transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={submitting || !quoteForm.amount}
                    className="flex-1 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                  >
                    {submitting ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      '提交报价'
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
