/**
 * 虾蛋星球 - 独立Supabase配置
 * 已脱离秒悟平台，使用独立Supabase项目
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// 独立Supabase项目配置（2026-04-28 创建）
export const supabaseUrl = 'https://oqhgrglihrelyzigginq.supabase.co';
export const supabaseAnonKey = 'sb_publishable_yK_z8x0ogHJ8Q6tzhulUwA_IvvDEEDr';

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
