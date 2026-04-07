import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-paper">
      {/* Header */}
      <header className="bg-white/90 backdrop-blur-sm border-b border-ink-200 sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <Link to={isAuthenticated ? '/dashboard' : '/login'} className="flex items-center gap-3">
              <span className="text-3xl font-brush text-seal-600">诗词</span>
              <div>
                <h1 className="text-xl font-bold text-ink-900 font-kai tracking-wider">诗词大会</h1>
                <p className="text-xs text-ink-400 font-kai">腹有诗书气自华</p>
              </div>
            </Link>

            {isAuthenticated && (
              <div className="flex items-center gap-4">
                <span className="text-sm text-ink-500 hidden sm:block font-kai">
                  {user?.fullName || user?.username}
                </span>
                {user?.role === 'ADMIN' && (
                  <Link to="/admin" className="btn btn-gold text-sm">
                    管理
                  </Link>
                )}
                <button onClick={handleLogout} className="btn btn-secondary text-sm">
                  退出
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 text-center">
        <div className="ink-divider max-w-xs mx-auto mb-4" />
        <p className="text-sm text-ink-400 font-kai">
          腹有诗书气自华 · 读书不觉已春深
        </p>
      </footer>
    </div>
  );
};
