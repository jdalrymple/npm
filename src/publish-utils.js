import * as path from 'path';
import execa from 'execa';
import { getChannel } from './channel-utils';
import { getRegistry, getReleasesInfo } from './npm-utils';

export async function publishNpm(
  npmrc,
  context,
  { npmPublish, pkgRoot, access = 'restricted' },
  pkgJson,
) {
  const { cwd, env, stdout, stderr, nextRelease: { version, channel } = {}, logger } = context;

  if (npmPublish === false || pkgJson.private === true) {
    logger.log(
      `Skip publishing to npm registry as ${
        npmPublish === false ? 'npmPublish' : "package.json's private property"
      } is ${npmPublish !== false}`,
    );

    return false;
  }

  const basePath = pkgRoot ? path.resolve(cwd, pkgRoot) : cwd;
  const registry = getRegistry(pkgJson, context);
  const distTag = getChannel(channel);
  const args = [
    'publish',
    basePath,
    '--userconfig',
    npmrc,
    '--tag',
    distTag,
    '--registry',
    registry,
  ];

  if (pkgJson.name.includes('@')) args.push('--access', access);

  logger.log(
    `Publishing ${pkgJson.name} version ${version} to npm registry on dist-tag ${distTag}`,
  );

  const result = execa('npm', args, { cwd, env });

  result.stdout.pipe(stdout, { end: false });
  result.stderr.pipe(stderr, { end: false });

  await result;

  logger.log(`Published ${pkgJson.name}@${version} to dist-tag @${distTag} on ${registry}`);

  return getReleasesInfo(pkgJson, context, distTag, registry);
}
