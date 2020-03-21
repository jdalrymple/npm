import execa from 'execa';
import normalizeUrl from 'normalize-url';
import path from 'path';
import rc from 'rc';
import getAuthToken from 'registry-auth-token';
import getRegistryUrl from 'registry-auth-token/registry-url';
import { outputFile, readFile } from 'fs-extra';
import nerfDart from 'nerf-dart';
import { getError } from './error';

const NPMX_DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/';

// Set the environment variable `LEGACY_TOKEN` when user use the legacy auth, so it can be resolved by npm CLI
export function getLegacyToken({ NPM_EMAIL, NPM_PASSWORD, NPM_USERNAME } = {}) {
  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    return {
      LEGACY_TOKEN: Buffer.from(`${NPM_USERNAME}:${NPM_PASSWORD}`, 'utf8').toString('base64'),
    };
  }

  return {};
}

export async function setAuth(
  npmrc,
  registry,
  { cwd = '.', env: { NPM_TOKEN, NPM_EMAIL, NPM_CONFIG_USERCONFIG, LEGACY_TOKEN } = {}, logger },
) {
  logger.log('Verify authentication for registry %s', registry);

  const { configs, ...rcConfig } = rc(
    'npm',
    { registry: NPMX_DEFAULT_NPM_REGISTRY },
    { config: NPM_CONFIG_USERCONFIG || path.resolve(cwd, '.npmrc') },
  );
  let currentConfig = '';

  if (configs.length > 0) {
    logger.log('Reading npm config from %s', configs.join(', '));

    currentConfig = await Promise.all(configs.map(c => readFile(c)));
    currentConfig = `${currentConfig.join('\n')}\n`;
  }

  if (getAuthToken(registry, { npmrc: rcConfig, recursive: true })) {
    await outputFile(npmrc, currentConfig.trim());
  } else if (LEGACY_TOKEN && NPM_EMAIL) {
    await outputFile(npmrc, `${currentConfig}_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`);

    logger.log(`Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${npmrc}`);
  } else if (NPM_TOKEN) {
    await outputFile(npmrc, `${currentConfig}${nerfDart(registry)}:_authToken = \${NPM_TOKEN}`);

    logger.log(`Wrote NPM_TOKEN to ${npmrc}`);
  } else {
    throw getError('ENONPMTOKEN', { registry });
  }
}

export function getReleasesInfo(
  { name },
  { env: { DEFAULT_NPM_REGISTRY = NPMX_DEFAULT_NPM_REGISTRY } = {}, nextRelease: { version } },
  distTag,
  registry,
) {
  return {
    name: `npm package (@${distTag} dist-tag)`,
    url:
      normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)
        ? `https://www.npmjs.com/package/${name}/v/${version}`
        : undefined,
    channel: distTag,
  };
}

export function getRegistry(
  { publishConfig: { registry } = {}, name },
  { cwd = '.', env = {} } = {},
) {
  return (
    registry ||
    env.NPM_CONFIG_REGISTRY ||
    getRegistryUrl(
      name.split('/')[0],
      rc('npm', { registry: NPMX_DEFAULT_NPM_REGISTRY }, { config: path.resolve(cwd, '.npmrc') }),
    )
  );
}

export async function verifyNpmAuth(npmrc, context, pkg) {
  const {
    cwd,
    stdout,
    stderr,
    env = { DEFAULT_NPM_REGISTRY: NPMX_DEFAULT_NPM_REGISTRY, ...context.env },
  } = context;
  const registry = getRegistry(pkg, context);

  await setAuth(npmrc, registry, context);

  if (
    env.DEFAULT_NPM_REGISTRY &&
    normalizeUrl(registry) === normalizeUrl(env.DEFAULT_NPM_REGISTRY)
  ) {
    try {
      const whoamiResult = execa('npm', ['whoami', '--userconfig', npmrc, '--registry', registry], {
        cwd,
        env,
      });

      whoamiResult.stdout.pipe(stdout, { end: false });
      whoamiResult.stderr.pipe(stderr, { end: false });

      await whoamiResult;
    } catch (e) {
      throw getError('EINVALIDNPMTOKEN', { registry });
    }
  }
}

export function summarizeReleasesInfo(releasesInfo) {
  const validReleases = releasesInfo.filter(i => i !== false);
  const urls = validReleases.filter(i => i.url !== undefined).map(i => i.url);

  if (validReleases.length === 0) return false;

  return {
    name: validReleases[0].name,
    urls,
    channel: validReleases[0].channel,
  };
}
