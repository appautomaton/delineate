    WORLD_BUILDERS.deep = ({ stage, root, calm }) => {
      // A school of paper fish, steered by the three rules of a flock: keep apart, keep in line, keep together.
      // They scatter from the pointer. By night, plankton light up where the pointer passes.
      const school = stage.querySelector('.dp-school');
      const plankton = stage.querySelector('.dp-plankton');
      const footer = stage.closest('.site-footer');
      const rand = (lo, hi) => lo + Math.random() * (hi - lo);
      const observers = [];
      const surfaces = [school, plankton].map((canvas) => {
        const s = { canvas, ctx: canvas.getContext('2d'), map: [1, 0, 0] };
        const fit = () => {
          const w = canvas.clientWidth, h = canvas.clientHeight;
          const scale = Math.max(w / 1600, h / 600);
          const dpr = Math.min(devicePixelRatio || 1, 1.5);
          canvas.width = Math.round(w * dpr);
          canvas.height = Math.round(h * dpr);
          s.map = [scale * dpr, ((w - 1600 * scale) / 2) * dpr, (h - 600 * scale) * dpr];
        };
        const observer = new ResizeObserver(fit);
        observer.observe(canvas);
        observers.push(observer);
        fit();
        return s;
      });

      // Each fish is cut once into a small sprite: a body, a stripe, a lit edge and a soft shadow.
      const sprite = (body, stripe, shadow) => {
        const c = document.createElement('canvas');
        c.width = 64; c.height = 32;
        const g = c.getContext('2d');
        const fish = new Path2D('M10 16C10 10 18 7 30 7C40 7 48 11 50 16C48 21 40 25 30 25C18 25 10 22 10 16Z M10 16L2 9C1 13 1 19 2 23Z');
        g.save(); g.translate(3, 4); g.fillStyle = shadow; g.filter = 'blur(2px)'; g.fill(fish); g.restore();
        g.fillStyle = body; g.fill(fish);
        g.save(); g.clip(fish); g.fillStyle = stripe; g.fillRect(24, 0, 5, 32); g.fillRect(36, 0, 3, 32); g.restore();
        g.strokeStyle = 'rgb(255 255 255 / .5)'; g.lineWidth = 1;
        g.beginPath(); g.moveTo(16, 10); g.quadraticCurveTo(30, 6, 46, 12); g.stroke();
        g.fillStyle = '#12232A'; g.beginPath(); g.arc(42, 14, 1.6, 0, 6.3); g.fill();
        return c;
      };
      const sprites = {
        day: [sprite('#F4C842', '#FFF4D2', 'rgb(10 60 70 / .35)'), sprite('#5B8FD0', '#CFE4F6', 'rgb(10 60 70 / .35)')],
        night: [sprite('#24425A', '#3A6A80', 'rgb(0 0 0 / .4)'), sprite('#1E3550', '#3C5E80', 'rgb(0 0 0 / .4)')],
      };
      const fish = Array.from({ length: 28 }, (_, i) => ({
        x: rand(500, 900), y: rand(330, 400), vx: rand(30, 60), vy: rand(-8, 8),
        kind: i % 4 === 0 ? 1 : 0, size: rand(.5, .66), phase: rand(0, 6.3),
      }));
      for (const f of fish) f.vx = Math.abs(f.vx);
      const glints = [];
      let pointer = null;
      const onMove = (event) => {
        const box = school.getBoundingClientRect();
        const s = surfaces[0];
        const dpr = school.width / box.width;
        pointer = { x: ((event.clientX - box.left) * dpr - s.map[1]) / s.map[0], y: ((event.clientY - box.top) * dpr - s.map[2]) / s.map[0], t: performance.now() };
        if (root.dataset.theme === 'night') {
          for (let k = 0; k < 3; k++) glints.push({ x: pointer.x + rand(-14, 14), y: pointer.y + rand(-10, 10), age: 0, life: rand(1.2, 2.6), r: rand(2, 4) });
        }
      };
      const onLeave = () => { pointer = null; };
      footer.addEventListener('pointermove', onMove);
      footer.addEventListener('pointerleave', onLeave);

      const glow = (() => {
        const c = document.createElement('canvas');
        c.width = c.height = 32;
        const g = c.getContext('2d');
        const fill = g.createRadialGradient(16, 16, 0, 16, 16, 16);
        fill.addColorStop(0, 'rgb(220 255 250 / 1)');
        fill.addColorStop(.3, 'rgb(110 240 225 / .5)');
        fill.addColorStop(1, 'rgb(90 220 220 / 0)');
        g.fillStyle = fill;
        g.fillRect(0, 0, 32, 32);
        return c;
      })();
      // Plankton drifting on their own at night, a quiet field the pointer can stir.
      const drifters = Array.from({ length: 40 }, () => ({ x: rand(0, 1600), y: rand(120, 560), ph: rand(0, 6.3), sp: rand(.2, .6) }));

      let on = false, frame = 0, last = 0, clock = 0, lit = false;
      const step = (now) => {
        frame = 0;
        if (!on) return;
        frame = requestAnimationFrame(step);
        // Thirty drawings a second: smooth enough for a school, half the work of the display's rate.
        const dt = Math.min((now - last) / 1000, .05);
        if (dt < .03) return;
        last = now;
        clock += dt;
        const night = root.dataset.theme === 'night';

        // Flocking.
        for (const a of fish) {
          let sx = 0, sy = 0, ax = 0, ay = 0, cx = 0, cy = 0, n = 0;
          for (const b of fish) {
            if (a === b) continue;
            const dx = b.x - a.x, dy = b.y - a.y, d2 = dx * dx + dy * dy;
            if (d2 > 90 * 90) continue;
            n++;
            ax += b.vx; ay += b.vy; cx += b.x; cy += b.y;
            if (d2 < 22 * 22) { sx -= dx / (d2 || 1) * 40; sy -= dy / (d2 || 1) * 40; }
          }
          if (n) {
            a.vx += ((ax / n - a.vx) * .9 + (cx / n - a.x) * .35 + sx * 14) * dt;
            a.vy += ((ay / n - a.vy) * .9 + (cy / n - a.y) * .35 + sy * 14) * dt;
          }
          // Keep to open water above the reef, and drift right overall.
          if (a.y < 290) a.vy += 30 * dt;
          if (a.y > 430) a.vy -= 40 * dt;
          a.vx += (44 - a.vx) * .2 * dt;
          if (pointer && now - pointer.t < 1500) {
            const dx = a.x - pointer.x, dy = a.y - pointer.y, d = Math.hypot(dx, dy);
            if (d < 110) { a.vx += dx / d * 520 * dt; a.vy += dy / d * 520 * dt; }
          }
          const speed = Math.hypot(a.vx, a.vy), max = 150;
          if (speed > max) { a.vx *= max / speed; a.vy *= max / speed; }
          a.x += a.vx * dt;
          a.y += a.vy * dt;
          if (a.x > 1700) a.x = -100;
          if (a.x < -120) a.x = 1680;
        }

        const s = surfaces[0];
        s.ctx.setTransform(1, 0, 0, 1, 0, 0);
        s.ctx.clearRect(0, 0, s.canvas.width, s.canvas.height);
        s.ctx.setTransform(s.map[0], 0, 0, s.map[0], s.map[1], s.map[2]);
        const set = night ? sprites.night : sprites.day;
        for (const a of fish) {
          const ang = Math.atan2(a.vy, Math.abs(a.vx)) * .6;
          const flip = a.vx < 0 ? -1 : 1;
          const wag = Math.sin(clock * 9 + a.phase) * .06;
          s.ctx.save();
          s.ctx.translate(a.x, a.y);
          s.ctx.scale(flip * a.size, a.size);
          s.ctx.rotate(ang * flip + wag);
          s.ctx.drawImage(set[a.kind], -32, -16);
          s.ctx.restore();
        }

        // The plankton layer is only touched by night; by day it is cleared once and left alone.
        const p = surfaces[1];
        if (night || lit) {
          p.ctx.setTransform(1, 0, 0, 1, 0, 0);
          p.ctx.clearRect(0, 0, p.canvas.width, p.canvas.height);
          lit = night;
        }
        if (night) {
          p.ctx.setTransform(p.map[0], 0, 0, p.map[0], p.map[1], p.map[2]);
          for (const d of drifters) {
            d.y -= d.sp * 6 * dt;
            if (d.y < 100) d.y = 580;
            const a = .25 + .25 * Math.sin(clock * 1.3 + d.ph);
            p.ctx.globalAlpha = a;
            p.ctx.drawImage(glow, d.x + Math.sin(clock * .4 + d.ph) * 8 - 4, d.y - 4, 8, 8);
          }
          for (let i = glints.length - 1; i >= 0; i--) {
            const g = glints[i];
            g.age += dt;
            if (g.age >= g.life) { glints.splice(i, 1); continue; }
            p.ctx.globalAlpha = Math.sin(Math.PI * g.age / g.life);
            const r = g.r * (1 + g.age);
            p.ctx.drawImage(glow, g.x - r * 2, g.y - r * 2 - g.age * 6, r * 4, r * 4);
          }
          p.ctx.globalAlpha = 1;
        } else {
          glints.length = 0;
        }
      };
      const setVisible = (visible) => {
        on = visible && !calm.matches;
        if (on && !frame) { last = performance.now(); frame = requestAnimationFrame(step); }
      };
      return {
        setVisible,
        destroy() {
          on = false;
          cancelAnimationFrame(frame);
          footer.removeEventListener('pointermove', onMove);
          footer.removeEventListener('pointerleave', onLeave);
          for (const observer of observers) observer.disconnect();
        },
      };
    };
