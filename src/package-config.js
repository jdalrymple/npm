import readPkg from 'read-pkg';
import loadJsonFile from 'load-json-file';
import path from 'path';
import glob from 'globby';
import { getError } from './error';

export async function getLernaConfig() {
  let file;

  try {
    file = await loadJsonFile('lerna.json');
  } catch (e) {
    file = {};
  }

  return file;
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

export async function getAllPkgInfo({ cwd }, { pkgRoot } = {}) {
  const rootPath = pkgRoot ? path.resolve(cwd, String(pkgRoot)) : cwd;
  const pkg = await getPkgInfo(rootPath);
  let subPkgs = [];

  if (pkg.private) {
    const subpkgsConfig = pkg.workspaces || (await getLernaConfig()).packages || [];

    if (subpkgsConfig.length > 0) {
      let paths = await Promise.all(subpkgsConfig.map(g => glob(g, { cwd, onlyFiles: false })));

      paths = paths.flat();
      subPkgs = await Promise.all(paths.map(p => getPkgInfo(path.resolve(cwd, p))));
    }
  }

  return { rootPkg: pkg, subPkgs };
}
