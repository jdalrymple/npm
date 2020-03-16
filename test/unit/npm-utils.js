import rc from 'rc';
import getAuthToken from 'registry-auth-token';
import { outputFile, readFile } from 'fs-extra';
import { WritableStreamBuffer } from 'stream-buffers';
import { PassThrough } from 'stream';
import execa from 'execa';
import {
  setAuth,
  getRegistry,
  getLegacyToken,
  summarizeReleasesInfo,
  getReleasesInfo,
  verifyNpmAuth,
} from '../../src/npm-utils';

jest.mock('registry-auth-token', () => jest.fn());
jest.mock('rc');
jest.mock('fs-extra');
jest.mock('execa');

describe('getRegistry', () => {
  it('should get the default registry without publish configuration', async () => {
    rc.mockReturnValueOnce({ registry: 'https://registry.npmjs.org/' });

    const reg = await getRegistry({ name: 'package-name' });

    expect(reg).toEqual('https://registry.npmjs.org/');
  });

  it('should get the default registry with publish configuration', async () => {
    rc.mockReturnValueOnce({ registry: 'https://registry.npmjs.org/' });

    const reg = await getRegistry({ name: 'package-name', publishConfig: {} });

    expect(reg).toEqual('https://registry.npmjs.org/');
  });

  it('should get the registry configured from "publishConfig"', async () => {
    const reg = await getRegistry({
      name: 'package-name',
      publishConfig: { registry: 'https://custom3.registry.com/' },
    });

    expect(reg).toEqual('https://custom3.registry.com/');
  });

  it('should get the registry configured in "NPM_CONFIG_REGISTRY"', async () => {
    const reg = await getRegistry(
      { name: 'package-name' },
      { env: { NPM_CONFIG_REGISTRY: 'https://custom1.registry.com/' } },
    );

    expect(reg).toEqual('https://custom1.registry.com/');
  });

  it('should get the registry configured in ".npmrc" for scoped package', async () => {
    rc.mockReturnValueOnce({ '@scope:registry': 'https://custom1.npmjs.com/' });

    const reg = await getRegistry({ name: '@scope/package-name' });

    expect(reg).toEqual('https://custom1.npmjs.com/');
  });
});

