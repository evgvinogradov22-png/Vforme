const EmailLog = require('../models/EmailLog');
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp.yandex.ru',
  port: 465,
  secure: true,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

const FROM = `"V Форме — Кристина Виноградова" <${process.env.SMTP_USER}>`;
const APP_URL = process.env.APP_URL || 'https://app.nutrikris.ru';

function baseTemplate(content) {
  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { margin: 0; padding: 0; background: #f4f5f7; font-family: Arial, sans-serif; }
    .wrap { max-width: 560px; margin: 40px auto; background: #fff; border-radius: 16px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08); }
    .header { background: #2D4A2D; padding: 32px 40px; text-align: center; }
    .header h1 { color: #fff; margin: 0; font-size: 24px; letter-spacing: 2px; }
    .header p { color: rgba(255,255,255,0.7); margin: 6px 0 0; font-size: 13px; }
    .body { padding: 36px 40px; }
    .body h2 { color: #1A1A1A; font-size: 20px; margin: 0 0 16px; }
    .body p { color: #555; line-height: 1.7; margin: 0 0 16px; font-size: 15px; }
    .btn { display: block; width: fit-content; margin: 24px auto; padding: 16px 36px; background: #C4A26B; color: #fff !important; text-decoration: none; border-radius: 30px; font-weight: 700; font-size: 15px; letter-spacing: 1px; }
    .footer { background: #f9f7f4; padding: 20px 40px; text-align: center; font-size: 12px; color: #999; border-top: 1px solid #e0dad0; }
    .highlight { background: #EBF0EB; border-left: 4px solid #2D4A2D; border-radius: 0 8px 8px 0; padding: 14px 16px; margin: 16px 0; color: #2D4A2D; font-style: italic; }
    .box { background: #EBF0EB; border-radius: 12px; padding: 20px; margin: 20px 0; text-align: center; }
  </style>
</head>
<body>
  <div class="wrap">
    <div class="header">
      <h1>🌿 V ФОРМЕ</h1>
      <p>Нутрициолог Кристина Виноградова</p>
    </div>
    <div class="body">${content}</div>
    <div class="footer">
      © 2025 V Форме · nutrikris.ru<br>
      Если вы не регистрировались — просто проигнорируйте это письмо.
    </div>
  </div>
</body>
</html>`;
}

async function sendVerification(email, name, code) {
  const html = baseTemplate(`
    <h2>Добро пожаловать, ${name || 'участница'}! 🌿</h2>
    <p>Вы зарегистрировались в программе <strong>V Форме</strong>.</p>
    <p>Введите этот код в приложении чтобы подтвердить email:</p>
    <div style="text-align:center;margin:28px 0">
      <div style="display:inline-block;background:#2D4A2D;color:#fff;font-size:42px;font-weight:700;letter-spacing:12px;padding:20px 36px;border-radius:16px">${code}</div>
    </div>
    <div class="highlight">Код действует 15 минут.</div>
  `);
  await transporter.sendMail({ from: FROM, to: email, subject: `${code} — код подтверждения V Форме`, html });
}

async function sendWelcome(email, name) {
  const html = baseTemplate(`
    <h2>Ваш аккаунт активирован! 🎉</h2>
    <p>Привет, ${name || 'участница'}!</p>
    <p>Email подтверждён. Добро пожаловать в программу!</p>
    <a href="${APP_URL}" class="btn">ПЕРЕЙТИ В КАБИНЕТ</a>
    <p>С заботой о вашем здоровье,<br><strong>Кристина Виноградова</strong></p>
  `);
  await transporter.sendMail({ from: FROM, to: email, subject: '🌿 Добро пожаловать в V Форме!', html });
}

async function sendPaymentConfirm(email, name, programTitle, amount) {
  const html = baseTemplate(`
    <h2>Спасибо за оплату! 💚</h2>
    <p>Привет, ${name || 'участница'}!</p>
    <p>Оплата прошла успешно. Доступ к программе открыт.</p>
    <div class="box">
      <div style="font-size: 18px; font-weight: 700; color: #2D4A2D;">${programTitle}</div>
      <div style="font-size: 28px; font-weight: 700; color: #C4A26B; margin-top: 8px;">${amount} ₽</div>
      <div style="font-size: 13px; color: #3D6B3D; margin-top: 4px;">✅ Оплачено</div>
    </div>
    <a href="${APP_URL}" class="btn">НАЧАТЬ ПРОГРАММУ</a>
    <div class="highlight">За каждый завершённый урок вы получаете баллы — их можно обменять на бонусы.</div>
    <p>С заботой,<br><strong>Кристина Виноградова</strong></p>
  `);
  await transporter.sendMail({ from: FROM, to: email, subject: `✅ Оплата подтверждена — ${programTitle}`, html });
}

async function sendPasswordReset(email, name, token) {
  const link = `${APP_URL}/reset-password?token=${token}`;
  const html = baseTemplate(`
    <h2>Сброс пароля</h2>
    <p>Привет, ${name || 'участница'}!</p>
    <p>Вы запросили сброс пароля для <strong>${email}</strong>.</p>
    <a href="${link}" class="btn">СМЕНИТЬ ПАРОЛЬ</a>
    <div class="highlight">Ссылка действует 1 час. Если вы не запрашивали сброс — проигнорируйте письмо.</div>
  `);
  await transporter.sendMail({ from: FROM, to: email, subject: '🔐 Сброс пароля — V Форме', html });
}

// Wrapper с логированием
async function loggedSend(fn, type, email, userId, ...args) {
  try {
    await fn(email, ...args);
    await EmailLog.create({ userId, to: email, type, status: 'sent', subject: type }).catch(() => {});
  } catch (e) {
    await EmailLog.create({ userId, to: email, type, status: 'error', error: e.message }).catch(() => {});
    throw e;
  }
}

module.exports = {
  sendVerification,
  sendWelcome,
  sendPaymentConfirm,
  sendPasswordReset,
  loggedSend,
};
