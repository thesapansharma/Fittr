import express from 'express';
import mongoose from 'mongoose';
import { config } from './config.js';
import { webhookRouter } from './routes/webhook.js';
import { startSchedulers } from './jobs/scheduler.js';

const app = express();
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'fitbudget-ai-coach' });
});

app.use('/webhook/whatsapp', webhookRouter);

async function start() {
  await mongoose.connect(config.mongoUri);
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
