import execa from 'execa';
import { directory as getTempDir } from 'tempy';
import { outputJson } from 'fs-extra';
import { WritableStreamBuffer } from 'stream-buffers';
import path from 'path';

let verifyConditions;
let prepare;
let publish;
let addChannel;

// Required because of the global state variables
// TODO: Investigate if that is the best design
beforeEach(() => {
  jest.resetModules();

  // eslint-disable-next-line
  ({ verifyConditions, prepare, publish, addChannel } = require('../../src'));
});

describe('End-to-End', () => {
  it('should publish the package and add to default dist-tag', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-default-tag',
      version: '0.0.0',
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
    };
    const context = {
      cwd,
      env: process.env,
      logger: { log: jest.fn() },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    await publish({}, { ...context, nextRelease: { version: '1.0.0', channel: 'next' } });

    const result = await addChannel({}, { ...context, nextRelease: { version: '1.0.0' } });

    expect(result).toMatchObject({
      name: 'npm package (@latest dist-tag)',
      urls: [],
      channel: 'latest',
    });

    await expect(
      execa('npm', ['view', pkg.name, 'dist-tags.latest'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });
  });

  it('should publish the package and add lts dist-tag', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-legacy-tag',
      version: '0.0.0',
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
    };
    const context = {
      cwd,
      env: process.env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'latest' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    await publish({}, { ...context, nextRelease: { channel: 'latest', version: '1.0.0' } });

    const result = await addChannel(
      {},
      { ...context, nextRelease: { channel: '1.x', version: '1.0.0' } },
    );

    expect(result).toMatchObject({
      name: 'npm package (@release-1.x dist-tag)',
      urls: [],
      channel: 'release-1.x',
    });

    await expect(
      execa('npm', ['view', pkg.name, 'dist-tags'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: "{ latest: '1.0.0', 'release-1.x': '1.0.0' }",
    });
  });

  it('should verify token and set up auth only on the fist call, then prepare on prepare call only', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-e2e-1',
      version: '0.0.0-dev',
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
    };

    const context = {
      cwd,
      env: process.env,
      logger: { log: jest.fn() },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    await verifyConditions({}, context);

    await prepare({}, { ...context, nextRelease: { version: '1.0.0' } });

    const publishResult = await publish(
      {},
      { ...context, nextRelease: { version: '1.0.0', channel: 'next' } },
    );

    expect(publishResult).toMatchObject({
      name: 'npm package (@next dist-tag)',
      urls: [],
      channel: 'next',
    });

    await expect(
      execa('npm', ['view', pkg.name, 'dist-tags.next'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });

    const channelResult = await addChannel({}, { ...context, nextRelease: { version: '1.0.0' } });

    expect(channelResult).toMatchObject({
      name: 'npm package (@latest dist-tag)',
      urls: [],
      channel: 'latest',
    });

    await expect(
      execa('npm', ['view', pkg.name, 'dist-tags.latest'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });
  });
});
