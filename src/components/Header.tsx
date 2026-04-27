import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Menu, X, Bell, MessageSquare, MessageCircle } from 'lucide-react';
import { Logo } from './Logo';
import { supabase } from '../supabase/client';

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [notificationCount, setNotificationCount] = useState(0);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    // Always use dark mode
    document.documentElement.classList.add('dark');
    document.documentElement.setAttribute('data-theme', 'dark');
    localStorage.setItem('theme', 'dark');
  }, []);

  useEffect(() => {
    fetchNotificationCount();
  }, []);

  async function fetchNotificationCount() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      // Mock notification count - in real app, fetch from notifications table
      setNotificationCount(3);
      setUnreadMessages(2);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-white/70 dark:bg-[#0a0a0f]/70 backdrop-blur-[20px] border-b border-black/[0.06] dark:border-white/[0.06]" style={{ backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/">
            <Logo size="md" />
          </Link>

          {/* Search Bar - Desktop */}
          <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
            <div className="relative w-full">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索工具..."
                className="w-full pl-10 pr-4 py-2 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#8B5CF6] transition-colors"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            </div>
          </form>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center space-x-6">
            <Link to="/" className="text-white/70 hover:text-white transition-colors">
              首页
            </Link>
            <Link to="/community" className="text-white/70 hover:text-white transition-colors">
              社区
            </Link>
            <Link to="/promotion" className="text-white/70 hover:text-white transition-colors">
              智能推广
            </Link>
            <Link to="/promoter" className="text-white/70 hover:text-white transition-colors">
              星推官
            </Link>
            <Link to="/demands" className="text-white/70 hover:text-white transition-colors">
              需求大厅
            </Link>
            <Link to="/join" className="text-white/70 hover:text-white transition-colors">
              入驻
            </Link>

            {/* Notifications */}
            <div className="flex items-center space-x-3">
              <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {notificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-xs flex items-center justify-center">
                    {notificationCount > 9 ? '9+' : notificationCount}
                  </span>
                )}
              </button>
              <button className="relative p-2 text-white/70 hover:text-white transition-colors">
                <MessageSquare className="w-5 h-5" />
                {unreadMessages > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#8B5CF6] rounded-full text-xs flex items-center justify-center">
                    {unreadMessages > 9 ? '9+' : unreadMessages}
                  </span>
                )}
              </button>
            </div>

            <Link to="/chat" className="text-white/70 hover:text-white transition-colors">
              消息
            </Link>
            <Link to="/profile" className="text-white/70 hover:text-white transition-colors">
              我的
            </Link>
          </nav>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="md:hidden p-2 text-white/70 hover:text-white"
          >
            {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {isMenuOpen && (
        <div className="md:hidden bg-[#1A1A2E] border-t border-white/10">
          <div className="px-4 py-4 space-y-4">
            <form onSubmit={handleSearch} className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索工具..."
                className="w-full pl-10 pr-4 py-2 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/50 focus:outline-none focus:border-[#8B5CF6]"
              />
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
            </form>
            <Link to="/" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              首页
            </Link>
            <Link to="/community" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              社区
            </Link>
            <Link to="/promotion" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              智能推广
            </Link>
            <Link to="/promoter" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              星推官
            </Link>
            <Link to="/demands" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              需求大厅
            </Link>
            <Link to="/join" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              入驻
            </Link>
            <Link to="/chat" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              消息
            </Link>
            <Link to="/profile" className="block text-white/70 hover:text-white py-2" onClick={() => setIsMenuOpen(false)}>
              我的
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
