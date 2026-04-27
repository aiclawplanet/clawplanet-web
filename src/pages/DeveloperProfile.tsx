import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { User, Wrench, Calendar, ChevronLeft, ExternalLink } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Profile = Tables<'profiles'>;
type Tool = Tables<'tools'>;

interface DeveloperWithTools extends Profile {
  tools?: Tool[];
}

export function DeveloperProfile() {
  const { id } = useParams<{ id: string }>();
  const [developer, setDeveloper] = useState<DeveloperWithTools | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (id) {
      fetchDeveloper();
    }
  }, [id]);

  async function fetchDeveloper() {
    try {
      const { data: profileData } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .single();

      if (profileData) {
        const { data: toolsData } = await supabase
          .from('tools')
          .select('*')
          .eq('developer_id', id)
          .eq('status', 'approved')
          .order('created_at', { ascending: false });

        setDeveloper({
          ...profileData,
          tools: toolsData || [],
        });
      }
    } catch (error) {
      console.error('Error fetching developer:', error);
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

  if (!developer) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen pt-20 px-4">
        <div className="text-6xl mb-4">🔍</div>
        <h2 className="text-xl font-bold mb-2">开发者未找到</h2>
        <Link to="/" className="px-6 py-3 bg-[#8B5CF6] rounded-xl">
          返回首页
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <Link
        to="/"
        className="inline-flex items-center text-white/60 hover:text-white mb-6 transition-colors"
      >
        <ChevronLeft className="w-5 h-5 mr-1" />
        返回首页
      </Link>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-8 mb-8"
      >
        <div className="flex items-center space-x-6">
          <div className="w-24 h-24 rounded-full bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/30 flex items-center justify-center">
            {developer.avatar_url ? (
              <img
                src={developer.avatar_url}
                alt={developer.username || ''}
                className="w-24 h-24 rounded-full"
              />
            ) : (
              <User className="w-12 h-12 text-white/60" />
            )}
          </div>
          <div className="flex-1">
            <h1 className="text-3xl font-bold mb-2">
              {developer.username || '匿名开发者'}
            </h1>
            <p className="text-white/60 mb-4">{developer.bio || '独立开发者'}</p>
            <div className="flex items-center space-x-6 text-sm text-white/40">
              <span className="flex items-center">
                <Wrench className="w-4 h-4 mr-2" />
                {developer.tools?.length || 0} 个作品
              </span>
              <span className="flex items-center">
                <Calendar className="w-4 h-4 mr-2" />
                加入于 {new Date(developer.created_at || '').toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
      >
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Wrench className="w-5 h-5 mr-2 text-[#8B5CF6]" />
          作品列表
          <span className="ml-2 text-sm text-white/40">({developer.tools?.length || 0})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {developer.tools?.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Link
                to={`/tool/${tool.id}`}
                className="group block bg-[#1A1A2E] border border-white/10 rounded-2xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all"
              >
                <div className="h-40 bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 flex items-center justify-center">
                  {tool.icon_url ? (
                    <img
                      src={tool.icon_url}
                      alt={tool.name}
                      className="w-20 h-20 rounded-xl"
                    />
                  ) : (
                    <Wrench className="w-16 h-16 text-[#8B5CF6]" />
                  )}
                </div>
                <div className="p-4">
                  <h3 className="font-bold text-white group-hover:text-[#8B5CF6] transition-colors mb-2">
                    {tool.name}
                  </h3>
                  <p className="text-white/60 text-sm line-clamp-2 mb-4">
                    {tool.description}
                  </p>
                  <div className="flex items-center justify-between text-sm text-white/40">
                    <span className="flex items-center">
                      <ExternalLink className="w-4 h-4 mr-1" />
                      {tool.jump_count || 0} 使用
                    </span>
                    <span>{new Date(tool.created_at || '').toLocaleDateString()}</span>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {(!developer.tools || developer.tools.length === 0) && (
          <div className="text-center py-12 text-white/40">
            <Wrench className="w-16 h-16 mx-auto mb-4" />
            <p>该开发者还没有发布作品</p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
