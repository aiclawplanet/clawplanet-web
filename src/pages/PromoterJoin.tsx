import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Award, Check, Sparkles, TrendingUp, DollarSign, Users, ChevronRight, AlertCircle, Globe, UserCircle, Hash, FileText, Mail, Eye, EyeOff } from 'lucide-react';
import { supabase } from '../supabase/client';

const platforms = [
  { value: 'weibo', label: '微博' },
  { value: 'douyin', label: '抖音' },
  { value: 'bilibili', label: 'B站' },
  { value: 'xiaohongshu', label: '小红书' },
  { value: 'zhihu', label: '知乎' },
  { value: 'wechat', label: '微信公众号' },
  { value: 'twitter', label: 'Twitter/X' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'other', label: '其他平台' },
];

const categories = [
  { value: 'tech', label: '科技数码' },
  { value: 'lifestyle', label: '生活方式' },
  { value: 'education', label: '教育学习' },
  { value: 'gaming', label: '游戏娱乐' },
  { value: 'business', label: '商业财经' },
  { value: 'design', label: '设计创意' },
  { value: 'productivity', label: '效率工具' },
  { value: 'other', label: '其他类型' },
];

export function PromoterJoin() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [showContact, setShowContact] = useState(false);

  const [formData, setFormData] = useState({
    platform: '',
    platformUsername: '',
    followerCount: '',
    contentCategory: '',
    bio: '',
    contactInfo: '',
    isPublic: true,
  });

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      setLoading(false);
    }
    checkUser();
  }, []);

  async function handleJoin() {
    if (!agreedToTerms) {
      setError('请先同意推广协议');
      return;
    }

    if (!formData.platform || !formData.platformUsername || !formData.followerCount || !formData.contentCategory) {
      setError('请填写完整的身份信息');
      return;
    }

    setIsSubmitting(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        setError('请先登录');
        setIsSubmitting(false);
        return;
      }

      const { error: promoterError } = await supabase
        .from('promoters')
        .insert({
          user_id: user.id,
          commission_rate: 10.00,
          status: 'active',
          platform: formData.platform,
          platform_username: formData.platformUsername,
          follower_count: parseInt(formData.followerCount) || 0,
          content_category: formData.contentCategory,
          bio: formData.bio,
          contact_info: formData.contactInfo,
          is_public: formData.isPublic,
        });

      if (promoterError) {
        if (promoterError.message?.includes('duplicate')) {
          setError('你已经是星推官了');
          setIsSubmitting(false);
          return;
        }
        throw promoterError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({ role: 'promoter' })
        .eq('id', user.id);

      if (profileError) throw profileError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/promoter');
      }, 1500);
    } catch (err: any) {
      setError(err.message || '加入失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

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
              <Award className="w-12 h-12 text-white" />
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
            加入星推官计划，发现价值工具，分享优质内容
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
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/profile"
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          返回
        </Link>
        <h1 className="text-2xl font-bold">成为星推官</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col items-center justify-center min-h-[40vh] text-center"
      >
        <div className="w-20 h-20 rounded-full bg-[#1A1A2E] border border-white/10 flex items-center justify-center mb-6">
          <Award className="w-10 h-10 text-[#F59E0B]" />
        </div>
        <h2 className="text-2xl font-bold mb-3">星推官计划</h2>
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
  if (success) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">欢迎加入星推官！</h2>
          <p className="text-white/60 mb-6">
            你已成为星推官，可以开始推广工具赚取佣金了。
          </p>
          <Link
            to="/promoter"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-xl font-medium"
          >
            进入推广中心
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/profile"
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          返回
        </Link>
        <h1 className="text-2xl font-bold">成为星推官</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-[#F59E0B]/20 to-[#EF4444]/20 border border-[#F59E0B]/30 rounded-2xl p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">星推官计划</h2>
              <p className="text-white/60">推广优质工具，赚取丰厚佣金</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#F59E0B]">10%</div>
              <div className="text-sm text-white/60">基础佣金比例</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#EF4444]">实时</div>
              <div className="text-sm text-white/60">数据追踪</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8B5CF6]">随时</div>
              <div className="text-sm text-white/60">申请提现</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <UserCircle className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            身份信息登记
          </h3>
          <p className="text-sm text-white/60 mb-6">
            完善你的博主身份信息，让开发者更好地了解你，主动寻求合作机会
          </p>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-white/40" />
                主要推广平台
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white"
              >
                <option value="">请选择平台</option>
                {platforms.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Hash className="w-4 h-4 mr-2 text-white/40" />
                平台账号名称
              </label>
              <input
                type="text"
                value={formData.platformUsername}
                onChange={(e) => setFormData({ ...formData, platformUsername: e.target.value })}
                placeholder="例如：@科技博主小王"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2 text-white/40" />
                粉丝数量
              </label>
              <input
                type="number"
                value={formData.followerCount}
                onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                placeholder="例如：10000"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-white/40" />
                内容类型
              </label>
              <select
                value={formData.contentCategory}
                onChange={(e) => setFormData({ ...formData, contentCategory: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white"
              >
                <option value="">请选择类型</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-white/40" />
                个人简介
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="简单介绍你的内容风格和推广优势..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-white/40" />
                联系方式
              </label>
              <div className="relative">
                <input
                  type={showContact ? 'text' : 'password'}
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="微信/邮箱/电话，供开发者联系你"
                  className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none pr-12"
                />
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showContact ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-[#0F0F1A] rounded-xl">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-[#0F0F1A] text-[#8B5CF6] focus:ring-[#8B5CF6]"
              />
              <label htmlFor="isPublic" className="text-sm text-white/80 cursor-pointer flex-1">
                公开我的资料，允许开发者主动联系我合作
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-[#F59E0B]" />
            星推官权益
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <h4 className="font-medium">丰厚佣金</h4>
                <p className="text-sm text-white/60">每成功推广一个工具，获得10%佣金收益</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div>
                <h4 className="font-medium">实时数据</h4>
                <p className="text-sm text-white/60">查看点击量、转化量等详细推广数据</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <h4 className="font-medium">专属链接</h4>
                <p className="text-sm text-white/60">每个工具生成专属推广链接，追踪效果</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">推广协议</h3>
          <div className="space-y-3 text-sm text-white/70 max-h-48 overflow-y-auto pr-2">
            <p>1. 星推官应遵守国家法律法规，不得进行违法违规推广活动。</p>
            <p>2. 禁止使用虚假、误导性信息进行推广。</p>
            <p>3. 禁止通过刷单、作弊等不正当手段获取佣金。</p>
            <p>4. 佣金结算周期为T+7，满100元可申请提现。</p>
            <p>5. 虾蛋星球有权对违规行为进行处理，包括但不限于冻结账号、扣除佣金等。</p>
            <p>6. 本协议最终解释权归虾蛋星球所有。</p>
          </div>

          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center space-x-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-[#0F0F1A] text-[#F59E0B] focus:ring-[#F59E0B]"
            />
            <label htmlFor="agreeTerms" className="text-sm text-white/80 cursor-pointer">
              我已阅读并同意推广协议
            </label>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={isSubmitting || !agreedToTerms}
          className="w-full py-4 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? '处理中...' : '立即成为星推官'}
        </button>
      </motion.div>
    </div>
  );
  */

  if (success) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">欢迎加入星推官！</h2>
          <p className="text-white/60 mb-6">
            你已成为星推官，可以开始推广工具赚取佣金了。
          </p>
          <Link
            to="/promoter"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-xl font-medium"
          >
            进入推广中心
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <Link
          to="/profile"
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          返回
        </Link>
        <h1 className="text-2xl font-bold">成为星推官</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-gradient-to-r from-[#F59E0B]/20 to-[#EF4444]/20 border border-[#F59E0B]/30 rounded-2xl p-6">
          <div className="flex items-center space-x-4 mb-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#F59E0B] to-[#EF4444] flex items-center justify-center">
              <Award className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold">星推官计划</h2>
              <p className="text-white/60">推广优质工具，赚取丰厚佣金</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-4 mt-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-[#F59E0B]">10%</div>
              <div className="text-sm text-white/60">基础佣金比例</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#EF4444]">实时</div>
              <div className="text-sm text-white/60">数据追踪</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-[#8B5CF6]">随时</div>
              <div className="text-sm text-white/60">申请提现</div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <UserCircle className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            身份信息登记
          </h3>
          <p className="text-sm text-white/60 mb-6">
            完善你的博主身份信息，让开发者更好地了解你，主动寻求合作机会
          </p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Globe className="w-4 h-4 mr-2 text-white/40" />
                主要推广平台
              </label>
              <select
                value={formData.platform}
                onChange={(e) => setFormData({ ...formData, platform: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white"
              >
                <option value="">请选择平台</option>
                {platforms.map((p) => (
                  <option key={p.value} value={p.value}>{p.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Hash className="w-4 h-4 mr-2 text-white/40" />
                平台账号名称
              </label>
              <input
                type="text"
                value={formData.platformUsername}
                onChange={(e) => setFormData({ ...formData, platformUsername: e.target.value })}
                placeholder="例如：@科技博主小王"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Users className="w-4 h-4 mr-2 text-white/40" />
                粉丝数量
              </label>
              <input
                type="number"
                value={formData.followerCount}
                onChange={(e) => setFormData({ ...formData, followerCount: e.target.value })}
                placeholder="例如：10000"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Sparkles className="w-4 h-4 mr-2 text-white/40" />
                内容类型
              </label>
              <select
                value={formData.contentCategory}
                onChange={(e) => setFormData({ ...formData, contentCategory: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white"
              >
                <option value="">请选择类型</option>
                {categories.map((c) => (
                  <option key={c.value} value={c.value}>{c.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-white/40" />
                个人简介
              </label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                placeholder="简单介绍你的内容风格和推广优势..."
                rows={3}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Mail className="w-4 h-4 mr-2 text-white/40" />
                联系方式
              </label>
              <div className="relative">
                <input
                  type={showContact ? 'text' : 'password'}
                  value={formData.contactInfo}
                  onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
                  placeholder="微信/邮箱/电话，供开发者联系你"
                  className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none pr-12"
                />
                <button
                  onClick={() => setShowContact(!showContact)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
                >
                  {showContact ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <div className="flex items-center space-x-3 p-3 bg-[#0F0F1A] rounded-xl">
              <input
                type="checkbox"
                id="isPublic"
                checked={formData.isPublic}
                onChange={(e) => setFormData({ ...formData, isPublic: e.target.checked })}
                className="w-5 h-5 rounded border-white/20 bg-[#0F0F1A] text-[#8B5CF6] focus:ring-[#8B5CF6]"
              />
              <label htmlFor="isPublic" className="text-sm text-white/80 cursor-pointer flex-1">
                公开我的资料，允许开发者主动联系我合作
              </label>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Sparkles className="w-5 h-5 mr-2 text-[#F59E0B]" />
            星推官权益
          </h3>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#F59E0B]/20 flex items-center justify-center flex-shrink-0">
                <DollarSign className="w-4 h-4 text-[#F59E0B]" />
              </div>
              <div>
                <h4 className="font-medium">丰厚佣金</h4>
                <p className="text-sm text-white/60">每成功推广一个工具，获得10%佣金收益</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#EF4444]/20 flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-4 h-4 text-[#EF4444]" />
              </div>
              <div>
                <h4 className="font-medium">实时数据</h4>
                <p className="text-sm text-white/60">查看点击量、转化量等详细推广数据</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <div className="w-8 h-8 rounded-lg bg-[#8B5CF6]/20 flex items-center justify-center flex-shrink-0">
                <Users className="w-4 h-4 text-[#8B5CF6]" />
              </div>
              <div>
                <h4 className="font-medium">专属链接</h4>
                <p className="text-sm text-white/60">每个工具生成专属推广链接，追踪效果</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4">推广协议</h3>
          <div className="space-y-3 text-sm text-white/70 max-h-48 overflow-y-auto pr-2">
            <p>1. 星推官应遵守国家法律法规，不得进行违法违规推广活动。</p>
            <p>2. 禁止使用虚假、误导性信息进行推广。</p>
            <p>3. 禁止通过刷单、作弊等不正当手段获取佣金。</p>
            <p>4. 佣金结算周期为T+7，满100元可申请提现。</p>
            <p>5. 虾蛋星球有权对违规行为进行处理，包括但不限于冻结账号、扣除佣金等。</p>
            <p>6. 本协议最终解释权归虾蛋星球所有。</p>
          </div>
          
          {error && (
            <div className="mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center text-red-400 text-sm">
              <AlertCircle className="w-4 h-4 mr-2 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="mt-6 flex items-center space-x-3">
            <input
              type="checkbox"
              id="agreeTerms"
              checked={agreedToTerms}
              onChange={(e) => setAgreedToTerms(e.target.checked)}
              className="w-5 h-5 rounded border-white/20 bg-[#0F0F1A] text-[#F59E0B] focus:ring-[#F59E0B]"
            />
            <label htmlFor="agreeTerms" className="text-sm text-white/80 cursor-pointer">
              我已阅读并同意推广协议
            </label>
          </div>
        </div>

        <button
          onClick={handleJoin}
          disabled={isSubmitting || !agreedToTerms}
          className="w-full py-4 bg-gradient-to-r from-[#F59E0B] to-[#EF4444] rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {isSubmitting ? '处理中...' : '立即成为星推官'}
        </button>
      </motion.div>
    </div>
  );
}
