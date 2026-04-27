import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Upload, AlertCircle, Check, Loader2, FileText, DollarSign, Clock, Phone, Tag, Briefcase, Layers } from 'lucide-react';
import { supabase } from '../supabase/client';
import type { Tables } from '../supabase/types';

type Category = Tables<'categories'>;

const demandTypes = [
  { value: 'miniapp', label: '小程序开发' },
  { value: 'website', label: '网站开发' },
  { value: 'app', label: 'APP开发' },
  { value: 'extension', label: '功能二次开发' },
  { value: 'plugin', label: '插件定制' },
  { value: 'other', label: '其他' },
];

const budgetOptions = [
  { value: 'under500', label: '500元内', min: 0, max: 500 },
  { value: '500to2000', label: '500-2000元', min: 500, max: 2000 },
  { value: '2000to5000', label: '2000-5000元', min: 2000, max: 5000 },
  { value: '5000to10000', label: '5000-10000元', min: 5000, max: 10000 },
  { value: 'above10000', label: '10000元以上', min: 10000, max: null },
  { value: 'negotiable', label: '面议', min: null, max: null },
];

const periodOptions = [
  { value: '1week', label: '1周内' },
  { value: '1to2weeks', label: '1-2周' },
  { value: '2to4weeks', label: '2-4周' },
  { value: '1monthplus', label: '1个月以上' },
  { value: 'negotiable', label: '面议' },
];

