import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageCircle, TrendingUp, Clock, ChevronRight, User, Users, Hash, ThumbsUp, MessageSquare } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Comment = Tables<'comments'>;
type Tool = Tables<'tools'>;
type Profile = Tables<'profiles'>;

interface CommentWithTool extends Comment {
  tool?: Tool;
  user?: Profile;
}

const hotTopics = [
  { id: 1, name: '效率工具推荐', count: 128 },
  { id: 2, name: '独立开发故事', count: 86 },
  { id: 3, name: '使用心得分享', count: 64 },
  { id: 4, name: '功能建议', count: 42 },
];

export function CommunityPage() {
  const [hotComments, setHotComments] = useState<CommentWithTool[]>([]);
  const [recentComments, setRecentComments] = useState<CommentWithTool[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'hot' | 'recent'>('hot');
  const [activeTopic, setActiveTopic] = useState<number | null>(null);

  useEffect(() => {
    fetchComments();
  }, []);

  async function fetchComments() {
    try {
      const { data: commentsData } = await supabase
        .from('comments')
        .select('*, tool:tool_id(*), user:user_id(*)')
        .order('likes_count', { ascending: false })
        .limit(20);

      if (commentsData) {
        setHotComments(commentsData);
      }

      const { data: recentData } = await supabase
        .from('comments')
        .select('*, tool:tool_id(*), user:user_id(*)')
        .order('created_at', { ascending: false })
        .limit(20);

      if (recentData) {
        setRecentComments(recentData);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
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

  const displayComments = activeTab === 'hot' ? hotComments : recentComments;

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-3xl font-bold mb-2">社区讨论</h1>
        <p className="text-white/60">发现用户对工具的真实反馈和使用心得</p>
      </motion.div>

      {/* Hot Topics */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-8"
      >
        <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center">
          <Hash className="w-4 h-4 mr-2" />
          热门话题
        </h2>
        <div className="flex flex-wrap gap-2">
          {hotTopics.map((topic) => (
            <button
              key={topic.id}
              onClick={() => setActiveTopic(activeTopic === topic.id ? null : topic.id)}
              className={`flex items-center px-4 py-2 rounded-full text-sm transition-colors ${
                activeTopic === topic.id
                  ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                  : 'bg-[#1A1A2E] border border-white/10 text-white/70 hover:border-[#8B5CF6]/50'
              }`}
            >
              <MessageSquare className="w-3 h-3 mr-2" />
              {topic.name}
              <span className="ml-2 text-xs text-white/40">{topic.count}</span>
            </button>
          ))}
        </div>
      </motion.div>

      <div className="flex space-x-4 mb-8">
        <button
          onClick={() => setActiveTab('hot')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'hot'
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
              : 'bg-[#1A1A2E] border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          <TrendingUp className="w-5 h-5" />
          <span>热门反馈</span>
        </button>
        <button
          onClick={() => setActiveTab('recent')}
          className={`flex items-center space-x-2 px-6 py-3 rounded-xl font-medium transition-colors ${
            activeTab === 'recent'
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
              : 'bg-[#1A1A2E] border border-white/10 text-white/60 hover:text-white'
          }`}
        >
          <Clock className="w-5 h-5" />
          <span>最新反馈</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {displayComments.map((comment, index) => (
          <motion.div
            key={comment.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
          >
            <Link
              to={`/tool/${comment.tool_id}`}
              className="block bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 hover:border-[#8B5CF6]/50 transition-colors"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/30 flex items-center justify-center flex-shrink-0">
                  {comment.user?.avatar_url ? (
                    <img
                      src={comment.user.avatar_url}
                      alt={comment.user.username || ''}
                      className="w-12 h-12 rounded-full"
                    />
                  ) : (
                    <User className="w-6 h-6 text-white/60" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="font-medium text-white/90">
                      {comment.user?.username || '匿名用户'}
                    </span>
                    <span className="text-xs text-white/40">
                      {new Date(comment.created_at || '').toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-white/70 mb-4 line-clamp-3">{comment.content}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="flex items-center space-x-2 text-sm text-white/60">
                        <MessageCircle className="w-4 h-4" />
                        <span>评论于</span>
                        <span className="text-[#8B5CF6]">{comment.tool?.name}</span>
                      </div>
                      <button className="flex items-center space-x-1 text-sm text-white/40 hover:text-[#8B5CF6] transition-colors">
                        <ThumbsUp className="w-4 h-4" />
                        <span>{comment.likes_count || 0}</span>
                      </button>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/40" />
                  </div>
                </div>
              </div>
            </Link>
          </motion.div>
        ))}
      </div>

      {displayComments.length === 0 && (
        <div className="text-center py-20">
          <MessageCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <p className="text-white/60 text-lg">暂无评论</p>
          <p className="text-white/40 mt-2">去工具详情页发表第一条评论吧</p>
        </div>
      )}
    </div>
  );
}
