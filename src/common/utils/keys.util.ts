import * as fs from 'fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

function getKeysDirectory() {
  const keysDirectory =
    process.env.JWT_KEYS_DIRECTORY || path.join(process.cwd(), 'keys');

  !fs.existsSync(keysDirectory) &&
    fs.mkdirSync(keysDirectory, { recursive: true });

  return keysDirectory;
}

function getAccessTokenKeyPair() {
  const keysDirectory = getKeysDirectory();
  const access_token_private_key_path = path.join(
    keysDirectory,
    'access_token_private.key',
  );
  const access_token_public_key_path = path.join(
    keysDirectory,
    'access_token_public.key',
  );

  const access_token_private_key_exists = fs.existsSync(
    access_token_private_key_path,
  );
  const access_token_public_key_exists = fs.existsSync(
    access_token_public_key_path,
  );

  if (!access_token_private_key_exists || !access_token_public_key_exists) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    fs.writeFileSync(access_token_private_key_path, privateKey);
    fs.writeFileSync(access_token_public_key_path, publicKey);
  }

  return {
    access_token_private_key: fs.readFileSync(
      access_token_private_key_path,
      'utf-8',
    ),
    access_token_public_key: fs.readFileSync(
      access_token_public_key_path,
      'utf-8',
    ),
  };
}

function getRefreshTokenKeyPair() {
  const keysDirectory = getKeysDirectory();
  const refresh_token_private_key_path = path.join(
    keysDirectory,
    'refresh_token_private.key',
  );
  const refresh_token_public_key_path = path.join(
    keysDirectory,
    'refresh_token_public.key',
  );

  const refresh_token_private_key_exists = fs.existsSync(
    refresh_token_private_key_path,
  );
  const refresh_token_public_key_exists = fs.existsSync(
    refresh_token_public_key_path,
  );

  if (!refresh_token_private_key_exists || !refresh_token_public_key_exists) {
    const { privateKey, publicKey } = crypto.generateKeyPairSync('rsa', {
      modulusLength: 2048,
      publicKeyEncoding: {
        type: 'spki',
        format: 'pem',
      },
      privateKeyEncoding: {
        type: 'pkcs8',
        format: 'pem',
      },
    });

    fs.writeFileSync(refresh_token_private_key_path, privateKey);
    fs.writeFileSync(refresh_token_public_key_path, publicKey);
  }

  return {
    refresh_token_private_key: fs.readFileSync(
      refresh_token_private_key_path,
      'utf-8',
    ),
    refresh_token_public_key: fs.readFileSync(
      refresh_token_public_key_path,
      'utf-8',
    ),
  };
}

export const { access_token_private_key, access_token_public_key } =
  getAccessTokenKeyPair();

export const { refresh_token_private_key, refresh_token_public_key } =
  getRefreshTokenKeyPair();
