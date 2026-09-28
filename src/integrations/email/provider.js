/**
 * Email provider abstraction. SMTP is the default; swap this module to change providers.
 * Failures must not leak SMTP internals to end users.
 */

import nodemailer from 'nodemailer';
import ejs from 'ejs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { ExternalServiceError } from '#errors';

const here = path.dirname(fileURLToPath(import.meta.url));
const templateRoot = path.resolve(here, '../../../views/emails');

export function createEmailProvider(config, logger) {
  const transporter = nodemailer.createTransport({
    host: config.email.host,
    port: config.email.port,
    secure: config.email.secure,
    auth:
      config.email.user || config.email.password
        ? { user: config.email.user, pass: config.email.password }
        : undefined,
    connectionTimeout: config.email.timeoutMs,
    greetingTimeout: config.email.timeoutMs,
    socketTimeout: config.email.timeoutMs,
  });

  async function render(template, data) {
    const html = await ejs.renderFile(path.join(templateRoot, `${template}.html.ejs`), data);
    const text = await ejs.renderFile(path.join(templateRoot, `${template}.text.ejs`), data);
    return { html, text };
  }

  return {
    /**
     * @param {{ to: string, subject: string, text: string, html: string }} message
     */
    async send(message) {
      try {
        await transporter.sendMail({
          from: config.email.from,
          to: message.to,
          subject: message.subject,
          text: message.text,
          html: message.html,
        });
      } catch (error) {
        logger.error({ err: error }, 'email send failed');
        throw new ExternalServiceError('The email could not be sent');
      }
    },

    async sendTemplate(template, { to, token, config: appConfig }) {
      const verifyUrl = `${appConfig.baseUrl}/auth/verify?token=${encodeURIComponent(token)}`;
      const resetUrl = `${appConfig.baseUrl}/auth/reset?token=${encodeURIComponent(token)}`;
      const subjects = {
        verify: 'Verify your email address',
        reset: 'Reset your password',
        security: 'Security notice',
      };
      const { html, text } = await render(template, {
        appName: appConfig.appName,
        verifyUrl,
        resetUrl,
        baseUrl: appConfig.baseUrl,
      });
      await this.send({ to, subject: subjects[template] || 'Account notice', html, text });
    },
  };
}
