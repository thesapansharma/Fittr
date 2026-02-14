import express from 'express';
import { config } from '../config.js';
import { handleIncoming } from '../services/coachEngine.js';
import { sendWhatsAppText } from '../services/whatsappService.js';

export const webhookRouter = express.Router();

webhookRouter.get('/', (req, res) => {
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  if (mode === 'subscribe' && token === config.whatsapp.verifyToken) {
    return res.status(200).send(challenge);
  }

  return res.sendStatus(403);
});

webhookRouter.post('/', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const changes = entry?.changes?.[0]?.value;
    const incoming = changes?.messages?.[0];

    if (!incoming) {
      return res.sendStatus(200);
    }

    const phone = incoming.from;
    const text = incoming.text?.body || '';

    const response = await handleIncoming(phone, text);
    await sendWhatsAppText(phone, response);

    return res.sendStatus(200);
  } catch (error) {
    console.error('Webhook processing failed', error.message);
    return res.sendStatus(500);
  }
});
