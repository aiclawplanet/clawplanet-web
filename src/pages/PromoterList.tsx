import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Users, Search, Filter, ChevronRight, Globe, Hash, Sparkles, Mail, TrendingUp, Award, UserCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Promoter = Tables<'promoters'>;
type Profile = Tables<'profiles'>;

interface PromoterWithProfile extends Promoter {
  profile?: Profile;
}

const platforms: Record<string, string> = {
  weibo: '微博',
  douyin: '抖音',
  bilibili: 'B站',
  xiaohongshu: '小红书',
  zhihu: '知乎',
  wechat: '微信公众号',
  twitter: 'Twitter/X',
  youtube: 'YouTube',
  other: '其他平台',
};

const categories: Record<string, string> = {
  tech: '科技数码',
  lifestyle: '生活方式',
  education: '教育学习',
  gaming: '游戏娱乐',
  business: '商业财经',
  design: '设计创意',
  productivity: '效率工具',
  other: '其他类型',
};

export function PromoterList() {
  const [promoters, setPromoters] = useState<PromoterWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPlatform, setSelectedPlatform] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [minFollowers, setMinFollowers] = useState('');

  useEffect(() => {
    fetchPromoters();
  }, []);

  async function fetchPromoters() {
    try {
      const { data } = await supabase
        .from('promoters')
        .select('*, profile:profiles(*)')
        .eq('status', 'active')
        .eq('is_public', true)
        .order('follower_count', { ascending: false });

      if (data) {
        setPromoters(data as PromoterWithProfile[]);
      }
    } catch (error) {
      console.error('Error fetching promoters:', error);
    } finally {
      setLoading(false);
    }
  }

  const filteredPromoters = promoters.filter((promoter) => {
    if (selectedPlatform && promoter.platform !== selectedPlatform) return false;
    if (selectedCategory && promoter.content_category !== selectedCategory) return false;
    if (minFollowers && (promoter.follower_count || 0) < parseInt(minFollowers)) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const username = promoter.profile?.username?.toLowerCase() || '';
      const platformUsername = promoter.platform_username?.toLowerCase() || '';
      const bio = promoter.bio?.toLowerCase() || '';
      if (!username.includes(query) && !platformUsername.includes(query) && !bio.includes(query)) {
        return false;
      }
    }
    return true;
  });

  function formatFollowerCount(count: number | null) {
    if (!count) return '0';
    if (count >= 10000) {
      return (count / 10000).toFixed(1) + '万';
    }
    return count.toString();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  return (
    <div className="pt-28 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">星推官广场</h1>
        <p className="text-white/60">发现优质博主，主动寻求合作推广</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 mb-8"
      >
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="搜索博主名称或简介..."
              className="w-full pl-10 pr-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
          <div className="relative">
            <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={selectedPlatform}
              onChange={(e) => setSelectedPlatform(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white appearance-none"
            >
              <option value="">所有平台</option>
              {Object.entries(platforms).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white appearance-none"
            >
              <option value="">所有类型</option>
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </div>
          <div className="relative">
            <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <input
              type="number"
              value={minFollowers}
              onChange={(e) => setMinFollowers(e.target.value)}
              placeholder="最低粉丝数"
              className="w-full pl-10 pr-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
        </div>
      </motion.div>

      {filteredPromoters.length === 0 ? (
        <div className="text-center py-16 bg-[#1A1A2E] border border-white/10 rounded-2xl">
          <UserCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h3 className="text-xl font-bold mb-2">暂无匹配的星推官</h3>
          <p className="text-white/60">尝试调整筛选条件或稍后再来</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredPromoters.map((promoter, index) => (
            <motion.div
              key={promoter.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 hover:border-[#8B5CF6]/30 transition-colors"
            >
              <div className="flex items-start space-x-4 mb-4">
                <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center flex-shrink-0">
                  {promoter.profile?.avatar_url ? (
                    <img
                      src={promoter.profile.avatar_url}
                      alt={promoter.profile.username || ''}
                      className="w-14 h-14 rounded-lg object-cover"
                    />
                  ) : (
                    <UserCircle className="w-10 h-10 text-[#8B5CF6]" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-bold text-white mb-1 truncate">
                    {promoter.profile?.username || '匿名用户'}
                  </h3>
                  <div className="flex items-center space-x-2 text-sm text-white/60">
                    <span className="flex items-center">
                      <Globe className="w-3 h-3 mr-1" />
                      {platforms[promoter.platform || ''] || promoter.platform}
                    </span>
                    <span>·</span>
                    <span className="flex items-center text-[#F59E0B]">
                      <Users className="w-3 h-3 mr-1" />
                      {formatFollowerCount(promoter.follower_count)}粉丝
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 mb-3">
                <span className="px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded text-xs">
                  {categories[promoter.content_category || ''] || promoter.content_category}
                </span>
                {promoter.total_earned && promoter.total_earned > 0 && (
                  <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded text-xs flex items-center">
                    <Award className="w-3 h-3 mr-1" />
                    已赚¥{promoter.total_earned.toFixed(0)}
                  </span>
                )}
              </div>

              {promoter.bio && (
                <p className="text-sm text-white/60 mb-4 line-clamp-2">{promoter.bio}</p>
              )}

              <div className="flex items-center justify-between pt-4 border-t border-white/10">
                <div className="text-sm text-white/40">
                  <span className="flex items-center">
                    <Hash className="w-3 h-3 mr-1" />
                    {promoter.platform_username}
                  </span>
                </div>
                {promoter.contact_info && (
                  <button
                    onClick={() => {
                      alert(`联系方式：${promoter.contact_info}`);
                    }}
                    className="flex items-center px-3 py-1.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-lg text-sm font-medium hover:opacity-90 transition-opacity"
                  >
                    <Mail className="w-4 h-4 mr-1" />
                    联系合作
                  </button>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
