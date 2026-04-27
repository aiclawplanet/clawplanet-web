import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { MessageSquare, Clock, ChevronRight, Search, Filter, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Conversation = Tables['chat_conversations']['Row'];
type Profile = Tables['profiles']['Row'];
type Demand = Tables['demands']['Row'];
type Message = Tables['chat_messages']['Row'];

interface ConversationWithDetails extends Conversation {
  demand?: Demand;
  user?: Profile;
  developer?: Profile;
  last_message?: Message;
  unread_count?: number;
}

export function ChatList() {
  const navigate = useNavigate();
  const [conversations, setConversations] = useState<ConversationWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    checkUser();
  }, []);

  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      subscribeToUpdates();
    }
  }, [currentUser]);

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

  async function fetchConversations() {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          demand:demand_id(*),
          user:user_id(*),
          developer:developer_id(*)
        `)
        .or(`user_id.eq.${currentUser},developer_id.eq.${currentUser}`)
        .order('last_message_at', { ascending: false });

      if (error) throw error;

      const conversationsWithDetails = await Promise.all(
        (data || []).map(async (conv) => {
          const { data: lastMsg } = await supabase
            .from('chat_messages')
            .select('*')
            .eq('conversation_id', conv.id)
            .order('created_at', { ascending: false })
            .limit(1)
            .maybeSingle();

          const { count: unreadCount } = await supabase
            .from('chat_messages')
            .select('*', { count: 'exact' })
            .eq('conversation_id', conv.id)
            .eq('is_read', false)
            .neq('sender_id', currentUser);

          return {
            ...conv,
            last_message: lastMsg,
            unread_count: unreadCount || 0
          };
        })
      );

      setConversations(conversationsWithDetails);
    } catch (error) {
      console.error('Error fetching conversations:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToUpdates() {
    const channel = supabase
      .channel('chat_updates')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'chat_messages'
        },
        () => {
          fetchConversations();
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  function formatTime(date: string) {
    const d = new Date(date);
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    
    if (diff < 60000) return '刚刚';
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
    return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
  }

  const filteredConversations = conversations.filter(conv => {
    if (!searchQuery) return true;
    const otherParty = isDeveloper ? conv.user : conv.developer;
    return otherParty?.username?.toLowerCase().includes(searchQuery.toLowerCase()) ||
           conv.demand?.title?.toLowerCase().includes(searchQuery.toLowerCase());
  });

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-20 pb-24">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl font-bold text-white mb-2">消息中心</h1>
          <p className="text-white/60">与需求方/开发者在线沟通</p>
        </motion.div>

        {/* Search */}
        <div className="relative mb-6">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="搜索对话..."
            className="w-full pl-12 pr-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#8B5CF6]"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/50" />
        </div>

        {/* Conversations List */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredConversations.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-20"
          >
            <div className="w-20 h-20 mx-auto mb-6 bg-[#1A1A2E] rounded-full flex items-center justify-center">
              <MessageSquare className="w-10 h-10 text-white/30" />
            </div>
            <h3 className="text-xl font-semibold text-white mb-2">暂无对话</h3>
            <p className="text-white/60 mb-6">
              {isDeveloper 
                ? '在需求大厅报价后，可与需求方开始沟通' 
                : '发布需求后，可与报价的开发者沟通'}
            </p>
            <button
              onClick={() => navigate(isDeveloper ? '/developer/demands' : '/demands')}
              className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#7C3AED] text-white rounded-xl font-medium"
            >
              {isDeveloper ? '浏览需求大厅' : '发布需求'}
            </button>
          </motion.div>
        ) : (
          <div className="space-y-2">
            {filteredConversations.map((conv, index) => {
              const otherParty = isDeveloper ? conv.user : conv.developer;
              
              return (
                <motion.div
                  key={conv.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => navigate(`/chat/${conv.id}`)}
                  className="bg-[#1A1A2E] border border-white/10 rounded-xl p-4 cursor-pointer hover:border-[#8B5CF6]/50 transition-all"
                >
                  <div className="flex items-center">
                    <div className="relative">
                      <div className="w-12 h-12 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-medium">
                        {otherParty?.username?.[0]?.toUpperCase() || 'U'}
                      </div>
                      {conv.unread_count > 0 && (
                        <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-xs flex items-center justify-center">
                          {conv.unread_count > 9 ? '9+' : conv.unread_count}
                        </span>
                      )}
                    </div>
                    <div className="flex-1 ml-4 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h3 className="font-medium text-white truncate">
                          {otherParty?.username || '用户'}
                        </h3>
                        <span className="text-xs text-white/40">
                          {formatTime(conv.last_message_at || conv.created_at)}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 truncate">
                        {conv.last_message?.content || '暂无消息'}
                      </p>
                      <p className="text-xs text-[#8B5CF6] mt-1 truncate">
                        {conv.demand?.title}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5 text-white/30 ml-2" />
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
