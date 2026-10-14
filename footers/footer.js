  (() => {
    const root = document.documentElement;
    const footer = document.querySelector('.site-footer');
    const stage = footer.querySelector('.world-stage');
    const journeyStage = document.querySelector('.journey-stage');
    const toggles = [...document.querySelectorAll('.theme-toggle')];
    const calm = matchMedia('(prefers-reduced-motion: reduce)');
    const store = (key, value) => { try { localStorage.setItem(`{{STORE}}-${key}`, value); } catch {} };

    // Each switch turns the sun-and-moon wheel another half revolution, always clockwise.
    let turns = root.dataset.theme === 'night' ? 1 : 0;
    const render = () => {
      const night = turns % 2 === 1;
      root.dataset.theme = night ? 'night' : 'day';
      footer.style.setProperty('--turn', `${turns * 180}deg`);
      for (const toggle of toggles) toggle.setAttribute('aria-checked', String(night));
    };
    render();
    requestAnimationFrame(() => requestAnimationFrame(() => root.classList.add('is-ready')));
    for (const toggle of toggles) {
      toggle.addEventListener('click', () => {
        turns += 1;
        store('theme', turns % 2 ? 'night' : 'day');
        render();
      });
    }

    // Each world registers a builder that brings its scene to life and returns how to pause and stop it.
    const WORLD_BUILDERS = {};
{{WORLD_JS}}

    // Worlds live in inert templates; only the chosen one is ever in the document.
    const templates = [...document.querySelectorAll('template[data-world]')];
    const ids = templates.map((t) => t.dataset.world);
    const names = Object.fromEntries(templates.map((t) => [t.dataset.world, t.dataset.name]));
    const pickers = [...document.querySelectorAll('.scene-picker')];
    let active = null, visible = false, planes = [];
    let reel = [], clock = 0, then = 0, asleep = false;

    const label = (id) => { for (const p of pickers) p.querySelector('.picker-name').textContent = names[id]; };
    const mount = (id) => {
      active?.destroy?.();
      active = null;
      const scene = document.getElementById(`world-${id}`).content.cloneNode(true);
      // A page with a journey stage sends each world's traveller along it; a page without one leaves it out.
      const travellers = scene.querySelectorAll('.journey');
      if (journeyStage) journeyStage.replaceChildren(...travellers); else travellers.forEach((t) => t.remove());
      stage.replaceChildren(scene);
      root.dataset.world = id;
      root.style.setProperty('--world-i', ids.indexOf(id));
      for (const picker of pickers) {
        for (const button of picker.querySelectorAll('button')) {
          const on = button.dataset.world === id;
          button.setAttribute('aria-checked', String(on));
          button.tabIndex = on ? 0 : -1;
        }
      }
      label(id);
      planes = [...footer.querySelectorAll('[data-sway]')].map((el) => ({ el, sway: Number(el.dataset.sway) }));
      // A world that starts new animations after it mounts asks the film clock to gather them in.
      const film = () => { if (clock) requestAnimationFrame(load); };
      active = WORLD_BUILDERS[id]?.({ stage, root, calm, film }) ?? null;
      active?.setVisible?.(visible && !asleep && !calm.matches);
      if (clock) requestAnimationFrame(load);
    };
    mount(root.dataset.world);

    const choose = (id) => {
      if (id === root.dataset.world) return;
      store('world', id);
      try {
        const url = new URL(location.href);
        url.searchParams.set('world', id);
        history.replaceState(null, '', url);
      } catch {}
      if (document.startViewTransition && !calm.matches) document.startViewTransition(() => mount(id));
      else mount(id);
    };
    // The host page can choose a world too, from anywhere on it.
    document.addEventListener('footer:choose', (event) => { if (ids.includes(event.detail)) choose(event.detail); });
    for (const picker of pickers) {
      const buttons = [...picker.querySelectorAll('button')];
      for (const button of buttons) {
        button.addEventListener('click', () => choose(button.dataset.world));
        button.addEventListener('pointerenter', () => label(button.dataset.world));
        button.addEventListener('pointerleave', () => label(root.dataset.world));
      }
      // Arrow keys move the choice, as in any radio group.
      picker.addEventListener('keydown', (event) => {
        const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[event.key];
        if (!step) return;
        event.preventDefault();
        const next = buttons[(ids.indexOf(root.dataset.world) + step + ids.length) % ids.length];
        choose(next.dataset.world);
        next.focus();
      });
    }

    // Idle life runs on a film's clock. Its CSS animations stay paused, and this steps every one of them
    // forward 24 times a second, both panes together so their copies never drift apart. Moving SVG costs a
    // full repaint per frame; at 24 frames instead of the display's 60 or 120, the scene stays alive for a
    // fraction of the work. Scroll-driven motion is untouched and keeps the display's own rate.
    const FILM = 1000 / 24;
    const inFooter = (node) => {
      while (node) {
        if (node === footer) return true;
        node = node.parentNode ?? node.host;
      }
      return false;
    };
    const load = () => {
      reel = document.getAnimations().filter((a) => a instanceof CSSAnimation && a.timeline === document.timeline && inFooter(a.effect?.target));
    };
    const advance = () => {
      const now = performance.now();
      const step = Math.min(now - then, 250);
      then = now;
      for (const a of reel) a.currentTime = (a.currentTime ?? 0) + step;
    };
    const life = () => {
      const on = visible && !asleep && !calm.matches;
      if (on && !clock) {
        load();
        then = performance.now();
        clock = setInterval(advance, FILM);
      } else if (!on && clock) {
        clearInterval(clock);
        clock = 0;
      }
      active?.setVisible?.(on);
    };

    // It only runs while the footer can be seen...
    new IntersectionObserver(([entry]) => {
      visible = entry.isIntersecting;
      life();
    }, { rootMargin: '120px' }).observe(footer);

    // ...and while someone is there: it rests a few seconds after the last scroll, pointer or key,
    // so a footer left on screen costs nothing, and wakes at the next movement.
    let nap = 0;
    const rest = () => {
      asleep = true;
      life();
    };
    const stir = () => {
      clearTimeout(nap);
      nap = setTimeout(rest, 8000);
      if (!asleep) return;
      asleep = false;
      life();
    };
    for (const type of ['pointermove', 'pointerdown', 'wheel', 'scroll', 'keydown', 'touchstart']) {
      addEventListener(type, stir, { passive: true });
    }
    stir();

    // Pointer parallax: nearer planes drift further, eased toward the pointer.
    const finePointer = matchMedia('(hover: hover) and (pointer: fine)');
    let targetX = 0, targetY = 0, x = 0, y = 0, frame = 0;
    const step = () => {
      x += (targetX - x) * 0.06;
      y += (targetY - y) * 0.06;
      for (const { el, sway } of planes) {
        el.style.transform = `translate3d(${(-x * sway).toFixed(2)}px, ${(-y * sway * 0.4).toFixed(2)}px, 0)`;
      }
      frame = Math.abs(targetX - x) + Math.abs(targetY - y) > 0.0005 ? requestAnimationFrame(step) : 0;
    };
    const aim = (nx, ny) => {
      targetX = nx;
      targetY = ny;
      if (!frame) frame = requestAnimationFrame(step);
    };
    footer.addEventListener('pointermove', (event) => {
      if (!finePointer.matches || calm.matches) return;
      const box = footer.getBoundingClientRect();
      aim(((event.clientX - box.left) / box.width) * 2 - 1, ((event.clientY - box.top) / box.height) * 2 - 1);
    });
    footer.addEventListener('pointerleave', () => aim(0, 0));
  })();
