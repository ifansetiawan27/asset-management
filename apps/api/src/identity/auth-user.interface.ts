/** Identitas terautentikasi hasil verifikasi token OIDC (diletakkan di request.user). */
export interface AuthUser {
  sub: string;
  email: string | null;
  username: string | null;
  tenantId: string | null;
  roles: string[];
}
