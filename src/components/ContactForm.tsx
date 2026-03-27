'use client';

import { useState } from 'react';

type Status = 'idle' | 'loading' | 'success' | 'error';

const INQUIRY_TYPES = ['索取资料', '咨询报价', '合作代理', '定制服务'] as const;
const PROJECT_TYPES = ['文旅度假营地', '精品酒店民宿', '商业空间', '公共设施', '其他'];
const MODELS = [
  'E7 Gen6 · 38.8㎡',
  'E6 Gen6 · 29.6㎡',
  'E3 Gen6 · 19㎡',
  'V9 Gen6 · 38㎡',
  'V5 Gen5 · 24.8㎡',
  'S5 Gen5 · 29.6㎡',
  '暂未确定',
];

export default function ContactForm() {
  const [form, setForm] = useState({
    inquiryType: '索取资料',
    name: '',
    phone: '',
    email: '',
    company: '',
    location: '',
    projectType: '',
    quantity: '',
    model: '',
    remarks: '',
  });
  const [status, setStatus] = useState<Status>('idle');
  const [errorMsg, setErrorMsg] = useState('');
  const [emailError, setEmailError] = useState('');

  function set(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (field === 'email') setEmailError('');
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    // Email validation
    if (!form.email.trim()) {
      setEmailError('请填写邮箱地址');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      setEmailError('请输入有效的邮箱地址');
      return;
    }

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) {
        setErrorMsg(data.error ?? '提交失败，请稍后再试');
        setStatus('error');
      } else {
        setStatus('success');
      }
    } catch {
      setErrorMsg('网络错误，请检查连接后重试');
      setStatus('error');
    }
  }

  if (status === 'success') {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <div className="w-16 h-16 rounded-full border-2 border-[#c9a84c] flex items-center justify-center mb-6">
          <svg className="w-8 h-8 text-[#c9a84c]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <div className="text-[#c9a84c] text-xs tracking-[0.3em] uppercase mb-3 font-medium">提交成功</div>
        <h3 className="text-white text-xl font-black mb-3 tracking-wider">感谢您的咨询</h3>
        <p className="text-white/45 text-sm leading-relaxed max-w-sm tracking-wider">
          我们已收到您的留言，专业顾问将在 24 小时内与您联系。
          {form.email && ' 确认邮件已发送至您的邮箱。'}
        </p>
        <button
          onClick={() => {
            setStatus('idle');
            setForm({
              inquiryType: '索取资料', name: '', phone: '', email: '',
              company: '', location: '', projectType: '', quantity: '', model: '', remarks: '',
            });
          }}
          className="mt-8 text-xs border border-white/15 text-white/40 hover:border-[#c9a84c]/40 hover:text-[#c9a84c] px-5 py-2 transition-all tracking-wider"
        >
          再次提交
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Inquiry type */}
      <div>
        <label className="block text-white/50 text-xs tracking-wider mb-2">咨询类型 *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {INQUIRY_TYPES.map((type) => (
            <label key={type} className="flex items-center gap-2 cursor-pointer group">
              <input
                type="radio"
                name="inquiryType"
                value={type}
                checked={form.inquiryType === type}
                onChange={() => set('inquiryType', type)}
                className="accent-[#c9a84c]"
              />
              <span className="text-sm text-white/60 group-hover:text-white/80 transition-colors tracking-wider">
                {type}
              </span>
            </label>
          ))}
        </div>
      </div>

      {/* Name + Phone */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">姓名 *</label>
          <input
            type="text"
            required
            value={form.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="您的姓名"
            className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">联系电话 *</label>
          <input
            type="tel"
            required
            value={form.phone}
            onChange={(e) => set('phone', e.target.value)}
            placeholder="+86 138 0000 0000"
            className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
      </div>

      {/* Email + Company */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">
            邮箱 <span className="text-red-400">*</span>
          </label>
          <input
            type="email"
            value={form.email}
            onChange={(e) => set('email', e.target.value)}
            placeholder="your@email.com"
            className={`w-full bg-[#111] border text-white text-sm px-4 py-3 focus:outline-none placeholder-white/20 tracking-wider ${emailError ? 'border-red-500/60 focus:border-red-500/80' : 'border-white/15 focus:border-[#c9a84c]/60'}`}
          />
          {emailError && (
            <p className="text-red-400/80 text-xs tracking-wider mt-1">{emailError}</p>
          )}
        </div>
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">公司名称</label>
          <input
            type="text"
            value={form.company}
            onChange={(e) => set('company', e.target.value)}
            placeholder="公司/组织名称"
            className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
      </div>

      {/* Country + Project type */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">所在国家/城市</label>
          <input
            type="text"
            value={form.location}
            onChange={(e) => set('location', e.target.value)}
            placeholder="如：中国·广州"
            className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">项目类型</label>
          <select
            value={form.projectType}
            onChange={(e) => set('projectType', e.target.value)}
            className="w-full bg-[#111] border border-white/15 text-white/70 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60"
          >
            <option value="">请选择项目类型</option>
            {PROJECT_TYPES.map((t) => <option key={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Quantity + Model */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">订购数量（台）</label>
          <input
            type="number"
            min="1"
            value={form.quantity}
            onChange={(e) => set('quantity', e.target.value)}
            placeholder="预计采购数量"
            className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 tracking-wider"
          />
        </div>
        <div>
          <label className="block text-white/50 text-xs tracking-wider mb-2">产品型号偏好</label>
          <select
            value={form.model}
            onChange={(e) => set('model', e.target.value)}
            className="w-full bg-[#111] border border-white/15 text-white/70 text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60"
          >
            <option value="">请选择</option>
            {MODELS.map((m) => <option key={m}>{m}</option>)}
          </select>
        </div>
      </div>

      {/* Remarks */}
      <div>
        <label className="block text-white/50 text-xs tracking-wider mb-2">备注</label>
        <textarea
          rows={4}
          value={form.remarks}
          onChange={(e) => set('remarks', e.target.value)}
          placeholder="请描述您的项目概况、特殊需求或其他问题..."
          className="w-full bg-[#111] border border-white/15 text-white text-sm px-4 py-3 focus:outline-none focus:border-[#c9a84c]/60 placeholder-white/20 resize-none tracking-wider"
        />
      </div>

      {status === 'error' && (
        <p className="text-red-400/80 text-xs tracking-wider border border-red-500/20 bg-red-500/5 px-3 py-2">
          {errorMsg}
        </p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full bg-[#c9a84c] text-[#0a0a0a] font-bold text-sm py-4 hover:bg-[#b8973b] disabled:opacity-60 transition-colors tracking-[0.2em] uppercase"
      >
        {status === 'loading' ? '提交中...' : '提交咨询'}
      </button>
      <p className="text-white/20 text-xs text-center tracking-wider">
        提交后专业顾问将在 24 小时内与您取得联系
      </p>
    </form>
  );
}
