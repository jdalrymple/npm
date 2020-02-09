// const path = require("path");
// const test = require("ava");
// const { outputJson, readJson, pathExists } = require("fs-extra");
// const execa = require("execa");
// const { spy } = require("sinon");
// const tempy = require("tempy");
// const clearModule = require("clear-module");
// const { WritableStreamBuffer } = require("stream-buffers");
// const npmRegistry = require("./helpers/npm-registry");

// /* eslint camelcase: ["error", {properties: "never"}] */

// // Environment variables used only for the local npm command used to do verification
// const testEnv = {
//   ...process.env,
//   ...npmRegistry.authEnv,
//   npm_config_registry: npmRegistry.url,
//   LEGACY_TOKEN: Buffer.from(
//     `${npmRegistry.authEnv.NPM_USERNAME}:${npmRegistry.authEnv.NPM_PASSWORD}`,
//     "utf8"
//   ).toString("base64")
// };

// test.before(async () => {
//   // Start the local NPM registry
//   await npmRegistry.start();
// });

// test.after.always(async () => {
//   // Stop the local NPM registry
//   await npmRegistry.stop();
// });

// test.beforeEach(t => {
//   // Clear npm cache to refresh the module state
//   clearModule("..");
//   t.context.m = require("..");
//   // Stub the logger
//   t.context.log = spy();
//   t.context.stdout = new WritableStreamBuffer();
//   t.context.stderr = new WritableStreamBuffer();
//   t.context.logger = { log: t.context.log };
// });

