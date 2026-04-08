import React, { useState, useEffect, useCallback } from 'react';
import { getCalendarData } from '../services/api';

function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [calendarData, setCalendarData] = useState({});
  const [selectedDate, setSelectedDate] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchCalendar = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await getCalendarData(currentDate.getMonth(), currentDate.getFullYear());
      setCalendarData(data);
    } catch (err) {
      console.error('Failed to load calendar');
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    fetchCalendar();
  }, [fetchCalendar]);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();
  const firstDay = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const monthName = currentDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });

  const prevMonth = () => setCurrentDate(new Date(year, month - 1, 1));
  const nextMonth = () => setCurrentDate(new Date(year, month + 1, 1));

  const getDayClass = (dateKey) => {
    const dayData = calendarData[dateKey];
    if (!dayData) return '';
    if (dayData.taken === dayData.total) return 'cal-day-perfect';
    if (dayData.missed > 0) return 'cal-day-missed';
    if (dayData.pending > 0) return 'cal-day-pending';
    return '';
  };

  const today = (() => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  })();

  return (
    <div className="calendar-page">
      <div className="calendar-container">
        <div className="calendar-header">
          <button className="btn btn-icon" onClick={prevMonth}>◀</button>
          <h2>{monthName}</h2>
          <button className="btn btn-icon" onClick={nextMonth}>▶</button>
        </div>

        {loading ? (
          <div className="loading">Loading calendar...</div>
        ) : (
          <>
            <div className="calendar-grid">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} className="cal-header-cell">{day}</div>
              ))}

              {[...Array(firstDay)].map((_, i) => (
                <div key={`empty-${i}`} className="cal-cell empty" />
              ))}

              {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const dateKey = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
                const isToday = dateKey === today;
                const dayData = calendarData[dateKey];

                return (
                  <div
                    key={day}
                    className={`cal-cell ${getDayClass(dateKey)} ${isToday ? 'cal-today' : ''} ${selectedDate === dateKey ? 'cal-selected' : ''}`}
                    onClick={() => setSelectedDate(dateKey === selectedDate ? null : dateKey)}
                  >
                    <span className="cal-day-number">{day}</span>
                    {dayData && (
                      <div className="cal-day-indicator">
                        <span className="cal-dot taken" title={`${dayData.taken} taken`} />
                        {dayData.missed > 0 && <span className="cal-dot missed" title={`${dayData.missed} missed`} />}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Selected day detail */}
            {selectedDate && calendarData[selectedDate] && (
              <div className="cal-detail">
                <h3>
                  {new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-US', {
                    weekday: 'long', month: 'long', day: 'numeric'
                  })}
                </h3>
                <div className="cal-detail-stats">
                  <span className="stat-taken">{calendarData[selectedDate].taken} taken</span>
                  <span className="stat-missed">{calendarData[selectedDate].missed} missed</span>
                  <span className="stat-pending">{calendarData[selectedDate].pending} pending</span>
                </div>
                <div className="cal-detail-doses">
                  {calendarData[selectedDate].doses.map((d, i) => (
                    <div key={i} className={`cal-dose-item status-${d.status}`}>
                      <span className="dose-name">{d.medication?.name}</span>
                      <span className="dose-time">{d.scheduledTime}</span>
                      <span className={`dose-status ${d.status}`}>{d.status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      <div className="calendar-legend">
        <div className="legend-item">
          <span className="legend-dot perfect" /> All doses taken
        </div>
        <div className="legend-item">
          <span className="legend-dot missed" /> Missed doses
        </div>
        <div className="legend-item">
          <span className="legend-dot pending" /> Pending doses
        </div>
      </div>
    </div>
  );
}

export default CalendarView;
