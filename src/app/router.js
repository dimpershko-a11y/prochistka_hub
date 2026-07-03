export function createRouter({ modules, shared, config }) {
  let currentModule = null;
  let outlet = null;

  function getRoute() {
    return window.location.hash.replace('#', '') || '/';
  }

  function findModuleByRoute(route) {
    if (route === '/') {
      return modules[0];
    }

    return modules.find((module) => module.moduleManifest.route === route) || modules[0];
  }

  function navigate(route) {
    window.location.hash = route;
  }

  function render() {
    if (!outlet) return;

    const route = getRoute();
    const nextModule = findModuleByRoute(route);

    if (currentModule?.unmount) {
      currentModule.unmount();
    }

    currentModule = nextModule;
    outlet.innerHTML = '';

    nextModule.mount(outlet, {
      shared,
      config,
      eventBus: shared.eventBus,
      navigate
    });
  }

  return {
    attach(container) {
      outlet = container;
    },
    navigate,
    start() {
      window.addEventListener('hashchange', render);
      render();
    }
  };
}
