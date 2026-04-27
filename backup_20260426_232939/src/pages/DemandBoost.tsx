import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Zap, Clock, TrendingUp, Eye, CheckCircle, AlertCircle, Crown, Rocket, Star } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Demand = Tables['demands']['Row'];

interface BoostOption {
  id: string;
  name: string;
  duration: number;
  price: number;
  features: string[];
  icon: React.ElementType;
  popular?: boolean;
}

const boostOptions: BoostOption[] = [
  {
    id: 'basic',
    name: '基础置顶',
    duration: 3,
    price: 29,
    features: ['置顶展示3天', '优先排序', '增加曝光量'],
    icon: Star,
  },
  {
    id: 'premium',
    name: '高级置顶',
    duration: 7,
    price: 59,
    features: ['置顶展示7天', '首页推荐位', '优先排序', '增加3倍曝光'],
    icon: Zap,
    popular: true,
  },
  {
    id: 'ultimate',
    name: '至尊置顶',
    duration: 15,
    price: 99,
    features: ['置顶展示15天', '首页Banner位', '精准推送', '增加10倍曝光', '专属客服'],
    icon: Crown,
  },
];

export function DemandBoost() {
  const { demandId } = useParams<{ demandId: string }>();
  const navigate = useNavigate();
  const [demand, setDemand] = useState<Demand | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedOption, setSelectedOption] = useState<string>('premium');
  const [submitting, setSubmitting] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);

  useEffect(() => {
    checkUser();
    if (demandId) {
      fetchDemand();
    }
  }, [demandId]);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setCurrentUser(user?.id || null);
  }

  async function fetchDemand() {
    try {
      const { data, error } = await supabase
        .from('demands')
        .select('*')
        .eq('id', demandId)
        .maybeSingle();

      if (error) throw error;
      setDemand(data);
    } catch (error) {
      console.error('Error fetching demand:', error);
    } finally {
      setLoading(false);
    }
  }

  async function handleBoost() {
    if (!currentUser || !demandId) {
      navigate('/profile');
      return;
    }

    const option = boostOptions.find(o => o.id === selectedOption);
    if (!option) return;

    setSubmitting(true);
    try {
      const { error } = await supabase
        .from('demand_boosts')
        .insert({
          demand_id: demandId,
          user_id: currentUser,
          boost_type: option.id,
          duration_days: option.duration,
          amount: option.price,
          status: 'pending'
        });

      if (error) throw error;

      alert('订单创建成功，请前往支付');
      navigate('/my-demands');
    } catch (error) {
      console.error('Error creating boost:', error);
      alert('创建订单失败，请重试');
    } finally {
      setSubmitting(false);
    }
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
          <button
            onClick={() => navigate('/my-demands')}
            className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
          >
            返回我的需求
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <button
            onClick={() => navigate(-1)}
            className="flex items-center text-white/60 hover:text-white mb-4 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 mr-2" />
            返回
          </button>
          <h1 className="text-3xl font-bold text-white mb-2">需求置顶服务</h1>
          <p className="text-white/60">提升需求曝光，更快找到合适的开发者</p>
        </motion.div>

        {/* Demand Info */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 mb-8"
        >
          <h3 className="text-white/60 text-sm mb-2">置顶需求</h3>
          <p className="text-white font-medium text-lg">{demand.title}</p>
          <div className="flex items-center gap-4 mt-3 text-sm text-white/50">
            <span className="flex items-center">
              <Eye className="w-4 h-4 mr-1" />
              {demand.view_count || 0} 浏览
            </span>
            <span className="flex items-center">
              <TrendingUp className="w-4 h-4 mr-1" />
              {demand.quote_count || 0} 报价
            </span>
          </div>
        </motion.div>

        {/* Boost Options */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid md:grid-cols-3 gap-4 mb-8"
        >
          {boostOptions.map((option) => {
            const Icon = option.icon;
            const isSelected = selectedOption === option.id;
            
            return (
              <motion.div
                key={option.id}
                onClick={() => setSelectedOption(option.id)}
                className={`relative bg-[#1A1A2E] border rounded-xl p-6 cursor-pointer transition-all ${
                  isSelected
                    ? 'border-[#8B5CF6] ring-2 ring-[#8B5CF6]/20'
                    : 'border-white/10 hover:border-white/30'
                }`}
              >
                {option.popular && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-full text-xs font-medium text-white">
                    最受欢迎
                  </div>
                )}
                
                <div className="text-center mb-6">
                  <div className={`w-14 h-14 mx-auto mb-4 rounded-xl flex items-center justify-center ${
                    isSelected ? 'bg-[#8B5CF6]/20' : 'bg-white/5'
                  }`}>
                    <Icon className={`w-7 h-7 ${isSelected ? 'text-[#8B5CF6]' : 'text-white/60'}`} />
                  </div>
                  <h3 className="text-lg font-bold text-white mb-1">{option.name}</h3>
                  <div className="flex items-baseline justify-center gap-1">
                    <span className="text-3xl font-bold text-[#8B5CF6]">¥{option.price}</span>
                    <span className="text-white/40">/{option.duration}天</span>
                  </div>
                </div>

                <ul className="space-y-3 mb-6">
                  {option.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center text-sm text-white/70">
                      <CheckCircle className="w-4 h-4 mr-2 text-green-400 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className={`w-full py-3 rounded-lg font-medium text-center transition-all ${
                  isSelected
                    ? 'bg-[#8B5CF6] text-white'
                    : 'bg-white/5 text-white/60'
                }`}>
                  {isSelected ? '已选择' : '选择'}
                </div>
              </motion.div>
            );
          })}
        </motion.div>

        {/* Benefits */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <Rocket className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            置顶优势
          </h3>
          <div className="grid md:grid-cols-3 gap-6">
            <div className="flex items-start">
              <div className="w-10 h-10 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                <Eye className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">更多曝光</h4>
                <p className="text-sm text-white/50">置顶需求获得更多浏览和报价</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                <Clock className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">更快对接</h4>
                <p className="text-sm text-white/50">优先展示，缩短寻找开发者时间</p>
              </div>
            </div>
            <div className="flex items-start">
              <div className="w-10 h-10 bg-[#8B5CF6]/20 rounded-lg flex items-center justify-center flex-shrink-0 mr-3">
                <TrendingUp className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <h4 className="font-medium text-white mb-1">优质报价</h4>
                <p className="text-sm text-white/50">更多开发者关注，选择更优</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Action */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col items-center"
        >
          <button
            onClick={handleBoost}
            disabled={submitting}
            className="w-full max-w-md py-4 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium text-lg hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
          >
            {submitting ? (
              <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>立即支付 ¥{boostOptions.find(o => o.id === selectedOption)?.price}</>
            )}
          </button>
          <p className="text-white/40 text-sm mt-4 text-center">
            支付成功后需求将立即置顶展示
          </p>
        </motion.div>
      </div>
    </div>
  );
}
