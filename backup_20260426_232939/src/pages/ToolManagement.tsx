import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  ArrowLeft, Edit, Trash2, Megaphone, Users, Eye, ExternalLink,
  TrendingUp, DollarSign, Percent, Info, Check, AlertCircle,
  ChevronRight, Sparkles, Wallet, BarChart3, Award
} from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;
type ToolPromotionSetting = Tables<'tool_promotion_settings'>;
type Certificate = Tables<'tool_certificates'>;

interface ToolWithDetails extends Tool {
  certificate?: Certificate;
  promotion_setting?: ToolPromotionSetting;
}

export function ToolManagement() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tool, setTool] = useState<ToolWithDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [showPromoterSettings, setShowPromoterSettings] = useState(false);
  const [saving, setSaving] = useState(false);
  const [promotionSettings, setPromotionSettings] = useState({
    promoter_fee_percentage: 30,
    min_promoter_reward: 10,
    max_promoter_reward: 1000,
    pay_per_conversion: 5,
    pay_per_landing_view: 0,
    daily_budget: 100,
    total_budget: 1000,
  });

  useEffect(() => {
    if (id) {
      fetchToolDetails();
    }
  }, [id]);

  async function fetchToolDetails() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/profile');
        return;
      }

      const { data: toolData } = await supabase
        .from('tools')
        .select('*, certificate:tool_certificates(*), promotion_setting:tool_promotion_settings(*)')
        .eq('id', id)
        .eq('developer_id', user.id)
        .single();

      if (toolData) {
        setTool(toolData);
        if (toolData.promotion_setting) {
          setPromotionSettings({
            promoter_fee_percentage: toolData.promotion_setting.promoter_fee_percentage || 30,
            min_promoter_reward: toolData.promotion_setting.min_promoter_reward || 10,
            max_promoter_reward: toolData.promotion_setting.max_promoter_reward || 1000,
            pay_per_conversion: toolData.promotion_setting.pay_per_conversion || 5,
            pay_per_landing_view: toolData.promotion_setting.pay_per_landing_view || 0,
            daily_budget: toolData.promotion_setting.daily_budget || 100,
            total_budget: toolData.promotion_setting.total_budget || 1000,
          });
        }
      }
    } catch (error) {
      console.error('Error fetching tool:', error);
    } finally {
      setLoading(false);
    }
  }

  async function savePromoterSettings() {
    if (!tool || !id) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase
        .from('tool_promotion_settings')
        .upsert({
          tool_id: id,
          developer_id: user.id,
          promotion_type: 'promoter',
          promoter_fee_percentage: promotionSettings.promoter_fee_percentage,
          platform_fee_percentage: 10,
          min_promoter_reward: promotionSettings.min_promoter_reward,
          max_promoter_reward: promotionSettings.max_promoter_reward,
          pay_per_conversion: promotionSettings.pay_per_conversion,
          pay_per_landing_view: promotionSettings.pay_per_landing_view,
          daily_budget: promotionSettings.daily_budget,
          total_budget: promotionSettings.total_budget,
          is_active: true,
        }, {
          onConflict: 'tool_id'
        });

      if (error) throw error;

      await fetchToolDetails();
      setShowPromoterSettings(false);
    } catch (error) {
      console.error('Error saving settings:', error);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTool() {
    if (!tool || !id) return;
    if (!confirm('确定要删除这个工具吗？此操作不可恢复。')) return;

    try {
      const { error } = await supabase
        .from('tools')
        .delete()
        .eq('id', id);

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error deleting tool:', error);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (!tool) {
    return (
      <div className="pt-20 px-4 max-w-4xl mx-auto text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-4 text-white/20" />
        <h1 className="text-xl font-bold mb-2">工具不存在或无权限访问</h1>
        <p className="text-white/60 mb-6">该工具可能已被删除或您没有管理权限</p>
        <Link
          to="/dashboard"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
        >
          <ArrowLeft className="w-5 h-5 mr-2" />
          返回开发者后台
        </Link>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-6xl mx-auto pb-20">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between mb-8"
      >
        <div className="flex items-center space-x-4">
          <Link
            to="/dashboard"
            className="p-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold">作品管理</h1>
            <p className="text-white/60 text-sm">管理您的工具和推广设置</p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to={`/tool/${tool.id}`}
            className="flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
          >
            <Eye className="w-4 h-4 mr-2" />
            预览
          </Link>
          <button
            onClick={() => setShowPromotionModal(true)}
            className="flex items-center px-4 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
          >
            <Megaphone className="w-4 h-4 mr-2" />
            推广
          </button>
        </div>
      </motion.div>

      {/* Tool Info Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 mb-6"
      >
        <div className="flex items-start space-x-6">
          <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[#8B5CF6]/10 to-[#3B82F6]/10 flex items-center justify-center flex-shrink-0">
            {tool.icon_url ? (
              <img src={tool.icon_url} alt={tool.name} className="w-20 h-20 rounded-xl" />
            ) : (
              <Sparkles className="w-12 h-12 text-[#8B5CF6]" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-3 mb-2">
              <h2 className="text-2xl font-bold">{tool.name}</h2>
              <StatusBadge status={tool.status || 'pending'} />
              {tool.certificate && (
                <span className="flex items-center px-2 py-1 bg-[#8B5CF6]/20 text-[#8B5CF6] text-xs rounded-full">
                  <Award className="w-3 h-3 mr-1" />
                  已确权
                </span>
              )}
            </div>
            <p className="text-white/60 mb-4 line-clamp-2">{tool.description}</p>
            <div className="flex items-center space-x-6 text-sm text-white/40">
              <span className="flex items-center">
                <Eye className="w-4 h-4 mr-1" />
                {tool.view_count || 0} 浏览
              </span>
              <span className="flex items-center">
                <ExternalLink className="w-4 h-4 mr-1" />
                {tool.jump_count || 0} 使用
              </span>
              <span className="flex items-center">
                <TrendingUp className="w-4 h-4 mr-1" />
                转化率 {tool.view_count ? Math.round((tool.jump_count || 0) / tool.view_count * 100) : 0}%
              </span>
            </div>
          </div>
          <div className="flex flex-col space-y-2">
            <Link
              to={`/tool/${tool.id}/edit`}
              className="flex items-center px-4 py-2 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
            >
              <Edit className="w-4 h-4 mr-2" />
              编辑
            </Link>
            <button
              onClick={deleteTool}
              className="flex items-center px-4 py-2 bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl hover:bg-red-500/20 transition-colors"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              删除
            </button>
          </div>
        </div>
      </motion.div>

      {/* Promotion Status */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6"
      >
        {/* Self Promotion Card */}
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center">
                <Megaphone className="w-6 h-6 text-orange-400" />
              </div>
              <div>
                <h3 className="font-bold">智能推广中心</h3>
                <p className="text-sm text-white/60">自己管理推广内容</p>
              </div>
            </div>
            {tool.promotion_setting?.promotion_type === 'self' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                已启用
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mb-4">
            使用AI生成推广文案，一键发布到多个社交平台，自主管理推广策略
          </p>
          <Link
            to={`/promotion/create?tool_id=${tool.id}`}
            className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <Sparkles className="w-4 h-4 mr-2" />
            进入智能推广中心
          </Link>
        </div>

        {/* Promoter Card */}
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                <Users className="w-6 h-6 text-[#8B5CF6]" />
              </div>
              <div>
                <h3 className="font-bold">星推官推广</h3>
                <p className="text-sm text-white/60">让推广者帮您推广</p>
              </div>
            </div>
            {tool.promotion_setting?.promotion_type === 'promoter' && (
              <span className="px-3 py-1 bg-green-500/20 text-green-400 text-sm rounded-full">
                已启用
              </span>
            )}
          </div>
          <p className="text-white/60 text-sm mb-4">
            设置推广奖励，让星推官们帮您推广，按效果付费，扩大影响力
          </p>
          <button
            onClick={() => setShowPromoterSettings(true)}
            className="flex items-center justify-center w-full py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity"
          >
            <DollarSign className="w-4 h-4 mr-2" />
            {tool.promotion_setting?.promotion_type === 'promoter' ? '修改推广设置' : '设置推广奖励'}
          </button>
        </div>
      </motion.div>

      {/* Stats Overview */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6"
      >
        <h3 className="font-bold mb-6 flex items-center">
          <BarChart3 className="w-5 h-5 mr-2 text-[#8B5CF6]" />
          数据概览
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard
            label="总浏览量"
            value={tool.view_count || 0}
            icon={Eye}
            color="text-blue-400"
          />
          <StatCard
            label="总使用次数"
            value={tool.jump_count || 0}
            icon={ExternalLink}
            color="text-green-400"
          />
          <StatCard
            label="转化率"
            value={`${tool.view_count ? Math.round((tool.jump_count || 0) / tool.view_count * 100) : 0}%`}
            icon={TrendingUp}
            color="text-purple-400"
          />
          <StatCard
            label="推广收益"
            value="¥0"
            icon={Wallet}
            color="text-orange-400"
          />
        </div>
      </motion.div>

      {/* Promotion Modal */}
      <AnimatePresence>
        {showPromotionModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPromotionModal(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-md w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">选择推广方式</h2>
              <p className="text-white/60 mb-6">选择适合您的推广策略</p>

              <div className="space-y-4">
                <Link
                  to={`/promotion/create?tool_id=${tool.id}`}
                  className="flex items-center p-4 bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-xl hover:border-orange-500/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-orange-500/20 to-red-500/20 flex items-center justify-center mr-4">
                    <Megaphone className="w-6 h-6 text-orange-400" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-orange-400 transition-colors">智能推广中心</h3>
                    <p className="text-sm text-white/60">AI生成文案，一键多平台发布</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </Link>

                <button
                  onClick={() => {
                    setShowPromotionModal(false);
                    setShowPromoterSettings(true);
                  }}
                  className="flex items-center w-full p-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#3B82F6]/10 border border-[#8B5CF6]/30 rounded-xl hover:border-[#8B5CF6]/50 transition-colors group"
                >
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center mr-4">
                    <Users className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold group-hover:text-[#8B5CF6] transition-colors">星推官推广</h3>
                    <p className="text-sm text-white/60">设置奖励，让推广者帮您推广</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </button>
              </div>

              <button
                onClick={() => setShowPromotionModal(false)}
                className="w-full py-3 mt-6 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                取消
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Promoter Settings Modal */}
      <AnimatePresence>
        {showPromoterSettings && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setShowPromoterSettings(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-xl font-bold mb-2">星推官推广设置</h2>
              <p className="text-white/60 mb-6">设置推广奖励，吸引更多星推官帮您推广</p>

              {/* Fee Structure Info */}
              <div className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4 mb-6">
                <h3 className="font-medium mb-3 flex items-center text-sm">
                  <Info className="w-4 h-4 mr-2 text-[#8B5CF6]" />
                  费用说明
                </h3>
                <div className="space-y-2 text-sm text-white/60">
                  <div className="flex justify-between">
                    <span>平台服务费</span>
                    <span className="text-white">10%</span>
                  </div>
                  <div className="flex justify-between">
                    <span>星推官分成</span>
                    <span className="text-white">{promotionSettings.promoter_fee_percentage}%</span>
                  </div>
                  <div className="flex justify-between border-t border-white/10 pt-2">
                    <span>开发者实际获得</span>
                    <span className="text-green-400">{90 - promotionSettings.promoter_fee_percentage}%</span>
                  </div>
                </div>
              </div>

              {/* Settings Form */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">
                    星推官分成比例 (%)
                  </label>
                  <div className="flex items-center space-x-4">
                    <input
                      type="range"
                      min="10"
                      max="50"
                      value={promotionSettings.promoter_fee_percentage}
                      onChange={(e) => setPromotionSettings({
                        ...promotionSettings,
                        promoter_fee_percentage: parseInt(e.target.value)
                      })}
                      className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#8B5CF6]"
                    />
                    <span className="w-16 text-right font-bold text-[#8B5CF6]">
                      {promotionSettings.promoter_fee_percentage}%
                    </span>
                  </div>
                  <p className="text-xs text-white/40 mt-1">
                    建议设置 20-40%，越高越能吸引星推官
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    最低推广奖励 (¥)
                  </label>
                  <input
                    type="number"
                    value={promotionSettings.min_promoter_reward}
                    onChange={(e) => setPromotionSettings({
                      ...promotionSettings,
                      min_promoter_reward: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                    placeholder="10"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">
                    最高推广奖励 (¥)
                  </label>
                  <input
                    type="number"
                    value={promotionSettings.max_promoter_reward}
                    onChange={(e) => setPromotionSettings({
                      ...promotionSettings,
                      max_promoter_reward: parseInt(e.target.value) || 0
                    })}
                    className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                    placeholder="1000"
                  />
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-medium mb-4 text-sm text-white/80">计费设置</h4>

                  <div>
                    <label className="block text-sm font-medium mb-2">
                      单次转化付费 (¥)
                    </label>
                    <input
                      type="number"
                      value={promotionSettings.pay_per_conversion}
                      onChange={(e) => setPromotionSettings({
                        ...promotionSettings,
                        pay_per_conversion: parseFloat(e.target.value) || 0
                      })}
                      className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                      placeholder="5"
                    />
                    <p className="text-xs text-white/40 mt-1">
                      用户点击"去使用"跳转到您的作品时计费
                    </p>
                  </div>
                </div>

                <div className="border-t border-white/10 pt-4">
                  <h4 className="font-medium mb-4 text-sm text-white/80">预算设置</h4>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium mb-2">
                        每日预算 (¥)
                      </label>
                      <input
                        type="number"
                        value={promotionSettings.daily_budget}
                        onChange={(e) => setPromotionSettings({
                          ...promotionSettings,
                          daily_budget: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                        placeholder="100"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-2">
                        总预算 (¥)
                      </label>
                      <input
                        type="number"
                        value={promotionSettings.total_budget}
                        onChange={(e) => setPromotionSettings({
                          ...promotionSettings,
                          total_budget: parseInt(e.target.value) || 0
                        })}
                        className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
                        placeholder="1000"
                      />
                    </div>
                  </div>
                </div>
              </div>

              {/* Platform Fee Notice */}
              <div className="mt-6 p-4 bg-[#8B5CF6]/10 border border-[#8B5CF6]/30 rounded-xl">
                <div className="flex items-start space-x-3">
                  <Percent className="w-5 h-5 text-[#8B5CF6] flex-shrink-0 mt-0.5" />
                  <div>
                    <h4 className="font-medium text-sm mb-1">平台服务费说明</h4>
                    <p className="text-xs text-white/60">
                      平台将收取 10% 的服务费用于维护推广系统、提供数据分析和技术支持。
                      剩余 90% 由开发者和星推官按设定比例分配。
                    </p>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3 mt-6">
                <button
                  onClick={() => setShowPromoterSettings(false)}
                  className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={savePromoterSettings}
                  disabled={saving}
                  className="flex-1 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                      保存中...
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4 mr-2" />
                      保存设置
                    </>
                  )}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    pending: 'bg-yellow-500/20 text-yellow-400',
    approved: 'bg-green-500/20 text-green-400',
    rejected: 'bg-red-500/20 text-red-400',
  };

  const labels: Record<string, string> = {
    pending: '审核中',
    approved: '已通过',
    rejected: '未通过',
  };

  return (
    <span className={`px-2 py-0.5 rounded text-xs ${styles[status] || styles.pending}`}>
      {labels[status] || '审核中'}
    </span>
  );
}

function StatCard({
  label,
  value,
  icon: Icon,
  color
}: {
  label: string;
  value: string | number;
  icon: React.ElementType;
  color: string;
}) {
  return (
    <div className="bg-[#0F0F1A] border border-white/10 rounded-xl p-4">
      <div className="flex items-center space-x-2 mb-2">
        <Icon className={`w-4 h-4 ${color}`} />
        <span className="text-sm text-white/60">{label}</span>
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
