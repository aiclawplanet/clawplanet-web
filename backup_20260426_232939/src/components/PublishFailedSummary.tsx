import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, Copy, Check, ExternalLink, RefreshCw, X, Shield, Clock, AlertTriangle } from 'lucide-react';
import { supabase } from '../supabase/client';

interface FailedPublish {
  id: string;
  platform: string;
  platform_name: string;
  error_message: string;
  error_type: string;
  content: string;
  title?: string;
  created_at: string;
  retry_count: number;
}

interface PlatformHealth {
  platform: string;
  status: 'healthy' | 'degraded' | 'unhealthy' | 'circuit_open';
  platform_name: string;
}

const statusConfig = {
  healthy: { color: 'bg-green-500', text: '健康', icon: '●' },
  degraded: { color: 'bg-yellow-500', text: '降级', icon: '●' },
  unhealthy: { color: 'bg-red-500', text: '异常', icon: '●' },
  circuit_open: { color: 'bg-gray-500', text: '熔断', icon: '●' },
};

const errorTypeLabels: Record<string, string> = {
  token_expired: '授权过期',
  rate_limit: '频率限制',
  network: '网络异常',
  content_violation: '内容违规',
  circuit_open: '平台熔断',
  unknown: '未知错误',
};

export function PublishFailedSummary({ contentId, onClose }: { contentId: string; onClose: () => void }) {
  const [failedPublishes, setFailedPublishes] = useState<FailedPublish[]>([]);
  const [platformHealth, setPlatformHealth] = useState<Map<string, PlatformHealth>>(new Map());
  const [loading, setLoading] = useState(true);
  const [copiedPlatform, setCopiedPlatform] = useState<string | null>(null);
  const [expandedPlatform, setExpandedPlatform] = useState<string | null>(null);

  useEffect(() => {
    fetchFailedPublishes();
    fetchPlatformHealth();
  }, [contentId]);

  async function fetchFailedPublishes() {
    try {
      const { data, error } = await supabase
        .from('promotion_publish_logs')
        .select('*')
        .eq('content_id', contentId)
        .eq('status', 'failed')
        .order('created_at', { ascending: false });

      if (error) throw error;

      const enrichedData = await Promise.all(
        (data || []).map(async (log) => {
          const { data: healthData } = await supabase
            .from('platform_health_status')
            .select('platform_name')
            .eq('platform', log.platform)
            .single();

          return {
            ...log,
            platform_name: healthData?.platform_name || log.platform,
          };
        })
      );

      setFailedPublishes(enrichedData);
    } catch (err) {
      console.error('Failed to fetch failed publishes:', err);
    } finally {
      setLoading(false);
    }
  }

  async function fetchPlatformHealth() {
    try {
      const { data, error } = await supabase
        .from('platform_health_status')
        .select('*');

      if (error) throw error;

      const healthMap = new Map();
      data?.forEach((h: PlatformHealth) => {
        healthMap.set(h.platform, h);
      });
      setPlatformHealth(healthMap);
    } catch (err) {
      console.error('Failed to fetch platform health:', err);
    }
  }

  async function copyContent(content: string, platform: string) {
    try {
      await navigator.clipboard.writeText(content);
      setCopiedPlatform(platform);
      setTimeout(() => setCopiedPlatform(null), 2000);
    } catch (err) {
      console.error('Copy failed:', err);
    }
  }

  function getPlatformUrl(platform: string): string {
    const urls: Record<string, string> = {
      wechat: 'https://mp.weixin.qq.com',
      xiaohongshu: 'https://creator.xiaohongshu.com',
      jike: 'https://web.okjike.com',
      zhihu: 'https://zhuanlan.zhihu.com/write',
      weibo: 'https://weibo.com',
      juejin: 'https://juejin.cn/editor/drafts/new',
      github: 'https://github.com',
      csdn: 'https://mp.csdn.net',
      v2ex: 'https://www.v2ex.com/new',
      segmentfault: 'https://segmentfault.com/write',
      jianshu: 'https://www.jianshu.com/writer',
      bilibili: 'https://member.bilibili.com/platform/upload-manager/article',
      douyin: 'https://creator.douyin.com',
      kuaishou: 'https://cp.kuaishou.com/article/publish',
      toutiao: 'https://mp.toutiao.com',
      baijiahao: 'https://baijiahao.baidu.com/builder/rc/edit',
      sohu: 'https://mp.sohu.com',
      netease: 'https://mp.163.com',
      twitter: 'https://twitter.com/compose/tweet',
      linkedin: 'https://www.linkedin.com/post/new',
      producthunt: 'https://www.producthunt.com/posts/new',
      hackernews: 'https://news.ycombinator.com/submit',
      reddit: 'https://www.reddit.com/submit',
      devto: 'https://dev.to/new',
      medium: 'https://medium.com/new-story',
      discord: 'https://discord.com/channels/@me',
      telegram: 'https://web.telegram.org',
    };
    return urls[platform] || '';
  }

  async function retryPublish(platform: string) {
    const health = platformHealth.get(platform);
    if (health?.status === 'circuit_open' || health?.status === 'unhealthy') {
      alert('该平台当前处于熔断状态，请稍后重试或手动发布');
      return;
    }

    try {
      const { data: session } = await supabase.auth.getSession();
      if (!session.session) {
        alert('请先登录');
        return;
      }

      const supabaseUrl = (window as any).MEOO_CONFIG?.meoo_app_access_url || location.origin;
      const functionUrl = `${supabaseUrl}/sb-api/functions/v1/publish-to-platforms`;

      const response = await fetch(functionUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${session.session.access_token}`,
        },
        body: JSON.stringify({
          contentId,
          platforms: [platform],
          useCircuitBreaker: true,
          enableFallback: true,
        }),
      });

      const result = await response.json();

      if (result.success) {
        alert('发布成功！');
        fetchFailedPublishes();
      } else {
        alert(`发布失败: ${result.results?.[0]?.error || '未知错误'}`);
      }
    } catch (err) {
      console.error('Retry failed:', err);
      alert('重试失败，请稍后重试');
    }
  }

  if (loading) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-[#1a1a1f] border border-white/10 rounded-xl p-8">
          <div className="flex items-center justify-center">
            <RefreshCw className="w-8 h-8 animate-spin text-orange-500" />
          </div>
        </div>
      </div>
    );
  }

  if (failedPublishes.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1a1a1f] border border-white/10 rounded-xl w-full max-w-lg p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Check className="w-5 h-5 text-green-400" />
              发布状态
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <p className="text-white/60 text-center py-8">所有平台均已成功发布！</p>
        </motion.div>
      </div>
    );
  }

  const groupedByError = failedPublishes.reduce((acc, item) => {
    const type = item.error_type || 'unknown';
    if (!acc[type]) acc[type] = [];
    acc[type].push(item);
    return acc;
  }, {} as Record<string, FailedPublish[]>);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#1a1a1f] border border-white/10 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
      >
        <div className="p-4 border-b border-white/10 bg-red-500/10">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-red-400" />
              发布失败汇总
              <span className="px-2 py-0.5 text-xs bg-red-500/20 text-red-400 rounded-full">
                {failedPublishes.length}个平台
              </span>
            </h3>
            <button onClick={onClose} className="p-1 hover:bg-white/10 rounded">
              <X className="w-5 h-5 text-white/60" />
            </button>
          </div>
          <p className="text-sm text-white/60 mt-2">
            以下平台自动发布失败，您可以复制文案手动发布，或等待系统自动重试
          </p>
        </div>

        <div className="p-4 overflow-y-auto max-h-[60vh] space-y-4">
          {Object.entries(groupedByError).map(([errorType, items]) => (
            <div key={errorType} className="bg-white/5 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle className="w-4 h-4 text-yellow-400" />
                <span className="font-medium text-sm">{errorTypeLabels[errorType] || errorType}</span>
                <span className="text-xs text-white/40">({items.length}个平台)</span>
              </div>

              <div className="space-y-3">
                {items.map((item) => {
                  const health = platformHealth.get(item.platform);
                  const status = health ? statusConfig[health.status] : null;
                  const isExpanded = expandedPlatform === item.id;

                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="bg-white/5 rounded-lg p-3 border border-white/10"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{item.platform_name}</span>
                          {status && (
                            <span className={`flex items-center gap-1 text-xs ${status.color.replace('bg-', 'text-')}`}>
                              <span className={`w-2 h-2 rounded-full ${status.color}`}></span>
                              {status.text}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => copyContent(item.content, item.platform)}
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title="复制文案"
                          >
                            {copiedPlatform === item.platform ? (
                              <Check className="w-4 h-4 text-green-400" />
                            ) : (
                              <Copy className="w-4 h-4" />
                            )}
                          </button>
                          <a
                            href={getPlatformUrl(item.platform)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-2 bg-white/10 hover:bg-white/20 rounded-lg transition-colors"
                            title="前往平台手动发布"
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                          <button
                            onClick={() => retryPublish(item.platform)}
                            disabled={health?.status === 'circuit_open' || health?.status === 'unhealthy'}
                            className="p-2 bg-orange-500/20 hover:bg-orange-500/30 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-colors"
                            title="重新尝试自动发布"
                          >
                            <RefreshCw className="w-4 h-4 text-orange-400" />
                          </button>
                        </div>
                      </div>

                      <div className="mt-2 text-xs text-white/40">
                        失败时间: {new Date(item.created_at).toLocaleString()} · 已重试{item.retry_count || 0}次
                      </div>

                      {item.error_message && (
                        <div className="mt-2 text-xs text-red-400 bg-red-500/10 rounded px-2 py-1">
                          错误: {item.error_message}
                        </div>
                      )}

                      <button
                        onClick={() => setExpandedPlatform(isExpanded ? null : item.id)}
                        className="mt-2 text-xs text-orange-400 hover:text-orange-300"
                      >
                        {isExpanded ? '收起文案' : '查看文案'}
                      </button>

                      <AnimatePresence>
                        {isExpanded && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            className="mt-2 overflow-hidden"
                          >
                            <div className="bg-white/5 rounded p-3 text-sm text-white/80 whitespace-pre-wrap max-h-40 overflow-y-auto">
                              {item.title && <div className="font-medium mb-2">{item.title}</div>}
                              {item.content}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        <div className="p-4 border-t border-white/10 bg-white/5">
          <div className="flex items-start gap-3 text-sm text-white/60">
            <Shield className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-white/80 mb-1">熔断保护说明</p>
              <p className="text-xs">
                处于"熔断"状态的平台暂时无法自动发布，系统会在5分钟后自动检测恢复。
                您可以选择手动发布，或等待系统恢复后自动重试（最多重试3次）。
              </p>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
