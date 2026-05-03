// =============================================================================
// MaaSwara — Telegram API Client
//
// Simple utility for communicating with the Telegram Bot API.
// =============================================================================

const getBotToken = () => {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) {
    console.error('[Telegram] TELEGRAM_BOT_TOKEN is not configured.');
  }
  return token;
};

export async function sendTelegramMessage(chatId: number | string, text: string) {
  const token = getBotToken();
  if (!token) return false;

  const url = `https://api.telegram.org/bot${token}/sendMessage`;

  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error('[Telegram] SendMessage failed:', errorData);
      return false;
    }

    return true;
  } catch (error) {
    console.error('[Telegram] Network error sending message:', error);
    return false;
  }
}
