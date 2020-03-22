import { WritableStreamBuffer } from 'stream-buffers';
import execa from 'execa';
import { PassThrough } from 'stream';
import { publishNpm } from '../../src/publish-utils';
import { getRegistry, getReleasesInfo } from '../../src/npm-utils';

jest.mock('../../src/npm-utils');
jest.mock('execa');

describe('publishNpm', () => {
  it('should skip publishing the package to a channel ("npmPublish" is false)', async () => {
    const logger = { log: jest.fn() };
    const result = await publishNpm('.npmrc', { logger }, { npmPublish: false });

    expect(logger.log).toHaveBeenCalledWith(
      'Skip publishing to npm registry as npmPublish is false',
    );

    expect(result).toBeFalsy();
  });

  it('should skip publishing the package to a channel ("package.private" is true)', async () => {
    const logger = { log: jest.fn() };
    const result = await publishNpm('.npmrc', { logger }, {}, { private: true });

    expect(logger.log).toHaveBeenCalledWith(
      "Skip publishing to npm registry as package.json's private property is true",
    );

    expect(result).toBeFalsy();
  });

  it('should publish channel if not private and npmPublish is true', async () => {
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

    await publishNpm('.npmrc', context, {}, pkgJson);

    expect(execa).toHaveBeenCalledWith(
      'npm',
      [
        'publish',
        'home',
        '--userconfig',
        '.npmrc',
        '--tag',
        'next',
        '--registry',
        'https://custom.npmjs.org/',
        '--access',
        'restricted',
      ],
      {
        cwd: 'home',
      },
    );

    expect(context.logger.log).toHaveBeenCalledWith(
      'Publishing test-project version 1.0.0 to npm registry on dist-tag next',
    );

    expect(context.logger.log).toHaveBeenCalledWith(
      'Published test-project@1.0.0 to dist-tag @next on https://custom.npmjs.org/',
    );

    expect(getReleasesInfo).toHaveBeenCalledWith(
      pkgJson,
      context,
      'next',
      'https://custom.npmjs.org/',
    );
  });
});
