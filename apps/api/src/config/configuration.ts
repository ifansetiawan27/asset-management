export interface AppConfig {
  app: { port: number; env: string };
  database: {
    host: string;
    port: number;
    username: string;
    password: string;
    name: string;
  };
  keycloak: {
    url: string;
    realm: string;
    clientId: string;
    issuer: string;
    jwksUri: string;
  };
  qr: { secret: string };
  storage: { dir: string };
  auth: { devBypass: boolean; devTenantId: string };
}

export default (): AppConfig => {
  const kcUrl = process.env.KEYCLOAK_URL ?? 'http://localhost:8080';
  const kcRealm = process.env.KEYCLOAK_REALM ?? 'ams';
  const issuer = `${kcUrl}/realms/${kcRealm}`;

  return {
    app: {
      port: parseInt(process.env.PORT ?? '3000', 10),
      env: process.env.NODE_ENV ?? 'development',
    },
    database: {
      host: process.env.DB_HOST ?? 'localhost',
      port: parseInt(process.env.DB_PORT ?? '5432', 10),
      // Runtime app terhubung sebagai user non-superuser agar RLS ditegakkan.
      username: process.env.DB_USERNAME ?? 'ams_app',
      password: process.env.DB_PASSWORD ?? 'ams_app_pw',
      name: process.env.DB_NAME ?? 'ams',
    },
    keycloak: {
      url: kcUrl,
      realm: kcRealm,
      clientId: process.env.KEYCLOAK_CLIENT_ID ?? 'ams-web',
      issuer,
      jwksUri: `${issuer}/protocol/openid-connect/certs`,
    },
    qr: {
      secret: process.env.QR_SIGNING_SECRET ?? 'dev-qr-secret-change-me',
    },
    storage: {
      dir: process.env.STORAGE_DIR ?? 'uploads',
    },
    auth: {
      // DEV ONLY: melewati verifikasi JWT agar frontend jalan tanpa Keycloak.
      devBypass: (process.env.AUTH_DEV_BYPASS ?? 'false') === 'true',
      devTenantId:
        process.env.AUTH_DEV_TENANT_ID ?? '11111111-1111-1111-1111-111111111111',
    },
  };
};
