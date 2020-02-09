import { isString, isNil, isBoolean } from 'lodash';
import { getError } from './error';

function validate({ npmPublish, tarballDir, pkgRoot }) {
  const isNonEmptyString = value => isString(value) && value.trim();
  const VALIDATORS = {
    npmPublish: isBoolean,
    tarballDir: isNonEmptyString,
    pkgRoot: isNonEmptyString
  };

  const errors = Object.entries({ npmPublish, tarballDir, pkgRoot }).reduce(
    (errors, [option, value]) =>
      !isNil(value) && !VALIDATORS[option](value)
        ? [...errors, getError(`EINVALID${option.toUpperCase()}`, { [option]: value })]
        : errors,
    []
  );

  if (errors.length > 0) throw new AggregateError(errors);
}

/**
 * Handle configuration
 *
 * If the npm publish plugin is used and has `npmPublish`, `tarballDir` or `pkgRoot` configured,
 * validate them now in order to prevent any release if the configuration is wrong
 *
 * Default - non repo
 * ["@semantic-release/npm", {
 *    "npmPublish": false,
 *    "tarballDir": "dist",
 *  }],
 *
 * MonoRepo
 *
 * Applies to all subpackages
 * ["@semantic-release/npm", {
 *   "npmPublish": false,
 *   "tarballDir": "dist",
 * }],
 *
 * Can also support custom perpackage
 * ["@semantic-release/npm", {
 *   "default": {
 *     "npmPublish": false,
 *     "tarballDir": "dist",
 *   }
 *   "package1": {
 *     "npmPublish": false,
 *     "tarballDir": "dist",
 *   }
 * }],
 *
 * OR [Not implemented yet]
 * Check for custom config in subrepo, should be in releaserc. For example, a subpackage with this  info wouldnt publish
 * ["@semantic-release/npm", {
 *  "npmPublish": false,
 *  "tarballDir": "dist",
 * }],
 */
export async function verifyPluginConfig(pluginConfig) {
  if (pluginConfig.default) {
    Object.values(pluginConfig).forEach(c => validate(c));
  } else {
    validate(pluginConfig);
  }

  return true;
}
