import React from 'react';

function AlarmPopup({ alarm, onDismiss, onTake }) {
  if (!alarm) return null;

  const formatTime = (time) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className="alarm-overlay">
      <div className={`alarm-popup ${alarm.isEarly ? 'alarm-early' : 'alarm-now'}`}>
        <div className="alarm-pulse" />
        <div className="alarm-icon">{alarm.isEarly ? '⏰' : '🔔'}</div>
        <h2 className="alarm-title">
          {alarm.isEarly
            ? 'Upcoming Medication'
            : 'Time to Take Your Medicine!'}
        </h2>
        <div className="alarm-med-name">{alarm.medicationName}</div>
        <div className="alarm-details">
          <span className="alarm-dosage">{alarm.dosage}</span>
          <span className="alarm-time">{formatTime(alarm.scheduledTime)}</span>
        </div>
        {alarm.instructions && (
          <p className="alarm-instructions">{alarm.instructions}</p>
        )}
        <div className="alarm-actions">
          {!alarm.isEarly && (
            <button className="btn btn-taken alarm-btn" onClick={onTake}>
              ✓ Mark as Taken
            </button>
          )}
          <button className="btn btn-outline alarm-btn" onClick={onDismiss}>
            {alarm.isEarly ? 'Got it' : 'Dismiss'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default AlarmPopup;
