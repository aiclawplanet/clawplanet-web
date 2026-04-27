import { useEffect, useState } from 'react';

export type Theme = 'dark';

/**
 * 获取初始主题 - 固定暗色模式
 */
function getInitialTheme(): Theme {
  return 'dark';
}

/**
 * 主题钩子 - 固定暗色模式
 */
export function useTheme() {
  const [theme] = useState<Theme>('dark');

  useEffect(() => {
    // 强制应用暗色模式
    applyTheme('dark');
  }, []);

  return theme;
}

/**
 * 应用主题到DOM - 固定暗色模式
 */
function applyTheme(theme: Theme) {
  if (typeof document === 'undefined') return;

  document.documentElement.classList.remove('light');
  document.documentElement.classList.add('dark');
  document.documentElement.setAttribute('data-theme', 'dark');
}
