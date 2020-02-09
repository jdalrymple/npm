// test("Prepare the package", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "prepare",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

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

//   t.is((await readJson(path.resolve(cwd, "package.json"))).version, "1.0.0");
//   t.false(await pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`)));
// });

// test("Prepare the package from a sub-directory", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "prepare-sub-dir",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "dist/package.json"), pkg);

//   await t.context.m.prepare(
//     { pkgRoot: "dist" },
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

//   t.is(
//     (await readJson(path.resolve(cwd, "dist/package.json"))).version,
//     "1.0.0"
//   );
//   t.false(await pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`)));
// });

// test("Throw SemanticReleaseError Array if config option are not valid in prepare", async t => {
//   const cwd = tempy.directory();
//   const pkg = { publishConfig: { registry: npmRegistry.url } };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   const npmPublish = 42;
//   const tarballDir = 42;
//   const pkgRoot = 42;

//   const errors = [
//     ...(await t.throwsAsync(
//       t.context.m.prepare(
//         { npmPublish, tarballDir, pkgRoot },
//         {
//           cwd,
//           env: {},
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
