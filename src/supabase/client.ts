/**
 * 虾蛋星球 - Supabase配置
 *
 * 统一走 /sb-api 代理（nginx 已配置支持 Storage 文件上传）
 * 不再需要直连 supabase.co 的第二客户端
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

function getSupabaseUrl(): string {
  return `${(window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin}/sb-api`;
}

export const supabaseUrl = getSupabaseUrl();
export const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xaGdyZ2xpaHJlbHl6aWdnaW5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzczMDQ3MDEsImV4cCI6MjA5Mjg4MDcwMX0.aKXHSGcX526eMZ0VCw6Wp1lQ5FGria7-8uXllGvmlaA';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// 挂载到 window，方便调试
(window as any).supabase = supabase;
