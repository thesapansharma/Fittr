import axios from 'axios';
import { config } from '../config.js';

export async function sendWhatsAppText(to, message) {
  if (!config.whatsapp.token || !config.whatsapp.phoneNumberId) {
    console.log(`[MOCK WHATSAPP] To ${to}: ${message}`);
    return { mocked: true };
  }

  const url = `https://graph.facebook.com/${config.whatsapp.graphVersion}/${config.whatsapp.phoneNumberId}/messages`;

  return axios.post(
    url,
    {
      messaging_product: 'whatsapp',
      to,
      type: 'text',
      text: { body: message }
    },
    {
      headers: {
        Authorization: `Bearer ${config.whatsapp.token}`,
        'Content-Type': 'application/json'
      }
    }
  );
}
