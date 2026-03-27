import { createMemoryRepository } from './memory.repository';
import { LocalFileRepository } from './local-file.repository';
import type { DataProvider, RepositoryMeta } from './repository.types';
import type { DataRepository } from './repository.types';

function parseProvider(input: string | undefined): DataProvider {
  if (input === 'memory' || input === 'local') {
    return input;
  }

  return 'local';
}

const requestedProvider = parseProvider(process.env.DATA_PROVIDER);
const localDbPath = process.env.LOCAL_DB_PATH || '.local-db/agenda-facilitada.json';

let repository: DataRepository;
let activeProvider: RepositoryMeta['activeProvider'];
let resolvedLocalDbPath: string | undefined;

function createLocalRepository() {
  const localRepository = new LocalFileRepository({
    filePath: localDbPath,
  });

  resolvedLocalDbPath = localRepository.getFilePath();
  return localRepository;
}

if (requestedProvider === 'memory') {
  repository = createMemoryRepository();
  activeProvider = 'memory';
} else {
  repository = createLocalRepository();
  activeProvider = 'local';
}

export const dataRepository = repository;
const repositoryMetaBase: RepositoryMeta = {
  requestedProvider,
  activeProvider,
};

export const repositoryMeta: RepositoryMeta = resolvedLocalDbPath
  ? { ...repositoryMetaBase, localDbPath: resolvedLocalDbPath }
  : repositoryMetaBase;
