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

export function isPremiumUser(info: UserSubscriptionInfo): boolean {
  return info.status === 'active';
}