describe('setAuth', () => {
  let context;

  beforeEach(async () => {
    context = {
      logger: { log: jest.fn() },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };
  });

  it('should set auth with "NPM_TOKEN"', async () => {
    const fileContents = ['//registry.npmjs.org/:_authToken=fake_token', 'test_config=abrakadabra'];

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({
      configs: ['/home/.npmrc', '/temp/.npmrc'],
    });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await setAuth('.npmrc', 'http://custom.registry.com', {
      env: { NPM_TOKEN: 'npm_token' },
      logger: context.logger,
    });

    expect(outputFile).toHaveBeenCalledWith(
      '.npmrc',
      [...fileContents, `//custom.registry.com/:_authToken = \${NPM_TOKEN}`].join('\n'),
    );
    expect(context.logger.log).toHaveBeenCalledWith('Wrote NPM_TOKEN to .npmrc');
  });

  it('should set auth with "NPM_USERNAME", "NPM_PASSWORD" and "NPM_EMAIL"', async () => {
    const fileContents = ['//registry.npmjs.org/:_authToken=fake_token', 'test_config=abrakadabra'];

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({
      configs: ['/home/.npmrc', '/temp/.npmrc'],
    });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await setAuth('.npmrc', 'http://custom.registry.com', {
      env: {
        NPM_EMAIL: 'npm_email',
        ...getLegacyToken({
          NPM_USERNAME: 'npm_username',
          NPM_PASSWORD: 'npm_pasword',
          NPM_EMAIL: 'npm_email',
        }),
      },
      logger: context.logger,
    });

    expect(outputFile).toHaveBeenCalledWith(
      '.npmrc',
      [...fileContents, `_auth = \${LEGACY_TOKEN}`, `email = \${NPM_EMAIL}`].join('\n'),
    );

    expect(context.logger.log).toHaveBeenCalledWith(
      'Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to .npmrc',
    );
  });

  it('should preserve home and local ".npmrc"', async () => {
    const fileContents = ['//registry.npmjs.org/:_authToken=fake_token', 'test_config=abrakadabra'];
    const filePaths = ['/home/.npmrc', '/temp/.npmrc'];

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({ configs: filePaths });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await setAuth('.npmrc', 'http://custom.registry.com', {
      env: { NPM_TOKEN: 'npm_token' },
      logger: context.logger,
    });

    expect(outputFile).toHaveBeenCalledWith(
      '.npmrc',
      [...fileContents, `//custom.registry.com/:_authToken = \${NPM_TOKEN}`].join('\n'),
    );

    expect(context.logger.log).toHaveBeenCalledWith(
      'Reading npm config from %s',
      filePaths.join(', '),
    );
    expect(context.logger.log).toHaveBeenCalledWith(
      'Verify authentication for registry %s',
      'http://custom.registry.com',
    );
    expect(context.logger.log).toHaveBeenCalledWith('Wrote NPM_TOKEN to .npmrc');
  });

  it('should preserve all ".npmrc" if auth is configured', async () => {
    const fileContents = ['//registry.npmjs.org/:_authToken=fake_token', 'test_config=abrakadabra'];
    const filePaths = ['/home/.npmrc', '/temp/.npmrc'];

    getAuthToken.mockReturnValueOnce(true);
    rc.mockReturnValueOnce({ configs: filePaths });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await setAuth('.npmrc', 'http://custom.registry.com', {
      env: { NPM_TOKEN: 'npm_token' },
      logger: context.logger,
    });

    expect(outputFile).toHaveBeenCalledWith('.npmrc', fileContents.join('\n'));
    expect(context.logger.log).toHaveBeenCalledWith(
      'Reading npm config from %s',
      filePaths.join(', '),
    );
    expect(context.logger.log).toHaveBeenCalledWith(
      'Verify authentication for registry %s',
      'http://custom.registry.com',
    );
  });

  it('should preserve ".npmrc" if auth is already configured for a scoped package', async () => {
    const fileContents = [
      '//registry.npmjs.org/:_authToken=fake_token',
      '@scope:registry=http://custom.registry.com\ntest_config=abrakadabra',
    ];
    const filePaths = ['/home/.npmrc', '/temp/.npmrc'];

    getAuthToken.mockReturnValueOnce(true);
    rc.mockReturnValueOnce({ configs: filePaths });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await setAuth('.npmrc', 'http://custom.registry.com', {
      env: { NPM_TOKEN: 'npm_token' },
      logger: context.logger,
    });

    expect(outputFile).toHaveBeenCalledWith('.npmrc', fileContents.join('\n'));
    expect(context.logger.log).toHaveBeenCalledWith(
      'Reading npm config from %s',
      filePaths.join(', '),
    );
    expect(context.logger.log).toHaveBeenCalledWith(
      'Verify authentication for registry %s',
      'http://custom.registry.com',
    );
  });

  it('should emulate npm config resolution if "NPM_CONFIG_USERCONFIG" is set', async () => {
    const fileContents = ['//registry.npmjs.org/:_authToken=fake_token', 'test_config=abrakadabra'];
    const filePaths = ['/home/.npmrc', '/temp/.npmrc'];

    getAuthToken.mockReturnValueOnce(true);
    rc.mockReturnValueOnce({ configs: filePaths });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await setAuth('.npmrc', 'http://custom.registry.com', {
      env: { NPM_CONFIG_USERCONFIG: '.testnpmrc' },
      logger: context.logger,
    });

    expect(rc).toHaveBeenCalledWith(
      'npm',
      { registry: 'https://registry.npmjs.org/' },
      { config: '.testnpmrc' },
    );
    expect(outputFile).toHaveBeenCalledWith('.npmrc', fileContents.join('\n'));
    expect(context.logger.log).toHaveBeenCalledWith(
      'Reading npm config from %s',
      filePaths.join(', '),
    );
    expect(context.logger.log).toHaveBeenCalledWith(
      'Verify authentication for registry %s',
      'http://custom.registry.com',
    );
  });

  it('should throw error if "NPM_TOKEN" is missing', async () => {
    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({ configs: ['/home/.npmrc', '/temp/.npmrc'] });

    await expect(
      setAuth('.npmrc', 'http://custom.registry.com', {
        logger: context.logger,
      }),
    ).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      message: 'No npm token specified.',
      code: 'ENONPMTOKEN',
    });
  });

  it('should throw error if "NPM_USERNAME" is missing', async () => {
    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({ configs: ['/home/.npmrc', '/temp/.npmrc'] });

    await expect(
      setAuth('.npmrc', 'http://custom.registry.com', {
        env: { NPM_PASSWORD: 'npm_pasword', NPM_EMAIL: 'npm_email' },
        logger: context.logger,
      }),
    ).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      message: 'No npm token specified.',
      code: 'ENONPMTOKEN',
    });
  });

  it('should throw error if "NPM_PASSWORD" is missing', async () => {
    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({ configs: ['/home/.npmrc', '/temp/.npmrc'] });

    await expect(
      setAuth('.npmrc', 'http://custom.registry.com', {
        env: { NPM_USERNAME: 'npm_username', NPM_EMAIL: 'npm_email' },
        logger: context.logger,
      }),
    ).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      message: 'No npm token specified.',
      code: 'ENONPMTOKEN',
    });
  });

  it('should throw error if "NPM_EMAIL" is missing', async () => {
    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValueOnce({ configs: ['/home/.npmrc', '/temp/.npmrc'] });

    await expect(
      setAuth('.npmrc', 'http://custom.registry.com', {
        env: { NPM_USERNAME: 'npm_username', NPM_PASSWORD: 'npm_pasword' },
        logger: context.logger,
      }),
    ).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      message: 'No npm token specified.',
      code: 'ENONPMTOKEN',
    });
  });
});

