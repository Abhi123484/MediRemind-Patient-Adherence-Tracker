// Store active timer IDs so we can clear them on re-schedule
let activeTimers = [];

// In-app alarm callback — set by the dashboard component
let _onAlarmTrigger = null;

export function setAlarmCallback(cb) {
  _onAlarmTrigger = cb;
}

export function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

export function scheduleReminders(pendingDoses) {
  // Clear any previously scheduled timers
  activeTimers.forEach(id => clearTimeout(id));
  activeTimers = [];

  const now = new Date();

  pendingDoses.forEach(dose => {
    const [hours, minutes] = dose.scheduledTime.split(':').map(Number);
    const reminderTime = new Date();
    reminderTime.setHours(hours, minutes, 0, 0);

    const delay = reminderTime.getTime() - now.getTime();

    // Only schedule future reminders (within the next 24 hours)
    if (delay > 0 && delay < 24 * 60 * 60 * 1000) {
      // Main alarm at scheduled time
      const mainTimer = setTimeout(() => {
        triggerAlarm(dose, false);
      }, delay);
      activeTimers.push(mainTimer);

      // 5-minute early reminder
      const earlyDelay = delay - 5 * 60 * 1000;
      if (earlyDelay > 0) {
        const earlyTimer = setTimeout(() => {
          triggerAlarm(dose, true);
        }, earlyDelay);
        activeTimers.push(earlyTimer);
      }
    }
  });

  // Also check every 30 seconds for doses that just became due (handles tab-sleep)
  const checkTimer = setInterval(() => {
    const currentTime = new Date();
    const timeStr = `${String(currentTime.getHours()).padStart(2, '0')}:${String(currentTime.getMinutes()).padStart(2, '0')}`;
    pendingDoses.forEach(dose => {
      if (dose.scheduledTime === timeStr && dose.status === 'pending') {
        triggerAlarm(dose, false);
      }
    });
  }, 30000);
  activeTimers.push(checkTimer);
}

function triggerAlarm(dose, isEarly) {
  // 1. Play alarm sound
  playAlarmSound();

  // 2. Show in-app popup notification
  if (_onAlarmTrigger) {
    _onAlarmTrigger({
      medicationId: dose.medicationId,
      medicationName: dose.medicationName,
      dosage: dose.dosage,
      scheduledTime: dose.scheduledTime,
      instructions: dose.instructions,
      isEarly
    });
  }

  // 3. Show browser notification (if permitted)
  showBrowserNotification(dose, isEarly);
}

function playAlarmSound() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();

    // Play a clear two-tone alarm beep pattern (repeats 3 times)
    const playBeep = (startTime, freq, duration) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      osc.type = 'sine';
      gain.gain.setValueAtTime(0.3, startTime);
      gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
      osc.start(startTime);
      osc.stop(startTime + duration);
    };

    for (let i = 0; i < 3; i++) {
      const base = ctx.currentTime + i * 0.8;
      playBeep(base, 880, 0.2);        // A5
      playBeep(base + 0.25, 1108, 0.2); // C#6
      playBeep(base + 0.5, 1320, 0.3);  // E6
    }
  } catch (e) {
    // AudioContext not available
  }
}

function showBrowserNotification(dose, isEarly) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  const title = isEarly
    ? `⏰ Reminder: ${dose.medicationName} in 5 minutes`
    : `🔔 Time to take ${dose.medicationName}!`;

  const body = `${dose.dosage}${dose.instructions ? ` — ${dose.instructions}` : ''}`;

  try {
    const notification = new Notification(title, {
      body,
      icon: '/favicon.ico',
      tag: `med-${dose.medicationId}-${dose.scheduledTime}-${isEarly ? 'early' : 'now'}`,
      requireInteraction: true,
      vibrate: [200, 100, 200, 100, 200]
    });

    notification.onclick = () => {
      window.focus();
      notification.close();
    };

    setTimeout(() => notification.close(), 120000);
  } catch (e) {
    // Notification API not available
  }
}
