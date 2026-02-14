import express from 'express';
import { config } from '../config.js';
import { handleIncoming } from '../services/coachEngine.js';
import { sendTelegramText } from '../services/telegramService.js';

export const telegramWebhookRouter = express.Router();

function getTelegramIncoming(update = {}) {
  const msg = update.message || update.edited_message || update.channel_post || update.edited_channel_post;

  if (msg?.chat?.id && (msg?.text || msg?.caption)) {
    return {
      chatId: String(msg.chat.id),
      text: msg.text || msg.caption
    };
  }

  const callback = update.callback_query;
  if (callback?.message?.chat?.id && callback?.data) {
    return {
      chatId: String(callback.message.chat.id),
      text: callback.data
    };
  }

  return null;
}

telegramWebhookRouter.post('/', async (req, res) => {
  try {
    if (config.telegram.webhookSecret) {
      const secretHeader = req.get('x-telegram-bot-api-secret-token');
      if (secretHeader !== config.telegram.webhookSecret) {
        return res.sendStatus(403);
      }
    }

    const incoming = getTelegramIncoming(req.body);
    if (!incoming) {
      return res.sendStatus(200);
    }

    const userKey = `telegram:${incoming.chatId}`;
    const response = await handleIncoming(userKey, incoming.text);
    await sendTelegramText(incoming.chatId, response);

    return res.sendStatus(200);
  } catch (error) {
    console.error('Telegram webhook processing failed', error.message);
    return res.sendStatus(500);
  }
});
