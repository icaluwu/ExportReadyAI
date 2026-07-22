import { initBotId } from 'botid/client/core';

// Protect only browser-initiated, high-value POST routes. In particular,
// /api/payment/notification is intentionally omitted because Midtrans calls it
// server-to-server and cannot complete a browser challenge.
initBotId({
  protect: [
    { path: '/api/analyze', method: 'POST', advancedOptions: { checkLevel: 'basic' } },
    { path: '/api/hs-code', method: 'POST', advancedOptions: { checkLevel: 'basic' } },
    { path: '/api/chat', method: 'POST', advancedOptions: { checkLevel: 'basic' } },
    {
      path: '/api/payment/create-transaction',
      method: 'POST',
      advancedOptions: { checkLevel: 'basic' },
    },
  ],
});