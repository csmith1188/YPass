/**
 * Formbar identity provider.
 *
 * Current Formbar production (formbar.yorktechapps.com) is the monolith login
 * page: GET /oauth?redirectURL=… then GET callback?token=<jwt>. That is
 * FORMBAR_OAUTH_MODE=legacy_redirect.
 *
 * Formbar DEV + Formbar.ts-client use authorization-code: send the browser to
 * the frontend consent page /oauth/authorize (not the API). The API routes
 * /api/v1/oauth/authorize and /api/v1/oauth/token require a Formbar user
 * session/Bearer token and are called by that UI, not by this app's redirect.
 */

import { createVerify } from 'node:crypto';
import { randomToken } from '#utils/crypto.js';
import { AuthenticationError, ExternalServiceError, ValidationError } from '#errors';

export function createFormbarOAuth({ config, logger, fetchImpl = fetch }) {
  const apiBase = config.formbar.baseUrl;
  const frontendBase = (config.formbar.frontendUrl || apiBase).replace(/\/+$/, '');
  const tokenUrl = `${apiBase}/api/v1/oauth/token`;

  return {
    mode: config.features.formbarOauthMode,

    createState() {
      return randomToken(24);
    },

    buildAuthorizationUrl(state) {
      if (config.features.formbarOauthMode === 'legacy_redirect') {
        const callback = new URL(config.formbar.redirectUri);
        callback.searchParams.set('state', state);
        const url = new URL(`${apiBase}/oauth`);
        url.searchParams.set('redirectURL', callback.toString());
        return url.toString();
      }

      const url = new URL(`${frontendBase}/oauth/authorize`);
      url.searchParams.set('response_type', 'code');
      url.searchParams.set('client_id', config.formbar.clientId);
      url.searchParams.set('redirect_uri', config.formbar.redirectUri);
      url.searchParams.set('scope', config.formbar.scopes);
      url.searchParams.set('state', state);
      return url.toString();
    },

    assertState(expected, actual) {
      if (!expected || !actual || expected !== actual) {
        throw new ValidationError('OAuth state mismatch');
      }
    },

    async completeCallback({ code, token, state, expectedState }) {
      this.assertState(expectedState, state);
      if (config.features.formbarOauthMode === 'legacy_redirect') {
        const accessToken = await verifyLegacyAccessToken(token, { apiBase, fetchImpl, logger });
        return this.parseIdentity({ access_token: accessToken });
      }
      const tokens = await this.exchangeCode(code);
      return this.parseIdentity(tokens);
    },

    async exchangeCode(code) {
      if (!code) {
        throw new ValidationError('Missing authorization code');
      }
      let response;
      try {
        response = await fetchImpl(tokenUrl, {
          method: 'POST',
          headers: { 'content-type': 'application/json', accept: 'application/json' },
          body: JSON.stringify({
            grant_type: 'authorization_code',
            code,
            redirect_uri: config.formbar.redirectUri,
            client_id: config.formbar.clientId,
            client_secret: config.formbar.clientSecret,
          }),
          signal: AbortSignal.timeout(10_000),
        });
      } catch (error) {
        logger.error({ err: error }, 'formbar token exchange failed');
        throw new ExternalServiceError('Formbar authentication failed');
      }

      if (!response.ok) {
        logger.warn({ status: response.status }, 'formbar token endpoint rejected the request');
        throw new AuthenticationError('Formbar authentication failed');
      }

      const body = await response.json();
      const data = body.data || body;
      if (!data.access_token) {
        throw new AuthenticationError('Formbar authentication failed');
      }
      return data;
    },

    /**
     * Decode the JWT payload without treating unsigned claims as authorization
     * decisions. Subject comes from the token `id` or `sub` claim.
     */
    parseIdentity(tokenResponse) {
      const access = tokenResponse.access_token;
      const payload = decodeJwtPayload(access) || {};
      const subject = payload.id ?? payload.sub;
      if (subject === undefined || subject === null) {
        throw new AuthenticationError('Formbar authentication failed');
      }
      return {
        provider: 'formbar',
        subject: String(subject),
        email: payload.email || null,
        displayName: payload.displayName || payload.name || 'Formbar user',
        profile: {
          permissions: payload.permissions,
          scopes: payload.scopes,
        },
        tokens: {
          accessToken: tokenResponse.access_token,
          refreshToken: tokenResponse.refresh_token || payload.refreshToken || null,
          expiresIn: tokenResponse.expires_in || null,
        },
      };
    },
  };
}

async function verifyLegacyAccessToken(token, { apiBase, fetchImpl, logger }) {
  if (!token) {
    throw new ValidationError('Missing Formbar token');
  }

  let pem;
  try {
    const response = await fetchImpl(`${apiBase}/certs`, {
      headers: { accept: 'application/json' },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) {
      throw new Error(`certs ${response.status}`);
    }
    const body = await response.json();
    pem = body.publicKey || body.data?.publicKey;
  } catch (error) {
    logger.error({ err: error }, 'formbar certs fetch failed');
    throw new ExternalServiceError('Formbar authentication failed');
  }

  if (!pem || !verifyJwtRs256(token, pem)) {
    throw new AuthenticationError('Formbar authentication failed');
  }

  const payload = decodeJwtPayload(token);
  if (payload?.exp && payload.exp * 1000 < Date.now()) {
    throw new AuthenticationError('Formbar authentication failed');
  }

  return token;
}

function verifyJwtRs256(token, publicKeyPem) {
  const parts = String(token).split('.');
  if (parts.length !== 3) {
    return false;
  }
  try {
    const verifier = createVerify('RSA-SHA256');
    verifier.update(`${parts[0]}.${parts[1]}`);
    verifier.end();
    return verifier.verify(publicKeyPem, parts[2], 'base64url');
  } catch {
    return false;
  }
}

function decodeJwtPayload(token) {
  const parts = String(token).split('.');
  if (parts.length < 2) {
    return null;
  }
  try {
    const json = Buffer.from(parts[1], 'base64url').toString('utf8');
    return JSON.parse(json);
  } catch {
    return null;
  }
}
