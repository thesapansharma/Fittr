# FitBudget AI Coach — Technical Documentation

## 1. Architecture Overview
FitBudget is a Node.js + Express + MongoDB application that serves:
- WhatsApp webhook processing for inbound/outbound chat coaching.
- Registration APIs and onboarding data capture.
- Admin APIs and admin web panel for operations.
- Scheduled automation jobs (reminders, summaries, product feedback cadence).
- Static web UI assets (`public/`) for registration and admin tools.

Primary runtime layers:
1. **HTTP layer** (`src/index.js`, route modules).
2. **Domain logic** (`src/services/coachEngine.js`).
3. **Persistence layer** (Mongoose models in `src/models/`).
4. **Integrations** (WhatsApp + OpenAI services).
5. **Scheduler** (`src/jobs/scheduler.js`).

---

## 2. Project Structure
- `src/index.js`: app bootstrapping, Mongo connect, router mounting, static hosting.
- `src/config.js`: env configuration.
- `src/routes/`
  - `webhook.js`: WhatsApp webhook verify + message intake.
  - `register.js`: OTP flow, registration, options APIs, free-cap controls.
  - `admin.js`: token-gated operational endpoints + simulator.
- `src/services/`
  - `coachEngine.js`: core conversational logic, onboarding, logging, summaries.
  - `whatsappService.js`: outbound WhatsApp send or mock log output.
  - `openaiService.js`: optional OpenAI Responses API bridge.
  - `foodData.js`: calorie + swap lookup dictionaries.
- `src/models/`: Mongoose schemas.
- `src/jobs/scheduler.js`: cron jobs for reminders/feedback.
- `public/`: browser UI files.

---

## 3. Runtime Dependencies & Configuration
### Required
- Node.js runtime (ES modules).
- MongoDB instance.

### Optional Integrations
- Meta WhatsApp Cloud API credentials.
- OpenAI API key/model configuration.

### Environment Variables
- `PORT`
- `MONGO_URI`
- `WHATSAPP_PROVIDER`
- `WHATSAPP_TOKEN`
- `WHATSAPP_PHONE_NUMBER_ID`
- `WHATSAPP_VERIFY_TOKEN`
- `WHATSAPP_GRAPH_VERSION`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_BASE_URL`
- `ADMIN_PANEL_TOKEN`

---

## 4. Data Model Reference
## 4.1 User
Stores profile, onboarding, personalization, medical context, reminders, and compliance events.
Key groups:
- Identity: `name`, `phone`.
- Body/goal: `weight`, `height`, `goal`, `bodyShapeGoal`.
- Lifestyle: `officeTiming`, `jobType`, `sleepHours`, `exerciseHabit`.
- Nutrition profile: `dietType`, `currentDiet`, `foodPreference`, `easyDietMode`.
- Medical: `medicalIssues`.
- Budget/hydration locale: `dailyBudget` (INR), `budgetCurrency` (fixed INR), `waterGoal`, and `gender` (India is fixed).
- Reminder state: `reminderTimes`, `lastReminderSent`.
- Compliance: `privacyAcceptedAt`, `termsAcceptedAt`, `phoneVerifiedAt`.
- Product ops: `lastProductFeedbackAt`, `onboardingComplete`, `latestMoodFlag`.

## 4.2 Meal
Per-meal capture: `food`, `calories`, `cost`, `mealType`, `mealDate`, `userId`.

## 4.3 WaterLog
Hydration event: `glasses`, `loggedAt`, `userId`.

## 4.4 ExerciseLog
Activity tracking: `activity`, `durationMinutes`, `exerciseDate`, `userId`.

## 4.5 Message
Audit log for inbound/outbound conversation: `content`, `direction`, `timestamp`, `userId`.

---

## 5. API Specification
## 5.1 Health
- `GET /health`

## 5.2 WhatsApp Webhook
- `GET /webhook/whatsapp`: Meta verification challenge.
- `POST /webhook/whatsapp`: incoming event parser; routes text to coach engine and sends reply.

## 5.3 Registration APIs
Base path: `/api/register`
- `GET /capacity`
- `GET /medical-options`
- `GET /office-timing-options` (office/work/gender/food-preference options; country removed and currency fixed to INR)
- `POST /send-otp`
- `POST /verify-otp`
- `POST /` (register/update user)

Functional constraints:
- New registrations are limited to first 200 onboarded users.
- Phone verification token required before register submit.
- Privacy and Terms acceptance required.

## 5.4 Admin APIs
Base path: `/api/admin` (requires `x-admin-token` = `ADMIN_PANEL_TOKEN`)
- `GET /overview`
- `GET /users?limit=...`
- `GET /messages?limit=...&phone=...`
- `POST /simulate` with `{ phone, text }`

---

## 6. Coach Engine Behavior
Core entrypoint: `handleIncoming(phone, text)`.

Flow:
1. Resolve/create user.
2. Persist incoming message.
3. If onboarding incomplete:
   - either return onboarding prompt, or parse CSV-style onboarding input.
4. Else route command-intent:
   - emotion support
   - feedback acknowledgment
   - reminder updates
   - medical updates
   - diet type updates
   - water/workout/meal logging
   - summary generation
5. For unknown/free-form input:
   - call OpenAI (if configured), else fallback help text.
6. Persist outgoing message.

---

## 7. Scheduler Design
`startSchedulers()` wires cron jobs for:
- morning reminder
- afternoon hydration prompt
- evening healthy-dinner prompt
- night sleep reminder
- daily automated check-in message
- user-custom reminder times (meal/water/workout)
- bi-weekly product feedback message

All jobs iterate onboarding-complete users and use WhatsApp send service.

---

## 8. Admin Panel Design
URL: `/admin`
Capabilities:
- enter admin token in UI.
- load operational overview counters.
- inspect users and message logs.
- run simulator to test coaching response for arbitrary phone+message.

Security note:
- Current token auth is static shared secret model suitable for MVP/internal use.
- Recommended next step: role-based admin user accounts + session/JWT + audit trails.

---

## 9. Error Handling & Fallbacks
- Missing WhatsApp credentials: send function logs to console in mock mode.
- OpenAI failures: handled gracefully; chat falls back to static command guidance.
- OTP invalid/expired: explicit API errors.
- Admin unauthorized: 401 JSON response.

---

## 10. Deployment Notes
1. Provision MongoDB.
2. Set all required `.env` values.
3. Configure WhatsApp webhook URL to `/webhook/whatsapp`.
4. Start service (`npm run dev` or process manager in production).
5. Lock down admin token and rotate periodically.

---

## 11. Recommended Next Improvements
- Add request validation middleware (zod/joi) for all route payloads.
- Add rate limits for OTP and admin endpoints.
- Add pagination + search indexes for admin logs.
- Add tests (unit + integration with supertest).
- Add RBAC-based admin auth.
