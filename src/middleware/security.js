import { randomBytes } from 'node:crypto';
import helmet from 'helmet';

/**
 * Per-request CSP nonce plus Helmet security headers.
 * Inline scripts in EJS must use nonce="<%= cspNonce %>".
 * Raw HTML (<%- %>) is only used for the nonce attribute in the layout.
 */
export function securityHeaders(config) {
  return [
    (req, res, next) => {
      res.locals.cspNonce = randomBytes(16).toString('base64');
      next();
    },
    helmet({
      contentSecurityPolicy: {
        useDefaults: false,
        directives: {
          defaultSrc: ["'self'"],
          baseUri: ["'self'"],
          objectSrc: ["'none'"],
          frameAncestors: ["'none'"],
          formAction: ["'self'"],
          imgSrc: ["'self'", 'data:'],
          styleSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
          scriptSrc: ["'self'", (req, res) => `'nonce-${res.locals.cspNonce}'`],
          connectSrc: ["'self'"],
          fontSrc: ["'self'"],
          ...(config.isProduction ? { upgradeInsecureRequests: [] } : {}),
        },
      },
      crossOriginEmbedderPolicy: false,
      hsts: config.security.hsts
        ? { maxAge: 15_552_000, includeSubDomains: true, preload: false }
        : false,
      hidePoweredBy: true,
      referrerPolicy: { policy: 'no-referrer' },
      frameguard: { action: 'deny' },
      noSniff: true,
    }),
  ];
}
