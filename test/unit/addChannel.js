import { addChannel, status } from '../../src';
import { getAllPkgInfo } from '../../src/package-config';
import { addChannelNpm } from '../../src/channel-utils';
import { verifyNpm } from '../../src/verify-utils';
import { summarizeReleasesInfo } from '../../src/npm-utils';

jest.mock('../../src/package-config');
jest.mock('../../src/verify-utils');
jest.mock('../../src/channel-utils', () => ({
  addChannelNpm: jest.fn(() => ({})),
}));
jest.mock('../../src/npm-utils', () => ({
  summarizeReleasesInfo: jest.fn(() => 'info'),
}));
jest.mock('tempy', () => ({
  file: jest.fn(() => 'temp'),
}));

beforeEach(() => {
  jest.resetModules();
});

describe('addChannel', () => {
  it("should verify if the conditions haven't been verified previously", async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
      },
      subPkgs: [],
    });

    expect(status.verified).toBeFalsy();

    await addChannel();

    expect(verifyNpm).toBeCalledWith('temp', {}, {});
  });

  it('should return the release summary after adding the channel', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
      },
      subPkgs: [],
    });

    const summary = await addChannel();

    expect(summary).toBe('info');
    expect(summarizeReleasesInfo).toBeCalledWith([{}]);
  });

  it('should forward pluginConfig and context to get package and subpackage information', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
      },
      subPkgs: [],
    });

    const context = { fake: 6 };
    const config = { property: true };

    await addChannel(config, context);

    expect(getAllPkgInfo).toBeCalledWith(context, config);
  });

  it('should add a channel for each package in repository', async () => {
    const pkgInfo = {
      rootPkg: {
        name: 'root',
        path: 'home/root',
        private: true,
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    };

    getAllPkgInfo.mockReturnValue(pkgInfo);

    await addChannel();

    expect(addChannelNpm).toBeCalledWith('temp', { cwd: 'home/root' }, {}, pkgInfo.rootPkg);
    expect(addChannelNpm).toBeCalledWith('temp', { cwd: 'home/root/sub1' }, {}, pkgInfo.subPkgs[0]);
    expect(addChannelNpm).toBeCalledWith('temp', { cwd: 'home/root/sub2' }, {}, pkgInfo.subPkgs[1]);
  });

  it('should take default config if package config is unknown', async () => {
    const pkgInfo = {
      rootPkg: {
        name: 'root',
        path: 'home/root',
        private: true,
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    };

    getAllPkgInfo.mockReturnValue(pkgInfo);

    const context = { ctx: 6 };
    const basicConfig = { property: true };
    const nestedConfig = { default: { property: false } };

    await addChannel(basicConfig, context);

    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root' },
      basicConfig,
      pkgInfo.rootPkg,
    );
    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root/sub1' },
      basicConfig,
      pkgInfo.subPkgs[0],
    );
    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root/sub2' },
      basicConfig,
      pkgInfo.subPkgs[1],
    );

    await addChannel(nestedConfig, context);

    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root' },
      nestedConfig.default,
      pkgInfo.rootPkg,
    );

    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root/sub1' },
      nestedConfig.default,
      pkgInfo.subPkgs[0],
    );
    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root/sub2' },
      nestedConfig.default,
      pkgInfo.subPkgs[1],
    );
  });

  it('should take custom config if package config is known', async () => {
    const pkgInfo = {
      rootPkg: {
        name: 'root',
        path: 'home/root',
        private: true,
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    };

    getAllPkgInfo.mockReturnValue(pkgInfo);

    const context = { ctx: 6 };
    const config = { sub1: { property: false }, default: { property: true } };

    await addChannel(config, context);

    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root' },
      config.default,
      pkgInfo.rootPkg,
    );
    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root/sub1' },
      config.sub1,
      pkgInfo.subPkgs[0],
    );
    expect(addChannelNpm).toBeCalledWith(
      'temp',
      { ctx: 6, cwd: 'home/root/sub2' },
      config.default,
      pkgInfo.subPkgs[1],
    );
  });
});
