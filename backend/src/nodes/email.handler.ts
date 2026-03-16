import nodemailer from 'nodemailer';
import { BaseHandler } from './base.handler';
import { ExecContext } from '../engine/types';
import { interpolate } from '../utils/interpolate';
import { getAIProvider } from '../ai/factory';
import { config } from '../config';
import { logger } from '../utils/logger';

/**
 * Email Node — sends an email using workflow data.
 *
 * Config:
 *   to:       string  — recipient email (supports {{field}} interpolation)
 *   subject:  string  — email subject (supports {{field}} interpolation)
 *   mode:     "template" | "ai"
 *
 *   Template mode:
 *     body: string  — email body with {{field}} placeholders
 *
 *   AI mode:
 *     prompt: string  — describes the email intent, {{field}} interpolated
 *                       before sending to the AI provider
 *
 * If SMTP is not configured, the email is logged to the console (dev mode).
 */
export class EmailHandler extends BaseHandler {
  readonly type = 'email';

  private createTransporter() {
    if (!config.SMTP_HOST) return null;

    return nodemailer.createTransport({
      host: config.SMTP_HOST,
      port: config.SMTP_PORT,
      secure: config.SMTP_PORT === 465,
      auth:
        config.SMTP_USER && config.SMTP_PASS
          ? { user: config.SMTP_USER, pass: config.SMTP_PASS }
          : undefined,
    });
  }

  async run(
    input: Record<string, unknown>,
    cfg: Record<string, unknown>,
    ctx: ExecContext
  ): Promise<Record<string, unknown>> {
    const to = interpolate((cfg.to as string) ?? '', input);
    const subject = interpolate(
      (cfg.subject as string) ?? 'Notification',
      input
    );
    const mode = (cfg.mode as string) ?? 'template';

    logger.debug(
      { executionId: ctx.executionId, to, subject, mode },
      '[email] preparing to send'
    );

    let body: string;
    if (mode === 'ai') {
      const promptTemplate = (cfg.prompt as string) ?? 'Write a professional email.';
      const prompt = interpolate(promptTemplate, input);
      const provider = getAIProvider();
      logger.debug(
        { executionId: ctx.executionId, provider: provider.name, promptPreview: prompt.slice(0, 300) },
        '[email] generating body via AI'
      );
      body = await provider.complete(prompt);
      logger.debug(
        { executionId: ctx.executionId, bodyLength: body.length },
        '[email] AI body generated'
      );
    } else {
      body = interpolate((cfg.body as string) ?? '', input);
      logger.debug(
        { executionId: ctx.executionId, bodyPreview: body.slice(0, 200) },
        '[email] body interpolated from template'
      );
    }

    const transporter = this.createTransporter();

    if (transporter && to) {
      await transporter.sendMail({ to, subject, text: body, html: body });
      logger.info({ executionId: ctx.executionId, to, subject, mode }, '[email] sent via SMTP');
    } else {
      // Dev mode — print to console instead of sending
      logger.info(
        { executionId: ctx.executionId, to, subject, mode, bodyPreview: body.slice(0, 200) },
        '[email] [DEV] no SMTP configured — logging only'
      );
    }

    return {
      ...input,
      email_sent: true,
      email_to: to,
      email_subject: subject,
    };
  }
}
