import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Upload, Check, AlertCircle, Code, ChevronRight, Plus, Trash2, ExternalLink, Smartphone, Globe, AppWindow, CheckCircle, XCircle, Clock, Wrench as WrenchIcon } from 'lucide-react';
import { supabase } from '../supabase/client';
import { decode } from 'base64-arraybuffer';
import type { Tables } from '../supabase/types';

type Tool = Tables<'tools'>;

interface PlatformLink {
  id: string;
  platform: string;
  platformName: string;
  url: string;
  icon: string;
  qrCodeUrl?: string;
}

// 需要二维码的平台列表（无法直接跳转的平台）
const QR_CODE_PLATFORMS = [
  'wechat_miniprogram', 'alipay_miniprogram', 'baidu_miniprogram',
  'bytedance_miniprogram', 'qq_miniprogram', 'kuaishou_miniprogram',
  'android_360', 'android_baidu', 'android_wandoujia'
];

// 检查平台是否需要二维码
function needsQrCode(platform: string): boolean {
  return QR_CODE_PLATFORMS.includes(platform);
}

const PLATFORM_OPTIONS = [
  { value: 'wechat_miniprogram', label: '微信小程序', icon: '微信', color: '#07C160', category: '小程序' },
  { value: 'alipay_miniprogram', label: '支付宝小程序', icon: '支付宝', color: '#1677FF', category: '小程序' },
  { value: 'baidu_miniprogram', label: '百度小程序', icon: '百度', color: '#2932E1', category: '小程序' },
  { value: 'bytedance_miniprogram', label: '抖音小程序', icon: '抖音', color: '#000000', category: '小程序' },
  { value: 'qq_miniprogram', label: 'QQ小程序', icon: 'QQ', color: '#12B7F5', category: '小程序' },
  { value: 'kuaishou_miniprogram', label: '快手小程序', icon: '快手', color: '#FF5000', category: '小程序' },
  { value: 'ios_app_store', label: 'App Store', icon: 'iOS', color: '#007AFF', category: '应用商店' },
  { value: 'android_huawei', label: '华为应用市场', icon: '华为', color: '#FF0000', category: '应用商店' },
  { value: 'android_xiaomi', label: '小米应用商店', icon: '小米', color: '#FF6900', category: '应用商店' },
  { value: 'android_oppo', label: 'OPPO应用商店', icon: 'OPPO', color: '#009B77', category: '应用商店' },
  { value: 'android_vivo', label: 'vivo应用商店', icon: 'vivo', color: '#415FFF', category: '应用商店' },
  { value: 'android_tencent', label: '应用宝', icon: '应用宝', color: '#00A1D6', category: '应用商店' },
  { value: 'android_360', label: '360手机助手', icon: '360', color: '#00C853', category: '应用商店' },
  { value: 'android_baidu', label: '百度手机助手', icon: '百度', color: '#2932E1', category: '应用商店' },
  { value: 'android_wandoujia', label: '豌豆荚', icon: '豌豆荚', color: '#4CAF50', category: '应用商店' },
  { value: 'web_official', label: '官方网站', icon: '官网', color: '#8B5CF6', category: '网页' },
  { value: 'web_h5', label: 'H5页面', icon: 'H5', color: '#3B82F6', category: '网页' },
  { value: 'web_github', label: 'GitHub', icon: 'GitHub', color: '#333333', category: '网页' },
  { value: 'web_gitee', label: 'Gitee', icon: 'Gitee', color: '#C71D23', category: '网页' },
];

