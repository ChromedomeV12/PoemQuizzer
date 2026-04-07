import React, { useEffect, useState } from 'react';
import { Layout } from '../components/Layout';
import { adminApi } from '../services/api';
import { User, Question, LeaderboardEntry } from '../types';

type AdminTab = 'users' | 'questions' | 'leaderboard' | 'monitor';

export const AdminPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<AdminTab>('users');
  const [users, setUsers] = useState<User[]>([]);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [monitorData, setMonitorData] = useState<Record<string, unknown> | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({ fullName: '', grade: '', studentId: '' });

  const tabs: { key: AdminTab; label: string; icon: string }[] = [
    { key: 'users', label: '用户管理', icon: '👥' },
    { key: 'questions', label: '题库管理', icon: '📝' },
    { key: 'leaderboard', label: '排行榜', icon: '🏆' },
    { key: 'monitor', label: '实时监控', icon: '📊' },
  ];

  useEffect(() => {
    loadData();
  }, [activeTab]);

  async function loadData() {
    try {
      switch (activeTab) {
        case 'users': {
          const res = await adminApi.getUsers({ search: searchQuery || undefined });
          if (res.data) {
            const data = res.data as Record<string, unknown>;
            setUsers((data.users as User[]) || []);
          }
          break;
        }
        case 'questions': {
          const res = await adminApi.getQuestions();
          if (res.data) {
            const data = res.data as Record<string, unknown>;
            setQuestions((data.questions as Question[]) || []);
          }
          break;
        }
        case 'leaderboard': {
          const res = await adminApi.getLeaderboard();
          if (res.data) {
            const data = res.data as Record<string, unknown>;
            setLeaderboard((data.leaderboard as LeaderboardEntry[]) || []);
          }
          break;
        }
        case 'monitor': {
          const res = await adminApi.getMonitor();
          if (res.data) {
            setMonitorData(res.data as Record<string, unknown>);
          }
          break;
        }
      }
    } catch (err) {
      console.error('Admin data load error:', err);
    }
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadData();
  };

  const startEditUser = (user: User) => {
    setEditingUser(user);
    setEditForm({ fullName: user.fullName || '', grade: user.grade || '', studentId: user.studentId || '' });
  };

  const saveEditUser = async () => {
    if (!editingUser) return;
    try {
      const res = await adminApi.updateUser(editingUser.id, {
        fullName: editForm.fullName,
        grade: editForm.grade,
        studentId: editForm.studentId,
      });
      if (res.error) {
        alert(res.error);
        return;
      }
      setEditingUser(null);
      loadData();
    } catch {
      alert('更新失败');
    }
  };

  return (
    <Layout>
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-brush text-ink-900 mb-6 tracking-wider">🔧 管理后台</h1>

        {/* Tab Navigation */}
        <div className="flex gap-2 mb-8 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`btn whitespace-nowrap font-kai ${
                activeTab === tab.key ? 'btn-primary' : 'btn-secondary'
              }`}
            >
              {tab.icon} {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {/* ── Users Tab ── */}
        {activeTab === 'users' && (
          <div className="card animate-fade-in poem-card">
            <div className="flex flex-col sm:flex-row gap-4 mb-6">
              <form onSubmit={handleSearch} className="flex-1 flex gap-2">
                <input
                  type="text"
                  className="input flex-1"
                  placeholder="搜索用户..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
                <button type="submit" className="btn btn-primary">搜索</button>
              </form>
            </div>

            {users.length === 0 ? (
              <p className="text-center text-ink-400 py-8 font-kai">暂无用户</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-ink-200">
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500">姓名</th>
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500 hidden sm:table-cell">邮箱</th>
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500">年级</th>
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500">学号</th>
                      <th className="text-center py-3 px-3 text-sm font-kai text-ink-500">角色</th>
                      <th className="text-center py-3 px-3 text-sm font-kai text-ink-500">操作</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-ink-100 hover:bg-ink-50 font-kai">
                        <td className="py-3 px-3">
                          <p className="font-medium">{user.fullName || '-'}</p>
                          <p className="text-xs text-ink-400">{user.username}</p>
                        </td>
                        <td className="py-3 px-3 text-sm hidden sm:table-cell">{user.email}</td>
                        <td className="py-3 px-3 text-sm font-kai">{user.grade || '-'}</td>
                        <td className="py-3 px-3 text-sm font-mono">{user.studentId || '-'}</td>
                        <td className="py-3 px-3 text-center">
                          <span className={`px-2 py-1 rounded-full text-xs font-kai ${
                            user.role === 'ADMIN' ? 'bg-seal-100 text-seal-800' : 'bg-ink-100 text-ink-600'
                          }`}>
                            {user.role === 'ADMIN' ? '管理员' : '用户'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-center">
                          <button onClick={() => startEditUser(user)} className="btn btn-secondary text-xs py-1 px-3">
                            编辑
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Edit Modal */}
            {editingUser && (
              <div className="fixed inset-0 bg-ink-950/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
                <div className="bg-white rounded-lg shadow-ink p-6 max-w-md w-full animate-slide-up poem-card">
                  <h3 className="text-xl font-brush text-ink-900 mb-4">编辑用户</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-kai text-ink-600 mb-1">姓名</label>
                      <input className="input" value={editForm.fullName}
                        onChange={(e) => setEditForm((p) => ({ ...p, fullName: e.target.value }))} />
                    </div>
                    <div>
                      <label className="block text-sm font-kai text-ink-600 mb-1">年级</label>
                      <select className="input" value={editForm.grade}
                        onChange={(e) => setEditForm((p) => ({ ...p, grade: e.target.value }))}>
                        <option value="">请选择</option>
                        <option value="初一">初一</option>
                        <option value="初二">初二</option>
                        <option value="初三">初三</option>
                        <option value="高一">高一</option>
                        <option value="高二">高二</option>
                        <option value="高三">高三</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-kai text-ink-600 mb-1">学号</label>
                      <input className="input" value={editForm.studentId}
                        onChange={(e) => setEditForm((p) => ({ ...p, studentId: e.target.value }))} />
                    </div>
                    <div className="flex gap-2">
                      <button onClick={saveEditUser} className="btn btn-primary flex-1 font-kai">保存</button>
                      <button onClick={() => setEditingUser(null)} className="btn btn-secondary flex-1 font-kai">取消</button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ── Questions Tab ── */}
        {activeTab === 'questions' && (
          <div className="card animate-fade-in poem-card">
            <h2 className="text-xl font-brush text-ink-800 mb-4">题库 ({questions.length} 题)</h2>
            {questions.length === 0 ? (
              <p className="text-center text-ink-400 py-8 font-kai">暂无题目</p>
            ) : (
              <div className="space-y-4">
                {questions.map((q) => (
                  <div key={q.id} className="p-4 bg-ink-50 rounded-lg font-kai">
                    <div className="flex items-center justify-between mb-2">
                      <span className={`text-xs px-2 py-1 rounded-full font-kai ${
                        q.phase === 'PRE_QUALIFIER' ? 'bg-bamboo-100 text-bamboo-800' : 'bg-seal-100 text-seal-800'
                      }`}>
                        {q.phase === 'PRE_QUALIFIER' ? '预选赛' : '决赛'}
                      </span>
                      <span className="text-xs text-ink-400">
                        {q.type === 'MULTIPLE_CHOICE' ? '选择题' : q.type === 'TRUE_FALSE' ? '判断题' : '简答题'} · {q.timeLimit}秒
                      </span>
                    </div>
                    <p className="text-sm text-ink-800 whitespace-pre-line">{q.questionText}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ── Leaderboard Tab ── */}
        {activeTab === 'leaderboard' && (
          <div className="card animate-fade-in poem-card">
            <h2 className="text-xl font-brush text-ink-800 mb-4">🏆 完整排行榜</h2>
            {leaderboard.length === 0 ? (
              <p className="text-center text-ink-400 py-8 font-kai">暂无参赛者</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b-2 border-ink-200">
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500">#</th>
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500">姓名</th>
                      <th className="text-left py-3 px-3 text-sm font-kai text-ink-500 hidden sm:table-cell">学号</th>
                      <th className="text-center py-3 px-3 text-sm font-kai text-ink-500">得分</th>
                      <th className="text-center py-3 px-3 text-sm font-kai text-ink-500">正确</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((entry) => (
                      <tr key={entry.rank} className="border-b border-ink-100 hover:bg-ink-50 font-kai">
                        <td className="py-3 px-3">
                          <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-brush text-sm ${
                            entry.rank === 1 ? 'bg-gold-400 text-white' :
                            entry.rank === 2 ? 'bg-ink-400 text-white' :
                            entry.rank === 3 ? 'bg-gold-600 text-white' :
                            'bg-ink-100 text-ink-600'
                          }`}>{entry.rank}</span>
                        </td>
                        <td className="py-3 px-3">
                          <p className="font-medium">{entry.fullName}</p>
                          <p className="text-xs text-ink-400">{entry.department}</p>
                        </td>
                        <td className="py-3 px-3 text-sm font-mono hidden sm:table-cell">{entry.studentId}</td>
                        <td className="py-3 px-3 text-center font-brush text-seal-600">{entry.totalScore}</td>
                        <td className="py-3 px-3 text-center">{entry.correctAnswers}/{entry.totalQuestions}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ── Monitor Tab ── */}
        {activeTab === 'monitor' && (
          <div className="card animate-fade-in poem-card">
            <h2 className="text-xl font-brush text-ink-800 mb-4">📊 实时监控</h2>
            {!monitorData || !(monitorData as Record<string, unknown>)?.participants ? (
              <p className="text-center text-ink-400 py-8 font-kai">暂无监控数据</p>
            ) : (
              <div>
                <p className="text-sm text-ink-500 mb-4 font-kai">
                  阶段：<strong>{String((monitorData as Record<string, string>).phase)}</strong> |
                  参赛者：<strong>{(monitorData as Record<string, number>).totalParticipants}</strong>
                </p>
                <div className="grid gap-3">
                  {((monitorData as { participants?: Array<Record<string, unknown>> }).participants || []).map((p) => (
                    <div key={String(p.id)} className="p-4 bg-ink-50 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 font-kai">
                      <div>
                        <p className="font-medium">{String(p.fullName)}</p>
                        <p className="text-sm text-ink-400">{String(p.studentId)}</p>
                      </div>
                      <div className="flex gap-4 text-sm">
                        <span>得分：<strong>{String((p.score as Record<string, unknown>)?.totalScore || 0)}</strong></span>
                        <span>已答：<strong>{String(p.submissionCount)}</strong></span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};
