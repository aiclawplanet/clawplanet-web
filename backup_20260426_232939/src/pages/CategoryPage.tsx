import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ChevronLeft, Grid3X3, List, Wrench, Eye, Rocket } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type Category = Tables<'categories'>;

export function CategoryPage() {
  const { id } = useParams<{ id: string }>();
  const [tools, setTools] = useState<Tool[]>([]);
  const [category, setCategory] = useState<Category | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<'newest' | 'popular'>('newest');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  useEffect(() => {
    fetchCategories();
    if (id && id !== 'all') {
      fetchCategoryAndTools();
    } else {
      fetchAllTools();
    }
  }, [id, sortBy]);

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order');
    if (data) {
      setCategories(data);
    }
  }

  async function fetchCategoryAndTools() {
    setLoading(true);
    try {
      // Fetch category
      const { data: categoryData } = await supabase
        .from('categories')
        .select('*')
        .eq('id', id)
        .single();

      if (categoryData) {
        setCategory(categoryData);
      }

      // Fetch tools
      let query = supabase
        .from('tools')
        .select('*, developer:developer_id(username)')
        .eq('status', 'approved')
        .eq('category_id', id);

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('view_count', { ascending: false });
      }

      const { data: toolsData } = await query;
      if (toolsData) {
        setTools(toolsData);
      }
    } catch (error) {
      console.error('Error fetching category:', error);
    } finally {
      setLoading(false);
    }
  }

  async function fetchAllTools() {
    setLoading(true);
    try {
      let query = supabase
        .from('tools')
        .select('*, developer:developer_id(username)')
        .eq('status', 'approved');

      if (sortBy === 'newest') {
        query = query.order('created_at', { ascending: false });
      } else {
        query = query.order('view_count', { ascending: false });
      }

      const { data: toolsData } = await query;
      if (toolsData) {
        setTools(toolsData);
      }
    } catch (error) {
      console.error('Error fetching tools:', error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-4">
          <Link
            to="/"
            className="flex items-center text-white/60 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-5 h-5 mr-1" />
            返回
          </Link>
          <h1 className="text-2xl font-bold">
            {category?.name || '全部工具'}
            <span className="ml-2 text-sm text-white/40">({tools.length})</span>
          </h1>
        </div>

        {/* Controls */}
        <div className="flex items-center space-x-3">
          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as 'newest' | 'popular')}
            className="px-3 py-2 bg-[#1A1A2E] border border-white/10 rounded-lg text-sm focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="newest">最新上架</option>
            <option value="popular">最受欢迎</option>
          </select>

          {/* View Mode */}
          <div className="flex items-center bg-[#1A1A2E] border border-white/10 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'text-[#8B5CF6]' : 'text-white/40'}`}
            >
              <Grid3X3 className="w-5 h-5" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'text-[#8B5CF6]' : 'text-white/40'}`}
            >
              <List className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {/* Category Filter */}
      <div className="flex flex-wrap gap-2 mb-8">
        <Link
          to="/category/all"
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
            id === 'all' || !id
              ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
              : 'bg-[#1A1A2E] border border-white/10 text-white/70 hover:border-[#8B5CF6]/50'
          }`}
        >
          全部
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/category/${cat.id}`}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              id === cat.id
                ? 'bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] text-white'
                : 'bg-[#1A1A2E] border border-white/10 text-white/70 hover:border-[#8B5CF6]/50'
            }`}
          >
            {cat.name}
          </Link>
        ))}
      </div>

      {/* Tools Grid/List */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
        </div>
      ) : tools.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="text-xl font-bold mb-2">暂无工具</h3>
          <p className="text-white/60">该分类下还没有工具，快来入驻吧！</p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4' : 'space-y-4'}>
          {tools.map((tool, index) => (
            <ToolCard key={tool.id} tool={tool} index={index} viewMode={viewMode} />
          ))}
        </div>
      )}
    </div>
  );
}

// Default export for the component
export default CategoryPage;

interface ToolCardProps {
  tool: Tool & { developer?: { username: string | null } };
  index: number;
  viewMode: 'grid' | 'list';
}

function ToolCard({ tool, index, viewMode }: ToolCardProps) {
  if (viewMode === 'list') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.05 }}
      >
        <Link
          to={`/tool/${tool.id}`}
          className="group flex items-center p-3 bg-white/5 backdrop-blur-xl border border-white/[0.08] rounded-[16px] hover:border-[#8B5CF6]/50 hover:bg-white/10 card-hover"
        >
          <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center overflow-hidden">
            {tool.icon_url ? (
              <img src={tool.icon_url} alt={tool.name} className="w-full h-full object-cover" />
            ) : (
              <Wrench className="w-6 h-6 text-[#8B5CF6]" />
            )}
          </div>
          <div className="flex-1 min-w-0 ml-3">
            <div className="flex items-center gap-2 mb-1">
              <h3 className="font-bold text-white group-hover:text-[#8B5CF6] transition-colors truncate">
                {tool.name}
              </h3>
              {tool.is_premium && (
                <span className="flex-shrink-0 px-1.5 py-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded text-[10px] font-medium">
                  精品
                </span>
              )}
            </div>
            <p className="text-white/50 text-xs line-clamp-1 mb-2">{tool.description}</p>
            <div className="flex items-center justify-between text-xs text-white/40">
              <span className="truncate max-w-[80px]">@{tool.developer?.username || '匿名开发者'}</span>
              <div className="flex items-center space-x-2">
                <span className="flex items-center gap-0.5">
                  <Eye className="w-3 h-3" />
                  {tool.view_count || 0}
                </span>
                <span className="flex items-center gap-0.5">
                  <Rocket className="w-3 h-3" />
                  {tool.jump_count || 0}
                </span>
              </div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/tool/${tool.id}`}
        className="group flex items-center p-3 bg-white/5 backdrop-blur-xl border border-white/[0.08] rounded-[16px] hover:border-[#8B5CF6]/50 hover:bg-white/10 card-hover"
      >
        <div className="flex-shrink-0 w-14 h-14 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center overflow-hidden">
          {tool.icon_url ? (
            <img src={tool.icon_url} alt={tool.name} className="w-full h-full object-cover" />
          ) : (
            <Wrench className="w-6 h-6 text-[#8B5CF6]" />
          )}
        </div>
        <div className="flex-1 min-w-0 ml-3">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-white group-hover:text-[#8B5CF6] transition-colors truncate">
              {tool.name}
            </h3>
            {tool.is_premium && (
              <span className="flex-shrink-0 px-1.5 py-0.5 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded text-[10px] font-medium">
                精品
              </span>
            )}
          </div>
          <p className="text-white/50 text-xs line-clamp-1 mb-2">{tool.description}</p>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span className="truncate max-w-[80px]">@{tool.developer?.username || '匿名开发者'}</span>
            <div className="flex items-center space-x-2">
              <span className="flex items-center gap-0.5">
                <Eye className="w-3 h-3" />
                {tool.view_count || 0}
              </span>
              <span className="flex items-center gap-0.5">
                <Rocket className="w-3 h-3" />
                {tool.jump_count || 0}
              </span>
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
