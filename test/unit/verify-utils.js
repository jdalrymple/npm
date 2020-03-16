import { requiresNpmAuth, verifyNpm } from '../../src/verify-utils';
import { verifyNpmAuth } from '../../src/npm-utils';
import { verifyPluginConfig } from '../../src/plugin-config';
import { getAllPkgInfo } from '../../src/package-config';

jest.mock('../../src/package-config');
jest.mock('../../src/plugin-config');
jest.mock('../../src/npm-utils');

jest.mock('execa');

describe('requiresNpmAuth', () => {
  it('should return true if root package is not private', async () => {
    const required = requiresNpmAuth({ rootPkg: { private: false }, subPkgs: [] });

    expect(required).toBeTruthy();
  });

  it('should return true if any of the sub packages are not private', async () => {
    const required = requiresNpmAuth({ rootPkg: { private: true }, subPkgs: [{ private: false }] });

    expect(required).toBeTruthy();
  });

  it('should return true if the top level pluginConfig has the npmPublish property set to true', async () => {
    const required = requiresNpmAuth(
      { rootPkg: { private: true }, subPkgs: [] },
      { npmPublish: true },
    );

    expect(required).toBeTruthy();
  });

  it('should return true if the nested pluginConfig has the npmPublish property set to true', async () => {
    const required = requiresNpmAuth(
      { rootPkg: { private: true }, subPkgs: [] },
      { default: { npmPublish: true } },
    );

    expect(required).toBeTruthy();
  });
});

describe('verifyNpm', () => {
  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should verify plugin config', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {},
      subPkgs: [],
    });

    await verifyNpm('.npmrc', {});

    expect(verifyPluginConfig).toHaveBeenCalledWith({});
  });

  it('should verify package configuration', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {},
      subPkgs: [],
    });

    await verifyNpm('.npmrc', { prop: 6 }, { conf: true });

    expect(getAllPkgInfo).toHaveBeenCalledWith({ prop: 6 }, { conf: true });
  });

  it('should perform npm authentication if required', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: {},
      subPkgs: [],
    });

    await verifyNpm('.npmrc', { prop: 6 }, { conf: true });

    expect(verifyNpmAuth).toHaveBeenCalledWith('.npmrc', { prop: 6 }, {});
  });

  it('should not perform npm authentication if not required', async () => {
    getAllPkgInfo.mockReturnValue({
      rootPkg: { private: true },
      subPkgs: [],
    });

    await verifyNpm('.npmrc', { prop: 6 }, { conf: true });

    expect(verifyNpmAuth).toHaveBeenCalledTimes(0);
  });
});
