// test('Skip adding the package to a channel ("npmPublish" is false)', async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "skip-add-channel",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await t.context.m.addChannel(
//     { npmPublish: false },
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

//   t.false(result);
//   await t.throwsAsync(
//     execa("npm", ["view", pkg.name, "version"], { cwd, env })
//   );
// });

// test('Skip adding the package to a channel ("package.private" is true)', async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "skip-add-channel-private",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url },
//     private: true
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await t.context.m.addChannel(
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

//   t.false(result);
//   await t.throwsAsync(
//     execa("npm", ["view", pkg.name, "version"], { cwd, env })
//   );
// });

// test("Create the package in addChannel step", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "add-channel-pkg",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   await t.context.m.prepare(
//     { npmPublish: false, tarballDir: "tarball" },
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

//   t.is((await readJson(path.resolve(cwd, "package.json"))).version, "1.0.0");
//   t.true(await pathExists(path.resolve(cwd, `tarball/${pkg.name}-1.0.0.tgz`)));
// });

// test("Throw SemanticReleaseError Array if config option are not valid in addChannel", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = { publishConfig: { registry: npmRegistry.url } };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   const npmPublish = 42;
//   const tarballDir = 42;
//   const pkgRoot = 42;

//   const errors = [
//     ...(await t.throwsAsync(
//       t.context.m.addChannel(
//         { npmPublish, tarballDir, pkgRoot },
//         {
//           cwd,
//           env,
//           options: {
//             publish: ["@semantic-release/github", "@semantic-release/npm"]
//           },
//           nextRelease: { version: "1.0.0" },
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
