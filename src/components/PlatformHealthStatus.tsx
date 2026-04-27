import { useState, useEffect } from 'react';
import { supabase } from '../supabase/client';

interface PlatformHealth {
  id: string;
  platform: string;
  platform_name: string;
  category: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'circuit_open';
  last_check_at: string;
  consecutive_failures: number;
  avg_response_time: number;
  fallback_strategy: string;
  alternative_platform?: string;
}

const statusConfig = {
  healthy: { color: 'bg-green-500', text: '健康', icon: 'fa-check-circle' },
  degraded: { color: 'bg-yellow-500', text: '降级', icon: 'fa-exclamation-circle' },
  unhealthy: { color: 'bg-red-500', text: '异常', icon: 'fa-times-circle' },
  circuit_open: { color: 'bg-gray-500', text: '熔断', icon: 'fa-ban' },
};

const categoryLabels: Record<string, string> = {
  tech: '技术社区',
  social: '社交媒体',
  media: '短视频/资讯',
  international: '国际平台',
};

export function PlatformHealthStatus() {
  const [platforms, setPlatforms] = useState<PlatformHealth[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  useEffect(() => {
    fetchHealthStatus();
    const interval = setInterval(fetchHealthStatus, 60000);
    return () => clearInterval(interval);
  }, []);

  async function fetchHealthStatus() {
    try {
      const { data, error } = await supabase
        .from('platform_health_status')
        .select('*')
        .order('priority', { ascending: true });

      if (error) throw error;
      setPlatforms(data || []);
    } catch (err) {
      console.error('Failed to fetch health status:', err);
    } finally {
      setLoading(false);
    }
  }

  const filteredPlatforms = selectedCategory === 'all'
    ? platforms
    : platforms.filter(p => p.category === selectedCategory);

  const categories = ['all', ...Array.from(new Set(platforms.map(p => p.category)))];

  const healthyCount = platforms.filter(p => p.status === 'healthy').length;
  const degradedCount = platforms.filter(p => p.status === 'degraded').length;
  const unhealthyCount = platforms.filter(p => p.status === 'unhealthy' || p.status === 'circuit_open').length;

  if (loading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="grid grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">平台健康状态</h2>
            <p className="text-sm text-gray-500 mt-1">实时监控30+推广平台API可用性</p>
          </div>
          <button
            onClick={fetchHealthStatus}
            className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <i className="fas fa-sync-alt mr-2"></i>
            刷新
          </button>
        </div>

        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4 border border-green-200">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-green-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-green-800">健康</span>
            </div>
            <p className="text-2xl font-bold text-green-900 mt-1">{healthyCount}</p>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-200">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-yellow-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-yellow-800">降级</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900 mt-1">{degradedCount}</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-200">
            <div className="flex items-center">
              <div className="w-3 h-3 bg-red-500 rounded-full mr-2"></div>
              <span className="text-sm font-medium text-red-800">异常</span>
            </div>
            <p className="text-2xl font-bold text-red-900 mt-1">{unhealthyCount}</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
            <div className="flex items-center">
              <i className="fas fa-shield-alt text-blue-500 mr-2"></i>
              <span className="text-sm font-medium text-blue-800">熔断保护</span>
            </div>
            <p className="text-2xl font-bold text-blue-900 mt-1">开启</p>
          </div>
        </div>
      </div>

      <div className="p-4 border-b border-gray-200 bg-gray-50">
        <div className="flex gap-2">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white'
                  : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
              }`}
            >
              {cat === 'all' ? '全部' : categoryLabels[cat] || cat}
            </button>
          ))}
        </div>
      </div>

      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredPlatforms.map(platform => {
            const config = statusConfig[platform.status];
            return (
              <div
                key={platform.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center">
                    <div className={`w-3 h-3 rounded-full ${config.color} mr-3`}></div>
                    <div>
                      <h3 className="font-medium text-gray-900">{platform.platform_name}</h3>
                      <p className="text-xs text-gray-500">{platform.platform}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                    platform.status === 'healthy' ? 'bg-green-100 text-green-800' :
                    platform.status === 'degraded' ? 'bg-yellow-100 text-yellow-800' :
                    platform.status === 'circuit_open' ? 'bg-gray-100 text-gray-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {config.text}
                  </span>
                </div>

                <div className="mt-4 space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">响应时间</span>
                    <span className="font-medium">{platform.avg_response_time || 0}ms</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">连续失败</span>
                    <span className={`font-medium ${
                      platform.consecutive_failures > 3 ? 'text-red-600' : 'text-gray-900'
                    }`}>
                      {platform.consecutive_failures}
                    </span>
                  </div>
                  {platform.alternative_platform && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-500">备用平台</span>
                      <span className="font-medium text-blue-600">{platform.alternative_platform}</span>
                    </div>
                  )}
                </div>

                <div className="mt-3 pt-3 border-t border-gray-100">
                  <p className="text-xs text-gray-400">
                    最后检查: {new Date(platform.last_check_at).toLocaleTimeString()}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
