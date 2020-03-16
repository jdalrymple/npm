import { file as createFile } from 'tempy';
import { addChannelNpm } from './channel-utils';
import { prepareNpm } from './prepare-utils';
import { publishNpm } from './publish-utils';
import { verifyNpm } from './verify-utils';
import { getAllPkgInfo } from './package-config';
import { summarizeReleasesInfo } from './npm-utils';

const npmrc = createFile({ name: '.npmrc' });

export const status = {
  verified: false,
  prepared: false,
};

/**
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or
 * `pkgRoot` configured, validate them now in order to prevent any release
 * if the configuration is wrong
 */
export async function verifyConditions(pluginConfig = {}, context = {}) {
  await verifyNpm(npmrc, context, pluginConfig);

  status.verified = true;
}

export async function prepare(pluginConfig = {}, context = {}) {
  if (!status.verified) await verifyConditions(context, pluginConfig);

  const { rootPkg, subPkgs } = await getAllPkgInfo(context, pluginConfig);

  // TODO: Adjust this to handle independant versioning
  await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const config = pluginConfig[p.name] || pluginConfig.default || pluginConfig;

      return prepareNpm(npmrc, { ...context, cwd: p.path }, config, p.private || false);
    }),
  );

  status.prepared = true;
}

export async function publish(pluginConfig, context) {
  if (!status.prepared) await prepare(context, pluginConfig);

  const { rootPkg, subPkgs } = await getAllPkgInfo(context, pluginConfig);

  const releaseInfo = await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const config = pluginConfig[p.name] || pluginConfig.default || pluginConfig;

      return publishNpm(npmrc, { ...context, cwd: p.path }, config, p);
    }),
  );

  return summarizeReleasesInfo(releaseInfo);
}

export async function addChannel(pluginConfig = {}, context = {}) {
  if (!status.verified) await verifyConditions(context, pluginConfig);

  const { rootPkg, subPkgs } = await getAllPkgInfo(context, pluginConfig);

  const releaseInfo = await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const config = pluginConfig[p.name] || pluginConfig.default || pluginConfig;

      return addChannelNpm(npmrc, { ...context, cwd: p.path }, config, p);
    }),
  );

  return summarizeReleasesInfo(releaseInfo);
}
