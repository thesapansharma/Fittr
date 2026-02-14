import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  communicationProvider: process.env.COMMUNICATION_PROVIDER || 'telegram',
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitbudget',
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'meta-cloud',
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'fitbudget_verify_token',
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION || 'v21.0'
  },
  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookSecret: process.env.TELEGRAM_WEBHOOK_SECRET || ''
  },
  openai: {
    apiKey: process.env.OPENAI_API_KEY || '',
    model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
    baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
  },
  adminToken: process.env.ADMIN_PANEL_TOKEN || 'fitbudget_admin'
};
