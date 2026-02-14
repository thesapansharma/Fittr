import express from 'express';
import { handleIncoming } from '../services/coachEngine.js';
import { sendTelegramText } from '../services/telegramService.js';

export const telegramWebhookRouter = express.Router();

telegramWebhookRouter.post('/', async (req, res) => {
  try {
    const msg = req.body?.message;
    const chatId = msg?.chat?.id;
    const text = msg?.text || '';

    if (!chatId || !text) {
      return res.sendStatus(200);
    }

    const userKey = `telegram:${chatId}`;
    const response = await handleIncoming(userKey, text);
    await sendTelegramText(chatId, response);
    return res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook processing failed', error.message);
    return res.sendStatus(500);
  }
});
