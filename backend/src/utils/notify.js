const https = require('https');

const ADMIN_TG_CHAT_ID = process.env.ADMIN_TG_CHAT_ID || '66905450';

function sendTgNotification(text) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token || !ADMIN_TG_CHAT_ID) return;
  const body = JSON.stringify({ chat_id: ADMIN_TG_CHAT_ID, text, parse_mode: 'HTML' });
  const opts = {
    hostname: 'api.telegram.org',
    path: `/bot${token}/${('sendMessage')}`,
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(body) },
  };
  const req = https.request(opts, () => {});
  req.on('error', () => {});
  req.write(body);
  req.end();
}

module.exports = { sendTgNotification };
