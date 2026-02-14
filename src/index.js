import express from 'express';
import mongoose from 'mongoose';
import path from 'path';
import { fileURLToPath } from 'url';
import { config } from './config.js';
import { webhookRouter } from './routes/webhook.js';
import { registerRouter } from './routes/register.js';
import { telegramWebhookRouter } from './routes/telegramWebhook.js';
import { adminRouter } from './routes/admin.js';
import { startSchedulers } from './jobs/scheduler.js';

const app = express();
app.use(express.json());

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const publicDir = path.join(__dirname, '..', 'public');

app.use(express.static(publicDir));

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fitbudget-ai-coach' });
});

app.use('/webhook/whatsapp', webhookRouter);
app.use('/webhook/telegram', telegramWebhookRouter);
app.use('/api/register', registerRouter);
app.use('/api/admin', adminRouter);


app.get('/admin', (_req, res) => {
  return res.sendFile(path.join(publicDir, 'admin.html'));
});

app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api/') || req.path.startsWith('/webhook/')) {
    return next();
  }

  return res.sendFile(path.join(publicDir, 'index.html'));
});

async function start() {
  await mongoose.connect(config.mongoUri,
    {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
  console.log('Connected to MongoDB');

  startSchedulers();

  app.listen(config.port, () => {
    console.log(`FitBudget AI Coach listening on port ${config.port}`);
  });
}

start().catch((err) => {
  console.error('Failed to start app', err);
  process.exit(1);
});
