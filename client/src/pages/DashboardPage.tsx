import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { quizApi } from '../services/api';
import { Score, EventPhase } from '../types';
import { Layout } from '../components/Layout';

export const DashboardPage: React.FC = () => {
  const { user } = useAuthStore();
  const [scores, setScores] = useState<Record<EventPhase, Score | null>>({
    PRE_QUALIFIER: null,
    FINALS: null,
  });
  const [phaseStatus, setPhaseStatus] = useState<Record<string, unknown> | null>(null);

  useEffect(() => {
    async function fetchData() {
      try {
        const [preScore, finalScore, statusRes] = await Promise.all([
          quizApi.getScore('PRE_QUALIFIER'),
          quizApi.getScore('FINALS'),
          quizApi.getStatus(),
        ]);

        if (preScore.data) {
          const preData = preScore.data as Record<string, unknown>;
          setScores((prev) => ({ ...prev, PRE_QUALIFIER: (preData.score as Score) || null }));
        }
        if (finalScore.data) {
          const finalData = finalScore.data as Record<string, unknown>;
          setScores((prev) => ({ ...prev, FINALS: (finalData.score as Score) || null }));
        }
        if (statusRes.data) {
          setPhaseStatus(statusRes.data as Record<string, unknown>);
        }
      } catch (err) {
        console.error('Dashboard fetch error:', err);
      }
    }
    fetchData();
  }, []);

  const preQualifierActive = (phaseStatus as { phases?: { preQualifier?: { active?: boolean } } })?.phases?.preQualifier?.active ?? false;
  const finalsActive = (phaseStatus as { phases?: { finals?: { active?: boolean } } })?.phases?.finals?.active ?? false;

  const getPreQualifierStatus = () => {
    if (!preQualifierActive) return { label: '已结束', color: 'bg-ink-300', disabled: true };
    const score = scores.PRE_QUALIFIER;
    if (score && score.totalQuestions > 0) return { label: '进行中', color: 'bg-warning', disabled: false };
    return { label: '进行中', color: 'bg-bamboo-500', disabled: false };
  };

  const getFinalsStatus = () => {
    if (!finalsActive) return { label: '未开始', color: 'bg-ink-300', disabled: true };
    return { label: '进行中', color: 'bg-seal-500', disabled: false };
  };

  const preStatus = getPreQualifierStatus();
  const finalStatus = getFinalsStatus();

  return (
    <Layout>
      <div className="max-w-4xl mx-auto">
        {/* Welcome */}
        <div className="card mb-8 animate-slide-up poem-card">
          <div className="flex items-start gap-4">
            <div className="w-14 h-14 rounded-full bg-seal-50 border-2 border-seal-200 flex items-center justify-center shrink-0">
              <span className="text-2xl font-brush text-seal-600">
                {user?.fullName?.[0] || user?.username?.[0] || '学'}
              </span>
            </div>
            <div>
              <h1 className="text-3xl font-brush text-ink-900 tracking-wider">
                欢迎，{user?.fullName || user?.username}！
              </h1>
              <p className="text-ink-400 mt-1 font-kai text-sm">腹有诗书气自华</p>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3 text-sm">
                <div>
                  <p className="text-ink-400 font-kai">年级</p>
                  <p className="font-kai text-ink-700">{user?.grade || '-'}</p>
                </div>
                <div>
                  <p className="text-ink-400 font-kai">学号</p>
                  <p className="font-mono text-ink-700">{user?.studentId || '-'}</p>
                </div>
                <div>
                  <p className="text-ink-400 font-kai">用户名</p>
                  <p className="font-kai text-ink-700">{user?.username}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Quiz Phases */}
        <h2 className="text-2xl font-brush text-ink-900 mb-6 tracking-wider">比赛阶段</h2>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Pre-Qualifier */}
          <div className="card hover:shadow-ink transition-shadow animate-slide-up poem-card">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-brush text-ink-800">预选赛</h3>
              <span className={`px-3 py-1 rounded-full text-xs text-white font-kai ${preStatus.color}`}>
                {preStatus.label}
              </span>
            </div>
            <p className="text-ink-500 mb-4 font-kai text-sm">
              自主答题，不限时间，4月20日前完成。
            </p>

            {scores.PRE_QUALIFIER && scores.PRE_QUALIFIER.totalQuestions > 0 && (
              <div className="mb-4 p-3 bg-ink-50 rounded-lg">
                <div className="flex justify-between text-sm font-kai">
                  <span>得分：<strong className="text-seal-600">{scores.PRE_QUALIFIER.totalScore}</strong></span>
                  <span>{scores.PRE_QUALIFIER.correctAnswers}/{scores.PRE_QUALIFIER.totalQuestions} 正确</span>
                </div>
                <div className="mt-2 h-2 bg-ink-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-bamboo-500 rounded-full transition-all"
                    style={{
                      width: `${(scores.PRE_QUALIFIER.correctAnswers / scores.PRE_QUALIFIER.totalQuestions) * 100}%`,
                    }}
                  />
                </div>
              </div>
            )}

            <Link
              to={preStatus.disabled ? '#' : '/quiz?phase=PRE_QUALIFIER'}
              className={`btn w-full py-3 text-lg font-kai ${
                preStatus.disabled
                  ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
                  : 'btn-primary'
              }`}
              onClick={(e) => preStatus.disabled && e.preventDefault()}
            >
              {scores.PRE_QUALIFIER?.totalQuestions ? '继续答题' : '开始答题'}
            </Link>
          </div>

          {/* Finals */}
          <div className="card hover:shadow-ink transition-shadow animate-slide-up poem-card" style={{ animationDelay: '100ms' }}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-brush text-ink-800">决赛</h3>
              <span className={`px-3 py-1 rounded-full text-xs text-white font-kai ${finalStatus.color}`}>
                {finalStatus.label}
              </span>
            </div>
            <p className="text-ink-500 mb-4 font-kai text-sm">
              限时竞赛，4月24日 16:45 - 18:45。
            </p>

            {scores.FINALS && scores.FINALS.totalQuestions > 0 && (
              <div className="mb-4 p-3 bg-ink-50 rounded-lg">
                <div className="flex justify-between text-sm font-kai">
                  <span>得分：<strong className="text-seal-600">{scores.FINALS.totalScore}</strong></span>
                  <span>{scores.FINALS.correctAnswers}/{scores.FINALS.totalQuestions} 正确</span>
                </div>
              </div>
            )}

            <Link
              to={finalStatus.disabled ? '#' : '/quiz?phase=FINALS'}
              className={`btn w-full py-3 text-lg font-kai ${
                finalStatus.disabled
                  ? 'bg-ink-200 text-ink-400 cursor-not-allowed'
                  : 'btn-seal'
              }`}
              onClick={(e) => finalStatus.disabled && e.preventDefault()}
            >
              {finalStatus.disabled ? '暂未开始' : '进入决赛'}
            </Link>
          </div>
        </div>

        {/* Leaderboard Link */}
        <div className="card mt-8 text-center animate-slide-up poem-card" style={{ animationDelay: '200ms' }}>
          <h3 className="text-lg font-brush text-ink-800 mb-2">🏆 排行榜</h3>
          <p className="text-ink-500 mb-4 font-kai text-sm">看看你和其他参赛者的排名</p>
          <Link to="/results" className="btn btn-gold">
            查看排行
          </Link>
        </div>
      </div>
    </Layout>
  );
};
