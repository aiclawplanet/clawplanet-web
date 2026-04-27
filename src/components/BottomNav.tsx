import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Grid3X3, MessageCircle, User, Plus, Sparkles } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export function BottomNav() {
  const location = useLocation();
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const [lastScrollY, setLastScrollY] = useState(0);

  // Hide/show on scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setIsVisible(false);
      } else {
        setIsVisible(true);
      }
      setLastScrollY(currentScrollY);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [lastScrollY]);

  const navItems = [
    { path: '/', icon: Home, label: '首页' },
    { path: '/category/all', icon: Grid3X3, label: '分类' },
    { path: '/community', icon: MessageCircle, label: '社区' },
    { path: '/profile', icon: User, label: '我的' },
  ];

  const quickActions = [
    { path: '/join', icon: Plus, label: '入驻', color: 'from-[#8B5CF6] to-[#3B82F6]' },
    { path: '/promoter', icon: Sparkles, label: '推广', color: 'from-[#F59E0B] to-[#EF4444]' },
  ];

  return (
    <>
      {/* Quick Actions Menu */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="fixed bottom-20 left-4 right-4 z-40 md:hidden"
          >
            <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-4 shadow-2xl">
              <div className="grid grid-cols-2 gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.path}
                    to={action.path}
                    onClick={() => setShowQuickActions(false)}
                    className={`flex items-center justify-center space-x-2 p-3 bg-gradient-to-r ${action.color} rounded-xl text-white font-medium`}
                  >
                    <action.icon className="w-5 h-5" />
                    <span>{action.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main Bottom Nav */}
      <motion.nav
        initial={{ y: 0 }}
        animate={{ y: isVisible ? 0 : 100 }}
        transition={{ duration: 0.3 }}
        className="fixed bottom-0 left-0 right-0 z-50 bg-[#0F0F1A]/95 backdrop-blur-md border-t border-white/10 md:hidden"
      >
        <div className="flex items-center justify-around h-16">
          {navItems.slice(0, 2).map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-[#8B5CF6]' : 'text-white/50'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}

          {/* Center Action Button */}
          <button
            onClick={() => setShowQuickActions(!showQuickActions)}
            className={`flex flex-col items-center justify-center flex-1 h-full transition-colors ${
              showQuickActions ? 'text-[#8B5CF6]' : 'text-white/50'
            }`}
          >
            <motion.div
              animate={{ rotate: showQuickActions ? 45 : 0 }}
              className="w-10 h-10 rounded-full bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center mb-1"
            >
              <Plus className="w-5 h-5 text-white" />
            </motion.div>
            <span className="text-xs">快捷</span>
          </button>

          {navItems.slice(2).map((item) => {
            const isActive = location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            return (
              <Link
                key={item.path + item.label}
                to={item.path}
                className={`flex flex-col items-center justify-center flex-1 h-full ${
                  isActive ? 'text-[#8B5CF6]' : 'text-white/50'
                }`}
              >
                <item.icon className="w-5 h-5 mb-1" />
                <span className="text-xs">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}
