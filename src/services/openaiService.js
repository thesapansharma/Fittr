import axios from 'axios';
import { config } from '../config.js';

function buildSystemPrompt(user) {
  return [
    'You are FitBudget AI Coach for WhatsApp users in India.',
    'Give concise, practical, supportive guidance for nutrition, workouts, hydration, sleep, and budget-friendly food choices.',
    'Respect user profile: goal, diet type, medical issues, office routine, and budget.',
    'Avoid diagnosis or medication advice; suggest seeing a doctor for clinical decisions.',
    'Keep response under 120 words and easy to act on today.'
  ].join(' ');
}

function extractOutputText(responseData) {
  if (responseData?.output_text) return responseData.output_text;

  const chunks = responseData?.output || [];
  for (const item of chunks) {
    for (const c of item?.content || []) {
      if (c.type === 'output_text' && c.text) return c.text;
      if (c.type === 'text' && c.text) return c.text;
    }
  }

  return '';
}

export async function getAiCoachReply(user, message) {
  if (!config.openai.apiKey) return null;

  const profile = {
    goal: user.goal,
    dietType: user.dietType,
    medicalIssues: user.medicalIssues || [],
    jobType: user.jobType,
    officeTiming: user.officeTiming,
    dailyBudget: user.dailyBudget,
    waterGoal: user.waterGoal,
    sleepHours: user.sleepHours,
    exerciseHabit: user.exerciseHabit
  };

  try {
    const response = await axios.post(
      `${config.openai.baseUrl}/responses`,
      {
        model: config.openai.model,
        input: [
          {
            role: 'system',
            content: [{ type: 'input_text', text: buildSystemPrompt(user) }]
          },
          {
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: `User profile: ${JSON.stringify(profile)}\nUser message: ${message}`
              }
            ]
          }
        ]
      },
      {
        headers: {
          Authorization: `Bearer ${config.openai.apiKey}`,
          'Content-Type': 'application/json'
        },
        timeout: 12000
      }
    );

    const text = extractOutputText(response.data)?.trim();
    return text || null;
  } catch (error) {
    console.error('OpenAI reply failed', error.response?.data || error.message);
    return null;
  }
}
