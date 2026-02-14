# FitBudget AI Coach — User Documentation

## 1. What this product does
FitBudget is a WhatsApp-first health coach that helps you:
- track meals, water, workouts
- get healthier food swap suggestions
- receive practical guidance based on your goal and lifestyle
- manage daily food budget
- get reminders and day summaries

You can also register from the web form for onboarding.

---

## 2. Getting Started
## Step A: Register (Web)
1. Open the website root URL (`/`).
2. Fill profile details (goal, diet type, medical issues, office timings, etc.).
3. Verify your WhatsApp phone with OTP.
4. Accept Privacy Policy and Terms.
5. Submit registration.

## Step B: Start WhatsApp Chat
Once registered, message your bot number and start logging activities.

---

## 3. What you can message
### Meal logging
- `meal lunch dal rice 120`
- `ate samosa 40`

### Water logging
- `water 2`

### Workout logging
- `workout walk 20`
- `exercise yoga 30`

### Workout suggestions
- `workout suggest`
- `workout plan`

### Daily summary
- `summary`

### Diet profile update
- `diet type vegetarian`
- supported: `vegetarian`, `vegan`, `eggetarian`, `non_vegetarian`

### Medical updates
- `medical diabetes high bp`

### Reminder time updates
- `set reminder water 10:30`
- `set reminder meal 13:15`
- `set reminder workout 18:30`

### Emotional support
- messages like “I feel guilty”, “I feel sad”, etc. will get encouragement.

### Product feedback
- `feedback improve workout suggestions`

---

## 4. Features you receive
- Personalized diet + lifestyle suggestions.
- Medical-aware guidance (non-diagnostic).
- Budget-aware nudges and warnings.
- Hydration and activity reminders.
- Daily summary report.
- Automatic daily check-in message on WhatsApp.
- Bi-weekly product feedback check-in on WhatsApp.

---

## 5. Registration fields explained
- **Goal**: lose weight / stay fit / gain muscle.
- **Body Shape Goal**: desired body composition direction.
- **Diet Type**: vegetarian/vegan/etc.
- **Current Diet**: your present eating pattern.
- **Food Preference**: preferred meal style.
- **Medical Issues**: selected conditions for safer guidance.
- **Work Type + Office timing**: helps schedule reminders/tips.
- **Daily Budget + Currency**: budget is tracked in INR (India-only setup).
- **Water Goal**: daily hydration target.

---

## 6. Privacy and Safety
- You must accept Privacy Policy and Terms to register.
- The bot gives lifestyle guidance, not diagnosis or medication prescriptions.
- For treatment decisions, consult your doctor.

---

## 7. Troubleshooting
- OTP not received: re-check phone format and resend OTP.
- “Phone verification required”: verify OTP first, then submit register.
- No AI-style free-form replies: ensure OpenAI is enabled by system admin.
- Message not understood: use command formats listed above.

---

## 8. Admin & Support (for operators)
- Admin panel is available at `/admin` for internal team use.
- End users should contact support if onboarding or messaging issues persist.


Note: Current active default communication provider is Telegram (`COMMUNICATION_PROVIDER=telegram`).
