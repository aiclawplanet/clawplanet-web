import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Lock, Home } from 'lucide-react';
import { supabase } from '../supabase/client';

/**
 * AdminRoute - 管理员路由守卫
 *
 * 功能：
 * 1. 检查用户是否已登录（未登录 → 重定向到首页）
 * 2. 检查用户是否是管理员（非管理员 → 显示无权访问页面）
 * 3. 加载中 → 显示加载动画
 * 4. 全部通过 → 渲染子组件
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [authState, setAuthState] = useState<'loading' | 'unauthenticated' | 'not_admin' | 'admin'>('loading');

  useEffect(() => {
    let cancelled = false;

    async function checkAuth() {
      const { data: { user } } = await supabase.auth.getUser();

      if (cancelled) return;

      if (!user) {
        // 未登录 → 重定向首页
        navigate('/', { replace: true });
        return;
      }

      // 已登录，检查是否是管理员
      const { data: profile } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();

      if (cancelled) return;

      if (profile?.role === 'admin') {
        setAuthState('admin');
      } else {
        setAuthState('not_admin');
      }
    }

    checkAuth();

    return () => {
      cancelled = true;
    };
  }, [navigate]);

  // 加载中
  if (authState === 'loading') {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]" />
      </div>
    );
  }

  // 非管理员
  if (authState === 'not_admin') {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <div className="w-16 h-16 rounded-2xl bg-red-500/20 flex items-center justify-center mb-4">
            <Lock className="w-8 h-8 text-red-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2 text-white">无权访问</h2>
          <p className="text-white/60 mb-6">你没有管理员权限，无法访问此页面</p>
          <button
            onClick={() => navigate('/', { replace: true })}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-xl hover:bg-[#7C3AED] transition-colors"
          >
            <Home className="w-4 h-4" />
            返回首页
          </button>
        </div>
      </div>
    );
  }

  // 管理员 → 渲染子组件
  return <>{children}</>;
}
