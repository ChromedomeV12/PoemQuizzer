import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

export const RegisterPage: React.FC = () => {
  const [formData, setFormData] = useState({
    email: '',
    username: '',
    password: '',
    confirmPassword: '',
  });
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('两次密码输入不一致');
      return;
    }

    if (formData.password.length < 8) {
      setError('密码至少8个字符');
      return;
    }

    setIsLoading(true);

    try {
      const response = await authApi.register(
        formData.email,
        formData.username,
        formData.password
      );

      console.log('Registration response:', response);

      if (response.error) {
        setError(response.error);
        return;
      }

      if (!response.data || !('token' in (response.data as any)) || !('user' in (response.data as any))) {
        console.error('Incomplete registration data:', response.data);
        setError('注册接口返回数据不完整，请稍后重试');
        return;
      }

      const { token, user } = response.data as { token: string; user: User };
      login(token, user);
      navigate('/profile-setup');
    } catch (err) {
      console.error('Registration catch error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-16 left-16 text-ink-100 text-8xl font-brush opacity-20 animate-float">墨</div>
        <div className="absolute bottom-20 right-20 text-ink-100 text-7xl font-brush opacity-15 animate-float" style={{ animationDelay: '3s' }}>韵</div>
      </div>

      <div className="card w-full max-w-md animate-slide-up relative z-10 poem-card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-bamboo-50 border-2 border-bamboo-200 mb-4">
            <span className="text-4xl font-brush text-bamboo-600">书</span>
          </div>
          <h1 className="text-3xl font-bold text-ink-900 font-brush tracking-wider">注册账号</h1>
          <p className="text-ink-400 mt-2 font-kai text-sm">加入诗词大会</p>
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
            <label htmlFor="email" className="block text-sm font-kai text-ink-600 mb-1.5">
              邮箱地址
            </label>
            <input
              id="email"
              name="email"
              type="email"
              className="input"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              required
              autoComplete="email"
            />
          </div>

          <div>
            <label htmlFor="username" className="block text-sm font-kai text-ink-600 mb-1.5">
              用户名
            </label>
            <input
              id="username"
              name="username"
              type="text"
              className="input"
              value={formData.username}
              onChange={handleChange}
              placeholder="3-30位字母或数字"
              required
              autoComplete="username"
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-kai text-ink-600 mb-1.5">
              密码
            </label>
            <input
              id="password"
              name="password"
              type="password"
              className="input"
              value={formData.password}
              onChange={handleChange}
              placeholder="至少8个字符"
              required
              autoComplete="new-password"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-kai text-ink-600 mb-1.5">
              确认密码
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              className="input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="再次输入密码"
              required
              autoComplete="new-password"
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
                注册中...
              </span>
            ) : (
              '注 册'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="ink-divider" />
        <p className="text-center text-sm text-ink-500 font-kai">
          已有账号？{' '}
          <Link to="/login" className="text-seal-600 hover:text-seal-700 font-medium">
            立即登录 →
          </Link>
        </p>
      </div>
    </div>
  );
};
