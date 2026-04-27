import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, Upload, Check, AlertCircle, Plus, Trash2, ExternalLink, Smartphone, Globe, AppWindow, Save, X } from 'lucide-react';
import { supabase } from '../supabase/client';
import { decode } from 'base64-arraybuffer';

interface PlatformLink {
  id: string;
  platform: string;
  platformName: string;
  url: string;
  icon: string;
  qrCodeUrl?: string;
}

const QR_CODE_PLATFORMS = [
  'wechat_miniprogram', 'alipay_miniprogram', 'baidu_miniprogram',
  'bytedance_miniprogram', 'qq_miniprogram', 'kuaishou_miniprogram',
  'android_360', 'android_baidu', 'android_wandoujia'
];

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

export function ToolEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

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

  useEffect(() => {
    if (id) {
      fetchToolData();
    }
  }, [id]);

  async function fetchToolData() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/profile');
        return;
      }

      const { data: toolData, error: toolError } = await supabase
        .from('tools')
        .select('*')
        .eq('id', id)
        .eq('developer_id', user.id)
        .single();

      if (toolError || !toolData) {
        setError('工具不存在或无权限访问');
        setLoading(false);
        return;
      }

      setFormData({
        name: toolData.name || '',
        description: toolData.description || '',
        developerStory: toolData.developer_story || '',
        categoryId: toolData.category_id || '',
        tags: toolData.tags?.join(', ') || '',
        iconUrl: toolData.icon_url || '',
      });

      const { data: linksData } = await supabase
        .from('tool_platform_links')
        .select('*')
        .eq('tool_id', id)
        .order('sort_order', { ascending: true });

      if (linksData) {
        const links: PlatformLink[] = linksData.map((link: any) => ({
          id: link.id,
          platform: link.platform,
          platformName: link.platform_name,
          url: link.url,
          icon: link.icon,
          qrCodeUrl: link.qr_code_url,
        }));
        setPlatformLinks(links);
      }
    } catch (err) {
      console.error('Error fetching tool:', err);
      setError('加载工具信息失败');
    } finally {
      setLoading(false);
    }
  }

  async function handleIconUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingIcon(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `icon-${Date.now()}.${fileExt}`;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const arrayBuffer = decode(base64);

          const { error: uploadError } = await supabase.storage
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
          setError('图标上传失败: ' + (err.message || '请重试'));
        } finally {
          setUploadingIcon(false);
        }
      };
    } catch (err: any) {
      setError('图标上传失败: ' + (err.message || '请重试'));
      setUploadingIcon(false);
    }
  }

  async function handleQrCodeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingQrCode(true);
    setError('');
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `qrcode-${Date.now()}.${fileExt}`;

      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = async () => {
        try {
          const base64 = (reader.result as string).split(',')[1];
          const arrayBuffer = decode(base64);

          const { error: uploadError } = await supabase.storage
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
          setError('二维码上传失败: ' + (err.message || '请重试'));
        } finally {
          setUploadingQrCode(false);
        }
      };
    } catch (err: any) {
      setError('二维码上传失败: ' + (err.message || '请重试'));
      setUploadingQrCode(false);
    }
  }

  function addPlatformLink() {
    if (!newPlatform.platform || !newPlatform.url) return;

    const platformOption = PLATFORM_OPTIONS.find(p => p.value === newPlatform.platform);
    if (!platformOption) return;

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

  function removePlatformLink(id: string) {
    setPlatformLinks(platformLinks.filter(link => link.id !== id));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!id) return;

    setError('');
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError('请先登录');
        return;
      }

      if (platformLinks.length === 0) {
        setError('请至少保留一个平台链接');
        return;
      }

      const primaryLink = platformLinks[0];

      const { error: updateError } = await supabase
        .from('tools')
        .update({
          name: formData.name,
          description: formData.description,
          developer_story: formData.developerStory,
          category_id: formData.categoryId || null,
          jump_url: primaryLink.url,
          jump_type: getJumpType(primaryLink.platform),
          tags: formData.tags.split(',').map(t => t.trim()).filter(Boolean),
          icon_url: formData.iconUrl || null,
          updated_at: new Date().toISOString(),
        })
        .eq('id', id)
        .eq('developer_id', user.id);

      if (updateError) throw updateError;

      const { error: deleteError } = await supabase
        .from('tool_platform_links')
        .delete()
        .eq('tool_id', id);

      if (deleteError) throw deleteError;

      const platformLinksData = platformLinks.map((link, index) => ({
        tool_id: id,
        platform: link.platform,
        platform_name: link.platformName,
        url: link.url,
        icon: link.icon,
        qr_code_url: link.qrCodeUrl || null,
        sort_order: index,
        is_active: true,
      }));

      const { error: insertError } = await supabase
        .from('tool_platform_links')
        .insert(platformLinksData);

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/my-tools');
      }, 1500);
    } catch (err: any) {
      console.error('Error saving tool:', err);
      setError(err.message || '保存失败，请重试');
    } finally {
      setSaving(false);
    }
  }

  function getJumpType(platform: string): string {
    if (platform.includes('miniprogram')) return 'miniprogram';
    if (platform.includes('app') || platform.includes('android') || platform.includes('ios')) return 'app';
    return 'h5';
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <AlertCircle className="w-16 h-16 mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-bold mb-2">加载失败</h2>
          <p className="text-white/60 mb-6">{error}</p>
          <Link
            to="/my-tools"
            className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
          >
            <ChevronLeft className="w-5 h-5 mr-2" />
            返回我的工具
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center space-x-4 mb-8"
      >
        <Link
          to="/my-tools"
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          返回
        </Link>
        <h1 className="text-2xl font-bold">编辑工具</h1>
      </motion.div>

      {success && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-xl flex items-center text-green-400"
        >
          <Check className="w-5 h-5 mr-2" />
          保存成功！正在返回...
        </motion.div>
      )}

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

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center">
            <span className="w-1 h-5 bg-gradient-to-b from-[#8B5CF6] to-[#3B82F6] rounded-full mr-3"></span>
            基本信息
          </h2>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              工具图标
            </label>
            <div className="flex items-center space-x-4">
              {formData.iconUrl ? (
                <div className="relative">
                  <img
                    src={formData.iconUrl}
                    alt="工具图标"
                    className="w-20 h-20 rounded-xl border border-white/10"
                  />
                  <button
                    type="button"
                    onClick={() => setFormData({ ...formData, iconUrl: '' })}
                    className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <label className="w-20 h-20 rounded-xl border border-dashed border-white/20 flex items-center justify-center cursor-pointer hover:border-[#8B5CF6] transition-colors">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleIconUpload}
                    className="hidden"
                  />
                  {uploadingIcon ? (
                    <div className="w-6 h-6 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <Upload className="w-6 h-6 text-white/40" />
                  )}
                </label>
              )}
              <p className="text-sm text-white/40">建议尺寸 200x200px</p>
            </div>
          </div>

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
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>

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
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              开发者故事
            </label>
            <textarea
              value={formData.developerStory}
              onChange={(e) => setFormData({ ...formData, developerStory: e.target.value })}
              placeholder="分享你开发这个工具的初衷和故事"
              rows={4}
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6] resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              分类
            </label>
            <select
              value={formData.categoryId}
              onChange={(e) => setFormData({ ...formData, categoryId: e.target.value })}
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white focus:outline-none focus:border-[#8B5CF6]"
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

          <div>
            <label className="block text-sm font-medium text-white/80 mb-2">
              标签
            </label>
            <input
              type="text"
              value={formData.tags}
              onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
              placeholder="用逗号分隔，如：计算器,房贷,实用"
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl text-white placeholder-white/40 focus:outline-none focus:border-[#8B5CF6]"
            />
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 space-y-6">
          <h2 className="text-lg font-bold flex items-center">
            <span className="w-1 h-5 bg-gradient-to-b from-[#8B5CF6] to-[#3B82F6] rounded-full mr-3"></span>
            平台链接
          </h2>

          <AnimatePresence>
            {platformLinks.map((link) => (
              <motion.div
                key={link.id}
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="flex items-center space-x-3 p-3 bg-[#0F0F1A] border border-white/10 rounded-xl"
              >
                <span className="text-xl">{link.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-white/90">{link.platformName}</p>
                  <p className="text-sm text-white/50 truncate">{link.url}</p>
                </div>
                {link.qrCodeUrl && (
                  <img
                    src={link.qrCodeUrl}
                    alt="二维码"
                    className="w-8 h-8 rounded"
                  />
                )}
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
              className="p-4 bg-[#0F0F1A] border border-white/10 rounded-xl space-y-4"
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
                          <X className="w-4 h-4" />
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

        <div className="flex space-x-4 pt-4">
          <Link
            to="/my-tools"
            className="flex-1 py-4 bg-white/5 border border-white/20 rounded-xl font-medium text-center hover:bg-white/10 transition-colors"
          >
            取消
          </Link>
          <button
            type="submit"
            disabled={saving || platformLinks.length === 0}
            className="flex-1 py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center justify-center"
          >
            {saving ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                保存中...
              </>
            ) : (
              <>
                <Save className="w-5 h-5 mr-2" />
                保存修改
              </>
            )}
          </button>
        </div>
      </motion.form>
    </div>
  );
}
