import dayjs from 'dayjs';
import { Meal } from '../models/Meal.js';
import { WaterLog } from '../models/WaterLog.js';
import { ExerciseLog } from '../models/ExerciseLog.js';
import { Message } from '../models/Message.js';
import { User } from '../models/User.js';
import { foodCalories, foodSwaps } from './foodData.js';
import { getAiCoachReply } from './openaiService.js';

const emotionalKeywords = ['guilty', 'ate too much', 'failed', 'binge', 'stress eating', 'sad', 'low', 'depressed'];

const supportedMedicalIssues = [
  'diabetes',
  'high_bp',
  'kidney_stone',
  'thyroid',
  'pcos',
  'cholesterol',
  'fatty_liver',
  'acidity',
  'ibs',
  'anemia',
  'asthma',
  'arthritis'
];

const medicalKeywords = {
  diabetes: ['diabetes', 'diabetic', 'sugar patient'],
  high_bp: ['high bp', 'bp', 'hypertension', 'blood pressure'],
  kidney_stone: ['kidney stone', 'stone problem', 'renal stone'],
  thyroid: ['thyroid', 'hypothyroid', 'hyperthyroid'],
  pcos: ['pcos', 'pcod'],
  cholesterol: ['cholesterol', 'lipid'],
  fatty_liver: ['fatty liver'],
  acidity: ['acidity', 'acid reflux', 'gastric'],
  ibs: ['ibs', 'irritable bowel'],
  anemia: ['anemia', 'low hemoglobin', 'haemoglobin'],
  asthma: ['asthma', 'breathing issue'],
  arthritis: ['arthritis', 'joint pain']
};

function detectMealType(text) {
  if (text.includes('breakfast')) return 'breakfast';
  if (text.includes('lunch')) return 'lunch';
  if (text.includes('dinner')) return 'dinner';
  return 'snack';
}

function findFood(text) {
  const normalized = text.toLowerCase();
  return Object.keys(foodCalories).find((f) => normalized.includes(f));
}

function extractNumber(text) {
  const match = text.match(/\d+/);
  return match ? Number(match[0]) : null;
}

function extractTime(text) {
  const match = text.match(/\b([01]?\d|2[0-3]):([0-5]\d)\b/);
  return match ? `${match[1].padStart(2, '0')}:${match[2]}` : null;
}

function detectMedicalIssues(text) {
  const normalized = text.toLowerCase();
  return Object.entries(medicalKeywords)
    .filter(([, terms]) => terms.some((term) => normalized.includes(term)))
    .map(([issue]) => issue);
}

function getDietTypeHint(user) {
  const dietMap = {
    vegetarian: 'Build meals around dal, paneer/tofu, curd, sprouts, vegetables, and whole grains.',
    vegan: 'Use tofu/soy/chana/rajma for protein and include nuts + seeds daily.',
    eggetarian: 'Use eggs + dals + curd for high-protein budget-friendly meals.',
    non_vegetarian: 'Use eggs/chicken/fish with vegetables and portioned carbs.'
  };

  return dietMap[user.dietType] || 'Keep balanced plate: protein + fiber + controlled carbs.';
}


function getCurrencySymbol(currency) {
  const symbols = { INR: '₹', USD: '$', GBP: '£', CAD: 'C$', AUD: 'A$', AED: 'AED ', SGD: 'S$' };
  return symbols[currency] || '';
}


function getWorkoutSuggestion(user) {
  const base = user.exerciseHabit === 'gym'
    ? 'Gym plan: 40-50 min strength training + 10 min cool down walk.'
    : user.exerciseHabit === 'beginner'
      ? 'Beginner plan: 20-25 min brisk walk + 8 squats + 8 wall pushups + stretching.'
      : 'Starter plan: 15-20 min walk + 5-10 min mobility/stretching.';

  const officeAddOn = user.jobType === 'desk'
    ? 'Desk tip: every hour, stand and do 2-3 min neck/back movement.'
    : 'Keep active shifts balanced with hydration and recovery.';

  return `${base}
${officeAddOn}
Recommended workout reminder: ${user?.reminderTimes?.workout || '18:30'}.`;
}

