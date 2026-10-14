  // Settle the world and the theme before the first paint, so nothing flashes. The address names a world
  // to open on; otherwise the visitor's last choice; otherwise the site's first.
  (() => {
    const root = document.documentElement;
    const worlds = {{WORLD_IDS}};
    const read = (key) => { try { return localStorage.getItem(key); } catch { return null; } };
    const asked = new URLSearchParams(location.search).get('world');
    const world = [asked, read('{{STORE}}-world')].find((id) => worlds.includes(id)) || worlds[0];
    root.dataset.world = world;
    root.style.setProperty('--world-i', worlds.indexOf(world));
    root.dataset.theme = read('{{STORE}}-theme') || ({{DEFAULT_THEME}} ??
      (matchMedia('(prefers-color-scheme: light)').matches ? 'day' : 'night'));
  })();
