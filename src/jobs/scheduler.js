import cron from 'node-cron';
import dayjs from 'dayjs';
import { listUsersForAutomation } from '../services/coachEngine.js';
import { sendMessage } from '../services/messagingService.js';

const SCHEDULER_TIMEZONE = 'Asia/Kolkata';


function getCurrentTimeInSchedulerTimezone() {
  const nowInSchedulerTz = new Date(new Date().toLocaleString('en-US', { timeZone: SCHEDULER_TIMEZONE }));
  const asDayJs = dayjs(nowInSchedulerTz);
  return {
    currentTime: asDayJs.format('HH:mm'),
    todayKey: asDayJs.format('YYYY-MM-DD')
  };
}

async function sendToAllUsers(messageFactory) {
  const users = await listUsersForAutomation();
  await Promise.all(
    users.map(async (user) => {
      try {
        const msg = messageFactory(user);
        await sendMessage(user.phone, msg);
      } catch (error) {
        console.error(`scheduler send failed for ${user.phone}`, error.message);
      }
    })
  );
}

async function sendCustomTimedReminders() {
  const users = await listUsersForAutomation();
  const { currentTime, todayKey } = getCurrentTimeInSchedulerTimezone();

  await Promise.all(
    users.map(async (user) => {
      const reminders = user.reminderTimes || {};
      const lastSent = user.lastReminderSent || {};

      const reminderConfigs = [
        { key: 'water', text: '💧 Water reminder: drink water now and stay hydrated.' },
        { key: 'meal', text: '🥗 Meal reminder: choose a balanced plate (protein + fiber + controlled carbs).' },
        { key: 'workout', text: '🏃 Workout reminder: do your planned session or at least a 15-minute walk.' },
        { key: 'sleep', text: '😴 Sleep reminder: start wind-down now and target consistent sleep timing.' }
      ];

      let changed = false;

      for (const reminder of reminderConfigs) {
        if (reminders[reminder.key] === currentTime && lastSent[reminder.key] !== todayKey) {
          try {
            await sendMessage(user.phone, reminder.text);
            user.lastReminderSent = { ...lastSent, [reminder.key]: todayKey };
            changed = true;
          } catch (error) {
            console.error(`custom reminder send failed for ${user.phone}`, error.message);
          }
        }
      }

      if (changed) {
        await user.save();
      }
    })
  );
}

async function sendDailyCoachCheckIn() {
  await sendToAllUsers((user) => `📘 Daily check-in: log meals, water, and workout today. Budget target: ₹${user.dailyBudget}. Reply 'summary' tonight for progress.`);
}

async function sendBiWeeklyFeedbackRequests() {
  const users = await listUsersForAutomation();
  const now = dayjs();

  await Promise.all(
    users.map(async (user) => {
      const lastFeedbackAt = user.lastProductFeedbackAt ? dayjs(user.lastProductFeedbackAt) : null;
      const shouldSend = !lastFeedbackAt || now.diff(lastFeedbackAt, 'day') >= 14;

      if (!shouldSend) return;

      const message = [
        '📝 Quick 2-week check-in from FitBudget!',
        'How is your coaching experience so far?',
        'Please reply with:',
        '1) Rating (1-5)',
        '2) One thing you like',
        '3) One thing we should improve'
      ].join('\n');

      await sendMessage(user.phone, message);
      user.lastProductFeedbackAt = now.toDate();
      await user.save();
    })
  );
}

export function startSchedulers() {
  cron.schedule('0 8 * * *', () => {
    sendToAllUsers(() => 'Good morning 🌞 Drink 1 glass of water and do a quick stretch.');
  }, { timezone: SCHEDULER_TIMEZONE });

  cron.schedule('0 14 * * *', () => {
    sendToAllUsers((user) => `Hydration check 💧 You are targeting ${user.waterGoal} glasses today. Add a short walk too.`);
  }, { timezone: SCHEDULER_TIMEZONE });

  cron.schedule('30 20 * * *', () => {
    sendToAllUsers(() => 'Evening tip: keep dinner light and finish 2-3 hours before sleep.');
  }, { timezone: SCHEDULER_TIMEZONE });

  cron.schedule('0 19 * * *', () => {
    sendDailyCoachCheckIn().catch((error) => {
      console.error('daily check-in scheduler failed', error.message);
    });
  }, { timezone: SCHEDULER_TIMEZONE });

  cron.schedule('0 11 * * *', () => {
    sendBiWeeklyFeedbackRequests().catch((error) => {
      console.error('bi-weekly feedback scheduler failed', error.message);
    });
  }, { timezone: SCHEDULER_TIMEZONE });

  cron.schedule('* * * * *', () => {
    sendCustomTimedReminders().catch((error) => {
      console.error('custom reminder scheduler failed', error.message);
    });
  }, { timezone: SCHEDULER_TIMEZONE });
}
