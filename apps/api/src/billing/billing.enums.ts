/** Enum untuk modul Billing (SaaS). */

export enum PlanCode {
  FREE = 'FREE',
  STANDARD = 'STANDARD',
  PREMIUM = 'PREMIUM',
  ENTERPRISE = 'ENTERPRISE',
}

export enum SubscriptionStatus {
  TRIAL = 'TRIAL',
  ACTIVE = 'ACTIVE',
  SUSPENDED = 'SUSPENDED',
  CANCELED = 'CANCELED',
}

export enum UsageMetricType {
  ASSETS = 'ASSETS',
  USERS = 'USERS',
  STORAGE = 'STORAGE',
}
