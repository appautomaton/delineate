    WORLD_BUILDERS.desert = ({ stage, root, calm }) => {
      // Wind. Sand lifts off each crest and is carried downwind in gusts. Drawn on a thin canvas
      // per depth plane, mapped to the drawing's coordinates, so hundreds of grains cost almost nothing.
      const bezier = ([a, b, c, d], t) => {
        const u = 1 - t;
        return [0, 1].map((k) => u * u * u * a[k] + 3 * u * u * t * b[k] + 3 * u * t * t * c[k] + t * t * t * d[k]);
      };
      const BANDS = {
        far: {
          y0: 260, y1: 384, grains: 26, speed: [36, 84], lift: [-8, -2], size: [.7, 1.3], life: [2.8, 5], alpha: .6,
          puffs: 3, puffSize: [7, 14], puffAlpha: .14,
          crests: [[[560, 324], [606, 306], [650, 304], [704, 306]], [[1060, 312], [1110, 304], [1150, 306], [1184, 308]], [[180, 320], [220, 318], [250, 319], [262, 320]]],
        },
        mid: {
          y0: 290, y1: 510, grains: 105, speed: [64, 160], lift: [-22, -6], size: [1.1, 2.4], life: [1.8, 3.8], alpha: .9,
          puffs: 8, puffSize: [9, 20], puffAlpha: .2,
          crests: [[[288, 356], [312, 364], [334, 378], [352, 394]], [[200, 362], [236, 356], [264, 354], [288, 356]], [[352, 394], [380, 418], [392, 446], [418, 472]],
                   [[1342, 344], [1370, 352], [1396, 366], [1418, 386]], [[1250, 360], [1290, 348], [1320, 344], [1342, 344]], [[1418, 386], [1446, 412], [1462, 446], [1484, 476]]],
        },
        ground: {
          y0: 420, y1: 600, grains: 80, speed: [150, 310], lift: [-10, -2], size: [1, 2], life: [1.1, 2.4], alpha: .75,
          puffs: 6, puffSize: [12, 26], puffAlpha: .16,
          crests: [[[-40, 470], [160, 456], [340, 448], [520, 452]], [[520, 452], [700, 456], [860, 458], [1000, 452]], [[1000, 452], [1200, 446], [1400, 444], [1640, 452]]],
        },
      };
      const INK = { day: '255 243 220', night: '190 182 224' };
      const VEIL = { day: 1, night: .62 };
      const rand = ([lo, hi]) => lo + Math.random() * (hi - lo);
      // A soft round sprite per theme, so blown-sand veils cost one drawImage each.
      const sprites = Object.fromEntries(Object.entries(INK).map(([theme, rgb]) => {
        const c = document.createElement('canvas');
        c.width = c.height = 64;
        const g = c.getContext('2d');
        const fill = g.createRadialGradient(32, 32, 0, 32, 32, 32);
        fill.addColorStop(0, `rgb(${rgb} / 1)`);
        fill.addColorStop(.45, `rgb(${rgb} / .42)`);
        fill.addColorStop(1, `rgb(${rgb} / 0)`);
        g.fillStyle = fill;
        g.fillRect(0, 0, 64, 64);
        return [theme, c];
      }));
      const observers = [];
      const fields = [...stage.querySelectorAll('.wind')].map((canvas) => {
        const band = BANDS[canvas.dataset.band];
        const field = { canvas, band, ctx: canvas.getContext('2d'), grains: [], puffs: [], grainDebt: 0, puffDebt: 0, map: null };
        const fit = () => {
          const depth = canvas.parentElement;
          const w = depth.clientWidth, h = depth.clientHeight;
          const scale = Math.max(w / 1600, h / 600);
          const dpr = Math.min(devicePixelRatio || 1, 1.5);
          const top = h - (600 - band.y0) * scale;
          const height = (band.y1 - band.y0) * scale;
          canvas.style.top = `${top}px`;
          canvas.style.height = `${height}px`;
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(height * dpr);
          field.map = [scale * dpr, ((w - 1600 * scale) / 2) * dpr, -band.y0 * scale * dpr];
        };
        const observer = new ResizeObserver(fit);
        observer.observe(canvas.parentElement);
        observers.push(observer);
        fit();
        return field;
      });
      const origin = (band) => {
        const [x, y] = bezier(band.crests[Math.floor(Math.random() * band.crests.length)], Math.random());
        return [x + rand([-3, 3]), y + rand([-2, 1])];
      };
      let windOn = false, windLast = 0, windClock = 0, windFrame = 0;
      const blow = (now) => {
        windFrame = 0;
        if (!windOn) return;
        windFrame = requestAnimationFrame(blow);
        // Thirty drawings a second: enough for blown sand, half the work of the display's rate.
        const dt = Math.min((now - windLast) / 1000, 0.05);
        if (dt < 0.03) return;
        windLast = now;
        windClock += dt;
        // Gusts: a slow swell with a quicker flutter on top, so the sand comes in surges.
        const gust = Math.max(0.3, 0.8 + 0.5 * Math.sin(windClock * 0.55) + 0.25 * Math.sin(windClock * 1.9 + 1.3));
        const theme = root.dataset.theme === 'day' ? 'day' : 'night';
        for (const field of fields) {
          const { band, ctx, grains, puffs, map } = field;
          field.grainDebt += band.grains * gust * gust * dt;
          field.puffDebt += band.puffs * gust * gust * dt;
          while (field.grainDebt >= 1) {
            const [x, y] = origin(band);
            grains.push({ x, y, vx: rand(band.speed) * gust, vy: rand(band.lift), size: rand(band.size), life: rand(band.life), age: 0 });
            field.grainDebt -= 1;
          }
          while (field.puffDebt >= 1) {
            const [x, y] = origin(band);
            puffs.push({ x, y, vx: rand(band.speed) * 0.55 * gust, vy: rand(band.lift) * 0.4, size: rand(band.puffSize), life: rand(band.life) * 1.4, age: 0 });
            field.puffDebt -= 1;
          }
          ctx.setTransform(1, 0, 0, 1, 0, 0);
          ctx.clearRect(0, 0, field.canvas.width, field.canvas.height);
          ctx.setTransform(map[0], 0, 0, map[0], map[1], map[2]);
          const sprite = sprites[theme];
          for (let i = puffs.length - 1; i >= 0; i--) {
            const p = puffs[i];
            p.age += dt;
            if (p.age >= p.life) { puffs.splice(i, 1); continue; }
            p.x += p.vx * dt;
            p.y += p.vy * dt;
            const s = p.size * (1 + 1.6 * p.age / p.life);
            ctx.globalAlpha = band.puffAlpha * VEIL[theme] * Math.sin(Math.PI * p.age / p.life);
            ctx.drawImage(sprite, p.x - s * 1.6, p.y - s * 0.55, s * 3.2, s * 1.1);
          }
          ctx.fillStyle = `rgb(${INK[theme]})`;
          for (let i = grains.length - 1; i >= 0; i--) {
            const g = grains[i];
            g.age += dt;
            if (g.age >= g.life) { grains.splice(i, 1); continue; }
            g.vy += 16 * dt;
            g.x += g.vx * dt * (0.7 + 0.3 * gust);
            g.y += g.vy * dt;
            ctx.globalAlpha = band.alpha * VEIL[theme] * Math.sin(Math.PI * g.age / g.life);
            ctx.beginPath();
            ctx.ellipse(g.x, g.y, g.size * (1 + g.vx / 50), g.size * 0.5, Math.atan2(g.vy, g.vx), 0, Math.PI * 2);
            ctx.fill();
          }
          ctx.globalAlpha = 1;
        }
      };
      const setWind = (on) => {
        windOn = on && !calm.matches;
        if (windOn && !windFrame) { windLast = performance.now(); windFrame = requestAnimationFrame(blow); }
      };
      return {
        setVisible: setWind,
        destroy() {
          setWind(false);
          cancelAnimationFrame(windFrame);
          for (const observer of observers) observer.disconnect();
        },
      };
    };
