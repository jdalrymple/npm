import execa from 'execa';
import { validRange } from 'semver';
import { getRegistry, getReleasesInfo } from './npm-utils';

export function getChannel(channel) {
  if (!channel) return 'latest';

  return validRange(channel) ? `release-${channel}` : channel;
}

export async function addChannelNpm(npmrc, context = {}, { npmPublish } = {}, pkgJson = {}) {
  const { cwd, env, stdout, stderr, nextRelease: { version, channel } = {}, logger } = context;

  if (npmPublish === false || pkgJson.private === true) {
    logger.log(
      `Skip adding to npm channel as ${
        npmPublish === false ? 'npmPublish' : "package.json's private property"
      } is ${npmPublish !== false}`,
    );

    return false;
  }

  const registry = getRegistry(pkgJson, context);
  const distTag = getChannel(channel);

  logger.log(`Adding version ${version} to npm registry on dist-tag ${distTag}`);

  const result = execa(
    'npm',
    [
      'dist-tag',
      'add',
      `${pkgJson.name}@${version}`,
      distTag,
      '--userconfig',
      npmrc,
      '--registry',
      registry,
    ],
    {
      cwd,
      env,
    },
  );

  result.stdout.pipe(stdout, { end: false });
  result.stderr.pipe(stderr, { end: false });

  await result;

  logger.log(`Added ${pkgJson.name}@${version} to dist-tag @${distTag} on ${registry}`);

  return getReleasesInfo(pkgJson, context, distTag, registry);
}
