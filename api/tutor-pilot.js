import { readFileSync } from 'node:fs';
import { pilotHandler } from '../server/pilot-handler.mjs';
import { pilotProvider } from '../server/pilot-provider.mjs';
import { pilotBlob } from '../server/pilot-store.mjs';

export default pilotHandler({ store: pilotBlob, provider: pilotProvider,
  html: () => readFileSync('private-preview/pilot.html', 'utf8') });
