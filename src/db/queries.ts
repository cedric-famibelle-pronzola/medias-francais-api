import { LogEntry } from '../@types/log-entry.ts';
import { connection } from './client.ts';

await connection.run(`
  CREATE TABLE IF NOT EXISTS logs (
    log JSON
  )
`);

export async function insertLog(log: LogEntry) {
  await connection.run(`INSERT INTO logs VALUES (?)`, [JSON.stringify(log)]);
}
