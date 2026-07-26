import { ValueTransformer } from 'typeorm';

/**
 * TypeORM mengembalikan kolom NUMERIC sebagai string. Transformer ini
 * mengonversi ke/ dari number agar tipe di aplikasi konsisten.
 */
export const numericTransformer: ValueTransformer = {
  to: (value?: number | null): number | null => value ?? null,
  from: (value?: string | null): number | null =>
    value === null || value === undefined ? null : parseFloat(value),
};
