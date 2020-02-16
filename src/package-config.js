import readPkg from 'read-pkg';
import loadJsonFile from 'load-json-file';
import path from 'path';
import glob from 'globby';
import { getError } from './error';

export async function getLernaConfig() {
  return loadJsonFile('lerna.json');
}

export async function getPkgInfo(cwd) {
  try {
    const pkg = await readPkg({ cwd });
    pkg.path = cwd;

    if (!pkg.private && !pkg.name) {
      throw getError('ENOPKGNAME');
    }

    return pkg;
  } catch (error) {
    if (error.code === 'ENOENT') {
      throw getError('ENOPKG');
    } else {
      throw error;
    }
  }
}

export async function getAllPkgInfo({ pkgRoot }, { cwd }) {
  const rootPath = pkgRoot ? path.resolve(cwd, String(pkgRoot)) : cwd;  
  const pkg = await getPkgInfo(rootPath);
  let subPkgs;

  if (pkg.private) {
    const subpkgsConfig = pkg.workspaces || (await getLernaConfig()).packages;

    if (subpkgsConfig) {
      let paths = await Promise.all(subpkgsConfig.map(g => glob(g, { cwd, onlyFiles: false })));

      paths = paths.flat();
      subPkgs = await Promise.all(paths.map(p => getPkgInfo(p)));
    }
  }

  return { rootPkg: pkg, subPkgs };
}
