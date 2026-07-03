import { createAppShell } from './app/app-shell.js';
import { createRouter } from './app/router.js';
import { modules } from './app/module-registry.js';
import { shared } from './shared/index.js';
import { appConfig } from './config/app-config.js';
import './app/styles.css';

const root = document.querySelector('#app');

const router = createRouter({
  modules,
  shared,
  config: appConfig
});

createAppShell({
  root,
  modules,
  router,
  shared,
  config: appConfig
});

router.start();
