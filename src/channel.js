import execa from 'execa';
import { getRegistry, getReleasesInfo } from './npm-utils';
import { validRange } from 'semver';

export function getChannel(channel) {
  return channel ? (validRange(channel) ? `release-${channel}` : channel) : 'latest';
}

export async function addNpmChannel(npmrc, { npmPublish }, context, pkgJson) {
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
      `Skip adding to npm channel as ${
        npmPublish === false ? 'npmPublish' : "package.json's private property"
      } is ${npmPublish !== false}`
    );

    return false;
  }

  const registry = getRegistry(pkgJson, context);
  const distTag = getChannel(channel);

  logger.log(`Adding version ${version} to npm registry on dist-tag ${distTag}`);

  const result = execa(
    'npm',
    ['dist-tag', 'add', `${pkgJson.name}@${version}`, distTag, '--userconfig', npmrc, '--registry', registry],
    {
      cwd,
      env
    }
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

  logger.log(`Added ${pkgJson.name}@${version} to dist-tag @${distTag} on ${registry}`);

  return getReleaseInfo(pkgJson, context, distTag, registry);
}
