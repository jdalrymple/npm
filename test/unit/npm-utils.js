import path from 'path';
import { remove, appendFile } from 'fs-extra';
import { directory as createDir } from 'tempy';
import { getRegistry } from '../../src/npm-utils';

describe('npmUtils.getRegistry', () => {
  let cwd;

  beforeEach(() => {
    cwd = createDir();
  });

  afterEach(async () => {
    await remove(cwd);
  });

  it('should get the default registry without publish configuration', async () => {
    const reg = await getRegistry({ name: 'package-name' }, { cwd });

    expect(reg).toEqual('https://registry.npmjs.org/');
  });

  it('should get the default registry with publish configuration', async () => {
    const reg = await getRegistry({ name: 'package-name', publishConfig: {} }, { cwd });

    expect(reg).toEqual('https://registry.npmjs.org/');
  });

  it('should get the registry configured in ".npmrc" and normalize trailing slash', async () => {
    await appendFile(path.resolve(cwd, '.npmrc'), 'registry = https://custom1.registry.com');

    const reg = await getRegistry({ name: 'package-name' }, { cwd });

    expect(reg).toEqual('https://custom1.registry.com/');
  });

  it('should get the registry configured from "publishConfig"', async () => {
    await appendFile(path.resolve(cwd, '.npmrc'), 'registry = https://custom2.registry.com');

    const reg = await getRegistry(
      {
        name: 'package-name',
        publishConfig: { registry: 'https://custom3.registry.com/' },
      },
      { cwd },
    );

    expect(reg).toEqual('https://custom3.registry.com/');
  });

  it('should get the registry configured in "NPM_CONFIG_REGISTRY"', async () => {
    const reg = await getRegistry(
      { name: 'package-name' },
      { cwd, env: { NPM_CONFIG_REGISTRY: 'https://custom1.registry.com/' } },
    );

    expect(reg).toEqual('https://custom1.registry.com/');
  });

  it('should get the registry configured in ".npmrc" for scoped package', async () => {
    await appendFile(path.resolve(cwd, '.npmrc'), '@scope:registry = https://custom1.registry.com');

    const reg = await getRegistry({ name: '@scope/package-name' }, { cwd });

    expect(reg).toEqual('https://custom1.registry.com/');
  });
});