function getMedicalGuidance(user) {
  const issues = user.medicalIssues || [];
  if (!issues.length) return '';

  const lines = [];

  if (issues.includes('diabetes')) {
    lines.push('🩺 Diabetes: choose low-GI foods, avoid sugary drinks, and walk 10-15 min after meals.');
  }
  if (issues.includes('high_bp')) {
    lines.push('🩺 High BP: reduce salt/packaged foods and include vegetables, fruit, and hydration.');
  }
  if (issues.includes('kidney_stone')) {
    lines.push('🩺 Kidney stone: keep steady hydration and avoid long no-water gaps.');
  }
  if (issues.includes('thyroid')) {
    lines.push('🩺 Thyroid: prioritize regular meal timing, protein, fiber, and sleep consistency.');
  }
  if (issues.includes('pcos')) {
    lines.push('🩺 PCOS: prefer high-fiber + protein meals and reduce refined sugar/snacks.');
  }
  if (issues.includes('cholesterol')) {
    lines.push('🩺 Cholesterol: use less fried food, include oats/legumes, and add daily walking.');
  }
  if (issues.includes('fatty_liver')) {
    lines.push('🩺 Fatty liver: lower sugar and fried foods, favor whole foods and gradual fat loss.');
  }
  if (issues.includes('acidity')) {
    lines.push('🩺 Acidity: avoid very spicy/late heavy meals and use lighter early dinners.');
  }
  if (issues.includes('ibs')) {
    lines.push('🩺 IBS: keep trigger-food journal, prefer simple home-cooked meals, avoid sudden food changes.');
  }
  if (issues.includes('anemia')) {
    lines.push('🩺 Anemia: include iron-rich foods (greens, legumes) with vitamin-C sources.');
  }
  if (issues.includes('asthma')) {
    lines.push('🩺 Asthma: keep hydration up and avoid known food/environment triggers.');
  }
  if (issues.includes('arthritis')) {
    lines.push('🩺 Arthritis: focus on anti-inflammatory meal pattern and low-impact daily activity.');
  }

  lines.push('For medical treatment changes, follow your doctor’s advice first.');
  return lines.join('\n');
}

async function getTodayStats(userId) {
  const start = dayjs().startOf('day').toDate();
  const end = dayjs().endOf('day').toDate();

  const [meals, waters, workouts] = await Promise.all([
    Meal.find({ userId, mealDate: { $gte: start, $lte: end } }),
    WaterLog.find({ userId, loggedAt: { $gte: start, $lte: end } }),
    ExerciseLog.find({ userId, exerciseDate: { $gte: start, $lte: end } })
  ]);

  return {
    mealCount: meals.length,
    budgetUsed: meals.reduce((sum, m) => sum + m.cost, 0),
    waterGlasses: waters.reduce((sum, w) => sum + w.glasses, 0),
    exerciseMinutes: workouts.reduce((sum, w) => sum + w.durationMinutes, 0)
  };
}

function onboardingPrompt() {
  return [
    'Welcome to FitBudget AI Coach 👋',
    'Please share in one message (comma-separated):',
    'Name, weight(kg), height(cm), goal(lose weight/stay fit/gain muscle),',
    'job type (desk/active), sleep hours, exercise habit (none/beginner/gym), daily budget(₹), water goal(glasses),',
    `diet type(vegetarian/vegan/eggetarian/non_vegetarian), medical issues(optional: ${supportedMedicalIssues.join('|')}|none), office timing.`
  ].join('\n');
}

async function saveMessage(userId, content, direction) {
  await Message.create({ userId, content, direction });
}

function normalizeMedicalValue(v) {
  const value = v.trim().toLowerCase();
  if (['high bp', 'bp', 'hypertension'].includes(value)) return 'high_bp';
  if (['kidney stone', 'stone'].includes(value)) return 'kidney_stone';
  if (['fatty liver'].includes(value)) return 'fatty_liver';
  return value.replace(/\s+/g, '_');
}

function parseMedicalIssues(rawText = '') {
  if (!rawText || rawText.toLowerCase() === 'none') return [];

  return rawText
    .split(/[|/,]/)
    .map((v) => normalizeMedicalValue(v))
    .filter((v) => supportedMedicalIssues.includes(v));
}

