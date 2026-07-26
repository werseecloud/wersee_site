import SftpClient from 'ssh2-sftp-client';
import type { GatewayConfig } from '../config.js';
import type { StorageProvider } from '../types.js';
import { retry, safeRemotePath, sha256, uuid } from '../utils.js';

const asBuffer = (value: unknown) => {
  if (!Buffer.isBuffer(value)) throw new Error('SFTP returned a non-buffer response.');
  return value;
};

export class SftpStorageProvider implements StorageProvider {
  private connected = false;

  constructor(
    private readonly config: GatewayConfig,
    private readonly client: SftpClient = new SftpClient(),
  ) {}

  private async connection() {
    if (!this.connected) {
      await retry(() => this.client.connect({
        host: this.config.sftpHost,
        port: this.config.sftpPort,
        username: this.config.sftpUsername,
        password: this.config.sftpPassword,
        readyTimeout: 20_000,
        retries: 1,
      }));
      this.connected = true;
    }
    return this.client;
  }

  private checked(path: string) {
    const normalized = safeRemotePath(path);
    const root = safeRemotePath(this.config.sftpRoot);
    if (normalized !== root && !normalized.startsWith(`${root}/`)) throw new Error('Path escaped the storage root.');
    return normalized;
  }

  async putAtomic(path: string, data: Buffer) {
    const finalPath = this.checked(path);
    const temporaryPath = `${finalPath}.tmp-${uuid()}`;
    const expectedSha256 = sha256(data);
    await retry(async () => {
      const client = await this.connection();
      await client.mkdir(finalPath.slice(0, finalPath.lastIndexOf('/')), true);
      if (await client.exists(finalPath)) {
        const current = asBuffer(await client.get(finalPath));
        if (sha256(current) === expectedSha256) return;
      }

      try {
        await client.put(data, temporaryPath);
        const uploaded = asBuffer(await client.get(temporaryPath));
        if (sha256(uploaded) !== expectedSha256) throw new Error('SFTP checksum verification failed.');

        if (await client.exists(finalPath)) {
          const backupPath = `${finalPath}.backup-${uuid()}`;
          await client.rename(finalPath, backupPath);
          try {
            await client.rename(temporaryPath, finalPath);
            await client.delete(backupPath, true);
          } catch (error) {
            if (await client.exists(finalPath)) await client.delete(finalPath, true);
            await client.rename(backupPath, finalPath).catch(() => undefined);
            throw error;
          }
        } else {
          await client.rename(temporaryPath, finalPath);
        }
      } finally {
        if (await client.exists(temporaryPath)) await client.delete(temporaryPath, true).catch(() => undefined);
      }
    });
  }

  async read(path: string, start?: number, endInclusive?: number) {
    const checked = this.checked(path);
    return retry(async () => {
      const client = await this.connection();
      if (start === undefined) return asBuffer(await client.get(checked));
      const chunks: Buffer[] = [];
      for await (const chunk of client.createReadStream(checked, { start, end: endInclusive })) {
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
      }
      return Buffer.concat(chunks);
    });
  }

  async exists(path: string) {
    return Boolean(await (await this.connection()).exists(this.checked(path)));
  }

  async delete(path: string) {
    const checked = this.checked(path);
    if (await this.exists(checked)) await retry(() => this.client.delete(checked, true));
  }

  async verify(path: string, expectedSha256: string) {
    return sha256(await this.read(path)) === expectedSha256;
  }

  async close() {
    if (this.connected) await this.client.end().catch(() => undefined);
    this.connected = false;
  }
}
