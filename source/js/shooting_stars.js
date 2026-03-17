(() => {
  if (location.pathname !== '/' && location.pathname !== '/index.html') {
    return;
  }

  const canvas = document.createElement('canvas');
  canvas.id = 'star-canvas';
  document.body.appendChild(canvas);
  const ctx = canvas.getContext('2d');

  let width;
  let height;
  const stars = [];
  const STAR_COUNT = 8;

  const SPECIAL_STAR_PROBABILITY = 0.15;
  const EASTER_EGG_URL = '/easter-egg/';

  const resize = () => {
    width = window.innerWidth;
    height = window.innerHeight;
    canvas.width = width;
    canvas.height = height;
  };

  window.addEventListener('resize', resize);
  resize();

  class Star {
    constructor() {
      this.reset(true);
    }

    reset(initial = false) {
      this.x = Math.random() * width;
      this.y = Math.random() * height * 0.5;
      this.len = Math.random() * 80 + 150;
      this.speed = Math.random() * 0.6 + 0.2;
      this.size = Math.random() * 1 + 0.5;
      this.angle = (45 * Math.PI) / 180;
      this.opacity = Math.random() * 0.5 + 0.3;
      this.isSpecial = Math.random() < SPECIAL_STAR_PROBABILITY;
      this.hue = Math.random() * 360;

      if (!initial) {
        this.x = Math.random() * width * 1.2 - width * 0.2;
        this.y = -100;
      }

      if (this.isSpecial) {
        this.size *= 2;
        this.speed *= 0.9;
        this.opacity = 1;
      } else {
        this.color = '#FFD700';
      }
    }

    update() {
      this.x += this.speed * Math.cos(this.angle);
      this.y += this.speed * Math.sin(this.angle);

      if (this.isSpecial) {
        this.hue = (this.hue + 2) % 360;
      }

      if (this.x > width + this.len || this.y > height + this.len) {
        this.reset();
      }
    }

    draw() {
      ctx.save();
      ctx.translate(this.x, this.y);
      ctx.rotate(this.angle - Math.PI);

      const gradient = ctx.createLinearGradient(0, 0, this.len, 0);

      if (this.isSpecial) {
        gradient.addColorStop(0, `hsla(0, 100%, 65%, ${this.opacity})`);
        gradient.addColorStop(0.2, `hsla(45, 100%, 65%, ${this.opacity})`);
        gradient.addColorStop(0.4, `hsla(90, 100%, 65%, ${this.opacity})`);
        gradient.addColorStop(0.6, `hsla(180, 100%, 65%, ${this.opacity})`);
        gradient.addColorStop(0.8, `hsla(270, 100%, 65%, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      } else {
        gradient.addColorStop(0, `rgba(255, 223, 0, ${this.opacity})`);
        gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');
      }

      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(this.len, 0);
      ctx.lineWidth = this.size;
      ctx.strokeStyle = gradient;
      ctx.lineCap = 'round';
      ctx.stroke();

      if (this.isSpecial) {
        const r = this.size * 2;
        const starGrad = ctx.createLinearGradient(-r, -r, r, r);
        starGrad.addColorStop(0, `hsla(${this.hue}, 100%, 75%, 1)`);
        starGrad.addColorStop(1, `hsla(${(this.hue + 45) % 360}, 100%, 50%, 1)`);

        ctx.shadowBlur = 15;
        ctx.shadowColor = `hsla(${this.hue}, 100%, 50%, 0.8)`;
        ctx.fillStyle = starGrad;

        this.drawStar(0, 0, 5, this.size * 4, this.size * 2);
      } else {
        ctx.shadowBlur = 10;
        ctx.shadowColor = '#FFD700';
        ctx.fillStyle = '#FFD700';
        this.drawStar(0, 0, 5, this.size * 3, this.size * 1.5);
      }

      ctx.restore();
    }

    drawStar(cx, cy, spikes, outerRadius, innerRadius) {
      let rot = (Math.PI / 2) * 3;
      let checkX = cx;
      let checkY = cy;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(cx, cy - outerRadius);

      for (let i = 0; i < spikes; i += 1) {
        checkX = cx + Math.cos(rot) * outerRadius;
        checkY = cy + Math.sin(rot) * outerRadius;
        ctx.lineTo(checkX, checkY);
        rot += step;

        checkX = cx + Math.cos(rot) * innerRadius;
        checkY = cy + Math.sin(rot) * innerRadius;
        ctx.lineTo(checkX, checkY);
        rot += step;
      }
      ctx.lineTo(cx, cy - outerRadius);
      ctx.closePath();
      ctx.fill();
    }

    checkClick(mouseX, mouseY) {
      if (!this.isSpecial) return false;

      const dx = mouseX - this.x;
      const dy = mouseY - this.y;
      const distance = Math.sqrt(dx * dx + dy * dy);

      return distance < (this.size * 5 + 20);
    }
  }

  for (let i = 0; i < STAR_COUNT; i += 1) {
    stars.push(new Star());
  }

  const animate = () => {
    ctx.clearRect(0, 0, width, height);

    stars.forEach(star => {
      star.update();
      star.draw();
    });

    requestAnimationFrame(animate);
  };

  animate();

  window.addEventListener('click', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    for (const star of stars) {
      if (star.checkClick(mouseX, mouseY)) {
        window.location.href = EASTER_EGG_URL;
        break;
      }
    }
  });

  window.addEventListener('mousemove', (e) => {
    const mouseX = e.clientX;
    const mouseY = e.clientY;

    let hoveringSpecial = false;
    for (const star of stars) {
      if (star.checkClick(mouseX, mouseY)) {
        hoveringSpecial = true;
        break;
      }
    }

    if (hoveringSpecial) {
      canvas.style.pointerEvents = 'auto';
      canvas.style.cursor = 'pointer';
    } else {
      canvas.style.pointerEvents = 'none';
      canvas.style.cursor = 'default';
    }
  });
})();
