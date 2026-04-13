import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

export const ProfileSetupPage: React.FC = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    grade: '',
    studentId: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!formData.fullName.trim() || !formData.grade.trim() || !formData.studentId.trim()) {
      setError('所有字段都是必填项');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.setupProfile(
        formData.fullName,
        formData.grade,
        formData.studentId
      );

      if (response.error) {
        setError(response.error);
        return;
      }

      // Extract data - check both top level and nested in 'data'
      const rawData = response.data as any;
      let user = rawData?.user;

      // If missing at top level, check if it's nested
      if (!user && rawData?.data?.user) user = rawData.data.user;

      if (!user) {
        console.error('Incomplete profile setup data structure:', rawData);
        setError('接口返回数据不完整，请稍后重试');
        return;
      }

      updateUser(user as User);
      navigate('/dashboard');
    } catch (err) {
      console.error('Profile setup catch error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 relative overflow-hidden">
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-12 right-16 text-ink-100 text-8xl font-brush opacity-15 animate-float">学</div>
        <div className="absolute bottom-16 left-12 text-ink-100 text-7xl font-brush opacity-10 animate-float" style={{ animationDelay: '2s' }}>子</div>
      </div>

      <div className="card w-full max-w-md animate-slide-up relative z-10 poem-card">
        {/* Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gold-50 border-2 border-gold-200 mb-4">
            <span className="text-4xl font-brush text-gold-600">名</span>
          </div>
          <h1 className="text-3xl font-bold text-ink-900 font-brush tracking-wider">完善信息</h1>
          <p className="text-ink-400 mt-2 font-kai text-sm">请填写您的个人信息</p>
        </div>

        {/* Warning */}
        <div className="mb-6 p-3 bg-gold-50 border border-gold-200 text-gold-800 rounded-lg text-sm font-kai">
          ⚠️ 请仔细核对信息，<strong>提交后不可修改</strong>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
            {error}
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label htmlFor="fullName" className="block text-sm font-kai text-ink-600 mb-1.5">
              姓名
            </label>
            <input
              id="fullName"
              name="fullName"
              type="text"
              className="input"
              value={formData.fullName}
              onChange={handleChange}
              placeholder="请输入真实姓名"
              required
            />
          </div>

          <div>
            <label htmlFor="grade" className="block text-sm font-kai text-ink-600 mb-1.5">
              年级
            </label>
            <select
              id="grade"
              name="grade"
              className="input"
              value={formData.grade}
              onChange={handleChange}
              required
            >
              <option value="">请选择年级</option>
              <option value="初一">初一</option>
              <option value="初二">初二</option>
              <option value="初三">初三</option>
              <option value="高一">高一</option>
              <option value="高二">高二</option>
              <option value="高三">高三</option>
            </select>
          </div>

          <div>
            <label htmlFor="studentId" className="block text-sm font-kai text-ink-600 mb-1.5">
              学号
            </label>
            <input
              id="studentId"
              name="studentId"
              type="text"
              className="input"
              value={formData.studentId}
              onChange={handleChange}
              placeholder="如：20240001"
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="btn btn-primary w-full py-3 text-lg"
          >
            {isLoading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                保存中...
              </span>
            ) : (
              '提 交'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};
