/**
 * Argon2id password hashing via hash-wasm (no native addon).
 * Never log the plaintext or the hash.
 */

import { randomBytes } from 'node:crypto';
import { argon2id, argon2Verify } from 'hash-wasm';

function paramsForEnv(env) {
  if (env === 'test') {
    return { parallelism: 1, iterations: 1, memorySize: 32, hashLength: 32 };
  }
  return { parallelism: 1, iterations: 2, memorySize: 19456, hashLength: 32 };
}

/**
 * @param {string} password
 * @param {string} [env]
 */
export async function hashPassword(password, env = process.env.NODE_ENV) {
  const salt = randomBytes(16);
  return argon2id({
    password,
    salt,
    ...paramsForEnv(env),
    outputType: 'encoded',
  });
}

/**
 * @param {string} hash
 * @param {string} password
 */
export async function verifyPassword(hash, password) {
  try {
    return await argon2Verify({ password, hash });
  } catch {
    return false;
  }
}
