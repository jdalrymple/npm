import { file as createFile } from 'tempy';
import { addChannelNpm } from './channel-utils';
import { prepareNpm } from './prepare-utils';
import { publishNpm } from './publish-utils';
import { verifyNpm } from './verify-utils';
import { getAllPkgInfo, getDependancyMap } from './package-config';
import { summarizeReleasesInfo, getLegacyToken } from './npm-utils';

const npmrc = createFile({ name: '.npmrc' });

export const status = {
  verified: false,
  prepared: false,
};

function modifyContext(context) {
  const legacyToken = getLegacyToken(context.env);
  const env = {
    ...legacyToken,
    ...context.env,
  };

  return { ...context, env };
}

/**
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or
 * `pkgRoot` configured, validate them now in order to prevent any release
 * if the configuration is wrong
 */
export async function verifyConditions(pluginConfig = {}, context = {}) {
  const ctx = modifyContext(context);

  await verifyNpm(npmrc, ctx, pluginConfig);

  status.verified = true;
}

export async function prepare(pluginConfig = {}, context = {}) {
  const ctx = modifyContext(context);

  if (!status.verified) await verifyConditions(pluginConfig, ctx);

  const { rootPkg, subPkgs } = await getAllPkgInfo(ctx, pluginConfig);

  // TODO: Adjust this to handle independant versioning
  // TODO: May have to explicitly default the config properties if any of the properties clash in the future
  await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const { pkgRoot, ...config } = pluginConfig[p.name] || pluginConfig.default || pluginConfig;
      const depMap = getDependancyMap(ctx.version, p, subPkgs);

      // TODO: Refactor to not pullout custom pkgRoot ie. Loop based on dep graph updating as it goes along
      return prepareNpm(npmrc, ctx, { pkgRoot: p.path, ...config }, p, depMap);
    }),
  );

  status.prepared = true;
}

export async function publish(pluginConfig, context) {
  const ctx = modifyContext(context);

  if (!status.prepared) await prepare(pluginConfig, ctx);

  const { rootPkg, subPkgs } = await getAllPkgInfo(ctx, pluginConfig);

  const releaseInfo = await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const { pkgRoot, ...config } = pluginConfig[p.name] || pluginConfig.default || pluginConfig;

      return publishNpm(npmrc, ctx, { pkgRoot: p.path, ...config }, p);
    }),
  );

  return summarizeReleasesInfo(releaseInfo);
}

export async function addChannel(pluginConfig = {}, context = {}) {
  const ctx = modifyContext(context);

  if (!status.verified) await verifyConditions(pluginConfig, ctx);

  const { rootPkg, subPkgs } = await getAllPkgInfo(ctx, pluginConfig);

  const releaseInfo = await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const { pkgRoot, ...config } = pluginConfig[p.name] || pluginConfig.default || pluginConfig;

      return addChannelNpm(npmrc, ctx, { pkgRoot: p.path, ...config }, p);
    }),
  );

  return summarizeReleasesInfo(releaseInfo);
}
