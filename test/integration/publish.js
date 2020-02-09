// test("Publish the package", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "publish",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await t.context.m.publish(
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
//   t.is((await readJson(path.resolve(cwd, "package.json"))).version, "1.0.0");
//   t.false(await pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`)));
//   t.is(
//     (await execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv }))
//       .stdout,
//     "1.0.0"
//   );
// });

// test("Publish the package on a dist-tag", async t => {
//   const cwd = tempy.directory();
//   const env = { ...npmRegistry.authEnv, DEFAULT_NPM_REGISTRY: npmRegistry.url };
//   const pkg = {
//     name: "publish-tag",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url, tag: "next" }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await t.context.m.publish(
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
//     url: "https://www.npmjs.com/package/publish-tag/v/1.0.0",
//     channel: "next"
//   });
//   t.is((await readJson(path.resolve(cwd, "package.json"))).version, "1.0.0");
//   t.false(await pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`)));
//   t.is(
//     (await execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv }))
//       .stdout,
//     "1.0.0"
//   );
// });

// test("Publish the package from a sub-directory", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "publish-sub-dir",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "dist/package.json"), pkg);

//   const result = await t.context.m.publish(
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

//   t.deepEqual(result, {
//     name: "npm package (@latest dist-tag)",
//     url: undefined,
//     channel: "latest"
//   });
//   t.is(
//     (await readJson(path.resolve(cwd, "dist/package.json"))).version,
//     "1.0.0"
//   );
//   t.false(await pathExists(path.resolve(cwd, `${pkg.name}-1.0.0.tgz`)));
//   t.is(
//     (await execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv }))
//       .stdout,
//     "1.0.0"
//   );
// });

// test('Create the package and skip publish ("npmPublish" is false)', async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "skip-publish",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await t.context.m.publish(
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

//   t.false(result);
//   t.is((await readJson(path.resolve(cwd, "package.json"))).version, "1.0.0");
//   t.true(await pathExists(path.resolve(cwd, `tarball/${pkg.name}-1.0.0.tgz`)));
//   await t.throwsAsync(
//     execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv })
//   );
// });

// test('Create the package and skip publish ("package.private" is true)', async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "skip-publish-private",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url },
//     private: true
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   const result = await t.context.m.publish(
//     { tarballDir: "tarball" },
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
//   t.is((await readJson(path.resolve(cwd, "package.json"))).version, "1.0.0");
//   t.true(await pathExists(path.resolve(cwd, `tarball/${pkg.name}-1.0.0.tgz`)));
//   await t.throwsAsync(
//     execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv })
//   );
// });

// test('Create the package and skip publish from a sub-directory ("npmPublish" is false)', async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "skip-publish-sub-dir",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "dist/package.json"), pkg);

//   const result = await t.context.m.publish(
//     { npmPublish: false, tarballDir: "./tarball", pkgRoot: "./dist" },
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
//   t.is(
//     (await readJson(path.resolve(cwd, "dist/package.json"))).version,
//     "1.0.0"
//   );
//   t.true(await pathExists(path.resolve(cwd, `tarball/${pkg.name}-1.0.0.tgz`)));
//   await t.throwsAsync(
//     execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv })
//   );
// });

// test('Create the package and skip publish from a sub-directory ("package.private" is true)', async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "skip-publish-sub-dir-private",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url },
//     private: true
//   };
//   await outputJson(path.resolve(cwd, "dist/package.json"), pkg);

//   const result = await t.context.m.publish(
//     { tarballDir: "./tarball", pkgRoot: "./dist" },
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
//   t.is(
//     (await readJson(path.resolve(cwd, "dist/package.json"))).version,
//     "1.0.0"
//   );
//   t.true(await pathExists(path.resolve(cwd, `tarball/${pkg.name}-1.0.0.tgz`)));
//   await t.throwsAsync(
//     execa("npm", ["view", pkg.name, "version"], { cwd, env: testEnv })
//   );
// });

// test("Throw SemanticReleaseError Array if config option are not valid in publish", async t => {
//   const cwd = tempy.directory();
//   const pkg = { publishConfig: { registry: npmRegistry.url } };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);
//   const npmPublish = 42;
//   const tarballDir = 42;
//   const pkgRoot = 42;

//   const errors = [
//     ...(await t.throwsAsync(
//       t.context.m.publish(
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

// test("Publish the package and add to default dist-tag", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "add-channel",
//     version: "0.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   await t.context.m.publish(
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

// test("Publish the package and add to lts dist-tag", async t => {
//   const cwd = tempy.directory();
//   const env = npmRegistry.authEnv;
//   const pkg = {
//     name: "add-channel-legacy",
//     version: "1.0.0",
//     publishConfig: { registry: npmRegistry.url }
//   };
//   await outputJson(path.resolve(cwd, "package.json"), pkg);

//   await t.context.m.publish(
//     {},
//     {
//       cwd,
//       env,
//       options: {},
//       stdout: t.context.stdout,
//       stderr: t.context.stderr,
//       logger: t.context.logger,
//       nextRelease: { channel: "latest", version: "1.0.0" }
//     }
//   );

//   const result = await t.context.m.addChannel(
//     {},
//     {
//       cwd,
//       env,
//       options: {},
//       stdout: t.context.stdout,
//       stderr: t.context.stderr,
//       logger: t.context.logger,
//       nextRelease: { channel: "1.x", version: "1.0.0" }
//     }
//   );

//   t.deepEqual(result, {
//     name: "npm package (@release-1.x dist-tag)",
//     url: undefined,
//     channel: "release-1.x"
//   });
//   t.is(
//     (await execa("npm", ["view", pkg.name, "dist-tags"], { cwd, env })).stdout,
//     "{ latest: '1.0.0', 'release-1.x': '1.0.0' }"
//   );
// });
