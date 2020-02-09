// import path from 'path';
import { remove } from 'fs-extra';
import { directory as createDir } from 'tempy';
import { getRegistry } from '../../src/npm-utils';

describe('npmUtils.getRegistry', () => {
  let tempDir;

  beforeEach(() => {
    tempDir = createDir();
  });

  afterEach(async () => {
    await remove(tempDir);
  });

  it('should get the default registry without publish configuration', async () => {
    const reg = await getRegistry({ name: 'package-name' }, { cwd: tempDir, env: {} });

    expect(reg).toEqual('https://registry.npmjs.org/');
  });

  it('should get the default registry with publish configuration', async () => {
    const reg = await getRegistry(
      { name: 'package-name', publishConfig: {} },
      { cwd: tempDir, env: {} },
    );

    expect(reg).toEqual('https://registry.npmjs.org/');
  });
});

// test('Get the registry configured in ".npmrc" and normalize trailing slash', async t => {
//   const cwd = tempy.directory();
//   await appendFile(
//     path.resolve(cwd, ".npmrc"),
//     "registry = https://custom1.registry.com"
//   );

//   t.is(
//     getRegistry({ name: "package-name" }, { cwd, env: {} }),
//     "https://custom1.registry.com/"
//   );
// });

// test('Get the registry configured from "publishConfig"', async t => {
//   const cwd = tempy.directory();
//   await appendFile(
//     path.resolve(cwd, ".npmrc"),
//     "registry = https://custom2.registry.com"
//   );

//   t.is(
//     getRegistry(
//       {
//         name: "package-name",
//         publishConfig: { registry: "https://custom3.registry.com/" }
//       },
//       { cwd, env: {} }
//     ),
//     "https://custom3.registry.com/"
//   );
// });

// test('Get the registry configured in "NPM_CONFIG_REGISTRY"', t => {
//   const cwd = tempy.directory();

//   t.is(
//     getRegistry(
//       { name: "package-name" },
//       { cwd, env: { NPM_CONFIG_REGISTRY: "https://custom1.registry.com/" } }
//     ),
//     "https://custom1.registry.com/"
//   );
// });

// test('Get the registry configured in ".npmrc" for scoped package', async t => {
//   const cwd = tempy.directory();
//   await appendFile(
//     path.resolve(cwd, ".npmrc"),
//     "@scope:registry = https://custom3.registry.com"
//   );

//   t.is(
//     getRegistry({ name: "@scope/package-name" }, { cwd, env: {} }),
//     "https://custom3.registry.com/"
//   );
// });

// const path = require("path");
// const test = require("ava");
// const { readFile, appendFile } = require("fs-extra");
// const { stub } = require("sinon");
// const tempy = require("tempy");
// const clearModule = require("clear-module");

// const { HOME } = process.env;
// const cwd = process.cwd();

// test.beforeEach(t => {
//   // Stub the logger
//   t.context.log = stub();
//   t.context.logger = { log: t.context.log };

//   clearModule("rc");
//   clearModule("../lib/set-npmrc-auth");
// });

// test.afterEach.always(() => {
//   process.env.HOME = HOME;
//   process.chdir(cwd);
// });

// test.serial('Set auth with "NPM_TOKEN"', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });
//   const env = { NPM_TOKEN: "npm_token" };

//   await require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//     cwd,
//     env,
//     logger: t.context.logger
//   });

//   t.regex(
//     (await readFile(npmrc)).toString(),
//     /\/\/custom.registry.com\/:_authToken = \$\{NPM_TOKEN\}/
//   );
//   t.deepEqual(t.context.log.args[1], [`Wrote NPM_TOKEN to ${npmrc}`]);
// });

// test.serial(
//   'Set auth with "NPM_USERNAME", "NPM_PASSWORD" and "NPM_EMAIL"',
//   async t => {
//     process.env.HOME = tempy.directory();
//     const cwd = tempy.directory();
//     process.chdir(cwd);
//     const npmrc = tempy.file({ name: ".npmrc" });
//     const env = {
//       NPM_USERNAME: "npm_username",
//       NPM_PASSWORD: "npm_pasword",
//       NPM_EMAIL: "npm_email"
//     };

//     await require("../lib/set-npmrc-auth")(
//       npmrc,
//       "http://custom.registry.com",
//       { cwd, env, logger: t.context.logger }
//     );

//     t.is(
//       (await readFile(npmrc)).toString(),
//       `_auth = \${LEGACY_TOKEN}\nemail = \${NPM_EMAIL}`
//     );
//     t.deepEqual(t.context.log.args[1], [
//       `Wrote NPM_USERNAME, NPM_PASSWORD and NPM_EMAIL to ${npmrc}`
//     ]);
//   }
// );

// test.serial('Preserve home ".npmrc"', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });
//   const env = { NPM_TOKEN: "npm_token" };

//   await appendFile(
//     path.resolve(process.env.HOME, ".npmrc"),
//     "home_config = test"
//   );

//   await require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//     cwd,
//     env,
//     logger: t.context.logger
//   });

//   t.is(
//     (await readFile(npmrc)).toString(),
//     `home_config = test\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//   );
//   t.deepEqual(t.context.log.args[1], [
//     "Reading npm config from %s",
//     [path.resolve(process.env.HOME, ".npmrc")].join(", ")
//   ]);
//   t.deepEqual(t.context.log.args[2], [`Wrote NPM_TOKEN to ${npmrc}`]);
// });

// test.serial('Preserve home and local ".npmrc"', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });
//   const env = { NPM_TOKEN: "npm_token" };

