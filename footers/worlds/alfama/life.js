    WORLD_BUILDERS.alfama = ({ stage, root, calm }) => {
      // By night the city answers the reader: moving through the footer's links lights a sleeping window.
      const footer = stage.closest('.site-footer');
      const links = [...footer.querySelectorAll('.sitemap a, .social a, .credit a')];
      const sleepers = () => [...stage.querySelectorAll('.pane--night .al-window--sleeper')];
      const lit = new Map();
      const wake = (event) => {
        if (root.dataset.theme !== 'night') return;
        const link = event.currentTarget;
        if (lit.has(link)) { clearTimeout(lit.get(link).timer); return; }
        const dark = sleepers().filter((w) => !w.classList.contains('is-lit'));
        if (!dark.length) return;
        const window = dark[Math.floor(Math.random() * dark.length)];
        window.classList.add('is-lit');
        lit.set(link, { window, timer: 0 });
      };
      const rest = (event) => {
        const entry = lit.get(event.currentTarget);
        if (!entry) return;
        entry.timer = setTimeout(() => { entry.window.classList.remove('is-lit'); lit.delete(event.currentTarget); }, 2400);
      };
      for (const link of links) {
        link.addEventListener('pointerenter', wake);
        link.addEventListener('focus', wake);
        link.addEventListener('pointerleave', rest);
        link.addEventListener('blur', rest);
      }
      return {
        setVisible() {},
        destroy() {
          for (const link of links) {
            link.removeEventListener('pointerenter', wake);
            link.removeEventListener('focus', wake);
            link.removeEventListener('pointerleave', rest);
            link.removeEventListener('blur', rest);
          }
          for (const { timer } of lit.values()) clearTimeout(timer);
        },
      };
    };
