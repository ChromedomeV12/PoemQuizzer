import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { authApi } from '../services/api';
import { useAuthStore } from '../store/authStore';
import { User } from '../types';

export const LoginPage: React.FC = () => {
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login } = useAuthStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      const response = await authApi.login(identifier, password);

      if (response.error) {
        setError(response.error);
        return;
      }

      // Extract data - check both top level and nested in 'data'
      const rawData = response.data as any;
      let token = rawData?.token;
      let user = rawData?.user;

      // If missing at top level, check if it's nested
      if (!token && rawData?.data?.token) token = rawData.data.token;
      if (!user && rawData?.data?.user) user = rawData.data.user;

      if (!token || !user) {
        console.error('Incomplete login data structure:', rawData);
        setError('登录接口返回数据不完整，请稍后重试');
        return;
      }

      login(token, user as User);

      if (!(user as User).profileComplete) {
        navigate('/profile-setup');
      } else if ((user as User).role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/dashboard');
      }
    } catch (err) {
      console.error('Login catch error:', err);
      setError('网络错误，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-paper px-4 relative overflow-hidden">
      {/* Decorative background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-10 right-10 text-ink-100 text-9xl font-brush opacity-30 animate-float">诗</div>
        <div className="absolute bottom-10 left-10 text-ink-100 text-8xl font-brush opacity-20 animate-float" style={{ animationDelay: '2s' }}>词</div>
        <div className="absolute top-1/3 left-1/4 text-ink-100 text-7xl font-brush opacity-15 animate-float" style={{ animationDelay: '4s' }}>书</div>
      </div>

      <div className="card w-full max-w-md animate-slide-up relative z-10 poem-card">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-seal-50 border-2 border-seal-200 mb-4">
            <span className="text-4xl font-brush text-seal-600">诗</span>
          </div>
          <h1 className="text-3xl font-bold text-ink-900 font-brush tracking-wider">诗词大会</h1>
          <p className="text-ink-400 mt-2 font-kai text-sm">腹有诗书气自华</p>
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
            <label htmlFor="identifier" className="block text-sm font-kai text-ink-600 mb-1.5">
              邮箱 / 用户名
            </label>
            <input
              id="identifier"
              type="text"
              className="input"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              placeholder="请输入邮箱或用户名"
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
              type="password"
              className="input"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
              autoComplete="current-password"
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
                登录中...
              </span>
            ) : (
              '登 录'
            )}
          </button>
        </form>

        {/* Footer */}
        <div className="ink-divider" />
        <p className="text-center text-sm text-ink-500 font-kai">
          还没有账号？{' '}
          <Link to="/register" className="text-seal-600 hover:text-seal-700 font-medium">
            立即注册 →
          </Link>
        </p>
      </div>
    </div>
  );
};
