<h1 align="center" style="border-bottom: none;">📦🚀 + <img alt="npm" src=".github/ASSETS/npm_icon.svg"/><br/>semantic-release-npmx</h1>
<h3 align="center">Semantic release plugin for npm publishing that supports monorepos!</h3>
<p align="center">
  <a href="https://travis-ci.com/jdalrymple/semantic-release-npmx">
    <img src="https://travis-ci.com/jdalrymple/semantic-release-npmx.svg?branch=master" alt="Travis Pipeline Status">
  </a>
  <a href="https://codeclimate.com/github/jdalrymple/semantic-release-npmx">
    <img src="https://codeclimate.com/github/jdalrymple/semantic-release-npmx/badges/gpa.svg" alt="Code Climate maintainability">
  </a>
  <a href="https://codecov.io/gh/jdalrymple/semantic-release-npmx">
    <img src="https://img.shields.io/codecov/c/github/jdalrymple/semantic-release-npmx/master.svg" alt="CodeCov test coverage">
  </a>
  <a href="https://david-dm.org/jdalrymple/semantic-release-npmx">
    <img src="https://david-dm.org/jdalrymple/semantic-release-npmx/status.svg" alt="Dependency Status" />
  </a>
  <a href="https://david-dm.org/jdalrymple/semantic-release-npmx?type=dev">
    <img src="https://david-dm.org/jdalrymple/semantic-release-npmx/dev-status.svg.svg" alt="Dev Dependency Status" />
  </a>
  <img src="https://flat.badgen.net/dependabot/jdalrymple/semantic-release-npmx?icon=dependabot" alt="Dependabot Badge" />
<!--   <a href="https://github.com/semantic-release/semantic-release">
    <img src="https://img.shields.io/badge/%20%20%F0%9F%93%A6%F0%9F%9A%80-semantic--release-e10079.svg" alt="Semantic Release">
  </a> -->
  <a href="http://commitizen.github.io/cz-cli/">
    <img src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" alt="Commitizen">
  </a>
  <img src="https://img.shields.io/badge/code%20style-prettier-ff69b4.svg" alt="Prettier">
  <a href="https://packagephobia.now.sh/result?p=semantic-release-npmx">
    <img src="https://packagephobia.now.sh/badge?p=semantic-release-npmx" alt="Install Size">
  </a>
  <a href="LICENSE.md">
    <img src="https://img.shields.io/badge/License-MIT-yellow.svg" alt="Licence: MIT">
  </a>
</p>

