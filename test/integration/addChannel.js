import execa from 'execa';
import { directory as getTempDir } from 'tempy';
import { outputJson } from 'fs-extra';
import { WritableStreamBuffer } from 'stream-buffers';
import path from 'path';

let addChannel;

// Required because of the global state variables
// TODO: Investigate if that is the best design
beforeEach(() => {
  jest.resetModules();

  // eslint-disable-next-line
  ({ addChannel } = require('../../src'));
});

describe('addChannel', () => {
  it('should skip adding the package to a channel ("npmPublish" is false)', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-skip-add-channel',
      version: '0.0.0',
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
    };

    const context = {
      cwd,
      env: process.env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    const result = await addChannel({ npmPublish: false }, context);

    expect(result).toBeFalsy();

    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });

  it('should skip adding the package to a channel ("package.private" is true)', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-skip-add-channel-private',
      version: '0.0.0',
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
      private: true,
    };

    const context = {
      cwd,
      env: process.env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    const result = await addChannel({}, context);

    expect(result).toBeFalsy();

    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });
});
