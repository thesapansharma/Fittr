import express from 'express';
import { config } from '../config.js';
import { handleIncoming } from '../services/coachEngine.js';
import { sendTelegramText } from '../services/telegramService.js';

export const telegramWebhookRouter = express.Router();

function getTelegramIncoming(update = {}) {
  const messageLike = update.message || update.edited_message || update.channel_post || update.edited_channel_post;

  if (messageLike?.chat?.id) {
    return {
      chatId: String(messageLike.chat.id),
      text: messageLike.text || messageLike.caption || '',
      hasText: Boolean(messageLike.text || messageLike.caption)
    };
  }

  const callback = update.callback_query;
  if (callback?.message?.chat?.id) {
    return {
      chatId: String(callback.message.chat.id),
      text: callback.data || '',
      hasText: Boolean(callback.data)
    };
  }

  return null;
}

telegramWebhookRouter.post('/', async (req, res) => {
  try {
    if (config.telegram.webhookSecret) {
      const secretHeader = req.get('x-telegram-bot-api-secret-token');
      const isSecretValid = secretHeader === config.telegram.webhookSecret;

      if (!isSecretValid && config.telegram.strictWebhookSecret) {
        console.warn('Telegram webhook rejected: invalid secret token header.');
        return res.sendStatus(403);
      }

      if (!isSecretValid && !config.telegram.strictWebhookSecret) {
        console.warn('Telegram webhook secret mismatch; processing update because TELEGRAM_STRICT_SECRET is disabled.');
      }
    }

    const incoming = getTelegramIncoming(req.body);
    if (!incoming) {
      return res.sendStatus(200);
    }

    if (!incoming.hasText) {
      await sendTelegramText(
        incoming.chatId,
        'I currently support text messages only. Please send your update in text format (for example: meal lunch dal rice 120).'
      );
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
