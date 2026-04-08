// Хук для отправки событий в Яндекс Метрику
// Использование: track('program_open', { programId, title })

const YM_ID = 108436364;

export function track(eventName, params = {}) {
  try {
    if (typeof window.ym === 'function') {
      window.ym(YM_ID, 'reachGoal', eventName, params);
    }
  } catch(e) {}
}

// Готовые события
export const analytics = {
  login: () => track('login'),
  register: () => track('register'),
  programOpen: (title) => track('program_open', { title }),
  programPay: (title, price) => track('program_pay', { title, price }),
  paymentSuccess: (title, price) => {
    track('payment_success', { title, price });
    // Ecommerce для Метрики
    try {
      window.dataLayer = window.dataLayer || [];
      window.dataLayer.push({ ecommerce: { purchase: { products: [{ name: title, price, quantity: 1 }] } } });
    } catch(e) {}
  },
  protocolOpen: (title) => track('protocol_open', { title }),
  protocolPay: (title, price) => track('protocol_pay', { title, price }),
  chatMessage: () => track('chat_message'),
  telegramLink: () => track('telegram_link'),
  tabSwitch: (tab) => track('tab_switch', { tab }),
};
