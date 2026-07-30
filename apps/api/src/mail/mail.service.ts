import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as nodemailer from 'nodemailer';
import { Transporter } from 'nodemailer';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private transporter: Transporter | null = null;

  constructor(private readonly config: ConfigService) {
    const host = this.config.get<string>('mail.host');
    const user = this.config.get<string>('mail.user');

    if (host && user) {
      this.transporter = nodemailer.createTransport({
        host,
        port: this.config.get<number>('mail.port') ?? 587,
        secure: this.config.get<boolean>('mail.secure') ?? false,
        auth: {
          user,
          pass: this.config.get<string>('mail.pass') ?? '',
        },
      });
      this.logger.log(`MailService: SMTP aktif ke ${host}`);
    } else {
      this.logger.warn(
        'MailService: MAIL_HOST / MAIL_USER tidak dikonfigurasi — mode stub (log saja).',
      );
    }
  }

  async sendMail(to: string, subject: string, html: string): Promise<void> {
    if (!this.transporter) {
      this.logger.warn(`[EMAIL stub] to=${to} | subject="${subject}"`);
      this.logger.warn(
        'Isi MAIL_HOST, MAIL_USER, MAIL_PASS di .env untuk mengaktifkan pengiriman email nyata.',
      );
      return;
    }

    const from =
      this.config.get<string>('mail.from') ?? 'AMS <no-reply@yourdomain.com>';
    await this.transporter.sendMail({ from, to, subject, html });
    this.logger.log(`Email terkirim ke ${to}: "${subject}"`);
  }
}
