import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Megaphone, Plus, FileText, Calendar, ChevronRight, Sparkles, Loader2, Link2, Shield, Zap, BarChart3, Edit3, Clock, RefreshCw } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type PromotionContent = Tables<'promotion_contents'>;

const platformIcons: Record<string, { name: string; abbr: string; bgColor: string }> = {
  wechat: { name: '微信公众号', abbr: '微信', bgColor: 'bg-[#07C160]' },
  xiaohongshu: { name: '小红书', abbr: '小红书', bgColor: 'bg-[#FF2442]' },
  jike: { name: '即刻', abbr: '即刻', bgColor: 'bg-[#FFE411]' },
  zhihu: { name: '知乎', abbr: '知乎', bgColor: 'bg-[#0084FF]' },
  pengyouquan: { name: '朋友圈', abbr: '朋友圈', bgColor: 'bg-[#07C160]' },
  weibo: { name: '微博', abbr: '微博', bgColor: 'bg-[#E6162D]' },
  juejin: { name: '掘金', abbr: '掘金', bgColor: 'bg-[#1E80FF]' },
  github: { name: 'GitHub', abbr: 'GH', bgColor: 'bg-[#333333]' },
  csdn: { name: 'CSDN', abbr: 'CSDN', bgColor: 'bg-[#FC5531]' },
  v2ex: { name: 'V2EX', abbr: 'V2', bgColor: 'bg-[#1E80FF]' },
  segmentfault: { name: '思否', abbr: 'SF', bgColor: 'bg-[#009A61]' },
  jianshu: { name: '简书', abbr: '简书', bgColor: 'bg-[#EA6F5A]' },
  bilibili: { name: 'B站', abbr: 'B站', bgColor: 'bg-[#00A1D6]' },
  douyin: { name: '抖音', abbr: '抖音', bgColor: 'bg-[#1a1a1a]' },
  kuaishou: { name: '快手', abbr: '快手', bgColor: 'bg-[#FF5000]' },
  toutiao: { name: '头条号', abbr: '头条', bgColor: 'bg-[#ED4040]' },
  baijiahao: { name: '百家号', abbr: '百家', bgColor: 'bg-[#2932E1]' },
  sohu: { name: '搜狐号', abbr: '搜狐', bgColor: 'bg-[#FF8200]' },
  netease: { name: '网易号', abbr: '网易', bgColor: 'bg-[#C41E3A]' },
  twitter: { name: 'Twitter/X', abbr: 'X', bgColor: 'bg-[#000000]' },
  linkedin: { name: 'LinkedIn', abbr: 'in', bgColor: 'bg-[#0A66C2]' },
  producthunt: { name: 'Product Hunt', abbr: 'PH', bgColor: 'bg-[#DA552F]' },
  hackernews: { name: 'Hacker News', abbr: 'HN', bgColor: 'bg-[#FF6600]' },
  reddit: { name: 'Reddit', abbr: 'R', bgColor: 'bg-[#FF4500]' },
  devto: { name: 'Dev.to', abbr: 'DEV', bgColor: 'bg-[#0D0D0D]' },
  medium: { name: 'Medium', abbr: 'M', bgColor: 'bg-[#121212]' },
  discord: { name: 'Discord', abbr: 'D', bgColor: 'bg-[#5865F2]' },
  telegram: { name: 'Telegram', abbr: 'TG', bgColor: 'bg-[#26A5E4]' },
};

