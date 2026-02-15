import axios from 'axios';
import { config } from '../config.js';

export async function sendTelegramText(chatId, message) {
  if (!config.telegram.botToken) {
    console.log(`[MOCK TELEGRAM] To ${chatId}: ${message}`);
    return { mocked: true };
  }

  const url = `https://api.telegram.org/bot${config.telegram.botToken}/sendMessage`;
  return axios.post(url, {
    chat_id: chatId,
    text: message
  });
}