export async function handleIncoming(phone, text) {
  const incoming = text.trim();
  let user = await User.findOne({ phone });

  if (!user) {
    user = await User.create({ phone });
    await saveMessage(user._id, incoming, 'incoming');
    const response = onboardingPrompt();
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  await saveMessage(user._id, incoming, 'incoming');

  if (!user.onboardingComplete) {
    const parts = incoming.split(',').map((p) => p.trim());
    if (parts.length < 9) {
      const response = 'Please send onboarding fields in one comma-separated message. I can then build your full plan 💪';
      await saveMessage(user._id, response, 'outgoing');
      return response;
    }

    const [
      name,
      weight,
      height,
      goal,
      jobType,
      sleepHours,
      exerciseHabit,
      dailyBudget,
      waterGoal,
      dietType = 'vegetarian',
      medicalIssueInput = 'none',
      officeTiming = '9am-6pm'
    ] = parts;

    user.name = name;
    user.weight = Number(weight);
    user.height = Number(height);
    user.goal = goal;
    user.jobType = jobType;
    user.sleepHours = Number(sleepHours);
    user.exerciseHabit = exerciseHabit;
    user.dailyBudget = Number(dailyBudget);
    user.waterGoal = Number(waterGoal);
    user.dietType = dietType.toLowerCase().replace(' ', '_');
    user.medicalIssues = parseMedicalIssues(medicalIssueInput);
    user.officeTiming = officeTiming;
    user.onboardingComplete = true;
    await user.save();

    const exerciseLine =
      user.exerciseHabit === 'none'
        ? 'Start with a 15 min walk daily. Consistency matters more than intensity.'
        : user.exerciseHabit === 'gym'
          ? 'Great. Focus on protein intake and proper recovery to avoid overtraining.'
          : 'Nice. Add squats, wall pushups, and stretching at home.';

    const response = ['Onboarding complete ✅', exerciseLine, `Diet coaching: ${getDietTypeHint(user)}`, `Workout reminder time: ${user?.reminderTimes?.workout || '18:30'}`, `Sleep reminder time: ${user?.reminderTimes?.sleep || '22:00'}`, getMedicalGuidance(user)]
      .filter(Boolean)
      .join('\n');

    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  const normalized = incoming.toLowerCase();

  if (emotionalKeywords.some((k) => normalized.includes(k))) {
    user.latestMoodFlag = 'guilty';
    await user.save();
    const response = 'You are doing better than you think 💙 One meal or one day won’t ruin progress. Start fresh next meal 👍';
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }


  if (normalized.startsWith('feedback') || normalized.includes('improve this app') || normalized.includes('improvement suggestion')) {
    const response = 'Thank you for sharing your feedback 🙏 We logged this and will use it to improve your coaching experience.';
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.startsWith('set reminder')) {
    const time = extractTime(normalized);

    if (!time) {
      const response = 'Please send reminder in this format: set reminder water 10:30';
      await saveMessage(user._id, response, 'outgoing');
      return response;
    }

    if (normalized.includes('water')) user.reminderTimes.water = time;
    if (normalized.includes('workout') || normalized.includes('exercise')) user.reminderTimes.workout = time;
    if (normalized.includes('meal') || normalized.includes('diet')) user.reminderTimes.meal = time;
    if (normalized.includes('sleep') || normalized.includes('bed') || normalized.includes('night')) user.reminderTimes.sleep = time;
    await user.save();

    const response = `Reminder time updated ⏰ Water: ${user.reminderTimes.water}, Meal: ${user.reminderTimes.meal}, Workout: ${user.reminderTimes.workout}, Sleep: ${user.reminderTimes.sleep || '22:00'}.`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.startsWith('medical') || normalized.startsWith('health issue')) {
    const issues = detectMedicalIssues(normalized);
    if (!issues.length) {
      const response = `Tell me issues like: medical diabetes high bp thyroid pcos cholesterol. Supported: ${supportedMedicalIssues.join(', ')}`;
      await saveMessage(user._id, response, 'outgoing');
      return response;
    }

    user.medicalIssues = [...new Set([...(user.medicalIssues || []), ...issues])];
    await user.save();
    const response = `Medical profile updated ✅\n${getMedicalGuidance(user)}`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.startsWith('diet type')) {
    const nextType = normalized.replace('diet type', '').trim().replace(' ', '_');
    const validDietTypes = ['vegetarian', 'vegan', 'eggetarian', 'non_vegetarian'];

    if (!validDietTypes.includes(nextType)) {
      const response = 'Use: diet type vegetarian | vegan | eggetarian | non_vegetarian';
      await saveMessage(user._id, response, 'outgoing');
      return response;
    }

    user.dietType = nextType;
    await user.save();
    const response = `Diet type updated ✅ ${getDietTypeHint(user)}`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }


  if (normalized.includes('workout suggest') || normalized.includes('exercise suggest') || normalized.includes('workout plan')) {
    const response = `🏃 Workout suggestion:
${getWorkoutSuggestion(user)}
You can set custom timing: set reminder workout 18:30`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }


  if (normalized.startsWith('sleep time') || normalized.startsWith('set sleep')) {
    const time = extractTime(normalized);
    if (!time) {
      const response = 'Use: sleep time 22:00';
      await saveMessage(user._id, response, 'outgoing');
      return response;
    }

    user.reminderTimes.sleep = time;
    await user.save();
    const response = `Sleep reminder updated 😴 ${user.reminderTimes.sleep}`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.startsWith('water')) {
    const glasses = extractNumber(normalized) || 1;
    await WaterLog.create({ userId: user._id, glasses });
    const stats = await getTodayStats(user._id);
    const response = `Hydration updated 💧 Total today: ${stats.waterGlasses}/${user.waterGoal} glasses.`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.startsWith('workout') || normalized.startsWith('exercise')) {
    const duration = extractNumber(normalized) || 15;
    const activity = normalized.replace(/\d+/g, '').replace('workout', '').replace('exercise', '').trim() || 'walking';
    await ExerciseLog.create({ userId: user._id, durationMinutes: duration, activity });
    const officeTip = user.jobType === 'desk' ? 'Also do neck/back stretch every hour during office work.' : 'Keep up the active routine.';
    const response = `Workout logged: ${duration} min ${activity} 🏃\n${officeTip}`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.includes('summary')) {
    const stats = await getTodayStats(user._id);
    const remainingBudget = user.dailyBudget - stats.budgetUsed;
    const currency = getCurrencySymbol(user.budgetCurrency);
    const response = [
      'Today Summary:',
      `Meals logged: ${stats.mealCount}`,
      `Water: ${stats.waterGlasses} glasses`,
      `Exercise: ${stats.exerciseMinutes} min`,
      `Budget used: ${currency}${stats.budgetUsed}`,
      `Budget left: ${currency}${remainingBudget}`,
      `Diet type: ${user.dietType}`,
      `Medical focus: ${(user.medicalIssues || []).join(', ') || 'none'}`,
      'Great progress 👍'
    ].join('\n');
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  if (normalized.startsWith('meal') || normalized.startsWith('ate')) {
    const food = findFood(normalized) || normalized.replace('meal', '').replace('ate', '').trim() || 'custom meal';
    const calories = foodCalories[food] || 220;
    const cost = extractNumber(normalized) || 0;
    const mealType = detectMealType(normalized);
    await Meal.create({ userId: user._id, food, calories, cost, mealType, mealDate: new Date() });

    const swap = foodSwaps.find((s) => s.trigger.some((trigger) => normalized.includes(trigger)));
    const stats = await getTodayStats(user._id);
    const budgetWarning =
      stats.budgetUsed > user.dailyBudget
        ? `⚠️ You crossed your daily budget by ${getCurrencySymbol(user.budgetCurrency)}${stats.budgetUsed - user.dailyBudget}.`
        : stats.budgetUsed > user.dailyBudget * 0.8
          ? '⚠️ You are nearing your daily budget limit.'
          : `Budget status: ${getCurrencySymbol(user.budgetCurrency)}${user.dailyBudget - stats.budgetUsed} left today.`;

    const sleepTip = user.sleepHours < 6 ? 'Sleep below 6 hours can slow fat loss. Aim for better sleep timing tonight.' : 'Good sleep supports fat loss and recovery.';
    const base = `${food} (~${calories} cal) logged.`;
    const swapLine = swap ? `Try ${swap.suggestions.join(' / ')} next time 🙂` : 'Nice logging consistency. Keep meals balanced with protein + fiber.';
    const response = `${base}\n${swapLine}\n${budgetWarning}\n${sleepTip}\n${getDietTypeHint(user)}\n${getMedicalGuidance(user)}`;
    await saveMessage(user._id, response, 'outgoing');
    return response;
  }

  const aiReply = await getAiCoachReply(user, incoming);
  if (aiReply) {
    await saveMessage(user._id, aiReply, 'outgoing');
    return aiReply;
  }

  const fallback = [
    'I can coach meals, water, workouts, diet type, medical-food care, and reminders.',
    'Try commands like:',
    '- meal lunch samosa 40',
    '- water 2',
    '- workout walk 20',
    '- workout suggest',
    '- diet type vegetarian',
    '- medical diabetes high bp thyroid',
    '- set reminder water 10:30',
    '- set reminder sleep 22:00',
    '- sleep time 22:00',
    '- summary'
  ].join('\n');

  await saveMessage(user._id, fallback, 'outgoing');
  return fallback;
}

export async function listUsersForAutomation() {
  return User.find({ onboardingComplete: true });
}
