import path from 'path';
import { outputJson, remove } from 'fs-extra';
import { directory as createDir } from 'tempy';
import { getPkgInfo } from '../../src/package-config';

describe('packageConfig.getPkgInfo', () => {
  it('should validate name and version then return parsed package.json if not private', async () => {
    const cwd = createDir();
    const pkg = { name: 'package', version: '0.0.0' };

    await outputJson(path.resolve(cwd, 'package.json'), pkg);

    const info = await getPkgInfo(cwd);

    expect(info.name).toEqual(pkg.name);
    expect(info.version).toEqual(pkg.version);

    await remove(cwd);
  });
});

// test("Verify name and version then return parsed package.json", async t => {
//   const cwd = tempy.directory();
//   const pkg = { name: "package", version: "0.0.0" };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await getPkg({}, { cwd });
//   t.is(pkg.name, result.name);
//   t.is(pkg.version, result.version);
// });

// test("Verify name and version then return parsed package.json from a sub-directory", async t => {
//   const cwd = tempy.directory();
//   const pkgRoot = "dist";
//   const pkg = { name: "package", version: "0.0.0" };
//   await outputJson(path.resolve(cwd, pkgRoot, "package.json"), pkg);

//   const result = await getPkg({ pkgRoot }, { cwd });
//   t.is(pkg.name, result.name);
//   t.is(pkg.version, result.version);
// });

// test("Throw error if missing package.json", async t => {
//   const cwd = tempy.directory();
//   const [error] = await t.throwsAsync(getPkg({}, { cwd }));

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.code, "ENOPKG");
// });

// test("Throw error if missing package name", async t => {
//   const cwd = tempy.directory();
//   await outputJson(path.resolve(cwd, "package.json"), { version: "0.0.0" });

//   const [error] = await t.throwsAsync(getPkg({}, { cwd }));

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.code, "ENOPKGNAME");
// });

// test("Throw error if package.json is malformed", async t => {
//   const cwd = tempy.directory();
//   await writeFile(path.resolve(cwd, "package.json"), "{name: 'package',}");

//   const [error] = await t.throwsAsync(getPkg({}, { cwd }));

//   t.is(error.name, "JSONError");
// });
