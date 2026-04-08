import React from 'react';

function MedicationCard({ dose, onTake, onMiss, isPast }) {
  const statusClasses = {
    taken: 'status-taken',
    missed: 'status-missed',
    pending: 'status-pending'
  };

  const statusLabels = {
    taken: '✓ Taken',
    missed: '✗ Missed',
    pending: 'Pending'
  };

  const formatTime = (time) => {
    const [h, m] = time.split(':');
    const hour = parseInt(h);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${m} ${ampm}`;
  };

  return (
    <div className={`medication-card ${statusClasses[dose.status]} ${isPast && dose.status === 'pending' ? 'overdue' : ''}`}>
      <div
        className="card-accent"
        style={{ backgroundColor: dose.color || '#4A90D9' }}
      />

      <div className="card-content">
        <div className="card-header">
          <h3 className="card-med-name">{dose.medicationName}</h3>
          <span className={`status-badge ${statusClasses[dose.status]}`}>
            {statusLabels[dose.status]}
          </span>
        </div>

        <div className="card-details">
          <span className="card-dosage">{dose.dosage}</span>
          <span className="card-time">{formatTime(dose.scheduledTime)}</span>
        </div>

        {dose.instructions && (
          <p className="card-instructions">{dose.instructions}</p>
        )}

        {(isPast && dose.status === 'pending') && (
          <div className="overdue-warning">⚠ This dose is overdue</div>
        )}

        {dose.status === 'pending' && (
          <div className="card-actions">
            <button className="btn btn-taken" onClick={onTake}>
              ✓ Take
            </button>
            <button className="btn btn-miss" onClick={onMiss}>
              Missed
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default MedicationCard;
