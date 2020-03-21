import { getAllPkgInfo } from '../../src/package-config';
import { prepareNpm } from '../../src/prepare-utils';
import { verifyNpm } from '../../src/verify-utils';

jest.mock('../../src/package-config');
jest.mock('../../src/verify-utils');
jest.mock('../../src/prepare-utils', () => ({
  prepareNpm: jest.fn(),
}));
jest.mock('tempy', () => ({
  file: jest.fn(() => 'temp'),
}));

let prepare;
let status;

beforeEach(() => {
  jest.isolateModules(() => {
    // eslint-disable-next-line
    ({ prepare, status } = require('../../src'));
  });
});

describe('prepare', () => {
  it("should verify if the conditions haven't been verified previously", async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    });

    expect(status.verified).toBeFalsy();

    await prepare();

    expect(verifyNpm).toBeCalledWith('temp', { env: {} }, {});
  });

  it('should forward pluginConfig and context to get package and subpackage information', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
      },
      subPkgs: [],
    });

    const context = { ctx: 6, env: {} };
    const config = { property: true };

    await prepare(config, context);

    expect(getAllPkgInfo).toBeCalledWith(context, config);
  });

  it('should prepare each package in repository', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
        private: true,
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    });

    const context = { env: {} };

    await prepare();

    expect(prepareNpm).toBeCalledWith('temp', context, { pkgRoot: 'home/root' }, true);
    expect(prepareNpm).toBeCalledWith('temp', context, { pkgRoot: 'home/root/sub1' }, false);
    expect(prepareNpm).toBeCalledWith('temp', context, { pkgRoot: 'home/root/sub2' }, true);
  });

  it('should take default config if package config is unknown', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
        private: true,
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    });

    const context = { ctx: 6, env: {} };
    const basicConfig = { property: true };
    const nestedConfig = { default: { property: false } };

    await prepare(basicConfig, context);

    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root', ...basicConfig },
      true,
    );
    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root/sub1', ...basicConfig },
      false,
    );
    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root/sub2', ...basicConfig },
      true,
    );

    await prepare(nestedConfig, context);

    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root', ...nestedConfig.default },
      true,
    );

    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root/sub1', ...nestedConfig.default },
      false,
    );
    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root/sub2', ...nestedConfig.default },
      true,
    );
  });

  it('should take custom config if package config is known', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
        private: true,
      },
      subPkgs: [
        { name: 'sub1', path: 'home/root/sub1' },
        { name: 'sub2', path: 'home/root/sub2', private: true },
      ],
    });

    const context = { ctx: 6, env: {} };
    const config = { sub1: { property: false }, default: { property: true } };

    await prepare(config, context);

    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root', ...config.default },
      true,
    );
    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root/sub1', ...config.sub1 },
      false,
    );
    expect(prepareNpm).toBeCalledWith(
      'temp',
      context,
      { pkgRoot: 'home/root/sub2', ...config.default },
      true,
    );
  });

  it('should set prepared flag to true once completed', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {
        name: 'root',
        path: 'home/root',
      },
      subPkgs: [],
    });

    await prepare();

    expect(status.prepared).toBeTruthy();
  });
});