//   await appendFile(path.resolve(cwd, ".npmrc"), "cwd_config = test");
//   await appendFile(
//     path.resolve(process.env.HOME, ".npmrc"),
//     "home_config = test"
//   );

//   await require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//     cwd,
//     env,
//     logger: t.context.logger
//   });

//   t.is(
//     (await readFile(npmrc)).toString(),
//     `home_config = test\ncwd_config = test\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//   );
//   t.deepEqual(t.context.log.args[1], [
//     "Reading npm config from %s",
//     [
//       path.resolve(process.env.HOME, ".npmrc"),
//       path.resolve(cwd, ".npmrc")
//     ].join(", ")
//   ]);
//   t.deepEqual(t.context.log.args[2], [`Wrote NPM_TOKEN to ${npmrc}`]);
// });

// test.serial('Preserve all ".npmrc" if auth is already configured', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });

//   await appendFile(
//     path.resolve(cwd, ".npmrc"),
//     `//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//   );
//   await appendFile(
//     path.resolve(process.env.HOME, ".npmrc"),
//     "home_config = test"
//   );

//   await require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//     cwd,
//     env: {},
//     logger: t.context.logger
//   });

//   t.is(
//     (await readFile(npmrc)).toString(),
//     `home_config = test\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//   );
//   t.deepEqual(t.context.log.args[1], [
//     "Reading npm config from %s",
//     [
//       path.resolve(process.env.HOME, ".npmrc"),
//       path.resolve(cwd, ".npmrc")
//     ].join(", ")
//   ]);
// });

// test.serial(
//   'Preserve ".npmrc" if auth is already configured for a scoped package',
//   async t => {
//     process.env.HOME = tempy.directory();
//     const cwd = tempy.directory();
//     process.chdir(cwd);
//     const npmrc = tempy.file({ name: ".npmrc" });

//     await appendFile(
//       path.resolve(cwd, ".npmrc"),
//       `@scope:registry=http://custom.registry.com\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//     );
//     await appendFile(
//       path.resolve(process.env.HOME, ".npmrc"),
//       "home_config = test"
//     );

//     await require("../lib/set-npmrc-auth")(
//       npmrc,
//       "http://custom.registry.com",
//       { cwd, env: {}, logger: t.context.logger }
//     );

//     t.is(
//       (await readFile(npmrc)).toString(),
//       `home_config = test\n@scope:registry=http://custom.registry.com\n//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//     );
//     t.deepEqual(t.context.log.args[1], [
//       "Reading npm config from %s",
//       [
//         path.resolve(process.env.HOME, ".npmrc"),
//         path.resolve(cwd, ".npmrc")
//       ].join(", ")
//     ]);
//   }
// );

// test.serial('Throw error if "NPM_TOKEN" is missing', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });

//   const [error] = await t.throwsAsync(
//     require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//       cwd,
//       env: {},
//       logger: t.context.logger
//     })
//   );

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.message, "No npm token specified.");
//   t.is(error.code, "ENONPMTOKEN");
// });

// test.serial(
//   'Emulate npm config resolution if "NPM_CONFIG_USERCONFIG" is set',
//   async t => {
//     process.env.HOME = tempy.directory();
//     const cwd = tempy.directory();
//     process.chdir(cwd);
//     const npmrc = tempy.file({ name: ".npmrc" });

//     await appendFile(
//       path.resolve(cwd, ".custom-npmrc"),
//       `//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//     );

//     await require("../lib/set-npmrc-auth")(
//       npmrc,
//       "http://custom.registry.com",
//       {
//         cwd,
//         env: { NPM_CONFIG_USERCONFIG: path.resolve(cwd, ".custom-npmrc") },
//         logger: t.context.logger
//       }
//     );

//     t.is(
//       (await readFile(npmrc)).toString(),
//       `//custom.registry.com/:_authToken = \${NPM_TOKEN}`
//     );
//     t.deepEqual(t.context.log.args[1], [
//       "Reading npm config from %s",
//       [path.resolve(cwd, ".custom-npmrc")].join(", ")
//     ]);
//   }
// );

// test.serial('Throw error if "NPM_USERNAME" is missing', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });
//   const env = { NPM_PASSWORD: "npm_pasword", NPM_EMAIL: "npm_email" };

//   const [error] = await t.throwsAsync(
//     require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//       cwd,
//       env,
//       logger: t.context.logger
//     })
//   );

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.message, "No npm token specified.");
//   t.is(error.code, "ENONPMTOKEN");
// });

// test.serial('Throw error if "NPM_PASSWORD" is missing', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });
//   const env = { NPM_USERNAME: "npm_username", NPM_EMAIL: "npm_email" };

//   const [error] = await t.throwsAsync(
//     require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//       cwd,
//       env,
//       logger: t.context.logger
//     })
//   );

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.message, "No npm token specified.");
//   t.is(error.code, "ENONPMTOKEN");
// });

// test.serial('Throw error if "NPM_EMAIL" is missing', async t => {
//   process.env.HOME = tempy.directory();
//   const cwd = tempy.directory();
//   process.chdir(cwd);
//   const npmrc = tempy.file({ name: ".npmrc" });
//   const env = { NPM_USERNAME: "npm_username", NPM_PASSWORD: "npm_password" };

//   const [error] = await t.throwsAsync(
//     require("../lib/set-npmrc-auth")(npmrc, "http://custom.registry.com", {
//       cwd,
//       env,
//       logger: t.context.logger
//     })
//   );

//   t.is(error.name, "SemanticReleaseError");
//   t.is(error.message, "No npm token specified.");
//   t.is(error.code, "ENONPMTOKEN");
// });