export function DemandPublish() {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    type: '',
    category: '',
    description: '',
    budget: '',
    period: '',
    contactInfo: '',
  });
  
  const [images, setImages] = useState<string[]>([]);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [agreedToTerms, setAgreedToTerms] = useState(false);

  useEffect(() => {
    checkUser();
    fetchCategories();
  }, []);

  async function checkUser() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      setUser(user);
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      setProfile(profile);
    }
    setLoading(false);
  }

  async function fetchCategories() {
    const { data } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });
    if (data) setCategories(data);
  }

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || images.length >= 3) return;

    setUploadingImage(true);
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const base64 = (e.target?.result as string).split(',')[1];
        const fileName = `${Date.now()}_${file.name}`;
        
        const { data, error } = await supabase.storage
          .from('demand-images')
          .upload(fileName, Buffer.from(base64, 'base64'), {
            contentType: file.type,
          });
        
        if (!error && data) {
          const { data: { publicUrl } } = supabase.storage
            .from('demand-images')
            .getPublicUrl(data.path);
          setImages([...images, publicUrl]);
        }
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error('Upload error:', err);
    } finally {
      setUploadingImage(false);
    }
  }

  function removeImage(index: number) {
    setImages(images.filter((_, i) => i !== index));
  }

  async function handleSubmit() {
    if (!user) {
      setError('请先登录');
      return;
    }

    if (!profile?.phone_verified) {
      setError('请先完成手机号实名验证');
      return;
    }

    if (!formData.title || !formData.type || !formData.category || !formData.description || !formData.budget || !formData.period) {
      setError('请填写完整的需求信息');
      return;
    }

    if (!agreedToTerms) {
      setError('请同意服务协议');
      return;
    }

    setSubmitting(true);
    setError('');

    try {
      const budgetOption = budgetOptions.find(b => b.value === formData.budget);
      
      const { error: insertError } = await supabase
        .from('demands')
        .insert({
          user_id: user.id,
          title: formData.title,
          type: formData.type,
          category: formData.category,
          description: formData.description,
          budget_min: budgetOption?.min,
          budget_max: budgetOption?.max,
          budget_type: formData.budget === 'negotiable' ? 'negotiable' : 'fixed',
          period: formData.period,
          contact_info: formData.contactInfo,
          status: 'pending',
        });

      if (insertError) throw insertError;

      setSuccess(true);
      setTimeout(() => {
        navigate('/profile/demands');
      }, 1500);
    } catch (err: any) {
      setError(err.message || '发布失败，请重试');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen pt-20">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#8B5CF6]"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto">
        <div className="text-center py-20">
          <FileText className="w-16 h-16 mx-auto mb-4 text-white/20" />
          <h2 className="text-2xl font-bold mb-2">请先登录</h2>
          <p className="text-white/60 mb-6">登录后即可发布开发需求</p>
          <button
            onClick={() => navigate('/profile')}
            className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
          >
            去登录
          </button>
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
          <h2 className="text-2xl font-bold mb-2">需求发布成功！</h2>
          <p className="text-white/60 mb-6">
            您的需求已提交审核，审核通过后将展示在需求大厅
          </p>
          <button
            onClick={() => navigate('/profile/demands')}
            className="px-6 py-3 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium"
          >
            查看我的需求
          </button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="pt-20 px-4 sm:px-6 lg:px-8 max-w-3xl mx-auto pb-20">
      <div className="flex items-center space-x-4 mb-8">
        <button
          onClick={() => navigate(-1)}
          className="flex items-center text-white/60 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5 mr-1" />
          返回
        </button>
        <h1 className="text-2xl font-bold">发布开发需求</h1>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-6"
      >
        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <FileText className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            需求基本信息
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Tag className="w-4 h-4 mr-2 text-white/40" />
                需求标题
              </label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="例如：小程序记账工具定制"
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Briefcase className="w-4 h-4 mr-2 text-white/40" />
                需求类型
              </label>
              <select
                value={formData.type}
                onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white"
              >
                <option value="">请选择类型</option>
                {demandTypes.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Layers className="w-4 h-4 mr-2 text-white/40" />
                所属领域
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none text-white"
              >
                <option value="">请选择领域</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <FileText className="w-4 h-4 mr-2 text-white/40" />
                详细需求
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="请详细描述您的开发需求，包括功能要求、技术栈偏好等..."
                rows={5}
                className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none resize-none"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">需求附件（最多3张）</label>
              <div className="flex items-center space-x-4">
                {images.map((img, index) => (
                  <div key={index} className="relative w-20 h-20 rounded-lg overflow-hidden">
                    <img src={img} alt="" className="w-full h-full object-cover" />
                    <button
                      onClick={() => removeImage(index)}
                      className="absolute top-1 right-1 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center text-white text-xs"
                    >
                      ×
                    </button>
                  </div>
                ))}
                {images.length < 3 && (
                  <label className="w-20 h-20 border border-dashed border-white/20 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:border-[#8B5CF6] transition-colors">
                    <Upload className="w-6 h-6 text-white/40 mb-1" />
                    <span className="text-xs text-white/40">上传</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                      disabled={uploadingImage}
                    />
                  </label>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <DollarSign className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            预算与周期
          </h3>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">预算区间</label>
              <div className="grid grid-cols-3 gap-3">
                {budgetOptions.map((b) => (
                  <button
                    key={b.value}
                    onClick={() => setFormData({ ...formData, budget: b.value })}
                    className={`px-4 py-3 rounded-xl border text-sm transition-all ${
                      formData.budget === b.value
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white'
                        : 'border-white/10 bg-[#0F0F1A] text-white/60 hover:border-white/30'
                    }`}
                  >
                    {b.label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2 flex items-center">
                <Clock className="w-4 h-4 mr-2 text-white/40" />
                期望周期
              </label>
              <div className="grid grid-cols-3 gap-3">
                {periodOptions.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => setFormData({ ...formData, period: p.value })}
                    className={`px-4 py-3 rounded-xl border text-sm transition-all ${
                      formData.period === p.value
                        ? 'border-[#8B5CF6] bg-[#8B5CF6]/20 text-white'
                        : 'border-white/10 bg-[#0F0F1A] text-white/60 hover:border-white/30'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6">
          <h3 className="text-lg font-bold mb-4 flex items-center">
            <Phone className="w-5 h-5 mr-2 text-[#8B5CF6]" />
            联系方式
          </h3>
          
          <div>
            <label className="block text-sm font-medium mb-2">联系方式（选填）</label>
            <input
              type="text"
              value={formData.contactInfo}
              onChange={(e) => setFormData({ ...formData, contactInfo: e.target.value })}
              placeholder="手机号/微信，可对接后私下发送"
              className="w-full px-4 py-3 bg-[#0F0F1A] border border-white/10 rounded-xl focus:border-[#8B5CF6] focus:outline-none"
            />
          </div>
        </div>

        <div className="bg-gradient-to-r from-orange-500/10 to-red-500/10 border border-orange-500/30 rounded-2xl p-6">
          <div className="flex items-start space-x-3">
            <AlertCircle className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-white/80">
              <p className="font-medium text-orange-400 mb-2">风险提示</p>
              <p>1. 本平台仅提供信息撮合服务，不参与实际开发交易</p>
              <p>2. 请谨慎核实开发者身份和能力，建议签订正式开发合同</p>
              <p>3. 平台不对开发质量、交付结果承担任何责任</p>
              <p>4. 交易资金请通过正规渠道支付，谨防诈骗</p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center text-red-400">
            <AlertCircle className="w-5 h-5 mr-2 flex-shrink-0" />
            {error}
          </div>
        )}

        <div className="flex items-center space-x-3">
          <input
            type="checkbox"
            id="agreeTerms"
            checked={agreedToTerms}
            onChange={(e) => setAgreedToTerms(e.target.checked)}
            className="w-5 h-5 rounded border-white/20 bg-[#0F0F1A] text-[#8B5CF6] focus:ring-[#8B5CF6]"
          />
          <label htmlFor="agreeTerms" className="text-sm text-white/80 cursor-pointer">
            我已阅读并同意服务协议和风险提示
          </label>
        </div>

        <button
          onClick={handleSubmit}
          disabled={submitting}
          className="w-full py-4 bg-gradient-to-r from-[#8B5CF6] to-[#3B82F6] rounded-xl font-medium text-lg disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
        >
          {submitting ? (
            <span className="flex items-center justify-center">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              提交中...
            </span>
          ) : (
            '发布需求'
          )}
        </button>
      </motion.div>
    </div>
  );
}
