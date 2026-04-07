import React, { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Layout } from '../components/Layout';
import { quizApi } from '../services/api';
import { Score, LeaderboardEntry, EventPhase } from '../types';

export const ResultsPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const phase = (searchParams.get('phase') as EventPhase) || 'PRE_QUALIFIER';

  const [score, setScore] = useState<Score | null>(null);
  const [totalAvailable, setTotalAvailable] = useState(0);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchData() {
      setLoading(true);
      try {
        const [scoreRes, leaderboardRes] = await Promise.all([
          quizApi.getScore(phase),
          quizApi.getLeaderboard(phase),
        ]);

        if (scoreRes.data) {
          const sData = scoreRes.data as Record<string, unknown>;
          setScore(sData.score as Score);
          setTotalAvailable((sData.totalAvailable as number) || 0);
        }

        if (leaderboardRes.data) {
          const lData = leaderboardRes.data as Record<string, unknown>;
          setLeaderboard((lData.leaderboard as LeaderboardEntry[]) || []);
        }
      } catch (err) {
        console.error('Results fetch error:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [phase]);

  const percentage = score && totalAvailable > 0
    ? Math.round((score.correctAnswers / totalAvailable) * 100)
    : 0;

  const getGrade = () => {
    if (percentage >= 90) return { emoji: '🏆', label: '文采斐然！', color: 'text-gold-500' };
    if (percentage >= 70) return { emoji: '🌟', label: '诗词达人！', color: 'text-bamboo-600' };
    if (percentage >= 50) return { emoji: '👍', label: '不错不错！', color: 'text-ink-600' };
    if (percentage >= 30) return { emoji: '💪', label: '再接再厉！', color: 'text-ink-500' };
    return { emoji: '📚', label: '多多读书！', color: 'text-seal-500' };
  };

  const grade = getGrade();

  if (loading) {
    return (
      <Layout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <span className="text-6xl font-brush text-ink-300 animate-float">榜</span>
            <p className="mt-4 text-ink-400 font-kai">加载成绩中...</p>
          </div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Score Summary */}
        <div className="card mb-8 text-center animate-slide-up poem-card">
          <div className="text-6xl mb-4">{grade.emoji}</div>
          <h1 className={`text-3xl font-brush ${grade.color} tracking-wider`}>{grade.label}</h1>
          <p className="text-ink-400 mt-2 font-kai">
            {phase === 'FINALS' ? '决赛' : '预选赛'}成绩
          </p>

          {score ? (
            <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="p-4 bg-ink-50 rounded-lg">
                <p className="text-3xl font-brush text-seal-600">{score.totalScore}</p>
                <p className="text-sm text-ink-500 font-kai">总分</p>
              </div>
              <div className="p-4 bg-ink-50 rounded-lg">
                <p className="text-3xl font-brush text-bamboo-600">{score.correctAnswers}</p>
                <p className="text-sm text-ink-500 font-kai">正确</p>
              </div>
              <div className="p-4 bg-ink-50 rounded-lg">
                <p className="text-3xl font-brush text-seal-500">{score.totalQuestions - score.correctAnswers}</p>
                <p className="text-sm text-ink-500 font-kai">错误</p>
              </div>
              <div className="p-4 bg-ink-50 rounded-lg">
                <p className="text-3xl font-brush text-gold-500">{percentage}%</p>
                <p className="text-sm text-ink-500 font-kai">正确率</p>
              </div>
            </div>
          ) : (
            <div className="mt-6 py-8">
              <p className="text-ink-400 font-kai">你还没有答题哦</p>
              <Link to={`/quiz?phase=${phase}`} className="btn btn-primary mt-4">
                开始答题
              </Link>
            </div>
          )}
        </div>

        {/* Leaderboard */}
        <div className="card animate-slide-up poem-card" style={{ animationDelay: '100ms' }}>
          <h2 className="text-2xl font-brush text-ink-900 mb-6 tracking-wider">🏆 排行榜</h2>

          {leaderboard.length === 0 ? (
            <p className="text-center text-ink-400 py-8 font-kai">暂无参赛者</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b-2 border-ink-200">
                    <th className="text-left py-3 px-4 text-sm font-kai text-ink-500">排名</th>
                    <th className="text-left py-3 px-4 text-sm font-kai text-ink-500">姓名</th>
                    <th className="text-center py-3 px-4 text-sm font-kai text-ink-500">得分</th>
                    <th className="text-center py-3 px-4 text-sm font-kai text-ink-500">正确</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry) => (
                    <tr
                      key={entry.rank}
                      className={`border-b border-ink-100 hover:bg-ink-50 transition-colors font-kai ${
                        entry.rank <= 3 ? 'bg-gold-50/50' : ''
                      }`}
                    >
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-brush text-sm ${
                          entry.rank === 1 ? 'bg-gold-400 text-white' :
                          entry.rank === 2 ? 'bg-ink-400 text-white' :
                          entry.rank === 3 ? 'bg-gold-600 text-white' :
                          'bg-ink-100 text-ink-600'
                        }`}>
                          {entry.rank}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <p className="font-medium">{entry.fullName}</p>
                        <p className="text-xs text-ink-400">{entry.department}</p>
                      </td>
                      <td className="py-3 px-4 text-center font-brush text-seal-600">
                        {entry.totalScore}
                      </td>
                      <td className="py-3 px-4 text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-kai ${
                          entry.totalQuestions > 0 && (entry.correctAnswers / entry.totalQuestions) >= 0.7
                            ? 'bg-green-100 text-green-800'
                            : 'bg-ink-100 text-ink-600'
                        }`}>
                          {entry.correctAnswers}/{entry.totalQuestions}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Back to Dashboard */}
        <div className="text-center mt-8">
          <Link to="/dashboard" className="btn btn-primary font-kai">
            ← 返回首页
          </Link>
        </div>
      </div>
    </Layout>
  );
};