export function DeveloperJoin() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    developerStory: '',
    categoryId: '',
    tags: '',
    iconUrl: '',
  });
  const [platformLinks, setPlatformLinks] = useState<PlatformLink[]>([]);
  const [showAddPlatform, setShowAddPlatform] = useState(false);
  const [newPlatform, setNewPlatform] = useState({ platform: '', url: '', qrCodeUrl: '' });
  const [uploadingQrCode, setUploadingQrCode] = useState(false);
  const [uploadingIcon, setUploadingIcon] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const [myTools, setMyTools] = useState<Tool[]>([]);
  const [isDeveloper, setIsDeveloper] = useState(false);
  // viewMode: 'form' = 新工具表单, 'existing' = 已有工具列表
  const [viewMode, setViewMode] = useState<'form' | 'existing'>('form');

  useEffect(() => {
    async function checkUser() {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);

      if (user) {
        // 检查是否为已认证开发者
        const { data: profile } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();

        const devStatus = profile?.role === 'developer' || profile?.role === 'admin';
        setIsDeveloper(devStatus);

        // 获取用户已有工具（任何状态）
        const { data: toolsData } = await supabase
          .from('tools')
          .select('*')
          .eq('developer_id', user.id)
          .order('created_at', { ascending: false });

        setMyTools(toolsData || []);
      }

      setCheckingAuth(false);
    }
    checkUser();
  }, []);

  function addPlatformLink() {
    if (!newPlatform.platform || !newPlatform.url) return;

    const platformOption = PLATFORM_OPTIONS.find(p => p.value === newPlatform.platform);
    if (!platformOption) return;

    // 检查是否需要二维码
    const requiresQr = needsQrCode(newPlatform.platform);
    if (requiresQr && !newPlatform.qrCodeUrl) {
      setError('该平台需要上传二维码图片');
      return;
    }

    const link: PlatformLink = {
      id: Date.now().toString(),
      platform: newPlatform.platform,
      platformName: platformOption.label,
      url: newPlatform.url,
      icon: platformOption.icon,
      qrCodeUrl: newPlatform.qrCodeUrl || undefined,
    };

    setPlatformLinks([...platformLinks, link]);
    setNewPlatform({ platform: '', url: '', qrCodeUrl: '' });
    setShowAddPlatform(false);
    setError('');
  }

  async function handleQrCodeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQrCode(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `qrcode-${Date.now()}.${fileExt}`;

      // Convert file to base64 then to ArrayBuffer for Supabase storage
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const arrayBuffer = decode(base64);

          const { data, error: uploadError } = await supabase.storage
            .from('promotion-assets')
            .upload(`qrcodes/${fileName}`, arrayBuffer, {
              contentType: file.type,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('promotion-assets')
            .getPublicUrl(`qrcodes/${fileName}`);

          setNewPlatform({ ...newPlatform, qrCodeUrl: publicUrl });
        } catch (err: any) {
          console.error('Upload error:', err);
          setError('二维码上传失败: ' + (err.message || '请重试'));
        } finally {
          setUploadingQrCode(false);
        }
      };
      reader.onerror = () => {
        setError('读取文件失败，请重试');
        setUploadingQrCode(false);
      };
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('二维码上传失败: ' + (err.message || '请重试'));
      setUploadingQrCode(false);
    }
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `icon-${Date.now()}.${fileExt}`;

      // Convert file to base64 then to ArrayBuffer for Supabase storage
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const arrayBuffer = decode(base64);

          const { data, error: uploadError } = await supabase.storage
            .from('promotion-assets')
            .upload(`icons/${fileName}`, arrayBuffer, {
              contentType: file.type,
            });

          if (uploadError) throw uploadError;

          const { data: { publicUrl } } = supabase.storage
            .from('promotion-assets')
            .getPublicUrl(`icons/${fileName}`);

          setFormData({ ...formData, iconUrl: publicUrl });
        } catch (err: any) {
          console.error('Upload error:', err);
          setError('头像上传失败: ' + (err.message || '请重试'));
        } finally {
          setUploadingIcon(false);
        }
      };
      reader.onerror = () => {
        setError('读取文件失败，请重试');
        setUploadingIcon(false);
      };
    } catch (err: any) {
      console.error('Upload error:', err);
      setError('头像上传失败: ' + (err.message || '请重试'));
      setUploadingIcon(false);
    }
  }

  function removePlatformLink(id: string) {
    setPlatformLinks(platformLinks.filter(link => link.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setIsSubmitting(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (!user) {
        setError('请先登录后再提交');
        setIsSubmitting(false);
        return;
      }

      if (platformLinks.length === 0) {
        setError('请至少添加一个平台链接');
        setIsSubmitting(false);
        return;
      }

      // Create tool with primary link
      const primaryLink = platformLinks[0];
      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .insert({
          name: formData.name,
          description: formData.description,
          developer_story: formData.developerStory,
          category_id: formData.categoryId || null,
          jump_url: primaryLink.url,
          jump_type: getJumpType(primaryLink.platform),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          developer_id: user.id,
          status: 'pending',
          icon_url: formData.iconUrl || null,
        })
        .select()
        .single();

      if (toolError) throw toolError;

      if (toolData) {
        // Insert all platform links
        const platformLinksData = platformLinks.map((link, index) => ({
          tool_id: toolData.id,
          platform: link.platform,
          platform_name: link.platformName,
          url: link.url,
          icon: link.icon,
          qr_code_url: link.qrCodeUrl || null,
          sort_order: index,
          is_active: true,
        }));

        const { error: linksError } = await supabase
          .from('tool_platform_links')
          .insert(platformLinksData);

        if (linksError) throw linksError;

        // Generate certificate
        const certificateCode = `CLAW-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        const hashValue = await generateHash(toolData.id + certificateCode);

        await supabase.from('tool_certificates').insert({
          tool_id: toolData.id,
          certificate_code: certificateCode,
          hash_value: hashValue,
          timestamp: new Date().toISOString(),
        });

        // Create developer application record for admin review
        // First check if application already exists
        const { data: existingApp } = await supabase
          .from('developer_applications')
          .select('id')
          .eq('user_id', user.id)
          .eq('status', 'pending')
          .maybeSingle();

        if (!existingApp) {
          const { error: appError } = await supabase
            .from('developer_applications')
            .insert({
              user_id: user.id,
              contact_name: user.user_metadata?.username || user.email?.split('@')[0] || '未知用户',
              bio: formData.developerStory || '申请成为开发者',
              status: 'pending',
              applied_at: new Date().toISOString(),
            });

          if (appError) {
            console.error('Developer application error:', appError);
          }
        }

        setSuccess(true);
        setTimeout(() => {
          navigate('/dashboard');
        }, 2000);
      }
    } catch (err: any) {
      setError(err.message || '提交失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  }

  function getJumpType(platform: string): string {
    if (platform.includes('miniprogram')) return 'miniprogram';
    if (platform.includes('app') || platform.includes('android') || platform.includes('ios')) return 'app';
    return 'h5';
  }

  async function generateHash(input: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(input);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // 状态徽章组件
  function StatusBadge({ status }: { status: string }) {
    const config: Record<string, { label: string; color: string }> = {
      pending: { label: '审核中', color: 'text-yellow-400 bg-yellow-400/10' },
      approved: { label: '已上线', color: 'text-green-400 bg-green-400/10' },
      rejected: { label: '已拒绝', color: 'text-red-400 bg-red-400/10' },
    };
    const c = config[status] || config.pending;
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full ${c.color}`}>
        {c.label}
      </span>
    );
  }

  if (checkingAuth) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto">
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="relative mb-8"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-full blur-3xl opacity-30"></div>
            <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-[#8B5CF6] to-[#3B82F6] flex items-center justify-center">
              <Code className="w-12 h-12 text-white" />
            </div>
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
              className="absolute -inset-4"
            >
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6] absolute top-0 left-1/2 -translate-x-1/2"></div>
              <div className="w-2 h-2 rounded-full bg-[#3B82F6] absolute bottom-0 left-1/2 -translate-x-1/2"></div>
              <div className="w-2 h-2 rounded-full bg-[#8B5CF6] absolute left-0 top-1/2 -translate-y-1/2"></div>
              <div className="w-2 h-2 rounded-full bg-[#3B82F6] absolute right-0 top-1/2 -translate-y-1/2"></div>
            </motion.div>
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-3xl font-bold mb-3"
          >
            成为虾匠
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="text-white/60 mb-2 text-center max-w-md"
          >
            让每个好工具，遇见需要它的人
          </motion.p>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="text-white/50 mb-6 text-center max-w-md text-sm"
          >
            加入虾匠计划，展示你的作品，获得更多曝光和用户
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
            className="flex items-center space-x-6 mb-8 text-sm text-white/40"
          >
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#8B5CF6] mr-2"></span>
              免费入驻
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#3B82F6] mr-2"></span>
              数字IP确权
            </span>
            <span className="flex items-center">
              <span className="w-1.5 h-1.5 rounded-full bg-[#10B981] mr-2"></span>
              数据看板
            </span>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Link
              to="/profile"
              className="group inline-flex items-center px-8 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium text-lg hover:shadow-lg hover:shadow-[#8B5CF6]/25 transition-all"
            >
              立即入驻
              <ChevronRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="text-center py-20"
        >
          <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-green-500/20 flex items-center justify-center">
            <Check className="w-10 h-10 text-green-400" />
          </div>
          <h2 className="text-2xl font-bold mb-2">提交成功！</h2>
          <p className="text-white/60 mb-6">
            你的工具已提交审核，审核通过后将展示在虾蛋星球。
          </p>
          <Link
            to="/dashboard"
            className="inline-block px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
          >
            查看我的工具
          </Link>
        </motion.div>
      </div>
    );
  }

  // ✅ 已认证开发者：展示已有工具 + 可新增工具
  if (isDeveloper) {
    // 根据 viewMode 切换：'existing' 看列表，'form' 提交新工具
    if (viewMode === 'form') {
      // 继续执行下面的主表单（复用表单逻辑）
    } else {
      return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <button
              onClick={() => navigate('/')}
              className="flex items-center text-white/60 hover:text-white mb-2 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              返回首页
            </button>
            <h1 className="text-2xl font-bold">我的工具</h1>
            <p className="text-white/60 text-sm mt-1">已认证开发者 · 可管理所有工具</p>
          </div>
          <button
            onClick={() => setViewMode('form')}
            className="flex items-center gap-2 px-4 py-2 bg-[#8B5CF6] text-white rounded-xl hover:bg-[#7C3AED] transition-colors"
          >
            <Plus className="w-4 h-4" />
            提交新工具
          </button>
        </div>

        {/* 开发者状态横幅 */}
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 mb-6 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center">
            <CheckCircle className="w-5 h-5 text-green-400" />
          </div>
          <div>
            <p className="font-medium text-green-400">你已是认证开发者</p>
            <p className="text-white/60 text-sm">可以直接提交新工具，审核通过后自动上线</p>
          </div>
        </div>

        {/* 已有工具列表 */}
        {myTools.length === 0 ? (
          <div className="text-center py-16 text-white/40">
            <WrenchIcon className="w-12 h-12 mx-auto mb-3 opacity-40" />
            <p>还没有提交过工具</p>
            <p className="text-sm mt-1">点击右上角"提交新工具"开始吧</p>
          </div>
        ) : (
          <div className="space-y-3">
            {myTools.map(tool => (
              <div
                key={tool.id}
                onClick={() => navigate(`/tool/${tool.id}/manage`)}
                className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-4 hover:bg-white/10 transition-colors cursor-pointer"
              >
                {tool.icon_url ? (
                  <img src={tool.icon_url} alt={tool.name} className="w-12 h-12 rounded-xl object-cover" />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[#8B5CF6]/20 to-[#3B82F6]/20 flex items-center justify-center">
                    <WrenchIcon className="w-6 h-6 text-[#8B5CF6]" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-medium truncate">{tool.name}</p>
                    <StatusBadge status={tool.status || 'pending'} />
                  </div>
                  <p className="text-xs text-white/40 truncate">{tool.description || '暂无描述'}</p>
                </div>
                <ChevronRight className="w-4 h-4 text-white/30 flex-shrink-0" />
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }
  } // ← 关闭 isDeveloper 块，viewMode==='form' 时透传到主表单

  return(
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
      {/* Header */}
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => isDeveloper ? setViewMode('existing') : navigate('/')}
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          {isDeveloper ? '返回工具列表' : '返回'}
        </button>
        <h1 className="text-2xl font-bold">入驻虾蛋星球</h1>
      </div>

      {/* Form */}
      <motion.form
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        onSubmit={handleSubmit}
        className="space-y-6"
      >
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center text-red-400">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* Tool Icon */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            工具头像
          </label>
          <div className="flex items-center space-x-4">
            {formData.iconUrl ? (
              <div className="relative">
                <img
                  src={formData.iconUrl}
                  alt="工具头像"
                  className="w-20 h-20 rounded-xl border border-white/10 object-cover"
                />
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, iconUrl: '' })}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                >
                  ×
                </button>
              </div>
            ) : (
              <label className="flex-shrink-0">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleIconUpload}
                  className="hidden"
                />
                <div className="w-20 h-20 bg-[#1A1A2E] border border-dashed border-white/20 rounded-xl text-white/60 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors cursor-pointer flex flex-col items-center justify-center">
                  {uploadingIcon ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <Upload className="w-6 h-6 mb-1" />
                      <span className="text-xs">上传头像</span>
                    </>
                  )}
                </div>
              </label>
            )}
            <p className="text-sm text-white/40">
              建议上传 200x200 像素的正方形图片<br />
              支持 JPG、PNG 格式
            </p>
          </div>
        </div>

        {/* Tool Name */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            工具名称 <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            placeholder="给你的工具起个名字"
            required
            className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            功能介绍 <span className="text-red-400">*</span>
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            placeholder="简单描述你的工具能做什么"
            required
            rows={3}
            className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] resize-none"
          />
        </div>

        {/* Developer Story */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            开发者故事
          </label>
          <textarea
            value={formData.developerStory}
            onChange={(e) => setFormData({ ...formData, developerStory: e.target.value })}
            placeholder="分享你开发这个工具的初衷和故事"
            rows={4}
            className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] resize-none"
          />
        </div>

        {/* Category */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            分类
          </label>
          <select
            value={formData.categoryId}
            onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
            className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
          >
            <option value="">选择分类</option>
            <option value="b9578954-22fc-4009-b963-4e29dcafbee0">效率工具</option>
            <option value="07152fbc-ce85-4624-952f-fc45fd780975">生活助手</option>
            <option value="790485f1-81b4-44de-84b8-ff4790785fe7">健康运动</option>
            <option value="0b434cc4-d294-4677-9489-271c2767bc9b">学习教育</option>
            <option value="d0cd07bc-80ab-40dc-9330-192367eb98c1">娱乐休闲</option>
            <option value="8e54e0cc-147b-483a-8323-0a483930c145">金融理财</option>
            <option value="0066055c-15c9-4b89-a188-0343e44b09cf">开发工具</option>
            <option value="39ad2e11-76a4-4b04-a369-bf54c143a1d6">其他</option>
          </select>
        </div>

        {/* Platform Links */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-3">
            平台链接 <span className="text-red-400">*</span>
          </label>
          <p className="text-sm text-white/50 mb-4">
            添加你的作品发布的各个平台链接，方便用户选择适合的平台使用
          </p>

          {/* Added Platform Links */}
          <AnimatePresence>
            {platformLinks.map((link, index) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-3 mb-3 p-3 bg-[#1A1A2E] border border-white/10 rounded-xl"
              >
                <span className="text-xl">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/90">{link.platformName}</p>
                  <p className="text-sm text-white/50 truncate">{link.url}</p>
                </div>
                <button
                  type="button"
                  onClick={() => removePlatformLink(link.id)}
                  className="p-2 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Add Platform Button */}
          {!showAddPlatform ? (
            <button
              type="button"
              onClick={() => setShowAddPlatform(true)}
              className="w-full py-3 border border-dashed border-white/20 rounded-xl text-white/60 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors flex items-center justify-center"
            >
              <Plus className="w-5 h-5 mr-2" />
              添加平台链接
            </button>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-4 bg-[#1A1A2E] border border-white/10 rounded-xl space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  选择平台
                </label>
                <select
                  value={newPlatform.platform}
                  onChange={(e) => setNewPlatform({ ...newPlatform, platform: e.target.value })}
                  className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
                >
                  <option value="">选择平台</option>
                  <optgroup label="小程序">
                    {PLATFORM_OPTIONS.filter(p => p.category === '小程序').map(p => (
                      <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="应用商店">
                    {PLATFORM_OPTIONS.filter(p => p.category === '应用商店').map(p => (
                      <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                    ))}
                  </optgroup>
                  <optgroup label="网页">
                    {PLATFORM_OPTIONS.filter(p => p.category === '网页').map(p => (
                      <option key={p.value} value={p.value}>{p.icon} {p.label}</option>
                    ))}
                  </optgroup>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  链接地址
                </label>
                <input
                  type="url"
                  value={newPlatform.url}
                  onChange={(e) => setNewPlatform({ ...newPlatform, url: e.target.value })}
                  placeholder={needsQrCode(newPlatform.platform) ? '#小程序://... 或 https://...' : 'https://...'}
                  className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              {/* 二维码上传 - 仅对需要二维码的平台显示 */}
              {newPlatform.platform && needsQrCode(newPlatform.platform) && (
                <div>
                  <label className="block text-sm font-medium text-white/80 mb-2">
                    二维码图片 <span className="text-red-400">*</span>
                    <span className="text-white/40 text-xs ml-2">该平台需要用户扫码使用</span>
                  </label>
                  <div className="flex items-center space-x-3">
                    {newPlatform.qrCodeUrl ? (
                      <div className="relative">
                        <img
                          src={newPlatform.qrCodeUrl}
                          alt="二维码"
                          className="w-24 h-24 rounded-lg border border-white/10"
                        />
                        <button
                          type="button"
                          onClick={() => setNewPlatform({ ...newPlatform, qrCodeUrl: '' })}
                          className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                        >
                          ×
                        </button>
                      </div>
                    ) : (
                      <label className="flex-1">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleQrCodeUpload}
                          className="hidden"
                        />
                        <div className="px-4 py-3 bg-[#0F0F1A] border border-dashed border-white/20 rounded-xl text-white/60 hover:border-[#8B5CF6] hover:text-[#8B5CF6] transition-colors cursor-pointer flex items-center justify-center">
                          {uploadingQrCode ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                          ) : (
                            <>
                              <Upload className="w-5 h-5 mr-2" />
                              上传二维码
                            </>
                          )}
                        </div>
                      </label>
                    )}
                  </div>
                  <p className="text-xs text-white/40 mt-2">
                    请上传该平台的二维码图片，用户将通过扫码访问
                  </p>
                </div>
              )}

              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={addPlatformLink}
                  disabled={!newPlatform.platform || !newPlatform.url || (needsQrCode(newPlatform.platform) && !newPlatform.qrCodeUrl)}
                  className="flex-1 py-2 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-lg font-medium disabled:opacity-50"
                >
                  确认添加
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowAddPlatform(false);
                    setNewPlatform({ platform: '', url: '', qrCodeUrl: '' });
                  }}
                  className="px-4 py-2 border border-white/20 rounded-lg text-white/60 hover:bg-white/5"
                >
                  取消
                </button>
              </div>
            </motion.div>
          )}
        </div>

        {/* Platform Preview */}
        {platformLinks.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="p-4 bg-gradient-to-r from-[#8B5CF6]/10 to-[#3B82F6]/10 border border-[#8B5CF6]/30 rounded-xl"
          >
            <h4 className="text-sm font-medium text-white/80 mb-3 flex items-center">
              <Smartphone className="w-4 h-4 mr-2 text-[#8B5CF6]" />
              用户将看到以下平台入口
            </h4>
            <div className="flex flex-wrap gap-2">
              {platformLinks.map((link) => (
                <span
                  key={link.id}
                  className="inline-flex items-center px-3 py-1.5 bg-white/10 rounded-lg text-sm"
                >
                  <span className="mr-1.5">{link.icon}</span>
                  {link.platformName}
                </span>
              ))}
            </div>
          </motion.div>
        )}

        {/* Tags */}
        <div>
          <label className="block text-sm font-medium text-white/80 mb-2">
            标签
          </label>
          <input
            type="text"
            value={formData.tags}
            onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
            placeholder="用逗号分隔，如：计算器,房贷,实用"
            className="w-full px-4 py-3 bg-[#1A1A2E] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
          />
        </div>

        {/* Submit */}
        <div className="pt-4">
          <button
            type="submit"
            disabled={isSubmitting || platformLinks.length === 0 || !formData.name.trim() || !formData.description.trim()}
            className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
          >
            {isSubmitting ? '提交中...' : '提交审核'}
          </button>
          <p className="text-center text-sm text-white/40 mt-4">
            提交后将自动完成轻量级IP确权
          </p>
        </div>
      </motion.form>
    </div>
  );
}
