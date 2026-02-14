# FitBudget AI Coach (Node.js + MongoDB + WhatsApp Cloud API)

A low-cost WhatsApp AI health coach backend for:
- meal + calorie tracking
- water tracking + reminders
- exercise/workout coaching
- food budget tracking
- food swap suggestions
- emotional eating support
- daily summary automation
- diet-type personalization + medical-aware suggestions

## Tech Stack
- Node.js + Express
- MongoDB + Mongoose
- Telegram Bot API (active mode) + WhatsApp Cloud API (optional fallback)
- node-cron for background reminders
- Optional OpenAI Responses API for free-form coaching replies with user context (India/INR, gender, food preference)
- React-based modern registration UI (served from Express)

## Documentation
- Technical documentation: `docs/TECHNICAL.md`
- User documentation: `docs/USER_GUIDE.md`

## Quick Start

```bash
npm install
cp .env.example .env
npm run dev
```

## Environment Variables
Create `.env`:

```env
PORT=3000
MONGO_URI=mongodb://127.0.0.1:27017/fitbudget
COMMUNICATION_PROVIDER=telegram
WHATSAPP_PROVIDER=meta-cloud
WHATSAPP_TOKEN=your_meta_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=fitbudget_verify_token
WHATSAPP_GRAPH_VERSION=v21.0
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
TELEGRAM_WEBHOOK_SECRET=optional_secret
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
ADMIN_PANEL_TOKEN=fitbudget_admin
# Country is fixed to India and budget currency is INR
```


## AI Model Support
- By default, coaching works with rule-based logic.
- If `OPENAI_API_KEY` is set, unknown/free-form user messages are sent to OpenAI Responses API.
- Default model is `gpt-4o-mini` (configurable via `OPENAI_MODEL`).

## Webhook Endpoints
- `GET /webhook/whatsapp` verification (if WhatsApp mode)
- `POST /webhook/whatsapp` incoming message handling
- `POST /webhook/telegram` incoming Telegram updates (`message`, `edited_message`, `channel_post`, `callback_query`)
- If `TELEGRAM_WEBHOOK_SECRET` is set, requests must include `x-telegram-bot-api-secret-token`.


## Admin Panel + Test Simulator
- Open `/admin` for an internal admin dashboard.
- Use header token `x-admin-token` (or enter it in UI) matching `ADMIN_PANEL_TOKEN`.
- Admin APIs:
  - `GET /api/admin/overview` → totals for users, onboarding, logs.
  - `GET /api/admin/users?limit=150` → user list.
  - `GET /api/admin/messages?limit=200&phone=...` → recent logs (optionally phone filtered).
  - `POST /api/admin/simulate` with `{ phone, text }` → run a local test message simulation and get bot reply.


## Message Inputs Supported
- `meal lunch samosa 40`
- `water 2`
- `workout walk 20`
- `workout suggest`
- `diet type vegetarian`
- `medical diabetes high bp`
- `set reminder water 10:30`
- `set reminder workout 18:30`
- `set reminder sleep 22:00`
- `sleep time 22:00`
- `summary`
- emotional phrases like `I feel guilty` or `I feel sad`
- product feedback reply like `feedback 5/5 love reminders, improve meal variety`

## New Personalized Health Features
- **Diet type profiles**: vegetarian, vegan, eggetarian, non_vegetarian.
- **Medical issue handling**: broader general list (diabetes, high BP, kidney stone, thyroid, PCOS, cholesterol, fatty liver, acidity, IBS, anemia, asthma, arthritis).
- **Meal suggestions based on medical profile**:
  - diabetes: lower sugar / low-GI guidance
  - high BP: low salt guidance
  - kidney stone: hydration focus reminders
- **Custom reminder time support** for meal/water/workout via WhatsApp command.

## Data Models
- Users
- Meals
- WaterLogs
- ExerciseLogs
- Messages

## Automation
Cron schedules included for:
- morning activation
- afternoon hydration nudge
- evening light-dinner reminder
- nightly sleep reminder
- daily automated check-in message for all onboarded users
- workout logging + suggestion support with configurable workout reminder timing
- custom-time reminders per user (water/meal/workout/sleep)
- automatic bi-weekly WhatsApp product feedback check-in

## Notes
If WhatsApp credentials are missing, outbound messages are printed in logs (mock mode) so local development stays simple.


## Keep PR Conflict-Free with `main`
Before opening or updating a PR, sync your branch with `main`:

```bash
git fetch origin
git rebase origin/main
# resolve conflicts if prompted
git rebase --continue
```

If your branch is already pushed, update remote branch after rebase:

```bash
git push --force-with-lease
```


## Registration API (First 200 Users Free)
- `GET /api/register/channel` → returns active communication provider and whether OTP is required.
- `GET /api/register/capacity` → returns `{ limit, used, remaining }`.
- `GET /api/register/medical-options` → returns supported medical issue list for dropdown UI.
- `GET /api/register/office-timing-options` → returns selectable `officeStarts`, `officeEnds`, `workTypes`, plus dropdown options for `genders` and `foodPreferences` (country removed; currency fixed to INR for India).
- `POST /api/register/send-otp` → sends OTP on the active provider channel for phone verification (required in WhatsApp mode).
- `POST /api/register/verify-otp` → verifies OTP and returns short-lived `verifyToken`.
- `POST /api/register` → registers/updates profile (requires OTP verification token and legal consent) and enforces free access cap for new signups.

### Web UI
- Open `/` to access the modern React registration page.
- The page shows live seat usage and supports profile inputs with dropdowns for body-shape goal, water goal, current diet, food preference, office start/end time, work type, gender, and daily budget range (country fixed to India; currency fixed to INR).
- Medical issues are shown as tap-friendly selectable chips for quicker selection.
- On submit, OTP verification appears in a popup modal if the phone is not yet verified.
- Phone registration requires OTP verification only when provider is WhatsApp; Telegram mode shows Telegram-specific UI text and skips OTP.
- Privacy Policy and Terms & Conditions consent are required before registration.
