import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Send, Paperclip, Smile, MoreVertical, Phone, Mail, Check, CheckCheck, Loader2, AlertCircle } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Message = Tables['chat_messages']['Row'];
type Conversation = Tables['chat_conversations']['Row'];
type Profile = Tables['profiles']['Row'];
type Demand = Tables['demands']['Row'];

interface MessageWithSender extends Message {
  sender?: Profile;
}

interface ConversationWithDetails extends Conversation {
  demand?: Demand;
  user?: Profile;
  developer?: Profile;
}

export function ChatPage() {
  const { conversationId } = useParams<{ conversationId: string }>();
  const navigate = useNavigate();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [conversation, setConversation] = useState<ConversationWithDetails | null>(null);
  const [messages, setMessages] = useState<MessageWithSender[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<string | null>(null);
  const [isDeveloper, setIsDeveloper] = useState(false);

  useEffect(() => {
    checkUser();
    if (conversationId) {
      fetchConversation();
      fetchMessages();
      subscribeToMessages();
    }
  }, [conversationId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  async function fetchConversation() {
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select(`
          *,
          demand:demand_id(*),
          user:user_id(*),
          developer:developer_id(*)
        `)
        .eq('id', conversationId)
        .maybeSingle();

      if (error) throw error;
      setConversation(data);
    } catch (error) {
      console.error('Error fetching conversation:', error);
    }
  }

  async function fetchMessages() {
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          sender:sender_id(*)
        `)
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages(data || []);
      markMessagesAsRead();
    } catch (error) {
      console.error('Error fetching messages:', error);
    } finally {
      setLoading(false);
    }
  }

  function subscribeToMessages() {
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'chat_messages',
          filter: `conversation_id=eq.${conversationId}`
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          const { data: sender } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', newMsg.sender_id)
            .single();
          
          setMessages(prev => [...prev, { ...newMsg, sender }]);
          
          if (newMsg.sender_id !== currentUser) {
            markMessagesAsRead();
          }
        }
      )
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  }

  async function markMessagesAsRead() {
    if (!currentUser || !conversationId) return;
    
    await supabase
      .from('chat_messages')
      .update({ is_read: true, read_at: new Date().toISOString() })
      .eq('conversation_id', conversationId)
      .neq('sender_id', currentUser)
      .eq('is_read', false);
  }

  async function handleSendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || !conversationId) return;

    setSending(true);
    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          conversation_id: conversationId,
          sender_id: currentUser,
          content: newMessage.trim(),
          message_type: 'text'
        });

      if (error) throw error;

      await supabase
        .from('chat_conversations')
        .update({ last_message_at: new Date().toISOString() })
        .eq('id', conversationId);

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
      alert('发送失败，请重试');
    } finally {
      setSending(false);
    }
  }

  function scrollToBottom() {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }

  function formatTime(date: string) {
    return new Date(date).toLocaleTimeString('zh-CN', { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  }

  function formatDate(date: string) {
    const d = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (d.toDateString() === today.toDateString()) {
      return '今天';
    } else if (d.toDateString() === yesterday.toDateString()) {
      return '昨天';
    } else {
      return d.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
    }
  }

  const otherParty = isDeveloper ? conversation?.user : conversation?.developer;
  const demand = conversation?.demand;

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0F0F1A] pt-20 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-[#8B5CF6] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0F0F1A] pt-16 pb-0">
      {/* Header */}
      <div className="fixed top-16 left-0 right-0 z-40 bg-[#1A1A2E]/95 backdrop-blur-md border-b border-white/10">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 text-white/60 hover:text-white mr-2"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center">
              <div className="w-10 h-10 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white font-medium">
                {otherParty?.username?.[0]?.toUpperCase() || 'U'}
              </div>
              <div className="ml-3">
                <h2 className="font-medium text-white">{otherParty?.username || '用户'}</h2>
                <p className="text-xs text-white/50">
                  {isDeveloper ? '需求方' : '开发者'} · {demand?.title?.slice(0, 15)}...
                </p>
              </div>
            </div>
          </div>
          <button className="p-2 text-white/60 hover:text-white">
            <MoreVertical className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="max-w-6xl mx-auto px-4 pt-32 pb-24">
        {messages.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-4 bg-[#1A1A2E] rounded-full flex items-center justify-center">
              <Send className="w-8 h-8 text-white/30" />
            </div>
            <p className="text-white/50">开始聊天吧</p>
            <p className="text-white/30 text-sm mt-2">沟通需求细节，确认合作意向</p>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((message, index) => {
              const isMine = message.sender_id === currentUser;
              const showDate = index === 0 || 
                new Date(message.created_at).toDateString() !== 
                new Date(messages[index - 1].created_at).toDateString();

              return (
                <React.Fragment key={message.id}>
                  {showDate && (
                    <div className="text-center my-4">
                      <span className="px-3 py-1 bg-white/10 rounded-full text-xs text-white/50">
                        {formatDate(message.created_at)}
                      </span>
                    </div>
                  )}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className={`flex ${isMine ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[70%] ${isMine ? 'flex-row-reverse' : 'flex-row'} flex items-end gap-2`}>
                      {!isMine && (
                        <div className="w-8 h-8 bg-gradient-to-br from-[#8B5CF6] to-[#7C3AED] rounded-full flex items-center justify-center text-white text-sm flex-shrink-0">
                          {message.sender?.username?.[0]?.toUpperCase() || 'U'}
                        </div>
                      )}
                      <div
                        className={`px-4 py-2.5 rounded-2xl ${
                          isMine
                            ? 'bg-[#8B5CF6] text-white'
                            : 'bg-[#1A1A2E] text-white border border-white/10'
                        }`}
                      >
                        <p className="text-sm">{message.content}</p>
                        <div className={`flex items-center mt-1 text-xs ${isMine ? 'text-white/60' : 'text-white/40'} justify-end gap-1`}>
                          <span>{formatTime(message.created_at)}</span>
                          {isMine && (
                            message.is_read ? (
                              <CheckCheck className="w-3 h-3" />
                            ) : (
                              <Check className="w-3 h-3" />
                            )
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A2E] border-t border-white/10">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <form onSubmit={handleSendMessage} className="flex items-end gap-2">
            <button className="p-3 text-white/50 hover:text-white transition-colors">
              <Paperclip className="w-5 h-5" />
            </button>
            <div className="flex-1 bg-[#0F0F1A] border border-white/10 rounded-2xl px-4 py-3">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="输入消息..."
                className="w-full bg-transparent text-white placeholder-white/40 focus:outline-none"
              />
            </div>
            <button className="p-3 text-white/50 hover:text-white transition-colors">
              <Smile className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={!newMessage.trim() || sending}
              className="p-3 bg-[#8B5CF6] text-white rounded-2xl hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
          <p className="text-center text-white/30 text-xs mt-2">
            平台仅提供沟通工具，请谨慎交易，建议签订正式合同
          </p>
        </div>
      </div>
    </div>
  );
}
