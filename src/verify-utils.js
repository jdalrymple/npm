import { getAllPkgInfo as verifyPkg } from './package-config';
import { verifyPluginConfig } from './plugin-config';
import { verifyNpmAuth } from './npm-utils';

// If the package is private||!npmPublish and all the children are private||!npmPublish, skip
export function requiresNpmAuth({ rootPkg, subPkgs }, pluginConfig = {}) {
  // Check package.json for non private packages and configuration
  return (
    !rootPkg.private ||
    subPkgs.some(s => !s.private) ||
    pluginConfig.npmPublish ||
    Object.values(pluginConfig).some(c => c.npmPublish)
  );
}

/*
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or
 * `pkgRoot` configured, validate them now in order to prevent any release
 * if the configuration is wrong
 */
export async function verifyNpm(npmrc, context, pluginConfig = {}) {
  verifyPluginConfig(pluginConfig);

  // Verify JSON for root, and children.
  const { rootPkg, subPkgs } = await verifyPkg(context, pluginConfig);

  // If any package in this group needs to be published, check npm auth
  if (requiresNpmAuth({ rootPkg, subPkgs }, pluginConfig)) {
    await verifyNpmAuth(npmrc, context, rootPkg);
  }
}
