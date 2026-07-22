import { createAppShell } from './app/app-shell.js';
import { createHomePage } from './app/home-page.js';
import { createRouter } from './app/router.js';
import { modules } from './app/module-registry.js';
import { shared } from './shared/index.js';
import { appConfig } from './config/app-config.js';

const root = document.querySelector('#app');
const homeModule = createHomePage({
  modules,
  config: appConfig
});

modules.forEach((module) => module.initialize?.({ shared }));

const router = createRouter({
  modules,
  homeModule,
  shared,
  config: appConfig
});

createAppShell({
  root,
  modules,
  homeModule,
  router,
  shared,
  config: appConfig
});

router.start();
