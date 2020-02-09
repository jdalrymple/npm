import * as path from 'path';
import execa from 'execa';
import { getChannel } from './channel';
import { getRegistry, getReleasesInfo } from './npm-utils';

export async function publishNpm(npmrc, { npmPublish, pkgRoot }, context, pkgJson) {
  const {
    cwd,
    env,
    stdout,
    stderr,
    nextRelease: { version, channel },
    logger
  } = context;

  if (npmPublish === false || pkgJson.private == true) {
    logger.log(
      `Skip publishing to npm registry as ${
        npmPublish === false ? 'npmPublish' : "package.json's private property"
      } is ${npmPublish !== false}`
    );

    return false;
  }

  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
  const registry = getRegistry(pkgJson, context);
  const distTag = getChannel(channel);

  logger.log(`Publishing ${pkgJson.name} version ${version} to npm registry on dist-tag ${distTag}`);

  const result = execa(
    'npm',
    ['publish', basePath, '--userconfig', npmrc, '--tag', distTag, '--registry', registry],
    { cwd, env }
  );

  result.stdout.pipe(
    stdout,
    { end: false }
  );
  result.stderr.pipe(
    stderr,
    { end: false }
  );

  await result;

  logger.log(`Published ${pkgJson.name}@${version} to dist-tag @${distTag} on ${registry}`);

  return getReleasesInfo(pkgJson, context, distTag, registry);
}
