import React, { useState, useEffect, useCallback } from 'react';
import { getTodaySchedule, logDose, getWeeklySummary, getStreak } from '../services/api';
import StreakTracker from '../components/StreakTracker';
import MedicationCard from '../components/MedicationCard';
import WeeklySummary from '../components/WeeklySummary';
import AlarmPopup from '../components/AlarmPopup';
import { requestNotificationPermission, scheduleReminders, setAlarmCallback } from '../utils/notifications';

function PatientDashboard() {
  const [schedule, setSchedule] = useState([]);
  const [weekly, setWeekly] = useState(null);
  const [streak, setStreak] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeAlarm, setActiveAlarm] = useState(null);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      const [scheduleRes, weeklyRes, streakRes] = await Promise.all([
        getTodaySchedule(),
        getWeeklySummary(),
        getStreak()
      ]);
      setSchedule(scheduleRes.data);
      setWeekly(weeklyRes.data);
      setStreak(streakRes.data.streak);

      // Schedule browser notifications for pending doses
      const pendingDoses = scheduleRes.data.filter(d => d.status === 'pending');
      scheduleReminders(pendingDoses);
    } catch (err) {
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
    requestNotificationPermission();

    // Register in-app alarm callback
    setAlarmCallback((alarmData) => {
      setActiveAlarm(alarmData);
    });

    return () => setAlarmCallback(null);
  }, [fetchData]);

  const handleAlarmTake = async () => {
    if (activeAlarm) {
      await handleLogDose(activeAlarm.medicationId, activeAlarm.scheduledTime, 'taken');
      setActiveAlarm(null);
    }
  };

  const handleLogDose = async (medicationId, scheduledTime, status) => {
    try {
      // Send local date as YYYY-MM-DD string to avoid timezone shift
      const now2 = new Date();
      const localDate = `${now2.getFullYear()}-${String(now2.getMonth() + 1).padStart(2, '0')}-${String(now2.getDate()).padStart(2, '0')}`;

      await logDose({
        medicationId,
        scheduledDate: localDate,
        scheduledTime,
        status
      });

      fetchData();
    } catch (err) {
      setError('Failed to log dose');
    }
  };

  const now = new Date();
  const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

  const upcoming = schedule.filter(d => d.status === 'pending' && d.scheduledTime >= currentTime);
  const past = schedule.filter(d => d.status !== 'pending' || d.scheduledTime < currentTime);

  if (loading) return <div className="loading">Loading your dashboard...</div>;

  return (
    <div className="dashboard">
      {/* In-app alarm popup */}
      <AlarmPopup
        alarm={activeAlarm}
        onDismiss={() => setActiveAlarm(null)}
        onTake={handleAlarmTake}
      />

      <div className="dashboard-header">
        <h1>Today's Medications</h1>
        <p className="date-display">
          {new Date().toLocaleDateString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
          })}
        </p>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="dashboard-grid">
        <div className="dashboard-main">
          {/* Upcoming Doses */}
          {upcoming.length > 0 && (
            <section className="section">
              <h2 className="section-title">⏰ Upcoming <span className="pending-count">{upcoming.length} pending</span></h2>
              <div className="medication-list">
                {upcoming.map((dose, i) => (
                  <MedicationCard
                    key={`upcoming-${i}`}
                    dose={dose}
                    onTake={() => handleLogDose(dose.medicationId, dose.scheduledTime, 'taken')}
                    onMiss={() => handleLogDose(dose.medicationId, dose.scheduledTime, 'missed')}
                  />
                ))}
              </div>
            </section>
          )}

          {/* Past / Completed Doses */}
          {past.length > 0 && (
            <section className="section">
              <h2 className="section-title">📋 Earlier Today</h2>
              <div className="medication-list">
                {past.map((dose, i) => (
                  <MedicationCard
                    key={`past-${i}`}
                    dose={dose}
                    onTake={() => handleLogDose(dose.medicationId, dose.scheduledTime, 'taken')}
                    onMiss={() => handleLogDose(dose.medicationId, dose.scheduledTime, 'missed')}
                    isPast
                  />
                ))}
              </div>
            </section>
          )}

          {schedule.length === 0 && (
            <div className="empty-state">
              <span className="empty-icon">💊</span>
              <h3>No medications scheduled today</h3>
              <p>Add medications from the Medications page to get started.</p>
            </div>
          )}
        </div>

        <div className="dashboard-sidebar">
          <StreakTracker streak={streak} />
          {weekly && <WeeklySummary data={weekly} todayPending={upcoming.length} />}
        </div>
      </div>
    </div>
  );
}

export default PatientDashboard;
