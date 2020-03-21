import path from 'path';
import { outputJson, remove, writeFile } from 'fs-extra';
import { directory as createDir } from 'tempy';
import { getPkgInfo, getAllPkgInfo } from '../../src/package-config';

let cwd;

beforeEach(() => {
  cwd = createDir();
});

afterEach(async () => {
  await remove(cwd);
});

describe('getPkgInfo', () => {
  it('should validate name and version then return parsed package.json if not private', async () => {
    const pkg = { name: 'package', version: '0.0.0' };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    const info = await getPkgInfo(cwd);

    expect(info.name).toEqual(pkg.name);
    expect(info.version).toEqual(pkg.version);
  });

  it('should verify name and version then return parsed package.json', async () => {
    const pkg = { name: 'package', version: '0.0.0' };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    const info = await getPkgInfo(cwd);

    expect(info.name).toEqual(pkg.name);
    expect(info.version).toEqual(pkg.version);
  });

  it('should Throw error if missing package.json', async () => {
    await expect(getPkgInfo(cwd)).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      code: 'ENOPKG',
    });
  });

  it('should Throw error if missing package name', async () => {
    await outputJson(path.resolve(cwd, 'package.json'), { version: '0.0.0' });

    await expect(getPkgInfo(cwd)).rejects.toMatchObject({
      name: 'SemanticReleaseError',
      code: 'ENOPKGNAME',
    });
  });

  it('should Throw error if package.json is malformed', async () => {
    await writeFile(path.resolve(cwd, 'package.json'), "{name: 'package',}");

    await expect(getPkgInfo(cwd)).rejects.toMatchObject({
      name: 'JSONError',
    });
  });
});

describe('getAllPkgInfo', () => {
  it('should verify name and version then return parsed package.json from a sub-directory in a single package repository', async () => {
    const pkgRoot = 'dist';
    const pkg = { name: 'package', version: '0.0.0' };

    await outputJson(path.resolve(cwd, pkgRoot, 'package.json'), pkg);

    const { rootPkg } = await getAllPkgInfo({ cwd }, { pkgRoot });

    expect(rootPkg.name).toEqual(pkg.name);
    expect(rootPkg.version).toEqual(pkg.version);
  });

  it('should look for subpackage configuration if root is private', async () => {
    const pkgRoot = 'dist';
    const pkg = { name: 'package', version: '0.0.0', private: true };

    await outputJson(path.resolve(cwd, pkgRoot, 'package.json'), pkg);

    const { rootPkg, subPkgs } = await getAllPkgInfo({ cwd }, { pkgRoot });

    expect(rootPkg.name).toEqual(pkg.name);
    expect(rootPkg.version).toEqual(pkg.version);
    expect(subPkgs).toStrictEqual([]);
  });
});
