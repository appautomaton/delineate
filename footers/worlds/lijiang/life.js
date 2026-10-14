    WORLD_BUILDERS.lijiang = ({ stage, root, calm }) => {
      // Light on the water: drifting sparkles by day; by night a column under the moon and another
      // under the lantern, broken into short dashes the way a painter would lay them. Fireflies along the banks.
      const glints = stage.querySelector('.lj-glints');
      const flies = stage.querySelector('.lj-flies');
      const moon = stage.querySelector('.orb--moon');
      const LANTERN_X = 602;
      const rand = (lo, hi) => lo + Math.random() * (hi - lo);
      const observers = [];
      const surfaces = [glints, flies].map((canvas) => {
        const surface = { canvas, ctx: canvas.getContext('2d'), map: [1, 0, 0], scale: 1 };
        const fit = () => {
          const w = canvas.clientWidth, h = canvas.clientHeight;
          const scale = Math.max(w / 1600, h / 600);
          const dpr = Math.min(devicePixelRatio || 1, 1.5);
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
          surface.scale = scale;
          surface.map = [scale * dpr, ((w - 1600 * scale) / 2) * dpr, (h - 600 * scale) * dpr];
        };
        const observer = new ResizeObserver(fit);
        observer.observe(canvas);
        observers.push(observer);
        fit();
        return surface;
      });
      const [water, banks] = surfaces;

      // Where the moon sits over the river, in drawing units.
      const moonX = () => {
        const box = moon.getBoundingClientRect(), host = glints.getBoundingClientRect();
        return ((box.left + box.width / 2 - host.left) * (glints.width / host.width) - water.map[1]) / water.map[0];
      };

      const sparks = [];
      const fireflies = Array.from({ length: 22 }, (_, i) => {
        const left = i % 2 === 0;
        return {
          x: left ? rand(20, 420) : rand(1260, 1600), y: left ? rand(380, 560) : rand(480, 590),
          ax: rand(8, 24), ay: rand(4, 12), fx: rand(.08, .2), fy: rand(.1, .26), ph: rand(0, 6.3),
          blink: rand(1.6, 3.6), bph: rand(0, 6.3),
        };
      });
      const glow = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d');
        const fill = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        fill.addColorStop(0, 'rgb(255 244 190 / 1)');
        fill.addColorStop(.25, 'rgb(230 236 140 / .55)');
        fill.addColorStop(1, 'rgb(200 220 120 / 0)');
        g.fillStyle = fill;
        g.fillRect(0, 0, 32, 32);
        return c;
      })();

      let on = false, frame = 0, last = 0, clock = 0, mx = 800;
      const spawn = (night) => {
        if (night) {
          // Most dashes fall in the moon's column, some in the lantern's.
          const lantern = Math.random() < .42;
          const y = lantern ? rand(516, 600) : rand(462, 600);
          const depth = (y - 458) / 142;
          const spread = lantern ? 6 + 26 * depth : 10 + 46 * depth;
          const cx = lantern ? LANTERN_X + 6 : mx;
          sparks.push({ x: cx + (Math.random() + Math.random() - 1) * spread, y, len: rand(4, 12) * (0.6 + depth),
                        life: rand(.5, 1.4), age: 0, vx: rand(-3, 3), warm: lantern });
        } else {
          const y = rand(470, 604);
          sparks.push({ x: rand(-40, 1640), y, len: rand(5, 16) * (0.5 + (y - 458) / 142), life: rand(1.2, 2.6), age: 0, vx: rand(4, 10), warm: false });
        }
      };
      const draw = (now) => {
        frame = 0;
        if (!on) return;
        frame = requestAnimationFrame(draw);
        const dt = Math.min((now - last) / 1000, .05);
        if (dt < .03) return;
        last = now;
        clock += dt;
        const night = root.dataset.theme === 'night';
        if (night && Math.floor(clock * 2) !== Math.floor((clock - dt) * 2)) mx = moonX();
        const want = night ? 70 : 34;
        while (sparks.length < want) spawn(night);

        const { ctx, map, canvas } = water;
        ctx.setTransform(1, 0, 0, 1, 0, 0);
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.setTransform(map[0], 0, 0, map[0], map[1], map[2]);
        ctx.lineCap = 'round';
        for (let i = sparks.length - 1; i >= 0; i--) {
          const s = sparks[i];
          s.age += dt;
          if (s.age >= s.life) { sparks.splice(i, 1); continue; }
          s.x += s.vx * dt;
          const a = Math.sin(Math.PI * s.age / s.life);
          ctx.strokeStyle = s.warm ? `rgb(255 200 120 / ${.85 * a})` : night ? `rgb(232 228 210 / ${.6 * a})` : `rgb(255 252 238 / ${.75 * a})`;
          ctx.lineWidth = s.warm ? 1.6 : night ? 1.2 : 1;
          ctx.beginPath();
          ctx.moveTo(s.x - s.len / 2, s.y);
          ctx.lineTo(s.x + s.len / 2, s.y);
          ctx.stroke();
        }

        const b = banks;
        b.ctx.setTransform(1, 0, 0, 1, 0, 0);
        b.ctx.clearRect(0, 0, b.canvas.width, b.canvas.height);
        if (night) {
          b.ctx.setTransform(b.map[0], 0, 0, b.map[0], b.map[1], b.map[2]);
          for (const fly of fireflies) {
            const x = fly.x + fly.ax * Math.sin(clock * fly.fx * 6.3 + fly.ph);
            const y = fly.y + fly.ay * Math.sin(clock * fly.fy * 6.3 + fly.ph * 1.7);
            const pulse = Math.max(0, Math.sin(clock * 6.3 / fly.blink + fly.bph));
            b.ctx.globalAlpha = pulse * pulse;
            b.ctx.drawImage(glow, x - 7, y - 7, 14, 14);
          }
          b.ctx.globalAlpha = 1;
        }
      };
      const setVisible = (visible) => {
        on = visible && !calm.matches;
        if (on && !frame) { last = performance.now(); mx = moonX(); frame = requestAnimationFrame(draw); }
      };
      return {
        setVisible,
        destroy() {
          on = false;
          cancelAnimationFrame(frame);
          for (const observer of observers) observer.disconnect();
        },
      };
    };
