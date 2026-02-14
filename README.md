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
- WhatsApp Cloud API (cheap vs CPaaS intermediaries)
- node-cron for background reminders
- Optional OpenAI Responses API for free-form coaching replies
- React-based modern registration UI (served from Express)

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
WHATSAPP_PROVIDER=meta-cloud
WHATSAPP_TOKEN=your_meta_token
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id
WHATSAPP_VERIFY_TOKEN=fitbudget_verify_token
WHATSAPP_GRAPH_VERSION=v21.0
OPENAI_API_KEY=your_openai_api_key
OPENAI_MODEL=gpt-4o-mini
OPENAI_BASE_URL=https://api.openai.com/v1
```


## AI Model Support
- By default, coaching works with rule-based logic.
- If `OPENAI_API_KEY` is set, unknown/free-form user messages are sent to OpenAI Responses API.
- Default model is `gpt-4o-mini` (configurable via `OPENAI_MODEL`).

## Webhook Endpoints
- `GET /webhook/whatsapp` verification
- `POST /webhook/whatsapp` incoming message handling

## Message Inputs Supported
- `meal lunch samosa 40`
- `water 2`
- `workout walk 20`
- `diet type vegetarian`
- `medical diabetes high bp`
- `set reminder water 10:30`
- `summary`
- emotional phrases like `I feel guilty` or `I feel sad`

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
- night sleep reminder
- custom-time reminders per user (water/meal/workout)

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
- `GET /api/register/capacity` → returns `{ limit, used, remaining }`.
- `GET /api/register/medical-options` → returns supported medical issue list for dropdown UI.
- `POST /api/register` → registers/updates a user profile and enforces free access cap for new signups.

### Web UI
- Open `/` to access the modern React registration page.
- The page shows live seat usage and supports profile inputs (goal, body-shape target, diet type, office timing, budget, and a multi-select medical issue dropdown).
