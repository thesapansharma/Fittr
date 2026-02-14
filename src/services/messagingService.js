import { config } from '../config.js';
import { sendWhatsAppText } from './whatsappService.js';
import { sendTelegramText } from './telegramService.js';

export function isOtpRequired() {
  return config.communicationProvider === 'whatsapp';
}

export async function sendMessage(to, message) {
  if (config.communicationProvider === 'telegram') {
    return sendTelegramText(to, message);
  }
  return sendWhatsAppText(to, message);
}
