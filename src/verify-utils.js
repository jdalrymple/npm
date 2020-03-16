import { getAllPkgInfo as verifyPkg } from './package-config';
import { verifyPluginConfig } from './plugin-config';
import { verifyNpmAuth } from './npm-utils';

// If the package is private||!npmPublish and all the children are private||!npmPublish, skip
export function requiresNpmAuth({ rootPkg, subPkgs }, pluginConfig = {}) {
  // Check root package.json
  if (!rootPkg.private) return true;

  // Check chilren package.json
  for (let i = 0; i < subPkgs.length; i += 1) {
    if (!subPkgs[i].private) return true;
  }

  // Check configuration
  // TODO: Handle configuration for package without default config
  if (pluginConfig.default) {
    const config = Object.values(pluginConfig);

    for (let i = 0; i < config.length; i += 1) {
      if (config[i].npmPublish) return true;
    }
  } else {
    return pluginConfig.npmPublish;
  }

  return false;
}

/*
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or
 * `pkgRoot` configured, validate them now in order to prevent any release
 * if the configuration is wrong
 */
export async function verifyNpm(npmrc, context, pluginConfig = {}) {
  verifyPluginConfig(pluginConfig);

  // Verify JSON for root, and children.
  const { rootPkg, subPkgs } = verifyPkg(context, pluginConfig);

  // If any package in this group needs to be published, check npm auth
  if (requiresNpmAuth({ rootPkg, subPkgs }, pluginConfig)) {
    await verifyNpmAuth(npmrc, context, rootPkg);
  }
}
