import execa from 'execa';
import { directory as getTempDir } from 'tempy';
import { outputJson, readJson, pathExists } from 'fs-extra';
import { WritableStreamBuffer } from 'stream-buffers';
import path from 'path';

let publish;

// Required because of the global state variables
// TODO: Investigate if that is the best design
beforeEach(() => {
  jest.resetModules();

  // eslint-disable-next-line
  ({ publish } = require('../../src'));
});

describe('publish', () => {
  it('should publish the package', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-default',
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

    const result = await publish({}, context);

    expect(result).toMatchObject({
      name: 'npm package (@latest dist-tag)',
      urls: [],
      channel: 'latest',
    });
    await expect(readJson(path.resolve(cwd, 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });
  });

  it('should publish the package on a dist-tag', async () => {
    const cwd = getTempDir();
    const env = { DEFAULT_NPM_REGISTRY: process.env.TEST_NPM_REGISTRY };
    const pkg = {
      name: 'npmx-publish-disttag',
      version: '0.0.0',
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY, tag: 'next' },
    };
    const context = {
      env,
      cwd,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'next' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    const result = await publish({}, context);

    expect(result).toMatchObject({
      name: 'npm package (@next dist-tag)',
      urls: ['https://www.npmjs.com/package/npmx-publish-disttag/v/1.0.0'],
      channel: 'next',
    });
    await expect(readJson(path.resolve(cwd, 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });
  });

  it('should publish the package from a sub-directory', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-subdir',
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

    await outputJson(path.resolve(cwd, 'dist', 'package.json'), pkg);

    const result = await publish({ pkgRoot: 'dist' }, context);

    expect(result).toMatchObject({
      name: 'npm package (@latest dist-tag)',
      urls: [],
      channel: 'latest',
    });
    await expect(readJson(path.resolve(cwd, 'dist', 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });
  });

  it('should create the package and skip publish ("npmPublish" is false)', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-skip-npmpublish',
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

    const result = await publish({ npmPublish: false, tarballDir: 'tarball' }, context);

    expect(result).toBeFalsy();

    await expect(readJson(path.resolve(cwd, 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(
      pathExists(path.resolve(cwd, 'tarball', `${pkg.name}-1.0.0.tgz`)),
    ).resolves.toBeTruthy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });

  it('should create the package and skip publish ("package.private" is true)', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-skip-private',
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

    const result = await publish({ tarballDir: 'tarball' }, context);

    expect(result).toBeFalsy();

    await expect(readJson(path.resolve(cwd, 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(
      pathExists(path.resolve(cwd, 'tarball', `${pkg.name}-1.0.0.tgz`)),
    ).resolves.toBeTruthy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });

  it('should create the package and skip publish from a sub-directory ("npmPublish" is false)', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-skip-subdir-npmpublish',
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

    await outputJson(path.resolve(cwd, 'dist', 'package.json'), pkg);

    const result = await publish(
      { pkgRoot: 'dist', npmPublish: false, tarballDir: 'tarball' },
      context,
    );

    expect(result).toBeFalsy();

    await expect(readJson(path.resolve(cwd, 'dist', 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(
      pathExists(path.resolve(cwd, 'tarball', `${pkg.name}-1.0.0.tgz`)),
    ).resolves.toBeTruthy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });

  it('should create the package and skip publish from a sub-directory ("package.private" is true)', async () => {
    const cwd = getTempDir();
    const pkg = {
      name: 'npmx-publish-skip-subdir-private',
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

    await outputJson(path.resolve(cwd, 'dist', 'package.json'), pkg);

    const result = await publish({ pkgRoot: 'dist', tarballDir: 'tarball' }, context);

    expect(result).toBeFalsy();

    await expect(readJson(path.resolve(cwd, 'dist', 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(
      pathExists(path.resolve(cwd, 'tarball', `${pkg.name}-1.0.0.tgz`)),
    ).resolves.toBeTruthy();
    await expect(
      execa('npm', ['view', pkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });

  it('should publish the sub package', async () => {
    const cwd = getTempDir();
    const rootpkg = {
      name: '@username/npmx-mono-publish-default-root',
      version: '0.0.0',
      private: true,
      workspaces: ['packages/*'],
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
    };
    const subpkg = {
      name: '@username/npmx-mono-publish-default-subpkg',
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

    await outputJson(path.resolve(cwd, 'package.json'), rootpkg);
    await outputJson(path.resolve(cwd, 'packages', 'subpkg', 'package.json'), subpkg);

    const result = await publish({}, context);

    expect(result).toMatchObject({
      name: 'npm package (@latest dist-tag)',
      urls: [],
      channel: 'latest',
    });

    await expect(readJson(path.resolve(cwd, 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(
      readJson(path.resolve(cwd, 'packages', 'subpkg', 'package.json')),
    ).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(pathExists(path.resolve(cwd, `${rootpkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();
    await expect(pathExists(path.resolve(cwd, `${subpkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();

    await expect(
      execa('npm', ['view', rootpkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();

    await expect(
      execa('npm', ['view', subpkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).resolves.toMatchObject({
      stdout: '1.0.0',
    });
  });

  it('should not publish the sub package', async () => {
    const cwd = getTempDir();
    const rootpkg = {
      name: '@username/npmx-mono-publish-skip-root',
      version: '0.0.0',
      private: true,
      workspaces: ['packages/*'],
      publishConfig: { registry: process.env.TEST_NPM_REGISTRY },
    };
    const subpkg = {
      name: '@username/npmx-mono-publish-skip-subpkg',
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

    await outputJson(path.resolve(cwd, 'package.json'), rootpkg);
    await outputJson(path.resolve(cwd, 'packages', 'subpkg', 'package.json'), subpkg);

    const result = await publish(
      { '@username/npmx-mono-publish-skip-subpkg': { npmPublish: false } },
      context,
    );

    expect(result).toBeFalsy();

    await expect(readJson(path.resolve(cwd, 'package.json'))).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(
      readJson(path.resolve(cwd, 'packages', 'subpkg', 'package.json')),
    ).resolves.toMatchObject({
      version: '1.0.0',
    });
    await expect(pathExists(path.resolve(cwd, `${rootpkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();
    await expect(pathExists(path.resolve(cwd, `${subpkg.name}-1.0.0.tgz`))).resolves.toBeFalsy();

    await expect(
      execa('npm', ['view', rootpkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();

    await expect(
      execa('npm', ['view', subpkg.name, 'version'], {
        cwd,
        env: { ...process.env, npm_config_registry: process.env.TEST_NPM_REGISTRY },
      }),
    ).rejects.toThrow();
  });
});
