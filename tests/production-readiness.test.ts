import assert from 'node:assert/strict';
import test from 'node:test';
import { maskFreeAiResult } from '../src/lib/ai-result';
import { calculatePaymentTotal } from '../src/lib/pricing';
import { getSafeNextPath } from '../src/lib/safe-redirect';
import { sanitizeArticleHtml } from '../src/lib/sanitize-html';

test('safe redirects accept local paths and reject external targets', () => {
  assert.equal(getSafeNextPath('/dashboard?tab=hasil'), '/dashboard?tab=hasil');
  assert.equal(getSafeNextPath('https://evil.example/phish'), '/dashboard');
  assert.equal(getSafeNextPath('//evil.example/phish'), '/dashboard');
});

test('article sanitizer removes executable markup', () => {
  const dirty = '<p>aman</p><img src="https://example.com/a.png" onerror="alert(1)"><script>alert(1)</script>';
  const clean = sanitizeArticleHtml(dirty);
  assert.match(clean, /<p>aman<\/p>/);
  assert.doesNotMatch(clean, /onerror|<script/i);
});

test('free AI response masks premium countries and roadmap phases', () => {
  const masked = maskFreeAiResult({
    topCountries: [{ country: 'Japan' }, { country: 'Germany' }],
    roadmap: { fase1: ['A'], fase2: ['B'], fase3: ['C'], fase4: ['D'] },
  });
  assert.equal(masked.topCountries?.[0]?.country, 'Japan');
  assert.equal(masked.topCountries?.[1]?.country, 'Negara Premium');
  assert.deepEqual(masked.roadmap?.fase3, ['Langkah premium dikunci.']);
});

test('payment total uses one consistent rounded tax calculation', () => {
  assert.deepEqual(calculatePaymentTotal(40_000), {
    subtotal: 40_000,
    tax: 4_400,
    total: 44_400,
  });
});
