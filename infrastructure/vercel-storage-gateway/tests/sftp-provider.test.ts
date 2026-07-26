import { describe, expect, it } from 'vitest';
import { SftpStorageProvider } from '../src/storage/sftp-provider.js';

class RenameStrictSftp {
  files = new Map<string, Buffer>();
  async connect() {}
  async end() {}
  async mkdir() {}
  async exists(path: string) { return this.files.has(path) ? '-' : false; }
  async put(data: Buffer, path: string) { this.files.set(path, Buffer.from(data)); }
  async get(path: string) {
    const data = this.files.get(path);
    if (!data) throw Object.assign(new Error('missing'), { code: 2 });
    return Buffer.from(data);
  }
  async rename(source: string, target: string) {
    if (this.files.has(target)) throw Object.assign(new Error('target exists'), { code: 4 });
    const data = this.files.get(source);
    if (!data) throw Object.assign(new Error('source missing'), { code: 2 });
    this.files.set(target, data);
    this.files.delete(source);
  }
  async delete(path: string) { this.files.delete(path); }
}

const config = {
  sftpHost: 'example.invalid',
  sftpPort: 22,
  sftpUsername: 'server-only',
  sftpPassword: 'server-only',
  sftpRoot: '/storage',
} as any;

describe('atomic SFTP writes', () => {
  it('treats an identical retry as a successful no-op', async () => {
    const client = new RenameStrictSftp();
    const provider = new SftpStorageProvider(config, client as any);
    const body = Buffer.from('same slice');
    await provider.putAtomic('/storage/temp/upload/0.slice', body);
    await provider.putAtomic('/storage/temp/upload/0.slice', body);
    expect(client.files.get('/storage/temp/upload/0.slice')).toEqual(body);
  });

  it('uses a backup swap when a retry contains corrected data', async () => {
    const client = new RenameStrictSftp();
    const provider = new SftpStorageProvider(config, client as any);
    await provider.putAtomic('/storage/temp/upload/0.slice', Buffer.from('old'));
    await provider.putAtomic('/storage/temp/upload/0.slice', Buffer.from('corrected'));
    expect(client.files.get('/storage/temp/upload/0.slice')?.toString()).toBe('corrected');
    expect([...client.files.keys()].some((key) => key.includes('.backup-'))).toBe(false);
  });
});
