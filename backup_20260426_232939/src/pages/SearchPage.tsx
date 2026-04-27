import React, { useEffect, useState, useRef } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, TrendingUp, Clock, Trash2, SlidersHorizontal, Filter, Wrench, Eye, Rocket } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type Category = Tables<'categories'>;

const hotSearches = ['房贷计算器', '戒烟打卡', '二维码生成', '单位换算', '密码生成器', '记账本', '番茄钟', '习惯养成'];

const SEARCH_HISTORY_KEY = 'search_history';
const MAX_HISTORY_ITEMS = 10;

export function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [tools, setTools] = useState<Tool[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(!!initialQuery);
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [sortBy, setSortBy] = useState<'relevance' | 'views' | 'newest'>('relevance');
  const [showFilters, setShowFilters] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Load search history from localStorage
    const saved = localStorage.getItem(SEARCH_HISTORY_KEY);
    if (saved) {
      try {
        setSearchHistory(JSON.parse(saved));
      } catch {
        setSearchHistory([]);
      }
    }
    fetchCategories();
    if (initialQuery) {
      performSearch(initialQuery);
    }
  }, []);

  async function fetchCategories() {
    const { data } = await supabase.from('categories').select('*').order('sort_order');
    if (data) setCategories(data);
  }

  // Search suggestions
  useEffect(() => {
    if (query.length >= 2) {
      const filtered = hotSearches.filter(s => s.includes(query) && s !== query).slice(0, 5);
      setSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setShowSuggestions(false);
    }
  }, [query]);

  async function performSearch(searchQuery: string) {
    if (!searchQuery.trim()) return;

    setLoading(true);
    setSearched(true);
    setShowSuggestions(false);

    // Save to search history
    saveToHistory(searchQuery.trim());

    try {
      let queryBuilder = supabase
        .from('tools')
        .select('*, developer:developer_id(username)')
        .eq('status', 'approved')
        .or(`name.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%,tags.cs.{${searchQuery}}`);

      // Apply category filter
      if (selectedCategory) {
        queryBuilder = queryBuilder.eq('category_id', selectedCategory);
      }

      // Apply sorting
      switch (sortBy) {
        case 'views':
          queryBuilder = queryBuilder.order('view_count', { ascending: false });
          break;
        case 'newest':
          queryBuilder = queryBuilder.order('created_at', { ascending: false });
          break;
        default:
          // relevance - default order
          break;
      }

      const { data } = await queryBuilder.limit(20);

      if (data) {
        setTools(data);
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setLoading(false);
    }
  }

  function saveToHistory(searchTerm: string) {
    setSearchHistory(prev => {
      const filtered = prev.filter(item => item !== searchTerm);
      const newHistory = [searchTerm, ...filtered].slice(0, MAX_HISTORY_ITEMS);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }

  function clearHistory() {
    setSearchHistory([]);
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  }

  function removeFromHistory(term: string) {
    setSearchHistory(prev => {
      const newHistory = prev.filter(item => item !== term);
      localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(newHistory));
      return newHistory;
    });
  }

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
      performSearch(query.trim());
    }
  }

  function clearSearch() {
    setQuery('');
    setSearched(false);
    setTools([]);
    setSearchParams({});
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
      {/* Search Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <h1 className="text-2xl font-bold mb-6">搜索工具</h1>
        
        <form onSubmit={handleSearch} className="relative">
          <input
            ref={searchInputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onFocus={() => query.length >= 2 && suggestions.length > 0 && setShowSuggestions(true)}
            onBlur={() => setShowSuggestions(false)}
            placeholder="输入关键词搜索工具..."
            className="w-full pl-12 pr-24 py-4 bg-[#1A1A2E] border border-white/10 rounded-2xl text-white text-lg placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] transition-colors"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-6 h-6 text-white/40" />

          {/* Search Suggestions Dropdown */}
          <AnimatePresence>
            {showSuggestions && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="absolute top-full left-0 right-0 mt-2 bg-[#1A1A2E] border border-white/10 rounded-xl shadow-xl z-50"
              >
                {suggestions.map((suggestion, index) => (
                  <button
                    key={suggestion}
                    onClick={() => {
                      setQuery(suggestion);
                      performSearch(suggestion);
                    }}
                    className="w-full px-4 py-3 text-left text-white/70 hover:bg-white/5 first:rounded-t-xl last:rounded-b-xl flex items-center"
                  >
                    <Search className="w-4 h-4 mr-3 text-white/40" />
                    {suggestion}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>

          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center space-x-1">
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`p-2 rounded-lg transition-colors ${showFilters ? 'bg-[#8B5CF6]/20 text-[#8B5CF6]' : 'text-white/40 hover:text-white'}`}
            >
              <SlidersHorizontal className="w-5 h-5" />
            </button>
            {query && (
              <button
                type="button"
                onClick={clearSearch}
                className="p-2 text-white/40 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
        </form>

        {/* Filters Panel */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 bg-[#1A1A2E] border border-white/10 rounded-xl"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Category Filter */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block flex items-center">
                    <Filter className="w-4 h-4 mr-1" />
                    分类筛选
                  </label>
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="w-full px-3 py-2 bg-[#0F0F1A] border border-white/10 rounded-lg text-white text-sm focus:outline-none focus:border-[#8B5CF6]"
                  >
                    <option value="">全部分类</option>
                    {categories.map((cat) => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Sort Options */}
                <div>
                  <label className="text-sm text-white/60 mb-2 block">排序方式</label>
                  <div className="flex space-x-2">
                    {[
                      { key: 'relevance', label: '相关度' },
                      { key: 'views', label: '浏览量' },
                      { key: 'newest', label: '最新' },
                    ].map(({ key, label }) => (
                      <button
                        key={key}
                        onClick={() => setSortBy(key as typeof sortBy)}
                        className={`px-3 py-2 rounded-lg text-sm transition-colors ${
                          sortBy === key
                            ? 'bg-[#8B5CF6] text-white'
                            : 'bg-[#0F0F1A] text-white/60 hover:text-white'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Search Suggestions */}
      {!searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-8"
        >
          {/* Hot Searches */}
          <div>
            <h2 className="text-sm font-medium text-white/60 mb-4 flex items-center">
              <TrendingUp className="w-4 h-4 mr-2" />
              热门搜索
            </h2>
            <div className="flex flex-wrap gap-2">
              {hotSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => {
                    setQuery(term);
                    performSearch(term);
                  }}
                  className="px-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-full text-sm text-white/70 hover:border-[#8B5CF6]/50 hover:text-white transition-colors"
                >
                  {term}
                </button>
              ))}
            </div>
          </div>

          {/* Search History */}
          {searchHistory.length > 0 && (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-medium text-white/60 flex items-center">
                  <Clock className="w-4 h-4 mr-2" />
                  搜索历史
                </h2>
                <button
                  onClick={clearHistory}
                  className="text-xs text-white/40 hover:text-red-400 flex items-center transition-colors"
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  清空
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <div
                    key={term}
                    className="group flex items-center px-3 py-2 bg-[#1A1A2E] border border-white/10 rounded-full text-sm text-white/70 hover:border-[#8B5CF6]/50 hover:text-white transition-colors"
                  >
                    <button
                      onClick={() => {
                        setQuery(term);
                        performSearch(term);
                      }}
                      className="mr-2"
                    >
                      {term}
                    </button>
                    <button
                      onClick={() => removeFromHistory(term)}
                      className="text-white/30 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      )}

      {/* Search Results */}
      {searched && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium">
              "{query}" 的搜索结果
              <span className="ml-2 text-sm text-white/40">({tools.length})</span>
            </h2>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
            </div>
          ) : tools.length === 0 ? (
            <div className="text-center py-20">
              <div className="text-6xl mb-4">🔍</div>
              <h3 className="text-xl font-bold mb-2">未找到相关工具</h3>
              <p className="text-white/60">换个关键词试试，或者入驻添加新工具</p>
              <Link
                to="/join"
                className="inline-block mt-6 px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
              >
                入驻展示作品
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {tools.map((tool, index) => (
                <ToolCard key={tool.id} tool={tool} index={index} />
              ))}
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

interface ToolCardProps {
  tool: Tool & { developer?: { username: string | null } };
  index: number;
}

function ToolCard({ tool, index }: ToolCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
    >
      <Link
        to={`/tool/${tool.id}`}
        className="group block bg-[#1A1A2E] border border-white/10 rounded-2xl overflow-hidden hover:border-[#8B5CF6]/50 hover:shadow-lg hover:shadow-[#8B5CF6]/10 transition-all"
      >
        <div className="h-40 bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 flex items-center justify-center">
          {tool.icon_url ? (
            <img src={tool.icon_url} alt={tool.name} className="w-20 h-20 rounded-2xl" />
          ) : (
            <Wrench className="w-16 h-16 text-[#8B5CF6]" />
          )}
          {tool.is_premium && (
            <div className="absolute top-3 right-3 px-2 py-1 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-lg text-xs font-medium">
              精品
            </div>
          )}
        </div>
        <div className="p-4">
          <h3 className="font-bold text-white group-hover:text-[#8B5CF6] transition-colors mb-1">
            {tool.name}
          </h3>
          <p className="text-white/60 text-sm line-clamp-2 mb-3">{tool.description}</p>
          <div className="flex items-center justify-between text-xs text-white/40">
            <span>@{tool.developer?.username || '匿名开发者'}</span>
            <div className="flex items-center space-x-3">
              <span className="flex items-center gap-1">
                <Eye className="w-3 h-3" />
                {tool.view_count || 0}
              </span>
              <span className="flex items-center gap-1">
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
