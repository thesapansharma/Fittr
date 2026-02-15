# Daily Coach Bot — Production System Design

## Purpose
A general, production-ready daily coach system for any user across Telegram/WhatsApp channels.

## User Profile Setup
Collect at onboarding:
- Name
- Wake time
- Sleep time
- Fitness goal (weight loss / muscle gain / stay fit / stress reduction)
- Diet type (vegetarian / vegan / eggetarian / non-veg)
- Work schedule
- Water goal (default 3L)
- Calorie goal
- Workout preference
- Reminder frequency (light / normal / strict)

## Daily Automation Timeline

### 1) Wake-up Message (at wake time)
- Greeting + 3 micro-actions (water, stretch, breath)
- CTA: `YES` / `REMIND ME`

### 2) Morning Hydration Check (wake + 20/30 min)
- Goal/progress reminder
- CTA: `DONE`

### 3) Morning Wellness Prompt (optional)
- Mood options (energetic/normal/tired/stressed)
- If stressed, send quick breathing protocol

### 4) Workout Reminder
- Goal-based workout suggestion
- Duration target
- CTA: `START` / `SKIP` / `LATER`
- If skipped, send short fallback plan (5-minute version)

### 5) Breakfast Check-In
- Goal/diet-based suggestions
- Parse food text, estimate calories, store log

### 6) Hourly / Periodic Micro Reminders
- Hydration (hourly or adaptive)
- Posture/movement (every 2–3 hours)
- Mid-morning mood check

### 7) Snack / Lunch / Afternoon / Evening / Dinner
- Prompt logging around meal windows
- Feedback + balance suggestions
- Post-lunch energy reset
- Evening movement nudge

### 8) Night Reflection + Daily Summary
- Reflection prompt before bedtime
- Auto summary at sleep time - 30 min

## Weekly Insights
Send every Sunday:
- Workout consistency
- Calorie trend
- Hydration trend
- Mood trend
- One practical recommendation

## AI Intelligence Rules
- Missed water repeatedly -> increase hydration reminder frequency
- Low mood repeatedly -> add calming interventions
- Overeating detected -> suggest lighter next meal
- Workout skipped -> suggest 5-minute fallback

## Data Model (Reference)

### Users
- id
- name
- wake_time
- sleep_time
- goal
- diet_type
- calorie_goal
- water_goal
- reminder_level

### DailyLog
- date
- user_id
- water_intake
- calories
- workout_status
- steps
- mood_summary

### Meals
- user_id
- date
- meal_type
- food_text
- calories

### MoodLogs
- user_id
- time
- mood

### ActivityLogs
- workout_done
- walk_done
- steps

## Automation Engine
- Wake-time job
- Hourly hydration/posture jobs
- Meal-time check-in jobs
- Night summary job
- Weekly insight job

Use queue-based scheduling in production (e.g., BullMQ/Redis) for retry and reliability.

## Architecture
- Frontend channels: Telegram bot, WhatsApp bot, optional app/web
- Backend: Node.js REST APIs + webhook handlers
- AI layer: LLM parser for food/mood + suggestions
- Database: MongoDB/PostgreSQL (team choice)
- Scheduler: cron + queue workers

## Message Design Principles
- Friendly, concise, supportive, non-judgmental
- Avoid long paragraphs
- Keep reminder volume configurable

## Reminder Modes
- Light: essential reminders
- Normal: full standard flow
- Strict: high accountability

## Privacy & Security
- Data encryption at rest/in transit
- User-controlled reminder frequency
- Opt-out anytime
- No unauthorized sharing

## Suggested MVP Sequence
1. Onboarding profile + reminder preferences
2. Wake/hydration/workout/meal/night summary flow
3. AI parsing for food + mood
4. Weekly insights
5. Adaptive reminder intelligence
