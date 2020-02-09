import execa from 'execa';
import normalizeUrl from 'normalize-url';
import AggregateError from 'aggregate-error';
import path from 'path';
import rc from 'rc';
import getAuthToken from 'registry-auth-token';
import getRegistryUrl from 'registry-auth-token/registry-url';
import { outputFile, readFile } from 'fs-extra';
import nerfDart from 'nerf-dart';
import { getError } from './error';

// Set the environment variable `LEGACY_TOKEN` when user use the legacy auth, so it can be resolved by npm CLI
function setLegacyToken({ env }) {
  if (env.NPM_USERNAME && env.NPM_PASSWORD && env.NPM_EMAIL) {
    env.LEGACY_TOKEN = Buffer.from(`${env.NPM_USERNAME}:${env.NPM_PASSWORD}`, 'utf8').toString(
      'base64',
    );
  }
}

async function setAuth(
  npmrc,
  registry,
  { cwd, env: { NPM_TOKEN, NPM_CONFIG_USERCONFIG, NPM_USERNAME, NPM_PASSWORD, NPM_EMAIL }, logger },
) {
  logger.log('Verify authentication for registry %s', registry);

  const { configs, ...rcConfig } = rc(
    'npm',
    { registry: 'https://registry.npmjs.org/' },
    { config: NPM_CONFIG_USERCONFIG || path.resolve(cwd, '.npmrc') },
  );

  if (configs) logger.log('Reading npm config from %s', configs.join(', '));

  const currentConfig = configs
    ? (await Promise.all(configs.map(config => readFile(config)))).join('\n')
    : '';

  if (getAuthToken(registry, { npmrc: rcConfig })) return outputFile(npmrc, currentConfig);

  if (NPM_USERNAME && NPM_PASSWORD && NPM_EMAIL) {
    await outputFile(
      npmrc,
      `${currentConfig ? `${currentConfig}\n` : ''}_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`,
    );

    logger.log(`Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${npmrc}`);
  } else if (NPM_TOKEN) {
    await outputFile(
      npmrc,
      `${currentConfig ? `${currentConfig}\n` : ''}${nerfDart(
        registry,
      )}:_authToken = \${NPM_TOKEN}`,
    );

    logger.log(`Wrote NPM_TOKEN to ${npmrc}`);
  } else {
    throw new AggregateError([getError('ENONPMTOKEN', { registry })]);
  }
}

export function getReleasesInfo(
  { name },
  { env: { DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/' }, nextRelease: { version } },
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

export function getRegistry({ publishConfig: { registry } = {}, name }, { cwd, env }) {
  return (
    registry ||
    env.NPM_CONFIG_REGISTRY ||
    getRegistryUrl(
      name.split('/')[0],
      rc(
        'npm',
        { registry: 'https://registry.npmjs.org/' },
        { config: path.resolve(cwd, '.npmrc') },
      ),
    )
  );
}

export async function verifyNpmAuth(npmrc, pkg, context) {
  const {
    cwd,
    env: { DEFAULT_NPM_REGISTRY = 'https://registry.npmjs.org/', ...env },
    stdout,
    stderr,
  } = context;
  const registry = getRegistry(pkg, context);

  // Not sure if this is needed?
  setLegacyToken(context);

  await setAuth(npmrc, registry, context);

  if (normalizeUrl(registry) === normalizeUrl(DEFAULT_NPM_REGISTRY)) {
    try {
      const whoamiResult = execa('npm', ['whoami', '--userconfig', npmrc, '--registry', registry], {
        cwd,
        env,
      });

      whoamiResult.stdout.pipe(stdout, { end: false });
      whoamiResult.stderr.pipe(stderr, { end: false });

      await whoamiResult;
    } catch (e) {
      throw new AggregateError([getError('EINVALIDNPMTOKEN', { registry })]);
    }
  }
}

export function summarizeReleasesInfo(releasesInfo) {
  const urls = releasesInfo.filter(i => i === false).map(i => i.url);

  if (urls.length === 0) return false;

  return {
    name: releasesInfo[0].name,
    urls: urls,
    channel: releasesInfo[0].channel,
  };
}
