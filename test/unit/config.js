import AggregateError from 'aggregate-error';
import { verifyPluginConfig } from '../../src/config';
import { getError } from '../../src/error';

let context;

beforeEach(() => {
  context = {};
  context.log = jest.fn();
  context.logger = { log: context.log };
});

describe('config.verifyPluginConfig in a single package repo', () => {
  it('should validate "npmPublish", "tarballDir" and "pkgRoot" options', async () => {
    const valid = await verifyPluginConfig(
      { npmPublish: true, tarballDir: 'release', pkgRoot: 'dist' },
      {},
      context.logger,
    );

    expect(valid).toBeTruthy();
  });

  it('should throw SemanticReleaseError if "npmPublish" option is not a Boolean', async () => {
    const npmPublish = 42;
    const e = new AggregateError([getError('EINVALIDNPMPUBLISH')]);

    await expect(verifyPluginConfig({ npmPublish }, {}, context.logger)).rejects.toStrictEqual(e);
  });

  it('should throw SemanticReleaseError if "tarballDir" option is not a String', async () => {
    const tarballDir = 42;
    const e = new AggregateError([getError('EINVALIDTARBALLDIR')]);

    await expect(verifyPluginConfig({ tarballDir }, {}, context.logger)).rejects.toStrictEqual(e);
  });

  it('should throw SemanticReleaseError if "pkgRoot" option is not a String', async () => {
    const pkgRoot = 42;
    const e = new AggregateError([getError('EINVALIDPKGROOT')]);

    await expect(verifyPluginConfig({ pkgRoot }, {}, context.logger)).rejects.toStrictEqual(e);
  });

  it('should throw SemanticReleaseError Array if multiple config are invalid', async () => {
    const npmPublish = 42;
    const tarballDir = 42;
    const pkgRoot = 42;
    const e = new AggregateError([
      getError('EINVALIDNPMPUBLISH'),
      getError('EINVALIDTARBALLDIR'),
      getError('EINVALIDPKGROOT'),
    ]);

    await expect(
      verifyPluginConfig({ npmPublish, tarballDir, pkgRoot }, {}, context.logger),
    ).rejects.toStrictEqual(e);
  });
});
