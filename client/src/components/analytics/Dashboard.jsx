import useAnalyticsStore from '../../store/analyticsStore';
import useHistoryStore from '../../store/historyStore';
import { BarChart, Bar, PieChart, Pie, Cell, ResponsiveContainer, XAxis, YAxis, Tooltip, AreaChart, Area } from 'recharts';
import { Activity, Zap, Target, TrendingUp, RotateCcw } from 'lucide-react';

const COLORS = ['#3b82f6', '#8b5cf6', '#10b981', '#f59e0b', '#ef4444', '#06b6d4'];

export default function Dashboard() {
  const {
    totalOptimizations,
    totalScores,
    getDailyUsageArray,
    getModeUsageArray,
    scoreHistory,
    resetAnalytics,
  } = useAnalyticsStore();
  const { history } = useHistoryStore();

  const dailyData = getDailyUsageArray();
  const modeData = getModeUsageArray();

  // Calculate average score
  const avgScore =
    scoreHistory.length > 0
      ? (scoreHistory.reduce((sum, s) => sum + s.score, 0) / scoreHistory.length).toFixed(1)
      : '—';

  // Recent scores for the mini chart
  const recentScores = scoreHistory.slice(-20).map((s, i) => ({
    i,
    score: s.score,
  }));

  const hasData = totalOptimizations > 0 || history.length > 0;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          icon={Zap}
          label="Total Optimizations"
          value={totalOptimizations}
          color="from-blue-500 to-cyan-500"
        />
        <StatCard
          icon={Target}
          label="Prompts Scored"
          value={totalScores}
          color="from-purple-500 to-violet-500"
        />
        <StatCard
          icon={TrendingUp}
          label="Avg Score"
          value={avgScore}
          suffix="/10"
          color="from-emerald-500 to-teal-500"
        />
        <StatCard
          icon={Activity}
          label="Saved Prompts"
          value={history.length}
          color="from-amber-500 to-orange-500"
        />
      </div>

      {!hasData ? (
        <div className="glass-card p-16 text-center">
          <Activity className="w-12 h-12 text-text-muted mx-auto mb-3" />
          <p className="text-text-secondary text-sm">No analytics data yet</p>
          <p className="text-text-muted text-xs mt-1">Start optimizing prompts to see your dashboard</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Daily Usage Chart */}
          {dailyData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Daily Usage
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={dailyData}>
                  <defs>
                    <linearGradient id="areaGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="date"
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    tickFormatter={(d) => d.slice(-5)}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: 12,
                      color: '#f1f5f9',
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="count"
                    stroke="#3b82f6"
                    fill="url(#areaGradient)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Mode Usage Pie Chart */}
          {modeData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Mode Usage
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie
                    data={modeData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={80}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {modeData.map((_, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: 12,
                      color: '#f1f5f9',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-wrap justify-center gap-3 mt-2">
                {modeData.map((entry, index) => (
                  <div key={entry.name} className="flex items-center gap-1.5">
                    <span
                      className="w-2.5 h-2.5 rounded-full"
                      style={{ background: COLORS[index % COLORS.length] }}
                    />
                    <span className="text-[10px] text-text-muted">{entry.name}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Score Trend */}
          {recentScores.length > 1 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Score Trend (last 20)
              </h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={recentScores}>
                  <XAxis dataKey="i" hide />
                  <YAxis
                    domain={[0, 10]}
                    tick={{ fontSize: 10, fill: '#64748b' }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: '#1e293b',
                      border: '1px solid #334155',
                      borderRadius: '8px',
                      fontSize: 12,
                      color: '#f1f5f9',
                    }}
                    formatter={(value) => [`${value}/10`, 'Score']}
                  />
                  <Bar dataKey="score" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Top Modes */}
          {modeData.length > 0 && (
            <div className="glass-card p-5">
              <h3 className="text-xs font-semibold text-text-secondary uppercase tracking-wide mb-4">
                Most Used Modes
              </h3>
              <div className="space-y-3">
                {modeData
                  .sort((a, b) => b.value - a.value)
                  .map((entry, index) => {
                    const maxVal = Math.max(...modeData.map((d) => d.value));
                    const percent = (entry.value / maxVal) * 100;
                    return (
                      <div key={entry.name}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-text">{entry.name}</span>
                          <span className="text-xs text-text-muted font-mono">{entry.value}</span>
                        </div>
                        <div className="w-full h-2 bg-surface-active rounded-full overflow-hidden">
                          <div
                            className="h-full rounded-full score-bar-fill"
                            style={{
                              width: `${percent}%`,
                              background: COLORS[index % COLORS.length],
                            }}
                          />
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Reset */}
      {hasData && (
        <div className="text-center">
          <button
            onClick={() => {
              if (confirm('Reset all analytics data?')) resetAnalytics();
            }}
            className="text-xs text-text-muted hover:text-error transition-colors flex items-center gap-1 mx-auto"
          >
            <RotateCcw className="w-3 h-3" />
            Reset Analytics
          </button>
        </div>
      )}
    </div>
  );
}

function StatCard({ icon: Icon, label, value, suffix, color }) {
  return (
    <div className="glass-card p-5">
      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center mb-3`}>
        <Icon className="w-5 h-5 text-white" />
      </div>
      <p className="text-2xl font-bold text-text animate-count">
        {value}
        {suffix && <span className="text-sm text-text-muted font-normal">{suffix}</span>}
      </p>
      <p className="text-xs text-text-muted mt-0.5">{label}</p>
    </div>
  );
}
