import { join } from '@std/path';
import { DuckDBInstanceCache } from '@duckdb/node-api';

const dirname = import.meta.dirname!;
const logDir = join(dirname, '../../logs');

const cache = new DuckDBInstanceCache();
const instance = await cache.getOrCreateInstance(`${logDir}/access_logs.db`, {
  threads: '4'
});

export const connection = await instance.connect();
