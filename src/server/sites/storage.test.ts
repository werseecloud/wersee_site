import { mkdtemp, readFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import path from 'node:path';
import JSZip from 'jszip';
import { afterEach, describe, expect, it } from 'vitest';
import { extractZip } from './storage';

const limits = {
  maxArchiveBytes: 1024 * 1024,
  maxUnpackedBytes: 1024 * 1024,
  maxFileCount: 20,
  maxSingleFileBytes: 512 * 1024,
};

const directories: string[] = [];

const makeDirectory = async () => {
  const directory = await mkdtemp(path.join(tmpdir(), 'wersee-sites-zip-test-'));
  directories.push(directory);
  return directory;
};

const asResponse = (buffer: Buffer) => new Response(buffer, {
  headers: { 'content-length': String(buffer.length) },
});

afterEach(async () => {
  await Promise.all(directories.splice(0).map((directory) => rm(directory, { recursive: true, force: true })));
});

describe('site ZIP extraction', () => {
  it('extracts ordinary static files without retaining the source archive', async () => {
    const zip = new JSZip();
    zip.file('dist/index.html', '<!doctype html><title>Wersee</title>');
    zip.file('dist/assets/app.js', 'console.log("ready")');
    const buffer = await zip.generateAsync({ type: 'nodebuffer' });
    const destination = await makeDirectory();

    const files = await extractZip(asResponse(buffer), destination, limits);

    expect(files.map((file) => file.path)).toEqual(['dist/index.html', 'dist/assets/app.js']);
    await expect(readFile(path.join(destination, 'dist/index.html'), 'utf8')).resolves.toContain('Wersee');
    await expect(readFile(path.join(destination, '.wersee-source.zip'))).rejects.toMatchObject({ code: 'ENOENT' });
  });

  it('marks Unix symbolic links so validation can block them', async () => {
    const zip = new JSZip();
    zip.file('index.html', '<!doctype html>');
    zip.file('shortcut', 'index.html', { unixPermissions: 0o120777 });
    const buffer = await zip.generateAsync({ type: 'nodebuffer', platform: 'UNIX' });
    const destination = await makeDirectory();

    const files = await extractZip(asResponse(buffer), destination, limits);

    expect(files.find((file) => file.path === 'shortcut')).toMatchObject({ symlink: true, size: 0 });
  });

  it('rejects an archive before extraction when the compressed-size limit is exceeded', async () => {
    const zip = new JSZip();
    zip.file('index.html', 'x'.repeat(2048));
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
    const destination = await makeDirectory();

    await expect(extractZip(asResponse(buffer), destination, { ...limits, maxArchiveBytes: 64 }))
      .rejects.toThrow('ARCHIVE_SIZE_LIMIT');
  });

  it('rejects a ZIP whose central and local names contain parent traversal', async () => {
    const zip = new JSZip();
    zip.file('safe.txt', 'not allowed outside the extraction root');
    const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'STORE' });
    const safeName = Buffer.from('safe.txt');
    const maliciousName = Buffer.from('../x.txt');
    for (let offset = buffer.indexOf(safeName); offset >= 0; offset = buffer.indexOf(safeName, offset + maliciousName.length)) {
      maliciousName.copy(buffer, offset);
    }
    const destination = await makeDirectory();

    await expect(extractZip(asResponse(buffer), destination, limits)).rejects.toThrow('ZIP_SLIP_DETECTED');
  });
});
