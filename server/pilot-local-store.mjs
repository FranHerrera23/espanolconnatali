import { mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';

// For a single local QA server only. Production uses private Blob and its ETags.
export function localPilotStore(directory) {
  mkdirSync(directory, { recursive: true, mode: 0o700 });
  const path = id => join(directory, `${id}.json`);
  const read = id => {
    try { return JSON.parse(readFileSync(path(id), 'utf8')); }
    catch (error) { if (error.code === 'ENOENT') return null; throw error; }
  };
  return {
    read,
    write(id, record, revision) {
      if ((read(id)?.revision ?? null) !== revision) return false;
      const nonce = randomUUID();
      const temporaryPath = path(`${id}-${nonce}`);
      writeFileSync(temporaryPath, JSON.stringify({ revision: nonce, record }), { mode: 0o600 });
      renameSync(temporaryPath, path(id));
      return true;
    },
  };
}
