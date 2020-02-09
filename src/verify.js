import { getAllPkgInfo as verifyPkg } from './package-config';
import { verifyPluginConfig } from './config';
import { verifyNpmAuth } from './npm-utils';

// If the package is private||!npmPublish and all the children are private||!npmPublish, skip
async function requiresNpmAuth(pkgJson, pluginConfig) {
  return false;
}

/*
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or
 * `pkgRoot` configured, validate them now in order to prevent any release
 * if the configuration is wrong
 */
export async function verifyNpm(pluginConfig, context) {
  verifyPluginConfig(pluginConfig);

  // Verify JSON for root, and children.
  const { rootPkg } = verifyPkg(pluginConfig, context);

  // If any package in this group needs to be published, check npm auth
  if (requiresNpmAuth(rootPkg, pluginConfig)) {
    verifyNpmAuth(npmrc, rootPkg, context);
  }
}
