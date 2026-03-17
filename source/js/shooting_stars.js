(() => {
  const STAR_COUNT = 12;
  const MIN_DURATION = 2.4;
  const MAX_DURATION = 4.8;
  const MIN_DELAY = 0;
  const MAX_DELAY = 6;
  const MIN_WIDTH = 100;
  const MAX_WIDTH = 190;

  const createContainer = () => {
    let container = document.getElementById('shooting-stars');
    if (!container) {
      container = document.createElement('div');
      container.id = 'shooting-stars';
      document.body.appendChild(container);
    }
    return container;
  };

  const rand = (min, max) => Math.random() * (max - min) + min;

  const createStar = () => {
    const star = document.createElement('span');
    star.className = 'shooting-star';
    star.style.top = `${rand(-10, 45)}vh`;
    star.style.left = `${rand(-20, 70)}vw`;
    star.style.setProperty('--star-width', `${rand(MIN_WIDTH, MAX_WIDTH)}px`);
    star.style.animationDuration = `${rand(MIN_DURATION, MAX_DURATION)}s`;
    star.style.animationDelay = `${rand(MIN_DELAY, MAX_DELAY)}s`;
    return star;
  };

  const mountStars = () => {
    const container = createContainer();
    container.innerHTML = '';
    for (let i = 0; i < STAR_COUNT; i += 1) {
      container.appendChild(createStar());
    }
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', mountStars, { once: true });
  } else {
    mountStars();
  }
})();