**[IN DEVELOPMENT]** [**semantic-release**](https://github.com/semantic-release/semantic-release) plugin to publish a [npm](https://www.npmjs.com) package based off of the work done [here](https://github.com/semantic-release/npm). Supports monorepos (lerna, and yarn) **but** is restricted to fixed versioning for now.


| Step               | Description                                                                                                                                   |                                                                     |
|--------------------|-----------------------------------------------------------------------------------------------------------------------------------------------|---------------------------------------------------------------------|
| `verifyConditions` | Verify the presence of the `NPM_TOKEN` environment variable, create or update the `.npmrc` file with the token and verify the token is valid. |                                                                     |
| `prepare`          | Update the `package.json` version and [create](https://docs.npmjs.com/cli/pack) the npm package tarball.                                      |                                                                     |
| `addChannel`       |                                                                                                                                               | [Add a release to a dist-tag](https://docs.npmjs.com/cli/dist-tag). |
| `publish`          | [Publish the npm package](https://docs.npmjs.com/cli/publish) to the registry.                                                                |                                                                     |

## Install

```bash
$ npm install semantic-release-npmx -D
```

## Usage

The plugin can be configured in the [**semantic-release** configuration file](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration):

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "semantic-release-npmx",
  ]
}
```

## Configuration

### Npm registry authentication

The npm authentication configuration is **required** and can be set via [environment variables](#environment-variables).

Both the [token](https://docs.npmjs.com/getting-started/working_with_tokens) and the legacy (`username`, `password` and `email`) authentication are supported. It is recommended to use the [token](https://docs.npmjs.com/getting-started/working_with_tokens) authentication. The legacy authentication is supported as the alternative npm registries [Artifactory](https://www.jfrog.com/open-source/#os-arti) and [npm-registry-couchapp](https://github.com/npm/npm-registry-couchapp) only supports that form of authentication.

**Note**: Only the `auth-only` [level of npm two-factor authentication](https://docs.npmjs.com/getting-started/using-two-factor-authentication#levels-of-authentication) is supported, **semantic-release** will not work with the default `auth-and-writes` level.

### Environment variables

| Variable       | Description                                                                                                                   |
| -------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `NPM_TOKEN`    | Npm token created via [npm token create](https://docs.npmjs.com/getting-started/working_with_tokens#how-to-create-new-tokens) |
| `NPM_USERNAME` | Npm username created via [npm adduser](https://docs.npmjs.com/cli/adduser) or on [npmjs.com](https://www.npmjs.com)           |
| `NPM_PASSWORD` | Password of the npm user.                                                                                                     |
| `NPM_EMAIL`    | Email address associated with the npm user                                                                                    |

Use either `NPM_TOKEN` for token authentication or `NPM_USERNAME`, `NPM_PASSWORD` and `NPM_EMAIL` for legacy authentication

### Options

| Options      | Description                                                                                                         | Default                                                                                                                          |
|--------------|---------------------------------------------------------------------------------------------------------------------|----------------------------------------------------------------------------------------------------------------------------------|
| `npmPublish` | Whether to publish the `npm` package to the registry. If `false` the `package.json` version will still be updated.  | `false` if the `package.json` [private](https://docs.npmjs.com/files/package.json#private) property is `true`, `true` otherwise. |
| `pkgRoot`    | Directory path to publish.                                                                                          | `.`                                                                                                                              |
| `tarballDir` | Directory path in which to write the the package tarball. If `false` the tarball is not be kept on the file system. This is relative to the cwd of where semantic-release is called from, even for sub-packages | `false`                                                                                                                          |
| `access` | The default publish [access](https://docs.npmjs.com/cli/publish) for the package. This only applies to scoped packages | `restricted`                                                                                                                          |

**Note**: The `pkgRoot` directory must contains a `package.json`. The version will be updated only in the `package.json` and `npm-shrinkwrap.json` within the `pkgRoot` directory.

**Note**: If you use a [shareable configuration](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/shareable-configurations.md#shareable-configurations) that defines one of these options you can set it to `false` in your [**semantic-release** configuration](https://github.com/semantic-release/semantic-release/blob/master/docs/usage/configuration.md#configuration) in order to use the default value.

### Npm configuration

The plugin uses the [`npm` CLI](https://github.com/npm/cli) which will read the configuration from [`.npmrc`](https://docs.npmjs.com/files/npmrc). See [`npm config`](https://docs.npmjs.com/misc/config) for the option list.

The [`registry`](https://docs.npmjs.com/misc/registry) can be configured via the npm environment variable `NPM_CONFIG_REGISTRY` and will take precedence over the configuration in `.npmrc`.

The [`registry`](https://docs.npmjs.com/misc/registry) and [`dist-tag`](https://docs.npmjs.com/cli/dist-tag) can be configured in the `package.json` and will take precedence over the configuration in `.npmrc` and `NPM_CONFIG_REGISTRY`:
```json
{
  "publishConfig": {
    "registry": "https://registry.npmjs.org/",
    "tag": "latest"
  }
}
```

### Examples

The `npmPublish` and `tarballDir` option can be used to skip the publishing to the `npm` registry and instead, release the package tarball with another plugin. For example with the [@semantic-release/github](https://github.com/semantic-release/github) plugin:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["semantic-release-npmx", {
      "npmPublish": false,
      "tarballDir": "dist",
    }],
    ["@semantic-release/github", {
      "assets": "dist/*.tgz"
    }]
  ]
}
```

When publishing from a sub-directory with the `pkgRoot` option, the `package.json` and `npm-shrinkwrap.json` updated with the new version can be moved to another directory with a `postpublish` [npm script](https://docs.npmjs.com/misc/scripts). For example with the [@semantic-release/git](https://github.com/semantic-release/git) plugin:

```json
{
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    ["semantic-release-npmx", {
      "pkgRoot": "dist",
    }],
    ["@semantic-release/git", {
      "assets": ["package.json", "npm-shrinkwrap.json"]
    }]
  ]
}
```
```json
{
  "scripts": {
    "postpublish": "cp -r dist/package.json . && cp -r dist/npm-shrinkwrap.json ."
  }
}
```

#### Monorepos
Configuration is pretty much the same, but nested to include configuration for subpackages as well.
`tarballDir` will be relative to the root directory.

```json
{
  "plugins": [
    ["semantic-release-npmx", {
      "default": {
        "npmPublish": false,
        "tarballDir": "dist",
      },
      "package1": {
        "npmPublish": true,
        "tarballDir": "dist",
      }
    }],
  ]
}
```

## TODO
- [ ] Handle independant versioning. This will probably require modifications to semantic-release itself. The context object is what tracks the nextRelease/Version information and that i calculated internally by SR. Perhaps if that functinality was exported as a default plugin?
- [ ] Add tests for scoped publishing, especially for restricted access repositories