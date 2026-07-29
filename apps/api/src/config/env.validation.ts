import * as Joi from 'joi';

export const validationSchema = Joi.object({
  NODE_ENV: Joi.string()
    .valid('development', 'test', 'production')
    .default('development'),
  PORT: Joi.number().default(3000),

  DB_HOST: Joi.string().default('localhost'),
  DB_PORT: Joi.number().default(5432),
  DB_NAME: Joi.string().default('ams'),
  DB_USERNAME: Joi.string().default('ams_app'),
  DB_PASSWORD: Joi.string().default('ams_app_pw'),

  // Kredensial admin (opsional saat runtime; dipakai oleh migrasi & seed)
  DB_ADMIN_USERNAME: Joi.string().optional(),
  DB_ADMIN_PASSWORD: Joi.string().optional(),

  // TLS koneksi DB (wajib untuk DB terkelola seperti Supabase)
  DB_SSL: Joi.string().valid('true', 'false').default('false'),
  DB_SSL_REJECT_UNAUTHORIZED: Joi.string().valid('true', 'false').default('false'),
  DB_SSL_CA_PATH: Joi.string().optional(),

  // Keycloak (SSO / OIDC)
  KEYCLOAK_URL: Joi.string().uri().default('http://localhost:8080'),
  KEYCLOAK_REALM: Joi.string().default('ams'),
  KEYCLOAK_CLIENT_ID: Joi.string().default('ams-web'),

  // Asset Catalog (Module 1)
  QR_SIGNING_SECRET: Joi.string().default('dev-qr-secret-change-me'),
  STORAGE_DIR: Joi.string().default('uploads'),

  // DEV ONLY: bypass autentikasi (untuk frontend tanpa Keycloak)
  AUTH_DEV_BYPASS: Joi.string().valid('true', 'false').default('false'),
  AUTH_DEV_TENANT_ID: Joi.string().optional(),
}).unknown(true);
