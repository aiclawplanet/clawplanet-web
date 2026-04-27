import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Star, Award, TrendingUp, Clock, CheckCircle, MessageSquare, ThumbsUp, Shield, Target, Zap } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Profile = Tables['profiles']['Row'];
type Review = Tables['reviews']['Row'];

interface ReviewWithUser extends Review {
  reviewer?: Profile;
}

interface ReputationData {
  level: number;
  score: number;
  total_orders: number;
  completed_orders: number;
  rating: number;
  response_rate: number;
  on_time_rate: number;
}

const levelConfig = [
  { level: 1, name: '新手开发者', color: 'bg-gray-500', icon: Target },
  { level: 2, name: '初级开发者', color: 'bg-green-500', icon: Zap },
  { level: 3, name: '中级开发者', color: 'bg-blue-500', icon: Star },
  { level: 4, name: '高级开发者', color: 'bg-purple-500', icon: Award },
  { level: 5, name: '专家开发者', color: 'bg-yellow-500', icon: Shield },
];

export function DeveloperReputation() {
  const { developerId } = useParams<{ developerId: string }>();
  const navigate = useNavigate();
  const [developer, setDeveloper] = useState<Profile | null>(null);
  const [reputation, setReputation] = useState<ReputationData | null>(null);
  const [reviews, setReviews] = useState<ReviewWithUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'all' | 'positive' | 'negative'>('all');

  useEffect(() => {
    if (developerId) {
      fetchDeveloperData();
    }
  }, [developerId]);

  async function fetchDeveloperData() {
    setLoading(true);
    try {
      const { data: dev } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', developerId)
        .maybeSingle();

      if (dev) setDeveloper(dev);

      const { data: rep } = await supabase
        .from('developer_reputation')
        .select('*')
        .eq('developer_id', developerId)
        .maybeSingle();

      if (rep) {
        setReputation(rep as ReputationData);
      } else {
        setReputation({
          level: 1,
          score: 100,
          total_orders: 0,
          completed_orders: 0,
          rating: 5.0,
          response_rate: 100,
          on_time_rate: 100,
        });
      }

      const { data: reviewsData } = await supabase
        .from('reviews')
        .select(`
          *,
          reviewer:reviewer_id(*)
        `)
        .eq('developer_id', developerId)
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      setReviews(reviewsData || []);
    } catch (error) {
      console.error('Error fetching developer data:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredReviews = reviews.filter(review => {
    if (activeTab === 'all') return true;
    if (activeTab === 'positive') return review.rating >= 4;
    return review.rating <= 2;
  });

  const levelInfo = levelConfig[reputation?.level - 1 || 0];
  const LevelIcon = levelInfo?.icon || Target;

  function renderStars(rating: number) {
    return (
      <div className="flex items-center gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <Star
            key={star}
            className={`w-4 h-4 ${
              star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-white/20'
            }`}
          />
        ))}
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
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
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 mb-8"
        >
          <div className="flex items-center mb-6">
            <div className="w-20 h-20 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {developer?.username?.[0]?.toUpperCase() || 'D'}
            </div>
            <div className="ml-4 flex-1">
              <h1 className="text-2xl font-bold text-white mb-1">{developer?.username || '开发者'}</h1>
              <div className="flex items-center gap-3">
                <span className={`px-3 py-1 ${levelInfo?.color || 'bg-gray-500'} rounded-full text-xs font-medium text-white flex items-center`}>
                  <LevelIcon className="w-3 h-3 mr-1" />
                  {levelInfo?.name || '新手开发者'}
                </span>
                {renderStars(reputation?.rating || 5)}
                <span className="text-white/60 text-sm">{reputation?.rating || 5.0}分</span>
              </div>
            </div>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-[#0F0F1A] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-white">{reputation?.total_orders || 0}</p>
              <p className="text-xs text-white/50">总接单</p>
            </div>
            <div className="bg-[#0F0F1A] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-green-400">{reputation?.completed_orders || 0}</p>
              <p className="text-xs text-white/50">已完成</p>
            </div>
            <div className="bg-[#0F0F1A] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-[#8B5CF6]">{reputation?.response_rate || 100}%</p>
              <p className="text-xs text-white/50">响应率</p>
            </div>
            <div className="bg-[#0F0F1A] rounded-xl p-4 text-center">
              <p className="text-2xl font-bold text-blue-400">{reputation?.on_time_rate || 100}%</p>
              <p className="text-xs text-white/50">准时率</p>
            </div>
          </div>
        </motion.div>

        {/* Level Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 mb-8"
        >
          <h3 className="text-lg font-bold text-white mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            等级进度
          </h3>
          <div className="relative">
            <div className="h-2 bg-white/10 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] rounded-full transition-all"
                style={{ width: `${Math.min((reputation?.score || 0) / 500 * 100, 100)}%` }}
              />
            </div>
            <div className="flex justify-between mt-2 text-xs text-white/50">
              <span>Lv.{reputation?.level || 1}</span>
              <span>{reputation?.score || 0}/500 经验值</span>
              <span>Lv.{(reputation?.level || 1) + 1}</span>
            </div>
          </div>
          <div className="mt-4 text-sm text-white/60">
            <p>完成订单、获得好评可提升等级</p>
          </div>
        </motion.div>

        {/* Reviews */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-bold text-white flex items-center">
              <MessageSquare className="w-5 h-5 mr-2 text-[#8B5CF6]" />
              历史评价
              <span className="ml-2 text-sm text-white/40">({reviews.length})</span>
            </h3>
            <div className="flex space-x-2">
              {[
                { id: 'all', label: '全部' },
                { id: 'positive', label: '好评' },
                { id: 'negative', label: '差评' },
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-[#1A1A2E] text-white/60 hover:bg-[#252542]'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {filteredReviews.length === 0 ? (
            <div className="text-center py-12 bg-[#1A1A2E] border border-white/10 rounded-xl">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 text-white/20" />
              <p className="text-white/60">暂无评价</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredReviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-sm font-medium">
                        {review.reviewer?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      <div className="ml-3">
                        <p className="text-white font-medium">{review.reviewer?.username || '用户'}</p>
                        <p className="text-xs text-white/40">
                          {new Date(review.created_at || '').toLocaleDateString('zh-CN')}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center">
                      {renderStars(review.rating)}
                    </div>
                  </div>
                  {review.content && (
                    <p className="text-white/70 text-sm">{review.content}</p>
                  )}
                  {review.tags && review.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-3">
                      {review.tags.map((tag, idx) => (
                        <span key={idx} className="px-2 py-1 bg-white/10 rounded text-xs text-white/60">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