describe('summarizeReleasesInfo', () => {
  it('should ignore false releases', async () => {
    const summary = summarizeReleasesInfo([false, { name: 'repo', channel: 'repo', url: 'test' }]);

    expect(summary).toMatchObject({
      name: 'repo',
      urls: ['test'],
      channel: 'repo',
    });
  });

  it('should return false if there are no releases', async () => {
    const summary = summarizeReleasesInfo([false, false]);

    expect(summary).toBeFalsy();
  });
});

describe('getLegacyToken', () => {
  it('should return a token if npm email, password and username are given', async () => {
    const env = {
      NPM_USERNAME: 'npm_username',
      NPM_PASSWORD: 'npm_pasword',
      NPM_EMAIL: 'npm_email',
    };

    const tokenObject = getLegacyToken(env);

    expect(tokenObject).toHaveProperty('LEGACY_TOKEN');
  });

  it('should return an empty object if either npm email, password and username are not given', async () => {
    const tokenObject = getLegacyToken({});

    expect(tokenObject).toMatchObject({});
  });
});

describe('getReleasesInfo', () => {
  it('should return a release information object', async () => {
    const info = getReleasesInfo(
      { name: 'test-project' },
      { nextRelease: { version: '1.0.0' } },
      'next',
      'https://registry.npmjs.org/',
    );

    expect(info).toMatchObject({
      name: 'npm package (@next dist-tag)',
      url: 'https://www.npmjs.com/package/test-project/v/1.0.0',
      channel: 'next',
    });
  });

  it('should return an undefined url if registry doesnt match default', async () => {
    const info = getReleasesInfo(
      { name: 'test-project' },
      { nextRelease: { version: '1.0.0' } },
      'next',
      'https://custom.npmjs.org/',
    );

    expect(info).toMatchObject({
      name: 'npm package (@next dist-tag)',
      url: undefined,
      channel: 'next',
    });
  });
});

describe('verifyNpmAuth', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should set the authentication information in the npmrc file', async () => {
    const fileContents = ['https://custom.npmjs.org/'];
    const env = { NPM_TOKEN: 'npm_token' };
    const pkgJson = {
      name: 'test-project',
    };

    const context = {
      cwd: 'home',
      env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'next' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValue({
      registry: 'https://custom.npmjs.org/',
      configs: ['/home/.npmrc'],
    });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    await verifyNpmAuth('.npmrc', context, pkgJson);

    expect(context.logger.log).toHaveBeenCalledWith(
      'Verify authentication for registry %s',
      'https://custom.npmjs.org/',
    );
  });

  it('should throw if token is invalid', async () => {
    const fileContents = ['https://custom.npmjs.org/'];
    const env = { DEFAULT_NPM_REGISTRY: 'https://custom.npmjs.org/', NPM_TOKEN: 'npm_token' };
    const pkgJson = {
      name: 'test-project',
    };

    const context = {
      cwd: 'home',
      env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'next' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValue({
      registry: 'https://custom.npmjs.org/',
      configs: ['/home/.npmrc'],
    });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    execa.mockImplementation(() => {
      throw new Error();
    });

    await expect(verifyNpmAuth('.npmrc', context, pkgJson)).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      message: 'Invalid npm token.',
      code: 'EINVALIDNPMTOKEN',
    });
  });

  it('should not verify if registry url doesnt match DEFAULT_NPM_REGISTRY env var', async () => {
    const fileContents = ['https://custom.npmjs.org/'];
    const env = { NPM_TOKEN: 'npm_token' };
    const pkgJson = {
      name: 'test-project',
    };

    const context = {
      cwd: 'home',
      env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'next' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValue({
      registry: 'https://custom.npmjs.org/',
      configs: ['/home/.npmrc'],
    });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    await verifyNpmAuth('.npmrc', context, pkgJson);

    expect(execa).toHaveBeenCalledTimes(0);
  });

  it('should run the whoami command in npm to verify the token', async () => {
    const fileContents = ['https://custom.npmjs.org/'];
    const env = { DEFAULT_NPM_REGISTRY: 'https://custom.npmjs.org/', NPM_TOKEN: 'npm_token' };
    const pkgJson = {
      name: 'test-project',
    };

    const context = {
      cwd: 'home',
      env,
      logger: { log: jest.fn() },
      nextRelease: { version: '1.0.0', channel: 'next' },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };

    getAuthToken.mockReturnValueOnce(false);
    rc.mockReturnValue({
      registry: 'https://custom.npmjs.org/',
      configs: ['/home/.npmrc'],
    });
    fileContents.forEach(c => readFile.mockReturnValueOnce(c));

    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    await verifyNpmAuth('.npmrc', context, pkgJson);

    expect(execa).toHaveBeenCalledWith(
      'npm',
      ['whoami', '--userconfig', '.npmrc', '--registry', 'https://custom.npmjs.org/'],
      {
        env,
        cwd: 'home',
      },
    );
  });
});
