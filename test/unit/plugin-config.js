import AggregateError from 'aggregate-error';
import { verifyPluginConfig } from '../../src/plugin-config';
import { getError } from '../../src/error';

describe('verifyPluginConfig', () => {
  it('should validate "npmPublish", "tarballDir" and "pkgRoot" options', () => {
    expect(
      verifyPluginConfig({
        npmPublish: true,
        tarballDir: 'release',
        pkgRoot: 'dist',
      }),
    ).toBeTruthy();
  });

  it('should throw SemanticReleaseError if "npmPublish" option is not a Boolean', () => {
    const npmPublish = 42;
    const error = new AggregateError([getError('EINVALIDNPMPUBLISH')]);

    try {
      verifyPluginConfig({ npmPublish });
    } catch (e) {
      // eslint-disable-next-line
      expect(e).toStrictEqual(error);
    }
  });

  it('should throw SemanticReleaseError if "tarballDir" option is not a String', async () => {
    const tarballDir = 42;
    const error = new AggregateError([getError('EINVALIDTARBALLDIR')]);

    try {
      verifyPluginConfig({ tarballDir });
    } catch (e) {
      // eslint-disable-next-line
      expect(e).toStrictEqual(error);
    }
  });

  it('should throw SemanticReleaseError if "pkgRoot" option is not a String', async () => {
    const pkgRoot = 42;
    const error = new AggregateError([getError('EINVALIDPKGROOT')]);

    try {
      verifyPluginConfig({ pkgRoot });
    } catch (e) {
      // eslint-disable-next-line
      expect(e).toStrictEqual(error);
    }
  });

  it('should throw SemanticReleaseError Array if multiple config are invalid', async () => {
    const npmPublish = 42;
    const tarballDir = 42;
    const pkgRoot = 42;
    const error = new AggregateError([
      getError('EINVALIDNPMPUBLISH'),
      getError('EINVALIDTARBALLDIR'),
      getError('EINVALIDPKGROOT'),
    ]);

    try {
      verifyPluginConfig({ pkgRoot, npmPublish, tarballDir });
    } catch (e) {
      // eslint-disable-next-line
      expect(e).toStrictEqual(error);
    }
  });
});
