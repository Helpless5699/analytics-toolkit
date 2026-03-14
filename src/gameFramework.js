import { pathToFileURL } from 'node:url';
import { createSnakeSurvivorApp } from './app/createSnakeSurvivorApp.js';

async function runDemo() {
  const app = await createSnakeSurvivorApp({
    phase: 'vertical_slice',
    profileId: 'local-demo',
    seed: 'season0-vertical-slice',
  });

  const demo = await app.runVerticalSliceDemo();
  const { summary } = demo.run;

  console.log('[Bootstrap] Snake Survivor season0 vertical slice ready');
  console.log('[Phase]', app.phase);
  console.log('[Profile]', demo.profile.playerName);
  console.log('[Run]', JSON.stringify(summary, null, 2));
  console.log('[Telemetry events]', demo.telemetry.map((entry) => entry.name));
  console.log('[Platform ops]', demo.platformLog.map((entry) => entry.type));
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  runDemo().catch((error) => {
    console.error('[Fatal]', error);
    process.exitCode = 1;
  });
}

export { runDemo };
