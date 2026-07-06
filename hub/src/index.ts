import os from 'os';
import { createApp } from './app';
import { config } from './config';
import { getDb } from './db';

function localIps(): string[] {
  const nets = os.networkInterfaces();
  const ips: string[] = [];
  for (const name of Object.keys(nets)) {
    for (const net of nets[name] || []) {
      if (net.family === 'IPv4' && !net.internal) ips.push(net.address);
    }
  }
  return ips;
}

// Ensure DB is initialised before serving.
getDb();

const app = createApp();

app.listen(config.port, () => {
  const ips = localIps();
  // eslint-disable-next-line no-console
  console.log('');
  console.log(`  ${config.hubName} v${config.version}`);
  console.log(`  Gemma provider: ${config.gemma.provider} (model: ${config.gemma.model})`);
  console.log(`  Listening on http://localhost:${config.port}`);
  for (const ip of ips) {
    console.log(`  On your LAN:    http://${ip}:${config.port}   <- use this as the Hub URL on phones`);
  }
  console.log('');
});
