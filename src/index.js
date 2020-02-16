import { file as createFile } from 'tempy';
import { addChannelNpm } from './channel';
import { prepareNpm } from './prepare';
import { publishNpm } from './publish';
import { verifyNpm } from './verify';
import { getAllPkgInfo } from './package-config';
import { summarizeReleasesInfo } from './npm-utils';

const npmrc = createFile({ name: '.npmrc' });
let verified;
let prepared;

/**
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or
 * `pkgRoot` configured, validate them now in order to prevent any release
 * if the configuration is wrong
 */
export async function verifyConditions(pluginConfig, context) {
  await verifyNpm(pluginConfig, context);

  verified = true;
}

export async function prepare(pluginConfig, context) {
  if (!verified) await verifyConditions(pluginConfig, context);

  const { rootPkg, subPkgs } = await getAllPkgInfo(pluginConfig, context);

  // TODO: Adjust this to handle independant versioning
  await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const config = pluginConfig.default
        ? pluginConfig[p.name] || pluginConfig.default
        : pluginConfig;

      return prepareNpm(npmrc, config, { ...context, cwd: p.path }, p.private);
    }),
  );

  prepared = true;
}

export async function publish(pluginConfig, context) {
  if (!prepared) await prepare(pluginConfig, context);

  const { rootPkg, subPkgs } = await getAllPkgInfo(pluginConfig, context);

  const releaseInfo = await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const config = pluginConfig.default
        ? pluginConfig[p.name] || pluginConfig.default
        : pluginConfig;

      return publishNpm(npmrc, config, { ...context, cwd: p.path }, p);
    }),
  );

  return summarizeReleasesInfo(releaseInfo);
}

export async function addChannel(pluginConfig, context) {
  if (!verified) await verifyConditions(pluginConfig, context);

  const { rootPkg, subPkgs } = await getAllPkgInfo(pluginConfig, context);

  const releaseInfo = await Promise.all(
    [rootPkg, ...subPkgs].map(p => {
      const config = pluginConfig.default
        ? pluginConfig[p.name] || pluginConfig.default
        : pluginConfig;

      return addChannelNpm(npmrc, config, { ...context, cwd: p.path }, p);
    }),
  );

  return summarizeReleasesInfo(releaseInfo);
}
