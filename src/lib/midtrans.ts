import crypto from 'crypto';
// eslint-disable-next-line @typescript-eslint/no-require-imports
const midtransClient = require('midtrans-client');

const isProduction = process.env.MIDTRANS_IS_PRODUCTION === 'true';
const serverKey = process.env.MIDTRANS_SERVER_KEY || '';
const clientKey = process.env.MIDTRANS_CLIENT_KEY || '';

export function getSnapClient() {
  if (!serverKey || !clientKey) {
    throw new Error('MIDTRANS_SERVER_KEY atau MIDTRANS_CLIENT_KEY belum dikonfigurasi');
  }

  return new midtransClient.Snap({
    isProduction,
    serverKey,
    clientKey,
  });
}

export function verifyNotificationSignature(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  signatureKey: string,
): boolean {
  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');

  return hash === signatureKey;
}

export function getSnapScriptUrl(): string {
  return isProduction
    ? 'https://app.midtrans.com/snap/snap.js'
    : 'https://app.sandbox.midtrans.com/snap/snap.js';
}

export function isMidtransProduction(): boolean {
  return isProduction;
}
