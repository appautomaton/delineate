    WORLD_BUILDERS.crayon = ({ stage, calm, film }) => {
      // The drawing plays once the world comes into view: strand by strand, far to near, as the hand made
      // it, stepped by the footer's film clock like the rest of its idle life. Once drawn, the stylesheet
      // brings the paper's grain up through it. With less motion asked for, the drawing is simply there.
      const world = stage.querySelector('.world--crayon');
      const longest = Math.max(...[...world.querySelectorAll('.wax path')].map((p) => parseFloat(p.style.getPropertyValue('--d')) + parseFloat(p.style.getPropertyValue('--t'))));
      let drawn = false, timer = 0;
      const finish = () => { world.classList.remove('is-drawing'); world.classList.add('is-drawn'); };
      if (calm.matches) { drawn = true; finish(); }
      return {
        setVisible(on) {
          if (!on || drawn) return;
          drawn = true;
          world.classList.add('is-drawing');
          film();
          timer = setTimeout(finish, (longest + .3) * 1000);
        },
        destroy() { clearTimeout(timer); },
      };
    };
