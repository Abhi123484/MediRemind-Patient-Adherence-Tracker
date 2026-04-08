import React from 'react';

function WeeklySummary({ data, todayPending = 0 }) {
  const { summary, dailyStats } = data;
  const totalPending = summary.pending + todayPending;

  const getBarColor = (taken, total) => {
    if (total === 0) return '#e0e0e0';
    const rate = taken / total;
    if (rate >= 0.9) return '#4CAF50';
    if (rate >= 0.6) return '#FFC107';
    return '#F44336';
  };

  const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="weekly-card">
      <h3 className="weekly-title">Weekly Overview</h3>

      <div className="adherence-ring">
        <svg viewBox="0 0 120 120" className="ring-svg">
          <circle cx="60" cy="60" r="50" className="ring-bg" />
          <circle
            cx="60" cy="60" r="50"
            className="ring-fill"
            strokeDasharray={`${summary.adherenceRate * 3.14} 314`}
            style={{
              stroke: summary.adherenceRate >= 80 ? '#4CAF50'
                : summary.adherenceRate >= 50 ? '#FFC107' : '#F44336'
            }}
          />
        </svg>
        <div className="ring-text">
          <span className="ring-percent">{summary.adherenceRate}%</span>
          <span className="ring-label">adherence</span>
        </div>
      </div>

      <div className="weekly-stats">
        <div className="stat">
          <span className="stat-value stat-taken">{summary.taken}</span>
          <span className="stat-label">Taken</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-missed">{summary.missed}</span>
          <span className="stat-label">Missed</span>
        </div>
        <div className="stat">
          <span className="stat-value stat-pending">{totalPending}</span>
          <span className="stat-label">Pending</span>
        </div>
      </div>

      <div className="weekly-bars">
        {Object.entries(dailyStats).map(([date, stats]) => {
          const dayOfWeek = new Date(date + 'T00:00:00').getDay();
          const height = stats.total > 0 ? (stats.taken / stats.total) * 100 : 0;
          return (
            <div key={date} className="bar-container">
              <div className="bar-wrapper">
                <div
                  className="bar"
                  style={{
                    height: `${Math.max(height, 4)}%`,
                    backgroundColor: getBarColor(stats.taken, stats.total)
                  }}
                  title={`${stats.taken}/${stats.total} doses`}
                />
              </div>
              <span className="bar-label">{dayLabels[dayOfWeek]}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default WeeklySummary;
