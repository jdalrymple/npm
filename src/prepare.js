import * as path from 'path';
import { move } from 'fs-extra';
import execa from 'execa';

async function updatePkgVersion(npmrc, basePath, { env, stdout, stderr, version, logger }) {
  logger.log('Write version %s to package.json in %s', version, basePath);

  const versionResult = execa(
    'npm',
    ['version', version, '--userconfig', npmrc, '--no-git-tag-version', '--allow-same-version'],
    {
      cwd: basePath,
      env
    }
  );

  versionResult.stdout.pipe(
    stdout,
    { end: false }
  );
  versionResult.stderr.pipe(
    stderr,
    { end: false }
  );

  await versionResult;
}

async function createTarball(npmrc, basePath, { cwd, env, stdout, stderr, version, logger }) {
  logger.log('Creating npm package version %s', version);

  const packResult = execa('npm', ['pack', basePath, '--userconfig', npmrc], {
    cwd,
    env
  });

  packResult.stdout.pipe(
    stdout,
    { end: false }
  );
  packResult.stderr.pipe(
    stderr,
    { end: false }
  );

  const tarball = (await packResult).stdout.split('\n').pop();
  const tarballSource = path.resolve(cwd, tarball);
  const tarballDestination = path.resolve(cwd, tarballDir.trim(), tarball);

  // Only move the tarball if we need to
  // Fixes: https://github.com/semantic-release/npm/issues/169
  if (tarballSource !== tarballDestination) {
    await move(tarballSource, tarballDestination);
  }
}

export async function prepareNpm(npmrc, { pkgRoot, tarballDir }, { cwd, env, stdout, stderr, nextRelease: { version }, logger }, isPrivate=false) {
  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;

  await updatePkgVersion(npmrc, basePath, { env, stdout, stderr, version, logger });

  if (tarballDir && isPrivate !== true) {
    await createTarball(npmrc, basePath, {
      cwd,
      env,
      stdout,
      stderr,
      version,
      logger
    });
  }
}