export function PromotionCenter() {
  const navigate = useNavigate();
  const [promotions, setPromotions] = useState<PromotionContent[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    total: 0,
    draft: 0,
    published: 0,
    scheduled: 0,
  });

  useEffect(() => {
    fetchPromotions();
  }, []);

  async function fetchPromotions() {
    try {
      const { data: userData } = await supabase.auth.getUser();

      if (!userData.user) {
        // 未登录状态显示演示数据
        setPromotions([]);
        setStats({ total: 0, draft: 0, published: 0, scheduled: 0 });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase
        .from('promotion_contents')
        .select('*')
        .eq('user_id', userData.user.id)
        .order('created_at', { ascending: false })
        .limit(5);

      if (error) throw error;

      setPromotions(data || []);

      const { data: allData } = await supabase
        .from('promotion_contents')
        .select('status')
        .eq('user_id', userData.user.id);

      if (allData) {
        setStats({
          total: allData.length,
          draft: allData.filter(p => p.status === 'draft').length,
          published: allData.filter(p => p.status === 'published').length,
          scheduled: allData.filter(p => p.status === 'scheduled').length,
        });
      }
    } catch (error) {
      console.error('Error fetching promotions:', error);
    } finally {
      setLoading(false);
    }
  }

  function getStatusBadge(status: string | null) {
    const statusMap: Record<string, { text: string; className: string }> = {
      draft: { text: '草稿', className: 'bg-gray-500/20 text-gray-400' },
      reviewing: { text: '审核中', className: 'bg-yellow-500/20 text-yellow-400' },
      approved: { text: '已通过', className: 'bg-green-500/20 text-green-400' },
      scheduled: { text: '已排期', className: 'bg-blue-500/20 text-blue-400' },
      published: { text: '已发布', className: 'bg-green-500/20 text-green-400' },
      archived: { text: '已归档', className: 'bg-gray-500/20 text-gray-400' },
    };
    const { text, className } = statusMap[status || 'draft'] || statusMap.draft;
    return (
      <span className={`px-2 py-1 rounded-full text-xs ${className}`}>
        {text}
      </span>
    );
  }

  function getPlatformNames(content: Record<string, any>) {
    const platforms = Object.keys(content || {});
    return platforms.map(p => platformIcons[p]?.name || p).slice(0, 3).join('、');
  }

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-white pt-20">
      <div className="max-w-6xl mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="flex items-center gap-3 mb-2">
            <Megaphone className="w-8 h-8 text-orange-500" />
            <h1 className="text-3xl font-bold">智能推广中心</h1>
          </div>
          <p className="text-white/60">AI一键生成多平台推广文案，让好工具被看见</p>
          <div className="mt-4 bg-orange-500/10 border border-orange-500/30 rounded-lg p-3 flex items-start gap-3">
            <Sparkles className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/80">
              <p className="font-medium text-orange-400 mb-1">温馨提示</p>
              <p>AI生成文案后，您可以点击任意平台文案进行编辑修改；也支持使用其他智能体生成文案后，一键复制粘贴到对应平台文本框中。智能推广中心支持推广文案的编辑和一键发送功能。</p>
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.05 }}
            className="mt-4 bg-blue-500/10 border border-blue-500/30 rounded-xl p-4"
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                <Shield className="w-5 h-5 text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-medium text-blue-400 mb-2 flex items-center gap-2">
                  平台熔断保护机制
                  <span className="px-2 py-0.5 text-xs bg-green-500/20 text-green-400 rounded-full">已开启</span>
                </h3>
                <p className="text-white/60 text-sm mb-3">
                  系统实时监控30+推广平台的API健康状态。当某个平台连续失败达到阈值时，自动触发熔断保护，避免无效请求，并自动切换到备用平台或加入重试队列。
                </p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-white/80">健康</span>
                    </div>
                    <p className="text-white/40">平台正常，可正常发布</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                      <span className="text-white/80">降级</span>
                    </div>
                    <p className="text-white/40">偶发失败，仍尝试发布</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-red-500 rounded-full"></div>
                      <span className="text-white/80">熔断</span>
                    </div>
                    <p className="text-white/40">连续失败，暂停自动发布</p>
                  </div>
                  <div className="bg-white/5 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
                      <span className="text-white/80">备用</span>
                    </div>
                    <p className="text-white/40">自动切换同类替代平台</p>
                  </div>
                </div>
                <div className="mt-3 flex items-center gap-4 text-xs text-white/40">
                  <span className="flex items-center gap-1">
                    <Zap className="w-3 h-3" />
                    熔断阈值：连续5次失败
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    恢复时间：5分钟后自动检测
                  </span>
                  <span className="flex items-center gap-1">
                    <RefreshCw className="w-3 h-3" />
                    失败任务自动重试3次
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-xl p-6"
          >
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-orange-400" />
              为什么选择虾蛋星球智能推广？
            </h2>
            <div className="grid md:grid-cols-5 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-orange-500/20 flex items-center justify-center flex-shrink-0">
                  <Zap className="w-5 h-5 text-orange-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">一站式管理</h3>
                  <p className="text-white/60 text-xs">无需频繁切换25+个平台，在虾蛋星球完成所有操作</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center flex-shrink-0">
                  <Shield className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">账号安全</h3>
                  <p className="text-white/60 text-xs">平台授权Token加密存储，仅用于发布内容，数据安全有保障</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-blue-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">效率提升</h3>
                  <p className="text-white/60 text-xs">生成→编辑→发布全流程在一个平台完成</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center flex-shrink-0">
                  <BarChart3 className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">发布追踪</h3>
                  <p className="text-white/60 text-xs">支持查看发布成功/失败状态，可以跳转到已发布内容的平台链接查看效果</p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-pink-500/20 flex items-center justify-center flex-shrink-0">
                  <Edit3 className="w-5 h-5 text-pink-400" />
                </div>
                <div>
                  <h3 className="font-medium text-sm mb-1">灵活编辑</h3>
                  <p className="text-white/60 text-xs">AI生成、手动编辑、外部复制粘贴三种方式</p>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-2xl font-bold mb-1">{stats.total}</div>
            <div className="text-white/60 text-sm">推广内容</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.25 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-2xl font-bold mb-1 text-yellow-400">{stats.draft}</div>
            <div className="text-white/60 text-sm">草稿</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-2xl font-bold mb-1 text-blue-400">{stats.scheduled}</div>
            <div className="text-white/60 text-sm">待发布</div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="bg-white/5 border border-white/10 rounded-xl p-4"
          >
            <div className="text-2xl font-bold mb-1 text-green-400">{stats.published}</div>
            <div className="text-white/60 text-sm">已发布</div>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            onClick={() => navigate('/promotion/create')}
            className="bg-gradient-to-br from-orange-500 to-red-500 rounded-xl p-6 text-left hover:from-orange-600 hover:to-red-600 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <Sparkles className="w-8 h-8" />
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold mb-1">AI生成文案</h3>
            <p className="text-white/80 text-sm">一次配置，支持25+平台一键触达，告别多平台切换，推广从未如此简单</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            onClick={() => navigate('/promotion/list')}
            className="bg-white/5 border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 text-blue-400" />
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold mb-1">我的推广</h3>
            <p className="text-white/60 text-sm">管理所有推广内容和发布状态</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            onClick={() => navigate('/promotion/settings')}
            className="bg-white/5 border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <Link2 className="w-8 h-8 text-green-400" />
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold mb-1">平台授权</h3>
            <p className="text-white/60 text-sm">连接社交账号，实现一键发布，Token加密存储，安全可靠</p>
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            onClick={() => navigate('/promotion/templates')}
            className="bg-white/5 border border-white/10 rounded-xl p-6 text-left hover:bg-white/10 transition-all group cursor-pointer"
          >
            <div className="flex items-center justify-between mb-4">
              <Calendar className="w-8 h-8 text-purple-400" />
              <ChevronRight className="w-5 h-5 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <h3 className="text-lg font-semibold mb-1">文案模板</h3>
            <p className="text-white/60 text-sm">使用预设模板快速创建内容</p>
          </motion.button>
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="bg-white/5 border border-white/10 rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">最近创建</h2>
            <button
              onClick={() => navigate('/promotion/list')}
              className="text-orange-500 hover:text-orange-400 text-sm flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-orange-500" />
            </div>
          ) : promotions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="w-12 h-12 text-white/20 mx-auto mb-4" />
              <p className="text-white/60 mb-4">还没有创建推广内容</p>
              <button
                onClick={() => navigate('/promotion/create')}
                className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
              >
                <Plus className="w-4 h-4" />
                创建第一个推广
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              {promotions.map((promotion) => (
                <motion.div
                  key={promotion.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="bg-white/5 rounded-lg p-4 flex items-center justify-between hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => navigate(`/promotion/${promotion.id}`)}
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="font-medium">{promotion.title}</h3>
                      {getStatusBadge(promotion.status)}
                    </div>
                    <p className="text-white/60 text-sm">
                      适配平台：{getPlatformNames(promotion.content as Record<string, any>)}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </motion.div>
              ))}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
