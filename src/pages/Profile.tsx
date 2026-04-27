import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, Heart, Settings, LogOut, ChevronRight, DollarSign, Mail, Github, Chrome,
  MessageCircle, Eye, EyeOff, Sparkles, Lock, UserPlus, Code, Award, Briefcase,
  TrendingUp, Megaphone, Shield, CheckCircle, Clock, X, Folder, Grid3X3, Zap, Book, Gamepad2,
  FileText, MessageSquare, Wrench
} from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Profile = Tables<'profiles'>;
type Tool = Tables<'tools'>;
type Favorite = Tables<'favorites'>;
type DeveloperApplication = Tables<'developer_applications'>;
type Promoter = Tables<'promoters'>;
type Category = Tables<'categories'>;

interface FavoriteWithCategory extends Favorite {
  tool: Tool & { category?: Category };
}

interface UserRoles {
  isUser: boolean;
  isDeveloper: boolean;
  isPromoter: boolean;
  isAdmin: boolean;
}

export function Profile() {
  const [user, setUser] = useState<Profile | null>(null);
  const [favorites, setFavorites] = useState<FavoriteWithCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState<UserRoles>({
    isUser: false,
    isDeveloper: false,
    isPromoter: false,
    isAdmin: false,
  });
  const [devApplication, setDevApplication] = useState<DeveloperApplication | null>(null);
  const [promoterInfo, setPromoterInfo] = useState<Promoter | null>(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [categories, setCategories] = useState<Category[]>([]);
  const [myTools, setMyTools] = useState<Tool[]>([]);

  useEffect(() => {
    checkUser();
  }, []);

  async function checkUser() {
    try {
      const { data: { user: authUser } } = await supabase.auth.getUser();

      if (authUser) {
        const { data: profileData } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', authUser.id)
          .single();

        if (profileData) {
          setUser(profileData);
          setRoles({
            isUser: profileData.role === 'user' || !profileData.role,
            isDeveloper: profileData.role === 'developer',
            isPromoter: profileData.role === 'promoter',
            isAdmin: profileData.role === 'admin',
          });

          if (profileData.role === 'developer' || profileData.role === 'admin') {
            const { data: appData } = await supabase
              .from('developer_applications')
              .select('*')
              .eq('user_id', authUser.id)
              .order('applied_at', { ascending: false })
              .maybeSingle();
            setDevApplication(appData);
          }

          if (profileData.role === 'promoter' || profileData.role === 'admin') {
            const { data: promoterData } = await supabase
              .from('promoters')
              .select('*')
              .eq('user_id', authUser.id)
              .maybeSingle();
            setPromoterInfo(promoterData);
          }
        }

        const { data: favoritesData } = await supabase
          .from('favorites')
          .select('*, tool:tool_id(*, category:category_id(*))')
          .eq('user_id', authUser.id)
          .order('created_at', { ascending: false });

        if (favoritesData) {
          setFavorites(favoritesData as FavoriteWithCategory[]);
        }

        // Fetch user's tools
        const { data: toolsData } = await supabase
          .from('tools')
          .select('*, category:category_id(*)')
          .eq('developer_id', authUser.id)
          .order('created_at', { ascending: false });

        if (toolsData) {
          setMyTools(toolsData);
        }

        // Fetch categories for filter
        const { data: categoriesData } = await supabase
          .from('categories')
          .select('*')
          .order('sort_order');

        if (categoriesData) {
          setCategories(categoriesData);
        }
      }
    } catch (error) {
      console.error('Error fetching user:', error);
    } finally {
      setLoading(false);
    }
  }

  // Get unique categories from favorites
  const favoriteCategories = React.useMemo(() => {
    const categoryMap = new Map<string, Category>();
    favorites.forEach(fav => {
      if (fav.tool?.category) {
        categoryMap.set(fav.tool.category.id, fav.tool.category);
      }
    });
    return Array.from(categoryMap.values());
  }, [favorites]);

  // Filter favorites by category
  const filteredFavorites = React.useMemo(() => {
    if (selectedCategory === 'all') return favorites;
    return favorites.filter(fav => fav.tool?.category?.id === selectedCategory);
  }, [favorites, selectedCategory]);

  async function handleLogout() {
    await supabase.auth.signOut();
    window.location.reload();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center space-x-4">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-[#8B5CF6]/30 to-[#3B82F6]/30 flex items-center justify-center">
              {user.avatar_url ? (
                <img
                  src={user.avatar_url}
                  alt={user.username || ''}
                  className="w-20 h-20 rounded-full"
                />
              ) : (
                <User className="w-10 h-10 text-white/60" />
              )}
            </div>
            <div className="flex-1">
              <div className="flex items-center space-x-3 mb-1">
                <h1 className="text-2xl font-bold">
                  {user.username || '未设置用户名'}
                </h1>
                <RoleBadge role={user.role || 'user'} />
              </div>
              <p className="text-white/60">{user.bio || '独立开发者'}</p>
              <div className="flex items-center space-x-2 mt-3">
                {!roles.isDeveloper && !roles.isAdmin && (
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="text-xs px-3 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] rounded-full hover:bg-[#8B5CF6]/30 transition-colors"
                  >
                    + 申请成为开发者
                  </button>
                )}
                {!roles.isPromoter && !roles.isAdmin && (
                  <button
                    onClick={() => setShowRoleModal(true)}
                    className="text-xs px-3 py-1 bg-green-500/20 text-green-400 rounded-full hover:bg-green-500/30 transition-colors"
                  >
                    + 成为星推官
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 mb-8"
      >
        {(roles.isDeveloper || roles.isAdmin) && (
          <Link
            to="/dashboard"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-[#8B5CF6]/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
                <Code className="w-5 h-5 text-[#8B5CF6]" />
              </div>
              <div>
                <span className="font-medium">开发者后台</span>
                <p className="text-xs text-white/40">管理我的工具产品</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        {(roles.isDeveloper || roles.isAdmin) && (
          <Link
            to="/developer/demands"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-cyan-500/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-cyan-400" />
              </div>
              <div>
                <span className="font-medium">需求大厅</span>
                <p className="text-xs text-white/40">浏览需求并报价接单</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        {(roles.isDeveloper || roles.isAdmin) && (
          <Link
            to="/my-quotes"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-pink-500/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-pink-500/20 flex items-center justify-center">
                <MessageSquare className="w-5 h-5 text-pink-400" />
              </div>
              <div>
                <span className="font-medium">我的报价</span>
                <p className="text-xs text-white/40">查看报价状态和成交情况</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        {(roles.isDeveloper || roles.isAdmin) && (
          <Link
            to="/promotion"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-orange-500/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-orange-500/20 flex items-center justify-center">
                <Megaphone className="w-5 h-5 text-orange-400" />
              </div>
              <div>
                <span className="font-medium">智能推广中心</span>
                <p className="text-xs text-white/40">AI生成文案，一键多平台发布</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        {(roles.isPromoter || roles.isAdmin) && (
          <Link
            to="/promoter"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-green-500/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-green-500/20 flex items-center justify-center">
                <Award className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <span className="font-medium">星推官推广中心</span>
                <p className="text-xs text-white/40">
                  发现价值工具，分享优质内容
                </p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        {roles.isAdmin && (
          <Link
            to="/admin"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-red-500/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
                <Shield className="w-5 h-5 text-red-400" />
              </div>
              <div>
                <span className="font-medium">管理员后台</span>
                <p className="text-xs text-white/40">平台管理与审核</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        <Link
          to="/my-demands"
          className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-indigo-500/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/20 flex items-center justify-center">
              <FileText className="w-5 h-5 text-indigo-400" />
            </div>
            <div>
              <span className="font-medium">我的需求</span>
              <p className="text-xs text-white/40">管理我发布的开发需求</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </Link>

        {/* 我的工具 - 所有用户都显示 */}
        <Link
          to="/my-tools"
          className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-[#8B5CF6]/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-[#8B5CF6]/20 flex items-center justify-center">
              <Wrench className="w-5 h-5 text-[#8B5CF6]" />
            </div>
            <div>
              <span className="font-medium">我的工具</span>
              <p className="text-xs text-white/40">
                {myTools.length > 0
                  ? `${myTools.filter(t => t.status === 'approved').length}个已上线, ${myTools.filter(t => t.status === 'pending').length}个审核中`
                  : '管理我提交的工具产品'}
              </p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </Link>

        {!roles.isDeveloper && !roles.isAdmin && (
          <Link
            to="/join"
            className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-[#3B82F6]/50 transition-colors"
          >
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-[#3B82F6]/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-[#3B82F6]" />
              </div>
              <div>
                <span className="font-medium">入驻成为开发者</span>
                <p className="text-xs text-white/40">提交我的工具产品</p>
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/40" />
          </Link>
        )}

        <Link
          to="/profile/settings"
          className="flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-[#8B5CF6]/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-gray-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            <div>
              <span className="font-medium">个人设置</span>
              <p className="text-xs text-white/40">修改资料、密码等</p>
            </div>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </Link>

        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-between p-4 bg-[#1A1A2E] border border-white/10 rounded-2xl hover:border-red-500/50 transition-colors"
        >
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center">
              <LogOut className="w-5 h-5 text-red-400" />
            </div>
            <span className="text-red-400">退出登录</span>
          </div>
          <ChevronRight className="w-5 h-5 text-white/40" />
        </button>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
      >
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Heart className="w-5 h-5 mr-2 text-red-400" />
          我的收藏
          <span className="ml-2 text-sm text-white/40">({favorites.length})</span>
        </h2>

        {favorites.length === 0 ? (
          <div className="text-center py-12 bg-[#1A1A2E] border border-white/10 rounded-2xl">
            <Heart className="w-12 h-12 mx-auto mb-3 text-white/20" />
            <p className="text-white/60">还没有收藏任何工具</p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl text-sm font-medium"
            >
              去发现工具
            </Link>
          </div>
        ) : (
          <>
            {/* Category Filter */}
            {favoriteCategories.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-6">
                <button
                  onClick={() => setSelectedCategory('all')}
                  className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                    selectedCategory === 'all'
                      ? 'bg-[#8B5CF6] text-white'
                      : 'bg-white/5 text-white/60 hover:bg-white/10'
                  }`}
                >
                  <Folder className="w-3 h-3 mr-1" />
                  全部 ({favorites.length})
                </button>
                {favoriteCategories.map((cat) => {
                  const count = favorites.filter(f => f.tool?.category?.id === cat.id).length;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => setSelectedCategory(cat.id)}
                      className={`flex items-center px-3 py-1.5 rounded-full text-sm transition-colors ${
                        selectedCategory === cat.id
                          ? 'bg-[#8B5CF6] text-white'
                          : 'bg-white/5 text-white/60 hover:bg-white/10'
                      }`}
                    >
                      {cat.name} ({count})
                    </button>
                  );
                })}
              </div>
            )}

            {/* Filtered Favorites Grid */}
            {filteredFavorites.length === 0 ? (
              <div className="text-center py-12 bg-[#1A1A2E] border border-white/10 rounded-2xl">
                <Folder className="w-12 h-12 mx-auto mb-3 text-white/20" />
                <p className="text-white/60">该分类下没有收藏</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {filteredFavorites.map((favorite, index) => (
                  <FavoriteCard key={favorite.id} favorite={favorite} index={index} />
                ))}
              </div>
            )}
          </>
        )}
      </motion.div>

      <AnimatePresence>
        {showRoleModal && (
          <RoleSelectionModal
            onClose={() => setShowRoleModal(false)}
            currentRole={user.role || 'user'}
          />
        )}
      </AnimatePresence>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const configs: Record<string, { text: string; className: string; icon: React.ReactNode }> = {
    user: { text: '普通用户', className: 'bg-gray-500/20 text-gray-400', icon: <User className="w-3 h-3" /> },
    developer: { text: '开发者', className: 'bg-[#8B5CF6]/20 text-[#8B5CF6]', icon: <Code className="w-3 h-3" /> },
    promoter: { text: '星推官', className: 'bg-green-500/20 text-green-400', icon: <Award className="w-3 h-3" /> },
    admin: { text: '管理员', className: 'bg-red-500/20 text-red-400', icon: <Shield className="w-3 h-3" /> },
  };
  const config = configs[role] || configs.user;

  return (
    <span className={`flex items-center space-x-1 px-2 py-0.5 rounded-full text-xs ${config.className}`}>
      {config.icon}
      <span>{config.text}</span>
    </span>
  );
}

interface RoleSelectionModalProps {
  onClose: () => void;
  currentRole: string;
}

function RoleSelectionModal({ onClose, currentRole }: RoleSelectionModalProps) {
  const navigate = useNavigate();

  const roles = [
    {
      id: 'developer',
      title: '成为开发者',
      description: '入驻虾蛋星球，展示和推广我的工具产品',
      icon: Code,
      color: 'from-[#8B5CF6] to-[#3B82F6]',
      bgColor: 'bg-[#8B5CF6]/20',
      textColor: 'text-[#8B5CF6]',
      available: currentRole === 'user',
      path: '/join',
    },
    {
      id: 'promoter',
      title: '成为星推官',
      description: '推广优质工具，赚取丰厚佣金',
      icon: Award,
      color: 'from-green-500 to-emerald-500',
      bgColor: 'bg-green-500/20',
      textColor: 'text-green-400',
      available: currentRole === 'user' || currentRole === 'developer',
      path: '/promoter/join',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-md w-full"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold">选择你的身份</h2>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-lg transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-white/60 text-sm mb-6">
          选择适合你的身份，开启虾蛋星球的精彩旅程。你可以同时拥有多个身份。
        </p>

        <div className="space-y-4">
          {roles.map((role) => (
            <button
              key={role.id}
              onClick={() => {
                navigate(role.path);
                onClose();
              }}
              disabled={!role.available}
              className={`w-full p-4 rounded-xl border transition-all text-left ${
                role.available
                  ? 'border-white/10 hover:border-white/30 bg-white/5 hover:bg-white/10'
                  : 'border-white/5 bg-white/5 opacity-50 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start space-x-4">
                <div className={`w-12 h-12 rounded-xl ${role.bgColor} flex items-center justify-center flex-shrink-0`}>
                  <role.icon className={`w-6 h-6 ${role.textColor}`} />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium mb-1">{role.title}</h3>
                  <p className="text-sm text-white/60">{role.description}</p>
                  {!role.available && (
                    <span className="text-xs text-white/40 mt-2 inline-block">已申请或已是该身份</span>
                  )}
                </div>
                <ChevronRight className="w-5 h-5 text-white/40 flex-shrink-0" />
              </div>
            </button>
          ))}
        </div>
      </motion.div>
    </motion.div>
  );
}

interface FavoriteCardProps {
  favorite: Favorite & { tool: Tool };
  index: number;
}

function FavoriteCard({ favorite, index }: FavoriteCardProps) {
  const tool = favorite.tool;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/tool/${tool.id}`}
        className="group block bg-[#1A1A2E] border border-white/10 rounded-2xl overflow-hidden hover:border-[#8B5CF6]/50 transition-all"
      >
        <div className="h-32 bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 flex items-center justify-center">
          {tool.icon_url ? (
            <img src={tool.icon_url} alt={tool.name} className="w-16 h-16 rounded-xl" />
          ) : (
            <Wrench className="w-12 h-12 text-[#8B5CF6]" />
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-white group-hover:text-[#8B5CF6] transition-colors mb-1">
            {tool.name}
          </h3>
          <p className="text-white/60 text-sm line-clamp-2">{tool.description}</p>
        </div>
      </Link>
    </motion.div>
  );
}

function LoginPage() {
  const [activeTab, setActiveTab] = useState<'login' | 'register' | 'social'>('login');

  return (
    <div className="min-h-screen pt-20 px-4 sm:px-6 lg:px-8 flex items-center justify-center">
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="relative inline-block mb-4">
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full blur-2xl opacity-30"></div>
            <div className="relative w-16 h-16 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center">
              <Sparkles className="w-8 h-8 text-white" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">欢迎回来</h1>
          <p className="text-white/60">登录虾蛋星球，发现更多精彩</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 sm:p-8"
        >
          <div className="flex space-x-1 mb-6 bg-[#0F0F1A] rounded-xl p-1">
            {[
              { id: 'login', label: '登录', icon: Lock },
              { id: 'register', label: '注册', icon: UserPlus },
              { id: 'social', label: '社交账号', icon: MessageCircle },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as typeof activeTab)}
                className={`flex-1 flex items-center justify-center space-x-2 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  activeTab === tab.id
                    ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                    : 'text-white/60 hover:text-white'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                <span className="hidden sm:inline">{tab.label}</span>
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === 'login' && (
              <EmailPasswordLoginForm key="login" />
            )}
            {activeTab === 'register' && (
              <EmailRegisterForm key="register" />
            )}
            {activeTab === 'social' && (
              <SocialLoginForm key="social" />
            )}
          </AnimatePresence>
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="text-center text-sm text-white/40 mt-6"
        >
          登录即表示同意
          <a href="#" className="text-[#8B5CF6] hover:underline mx-1">服务条款</a>
          和
          <a href="#" className="text-[#8B5CF6] hover:underline mx-1">隐私政策</a>
        </motion.p>
      </div>
    </div>
  );
}

function EmailPasswordLoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleLogin() {
    if (!email.trim() || !password.trim()) {
      setMessage('请填写邮箱和密码');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: password.trim(),
    });

    if (error) {
      setMessage('登录失败：' + error.message);
      setLoading(false);
      return;
    }

    window.location.reload();
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱"
          className="w-full pl-12 pr-4 py-3.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
      </div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="请输入密码"
          className="w-full pl-4 pr-12 py-3.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <button
        onClick={handleLogin}
        disabled={loading || !email.trim() || !password.trim()}
        className="w-full py-3.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {loading ? '登录中...' : '登录'}
      </button>
      {message && (
        <p className="text-sm text-center text-red-400">{message}</p>
      )}
    </motion.div>
  );
}

function EmailRegisterForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  async function handleRegister() {
    if (!email.trim() || !password.trim() || !username.trim()) {
      setMessage('请填写所有必填项');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('两次输入的密码不一致');
      return;
    }

    if (password.length < 6) {
      setMessage('密码长度至少6位');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email.trim(),
        password: password.trim(),
        options: {
          data: {
            username: username.trim(),
          },
        },
      });

      if (authError) {
        setMessage('注册失败：' + authError.message);
        setLoading(false);
        return;
      }

      if (authData.user) {
        const { error: profileError } = await supabase.from('profiles').insert({
          id: authData.user.id,
          username: username.trim(),
          role: 'user',
        });

        if (profileError) {
          console.error('Profile error:', profileError);
          if (profileError.message?.includes('duplicate') || profileError.code === '23505') {
            const { error: signInError } = await supabase.auth.signInWithPassword({
              email: email.trim(),
              password: password.trim(),
            });

            if (!signInError) {
              window.location.reload();
              return;
            }
          }
          setMessage('创建用户资料失败：' + profileError.message);
          setLoading(false);
          return;
        }

        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password: password.trim(),
        });

        if (signInError) {
          setMessage('注册成功，请手动登录');
          setLoading(false);
          return;
        }

        window.location.reload();
      }
    } catch (err: any) {
      setMessage('注册失败：' + (err.message || '未知错误'));
    }

    setLoading(false);
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-4"
    >
      <div className="relative">
        <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          placeholder="设置用户名"
          className="w-full pl-12 pr-4 py-3.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
      </div>
      <div className="relative">
        <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="请输入邮箱"
          className="w-full pl-12 pr-4 py-3.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
      </div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="设置密码（至少6位）"
          className="w-full pl-4 pr-12 py-3.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
        <button
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-white/40 hover:text-white"
        >
          {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
        </button>
      </div>
      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="确认密码"
          className="w-full pl-4 pr-4 py-3.5 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
        />
      </div>
      <button
        onClick={handleRegister}
        disabled={loading || !email.trim() || !password.trim() || !username.trim()}
        className="w-full py-3.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity"
      >
        {loading ? '注册中...' : '注册'}
      </button>
      {message && (
        <p className={`text-sm text-center ${message.includes('失败') ? 'text-red-400' : 'text-green-400'}`}>
          {message}
        </p>
      )}
    </motion.div>
  );
}

function SocialLoginForm() {
  const [loading, setLoading] = useState<string | null>(null);

  async function handleSocialLogin(provider: 'github' | 'google') {
    setLoading(provider);
    await supabase.auth.signInWithOAuth({ provider });
  }

  const socialButtons = [
    { id: 'github', label: 'GitHub', icon: Github, color: 'from-gray-700 to-gray-800' },
    { id: 'google', label: 'Google', icon: Chrome, color: 'from-red-500 to-orange-500' },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="space-y-3"
    >
      {socialButtons.map((btn) => (
        <button
          key={btn.id}
          onClick={() => handleSocialLogin(btn.id as 'github' | 'google')}
          disabled={loading === btn.id}
          className={`w-full py-3.5 bg-gradient-to-r ${btn.color} rounded-xl font-medium disabled:opacity-50 hover:opacity-90 transition-opacity flex items-center justify-center space-x-3`}
        >
          {loading === btn.id ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
          ) : (
            <>
              <btn.icon className="w-5 h-5" />
              <span>使用 {btn.label} 登录</span>
            </>
          )}
        </button>
      ))}
      <p className="text-center text-sm text-white/40 mt-4">
        使用第三方账号快速登录，无需注册
      </p>
    </motion.div>
  );
}
