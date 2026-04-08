import React from 'react';

function StreakTracker({ streak }) {
  const getStreakEmoji = () => {
    if (streak >= 30) return '🏆';
    if (streak >= 14) return '🔥';
    if (streak >= 7) return '⭐';
    if (streak >= 3) return '💪';
    return '🎯';
  };

  const getStreakMessage = () => {
    if (streak >= 30) return 'Outstanding! A whole month!';
    if (streak >= 14) return 'Two weeks strong!';
    if (streak >= 7) return 'One week streak!';
    if (streak >= 3) return 'Building momentum!';
    if (streak >= 1) return 'Great start!';
    return 'Take all doses today to start!';
  };

  return (
    <div className="streak-card">
      <div className="streak-emoji">{getStreakEmoji()}</div>
      <div className="streak-count">{streak}</div>
      <div className="streak-label">Day Streak</div>
      <div className="streak-message">{getStreakMessage()}</div>

      <div className="streak-dots">
        {[...Array(7)].map((_, i) => (
          <div
            key={i}
            className={`streak-dot ${i < Math.min(streak, 7) ? 'active' : ''}`}
          />
        ))}
      </div>
    </div>
  );
}

export default StreakTracker;
