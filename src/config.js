import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT || 3000),
  mongoUri: process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/fitbudget',
  whatsapp: {
    provider: process.env.WHATSAPP_PROVIDER || 'meta-cloud',
    token: process.env.WHATSAPP_TOKEN || '',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID || '',
    verifyToken: process.env.WHATSAPP_VERIFY_TOKEN || 'fitbudget_verify_token',
    graphVersion: process.env.WHATSAPP_GRAPH_VERSION || 'v21.0'
  }
};
