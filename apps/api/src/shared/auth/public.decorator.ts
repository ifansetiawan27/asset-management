import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';

/** Menandai route agar dilewati oleh JwtAuthGuard (tanpa autentikasi). */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
