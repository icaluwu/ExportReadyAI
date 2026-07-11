import { createAdminClient } from './supabase-admin';

export type SubscriptionStatus = 'active' | 'expired' | 'cancelled' | 'none';

export interface UserSubscriptionInfo {
  status: SubscriptionStatus;
  planName: string | null;
  expiresAt: string | null;
  features: string[];
}

const FREE_FEATURES = ['assessment_basic'];

export async function getUserSubscriptionStatus(
  userId: string,
): Promise<UserSubscriptionInfo> {
  const admin = createAdminClient();

  const { data, error } = await admin
    .from('user_subscriptions')
    .select(
      `
      status,
      expires_at,
      subscription_plans (
        name,
        features
      )
    `,
    )
    .eq('user_id', userId)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    console.error('getUserSubscriptionStatus error:', error);
    return {
      status: 'none',
      planName: null,
      expiresAt: null,
      features: FREE_FEATURES,
    };
  }

  if (!data) {
    return {
      status: 'none',
      planName: null,
      expiresAt: null,
      features: FREE_FEATURES,
    };
  }

  const rawPlan = data.subscription_plans;
  const plan = (Array.isArray(rawPlan) ? rawPlan[0] : rawPlan) as {
    name: string;
    features: string[];
  } | null;

  const expiresAt = data.expires_at as string;
  const isExpired = new Date(expiresAt) <= new Date();

  if (isExpired) {
    return {
      status: 'expired',
      planName: plan?.name ?? null,
      expiresAt,
      features: FREE_FEATURES,
    };
  }

  return {
    status: 'active',
    planName: plan?.name ?? null,
    expiresAt,
    features: (plan?.features as string[]) ?? FREE_FEATURES,
  };
}

export function hasFeature(features: string[], feature: string): boolean {
  return features.includes(feature);
}

/**
 * Compute the expiry date for a subscription plan based on its name.
 * Returns null for non-premium (free) plans.
 */
export function computeExpiryDate(planName: string, from: Date = new Date()): Date | null {
  switch (planName) {
    case 'premium_monthly':
      return new Date(from.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'premium_yearly':
      return new Date(from.getTime() + 365 * 24 * 60 * 60 * 1000);
    default:
      return null;
  }
}

/**
 * Activate (or renew) a user's subscription after a successful payment.
 * Expires any prior active subscription for the user and inserts a new one.
 *
 * Returns true on success, false on failure (errors are logged, not thrown,
 * so a webhook can still ack 200 to Midtrans and retry via reconciliation).
 */
export async function activateSubscription(
  userId: string,
  planId: string,
  planName: string,
): Promise<boolean> {
  try {
    const admin = createAdminClient();
    const now = new Date();
    const expiresAt = computeExpiryDate(planName, now);

    if (!expiresAt) {
      console.warn('[activateSubscription] Unknown plan name, skipping:', planName);
      return false;
    }

    // Expire any existing active subscription for this user to avoid overlaps
    const { error: expireError } = await admin
      .from('user_subscriptions')
      .update({ status: 'expired', updated_at: now.toISOString() })
      .eq('user_id', userId)
      .eq('status', 'active');

    if (expireError) {
      console.error('[activateSubscription] Failed to expire prior subscription:', expireError);
      // Non-fatal: continue to insert the new one
    }

    const { error: insertError } = await admin.from('user_subscriptions').insert({
      user_id: userId,
      plan_id: planId,
      status: 'active',
      started_at: now.toISOString(),
      expires_at: expiresAt.toISOString(),
    });

    if (insertError) {
      console.error('[activateSubscription] Failed to insert subscription:', insertError);
      return false;
    }

    return true;
  } catch (err) {
    console.error('[activateSubscription] Unexpected error:', err);
    return false;
  }
}

export function isPremiumUser(info: UserSubscriptionInfo): boolean {
  return info.status === 'active';
}
