import app from './app.js';
import { config } from './config.js';
import { startWatcher } from './services/watcher.js';

app.listen(config.port, () => console.log(`Backend listening on http://localhost:${config.port}`));
startWatcher();