// test('Skip npm auth verification if "npmPublish" is false', async t => {
//   const cwd = tempy.directory();
//   const env = { NPM_TOKEN: "wrong_token" };
//   const pkg = {
//     name: "published",
//     version: "1.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       { npmPublish: false },
//       {
//         cwd,
//         env,
//         options: {},
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test('Skip npm auth verification if "package.private" is true', async t => {
//   const cwd = tempy.directory();
//   const pkg = {
//     name: "published",
//     version: "1.0.0",
//     publishConfig: { registry: npmRegistry.url },
//     private: true
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       { npmPublish: false },
//       {
//         cwd,
//         env: {},
//         options: { publish: ["@semantic-release/npm"] },
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test('Skip npm token verification if "package.private" is true', async t => {
//   const cwd = tempy.directory();
//   const pkg = {
//     name: "published",
//     version: "1.0.0",
//     publishConfig: { registry: npmRegistry.url },
//     private: true
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       {},
//       {
//         cwd,
//         env: {},
//         options: { publish: ["@semantic-release/npm"] },
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test("Throws error if NPM token is invalid", async t => {
//   const cwd = tempy.directory();
//   const env = {
//     NPM_TOKEN: "wrong_token",
//     DEFAULT_NPM_REGISTRY: npmRegistry.url
//   };
//   const pkg = {
//     name: "published",
//     version: "1.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const [error] = await t.throwsAsync(
//     t.context.m.verifyConditions(
//       {},
//       {
//         cwd,
//         env,
//         options: {},
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.code, "EINVALIDNPMTOKEN");
//   t.is(error.message, "Invalid npm token.");
// });

// test("Skip Token validation if the registry configured is not the default one", async t => {
//   const cwd = tempy.directory();
//   const env = { NPM_TOKEN: "wrong_token" };
//   const pkg = {
//     name: "published",
//     version: "1.0.0",
//     publishConfig: { registry: "http://custom-registry.com/" }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       {},
//       {
//         cwd,
//         env,
//         options: {},
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test("Verify npm auth and package", async t => {
//   const cwd = tempy.directory();
//   const pkg = {
//     name: "valid-token",
//     version: "0.0.0-dev",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       {},
//       {
//         cwd,
//         env: npmRegistry.authEnv,
//         options: {},
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test("Verify npm auth and package from a sub-directory", async t => {
//   const cwd = tempy.directory();
//   const pkg = {
//     name: "valid-token",
//     version: "0.0.0-dev",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "dist/package.json"), pkg);
//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       { pkgRoot: "dist" },
//       {
//         cwd,
//         env: npmRegistry.authEnv,
//         options: {},
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test('Verify npm auth and package with "npm_config_registry" env var set by yarn', async t => {
//   const cwd = tempy.directory();
//   const pkg = {
//     name: "valid-token",
//     version: "0.0.0-dev",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       {},
//       {
//         cwd,
//         env: {
//           ...npmRegistry.authEnv,
//           npm_config_registry: "https://registry.yarnpkg.com"
//         },
//         options: { publish: [] },
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
// });

// test("Throw SemanticReleaseError Array if config option are not valid in verifyConditions", async t => {
//   const cwd = tempy.directory();
//   const pkg = { publishConfig: { registry: npmRegistry.url } };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   const npmPublish = 42;
//   const tarballDir = 42;
//   const pkgRoot = 42;
//   const errors = [
//     ...(await t.throwsAsync(
//       t.context.m.verifyConditions(
//         {},
//         {
//           cwd,
//           env: {},
//           options: {
//             publish: [
//               "@semantic-release/github",
//               { path: "@semantic-release/npm", npmPublish, tarballDir, pkgRoot }
//             ]
//           },
//           stdout: t.context.stdout,
//           stderr: t.context.stderr,
//           logger: t.context.logger
//         }
//       )
//     ))
//   ];

//   t.is(errors[0].name, "SemanticReleaseError");
//   t.is(errors[0].code, "EINVALIDNPMPUBLISH");
//   t.is(errors[1].name, "SemanticReleaseError");
//   t.is(errors[1].code, "EINVALIDTARBALLDIR");
//   t.is(errors[2].name, "SemanticReleaseError");
//   t.is(errors[2].code, "EINVALIDPKGROOT");
//   t.is(errors[3].name, "SemanticReleaseError");
//   t.is(errors[3].code, "ENOPKG");
// });

// test("Verify token and set up auth only on the fist call, then prepare on prepare call only", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "test-module",
//     version: "0.0.0-dev",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   await t.notThrowsAsync(
//     t.context.m.verifyConditions(
//       {},
//       {
//         cwd,
//         env,
//         options: {},
//         stdout: t.context.stdout,
//         stderr: t.context.stderr,
//         logger: t.context.logger
//       }
//     )
//   );
//   await t.context.m.prepare(
//     {},
//     {
//       cwd,
//       env,
//       options: {},
//       stdout: t.context.stdout,
//       stderr: t.context.stderr,
//       logger: t.context.logger,
//       nextRelease: { version: "1.0.0" }
//     }
//   );

//   let result = await t.context.m.publish(
//     {},
//     {
//       cwd,
//       env,
//       options: {},
//       stdout: t.context.stdout,
//       stderr: t.context.stderr,
//       logger: t.context.logger,
//       nextRelease: { channel: "next", version: "1.0.0" }
//     }
//   );
//   t.deepEqual(result, {
//     name: "npm package (@next dist-tag)",
//     url: undefined,
//     channel: "next"
//   });
//   t.is(
//     (await execa("npm", ["view", pkg.name, "dist-tags.next"], { cwd, env }))
//       .stdout,
//     "1.0.0"
//   );

//   result = await t.context.m.addChannel(
//     {},
//     {
//       cwd,
//       env,
//       options: {},
//       stdout: t.context.stdout,
//       stderr: t.context.stderr,
//       logger: t.context.logger,
//       nextRelease: { version: "1.0.0" }
//     }
//   );

//   t.deepEqual(result, {
//     name: "npm package (@latest dist-tag)",
//     url: undefined,
//     channel: "latest"
//   });
//   t.is(
//     (await execa("npm", ["view", pkg.name, "dist-tags.latest"], { cwd, env }))
//       .stdout,
//     "1.0.0"
//   );
// });
