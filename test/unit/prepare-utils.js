import execa from 'execa';
import { Readable, PassThrough } from 'stream';
import { move } from 'fs-extra';
import { WritableStreamBuffer } from 'stream-buffers';
import { prepareNpm } from '../../src/prepare-utils';

jest.mock('execa');
jest.mock('path', () => ({
  resolve: jest.requireActual('path').join,
}));
jest.mock('fs-extra');

describe('prepareNpm', () => {
  let context;

  beforeEach(async () => {
    context = {
      logger: { log: jest.fn() },
      stdout: new WritableStreamBuffer(),
      stderr: new WritableStreamBuffer(),
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should update the package.json', async () => {
    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    await prepareNpm('.npmrc', {
      cwd: 'home',
      env: {},
      stdout: context.stdout,
      stderr: context.stderr,
      nextRelease: { version: '1.0.0' },
      logger: context.logger,
    });

    expect(execa).toHaveBeenCalledWith(
      'npm',
      [
        'version',
        '1.0.0',
        '--userconfig',
        '.npmrc',
        '--no-git-tag-version',
        '--allow-same-version',
      ],
      {
        cwd: 'home',
        env: {},
      },
    );

    // Verify the logger has been called with the version updated
    expect(context.logger.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      'home',
    );
  });

  it('should not create a tarball if package is private', async () => {
    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    await prepareNpm(
      '.npmrc',
      {
        cwd: 'home',
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
      {},
      true,
    );

    expect(execa).toHaveBeenCalledWith(
      'npm',
      [
        'version',
        '1.0.0',
        '--userconfig',
        '.npmrc',
        '--no-git-tag-version',
        '--allow-same-version',
      ],
      {
        cwd: 'home',
        env: {},
      },
    );

    expect(execa).toHaveBeenCalledTimes(1);

    // Verify the logger has been called with the version updated
    expect(context.logger.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      'home',
    );
  });

  it('should create the package in the "tarballDir" directory', async () => {
    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    execa.mockReturnValueOnce({
      stdout: { pipe: jest.fn(), split: jest.fn(() => ['test-project-1.0.0.tgz']) },
      stderr: Readable.from('test'),
    });

    await prepareNpm(
      '.npmrc',
      {
        cwd: 'home',
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
      { tarballDir: 'tarball' },
    );

    // Verify tar is created
    expect(execa).toHaveBeenCalledWith('npm', ['pack', 'home', '--userconfig', '.npmrc'], {
      cwd: 'home',
      env: {},
    });

    expect(move).toHaveBeenCalledWith(
      'home/test-project-1.0.0.tgz',
      'home/tarball/test-project-1.0.0.tgz',
    );

    // Verify the logger has been called with the version updated
    expect(context.logger.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      'home',
    );
  });

  it('should only move the created tarball if the "tarballDir" directory is not the CWD', async () => {
    execa.mockReturnValueOnce({
      stdout: new PassThrough(),
      stderr: new PassThrough(),
    });

    execa.mockReturnValueOnce({
      stdout: { pipe: jest.fn(), split: jest.fn(() => ['test-project-1.0.0.tgz']) },
      stderr: Readable.from('test'),
    });

    await prepareNpm(
      '.npmrc',
      {
        cwd: 'home',
        env: {},
        stdout: context.stdout,
        stderr: context.stderr,
        nextRelease: { version: '1.0.0' },
        logger: context.logger,
      },
      { tarballDir: '.' },
    );

    // Verify tar is created
    expect(execa).toHaveBeenCalledWith('npm', ['pack', 'home', '--userconfig', '.npmrc'], {
      cwd: 'home',
      env: {},
    });

    expect(move).toHaveBeenCalledTimes(0);

    // Verify the logger has been called with the version updated
    expect(context.logger.log).toHaveBeenCalledWith(
      'Write version %s to package.json in %s',
      '1.0.0',
      'home',
    );
  });
});
