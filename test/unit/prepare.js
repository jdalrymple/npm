import path from 'path';
import execa from 'execa';
import {
  outputJson,
  readJson,
  remove,
  appendFile,
  readFile,
  outputFile,
  pathExists,
} from 'fs-extra';
import { directory as createDir, file as createFile } from 'tempy';
import { WritableStreamBuffer } from 'stream-buffers';
import { prepareNpm } from '../../src/prepare';

let context;
let cwd;
let tempNpmrc;

beforeEach(async () => {
  cwd = await createDir();
  tempNpmrc = await createFile({ name: '.tempNpmrc' });

  context = {};
  context.log = jest.fn();
  context.logger = { log: context.log };
  context.stdout = new WritableStreamBuffer();
  context.stderr = new WritableStreamBuffer();
});

afterEach(async () => {
  await remove(cwd);
  await remove(tempNpmrc);
});

describe('prepareNpm.prepareNpm in a single package repository', () => {
  it('should update the package.json', async () => {
    const packagePath = path.resolve(cwd, 'package.json');
    await outputJson(packagePath, { version: '0.0.0-dev' });

    await prepareNpm(
      tempNpmrc,
      {},
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    const json = await readJson(packagePath);

    // Verify package.json has been updated
    expect(json.version).toBe('1.0.0');

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });

  it('should update the package.json and the npm-shrinkwrap.json', async () => {
    const packagePath = path.resolve(cwd, 'package.json');
    const shrinkwrapPath = path.resolve(cwd, 'npm-shrinkwrap.json');

    await outputJson(packagePath, { version: '0.0.0-dev' });

    // Create a npm-shrinkwrap.json file
    await execa('npm', ['shrinkwrap'], { cwd });

    await prepareNpm(
      tempNpmrc,
      {},
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    const [pkg, shrinkwrap] = await Promise.all([readJson(packagePath), readJson(shrinkwrapPath)]);

    // Verify package.json and npm-shrinkwrap.json have been updated
    expect(pkg.version).toBe('1.0.0');
    expect(shrinkwrap.version).toBe('1.0.0');

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });

  it('should update the package.json and the package-lock.json', async () => {
    const packagePath = path.resolve(cwd, 'package.json');
    const packageLockPath = path.resolve(cwd, 'package-lock.json');

    await outputJson(packagePath, { version: '0.0.0-dev' });
    await appendFile(path.resolve(cwd, '.tempNpmrc'), 'package-lock = true');

    // Create a package-lock.json file
    await execa('npm', ['install'], { cwd });

    await prepareNpm(
      tempNpmrc,
      {},
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    const [pkg, pkglock] = await Promise.all([readJson(packagePath), readJson(packageLockPath)]);

    // Verify the package.json and the package-lock.json have been updated
    expect(pkg.version).toBe('1.0.0');
    expect(pkglock.version).toBe('1.0.0');

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });

  it('should update the package.json and the npm-shrinkwrap.json in a sub-directory', async () => {
    const pkgRoot = 'dist';
    const packagePath = path.resolve(cwd, pkgRoot, 'package.json');
    const shrinkwrapPath = path.resolve(cwd, pkgRoot, 'npm-shrinkwrap.json');

    await outputJson(packagePath, { version: '0.0.0-dev' });

    // Create a npm-shrinkwrap.json file
    await execa('npm', ['shrinkwrap'], { cwd: path.resolve(cwd, pkgRoot) });

    await prepareNpm(
      tempNpmrc,
      { pkgRoot },
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    const [pkg, shrinkwrap] = await Promise.all([readJson(packagePath), readJson(shrinkwrapPath)]);

    // Verify package.json and npm-shrinkwrap.json have been updated
    expect(pkg.version).toBe('1.0.0');
    expect(shrinkwrap.version).toBe('1.0.0');

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      path.resolve(cwd, pkgRoot),
    );
  });

  it('should update the package.json and the package-lock.json in a sub-directory', async () => {
    const pkgRoot = 'dist';
    const packagePath = path.resolve(cwd, pkgRoot, 'package.json');
    const packageLockPath = path.resolve(cwd, pkgRoot, 'package-lock.json');

    await outputJson(packagePath, { version: '0.0.0-dev' });
    await appendFile(path.resolve(cwd, pkgRoot, '.tempNpmrc'), 'package-lock = true');

    // Create a package-lock.json file
    await execa('npm', ['install'], { cwd: path.resolve(cwd, pkgRoot) });

    await prepareNpm(
      tempNpmrc,
      { pkgRoot },
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    const [pkg, pkglock] = await Promise.all([readJson(packagePath), readJson(packageLockPath)]);

    // Verify the package.json and the package-lock.json have been updated
    expect(pkg.version).toBe('1.0.0');
    expect(pkglock.version).toBe('1.0.0');

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      path.resolve(cwd, pkgRoot),
    );
  });

  it('should preserve indentation and newline', async () => {
    const packagePath = path.resolve(cwd, 'package.json');

    await outputFile(
      packagePath,
      `{\r\n        "name": "package-name",\r\n        "version": "0.0.0-dev"\r\n}\r\n`,
    );

    await prepareNpm(
      tempNpmrc,
      {},
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    // Verify package.json has been updated
    const json = await readFile(packagePath, 'utf8');

    expect(json).toMatch(
      `{\r\n        "name": "package-name",\r\n        "version": "1.0.0"\r\n}\r\n`,
    );

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });

  it('should use the default indentation and newline if it cannot be detected', async () => {
    const packagePath = path.resolve(cwd, 'package.json');

    await outputFile(packagePath, `{"name": "package-name","version": "0.0.0-dev"}`);

    await prepareNpm(
      tempNpmrc,
      {},
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    // Verify package.json has been updated
    const json = await readFile(packagePath, 'utf8');

    expect(json).toMatch(`{\n  "name": "package-name",\n  "version": "1.0.0"\n}\n`);

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });

  it('should create the package in the "tarballDir" directory', async () => {
    const packagePath = path.resolve(cwd, 'package.json');
    const pkg = { name: 'my-pkg', version: '0.0.0-dev' };

    await outputJson(packagePath, pkg);

    await prepareNpm(
      tempNpmrc,
      { tarballDir: 'tarball' },
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    // Verify package.json has been updated
    const json = await readJson(packagePath);

    expect(json.version).toBe('1.0.0');

    // Verify tar is created
    const exists = await pathExists(path.resolve(cwd, `tarball/${pkg.name}-1.0.0.tgz`));

    expect(exists).toBeTruthy();

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });

  it('should only move the created tarball if the "tarballDir" directory is not the CWD', async () => {
    const packagePath = path.resolve(cwd, 'package.json');
    const pkg = { name: 'my-pkg', version: '0.0.0-dev' };

    await outputJson(packagePath, pkg);

    await prepareNpm(
      tempNpmrc,
      { tarballDir: '.' },
      {
        cwd,
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
    );

    // Verify package.json has been updated
    const json = await readJson(packagePath);

    expect(json.version).toBe('1.0.0');

    // Verify tar is created
    const exists = await pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`));

    expect(exists).toBeTruthy();

    // Verify the logger has been called with the version updated
    expect(context.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      cwd,
    );
  });
});
