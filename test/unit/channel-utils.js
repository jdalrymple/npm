import { WritableStreamBuffer } from 'stream-buffers';
import execa from 'execa';
import { PassThrough } from 'stream';
import { getChannel, addChannelNpm } from '../../src/channel-utils';
import { getRegistry, getReleasesInfo } from '../../src/npm-utils';

jest.mock('../../src/npm-utils');
jest.mock('execa');

describe('getChannel', () => {
  it('should get the default channel', () => {
    expect(getChannel(undefined)).toBe('latest');
  });

  it('should get the passed channel if valid', async () => {
    expect(getChannel('next')).toBe('next');
  });

  it('should prefix channel with "release-" if invalid', () => {
    expect(getChannel('1.x')).toBe('release-1.x');
  });
});

describe('addChannelNpm', () => {
  it('should skip adding the package to a channel ("npmPublish" is false)', async () => {
    const logger = { log: jest.fn() };
    const result = await addChannelNpm('.npmrc', { logger }, { npmPublish: false });

    expect(logger.log).toHaveBeenCalledWith('Skip adding to npm channel as npmPublish is false');

    expect(result).toBeFalsy();
  });

  it('should skip adding the package to a channel ("package.private" is true)', async () => {
    const logger = { log: jest.fn() };
    const result = await addChannelNpm('.npmrc', { logger }, {}, { private: true });

    expect(logger.log).toHaveBeenCalledWith(
      "Skip adding to npm channel as package.json's private property is true",
    );

    expect(result).toBeFalsy();
  });

  it('should add channel if not private and npmPublish is true', async () => {
    getRegistry.mockReturnValueOnce('https://custom.npmjs.org/');
    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    const context = {
      cwd: 'home',
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'next' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };
    const pkgJson = {
      name: 'test-project',
    };

    await addChannelNpm('.npmrc', context, {}, pkgJson);

    expect(execa).toHaveBeenCalledWith(
      'npm',
      [
        'dist-tag',
        'add',
        'test-project@1.0.0',
        'next',
        '--userconfig',
        '.npmrc',
        '--registry',
        'https://custom.npmjs.org/',
      ],
      {
        cwd: 'home',
      },
    );

    expect(context.logger.log).toHaveBeenCalledWith(
      'Adding version 1.0.0 to npm registry on dist-tag next',
    );

    expect(context.logger.log).toHaveBeenCalledWith(
      'Added test-project@1.0.0 to dist-tag @next on https://custom.npmjs.org/',
    );

    expect(getReleasesInfo).toHaveBeenCalledWith(
      pkgJson,
      context,
      'next',
      'https://custom.npmjs.org/',
    );
  });
});
