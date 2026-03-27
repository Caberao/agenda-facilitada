import { createMemoryRepository } from './memory.repository';
import { LocalFileRepository } from './local-file.repository';
import { createSupabaseRepository } from './supabase.repository';
import type { DataProvider, RepositoryMeta } from './repository.types';
import type { DataRepository } from './repository.types';

function parseProvider(input: string | undefined): DataProvider {
  if (input === 'memory' || input === 'local' || input === 'supabase') {
    return input;
  }

  return 'local';
}

const requestedProvider = parseProvider(process.env.DATA_PROVIDER);
const localDbPath = process.env.LOCAL_DB_PATH || '.local-db/agenda-facilitada.json';
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const supabaseSchema = process.env.SUPABASE_SCHEMA || 'public';

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
} else if (requestedProvider === 'supabase') {
  if (!supabaseUrl || !supabaseServiceRoleKey) {
    repository = createLocalRepository();
    activeProvider = 'local';
  } else {
    repository = createSupabaseRepository({
      url: supabaseUrl,
      serviceRoleKey: supabaseServiceRoleKey,
      schema: supabaseSchema,
    });
    activeProvider = 'supabase';
  }
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
