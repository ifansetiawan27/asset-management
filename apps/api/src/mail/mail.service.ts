import {
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  /** null = stub mode (log saja, tidak kirim email nyata) */
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const mailHost = this.config.get<string>('mail.host');
    const mailUser = this.config.get<string>('mail.user');
    const mailPass = this.config.get<string>('mail.pass');

    // Aktifkan SMTP hanya jika host, user, DAN password semuanya diisi.
    if (mailHost && mailUser && mailPass) {
      this.transporter = nodemailer.createTransport({
        host: mailHost,
        port: this.config.get<number>('mail.port') ?? 587,
        secure: this.config.get<boolean>('mail.secure') ?? false,
        auth: { user: mailUser, pass: mailPass },
      });
      this.logger.log(`MailService: SMTP aktif → ${mailHost}`);
    } else {
      this.logger.warn(
        'MailService: MAIL_PASS kosong atau MAIL_HOST/MAIL_USER tidak diisi → mode STUB (log ke console).',
      );
    }
  }

  /**
   * Kirim email.
   * - SMTP dikonfigurasi → kirim nyata; lempar ServiceUnavailableException bila auth/koneksi gagal.
   * - Stub mode (MAIL_PASS kosong) → log ke console saja, tidak melempar error.
   *
   * @param to      Alamat tujuan
   * @param subject Subjek email
   * @param html    Body HTML
   * @param devData Data tambahan untuk ditampilkan di log saat mode stub (mis. password sementara)
   */
  async sendMail(
    to: string,
    subject: string,
    html: string,
    devData?: Record<string, string>,
  ): Promise<void> {
    /* ── STUB MODE ──────────────────────────────────────────── */
    if (!this.transporter) {
      this.logger.warn(`[EMAIL STUB] ─────────────────────────────`);
      this.logger.warn(`  To      : ${to}`);
      this.logger.warn(`  Subject : ${subject}`);
      if (devData) {
        for (const [k, v] of Object.entries(devData)) {
          this.logger.warn(`  ${k.padEnd(10)}: ${v}`);
        }
      }
      this.logger.warn(`───────────────────────────────────────────`);
      this.logger.warn(
        'Untuk mengirim email nyata, isi MAIL_HOST, MAIL_USER, MAIL_PASS di .env\n' +
          'Gmail: aktifkan 2FA lalu buat App Password di https://myaccount.google.com/apppasswords',
      );
      return; // Tidak melempar error — feature tetap berjalan
    }

    /* ── SMTP NYATA ──────────────────────────────────────────── */
    const from =
      this.config.get<string>('mail.from') ?? 'AMS <no-reply@yourdomain.com>';
    try {
      await this.transporter.sendMail({ from, to, subject, html });
      this.logger.log(`Email terkirim ke ${to}: "${subject}"`);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      this.logger.error(`Gagal kirim email ke ${to}: ${message}`);

      // Panduan singkat untuk error SMTP auth Gmail
      if (message.includes('BadCredentials') || message.includes('535')) {
        this.logger.error(
          'Gmail menolak kredensial. Gunakan App Password (bukan password biasa).\n' +
            '→ Aktifkan 2FA: https://myaccount.google.com/security\n' +
            '→ Buat App Password: https://myaccount.google.com/apppasswords\n' +
            '→ Isi MAIL_PASS=<16-char-app-password> di .env',
        );
      }

      throw new ServiceUnavailableException(
        'Gagal mengirim email. Konfigurasi SMTP belum benar. ' +
          'Periksa MAIL_HOST / MAIL_USER / MAIL_PASS di .env.',
      );
    }
  }
}
