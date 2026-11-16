/*
  Banner art below the first screen (PERF-01).

  Native loading="lazy" is not enough here: on a slow phone Chrome starts lazy images
  up to 2500px ahead, so the half banners shared the line with the hero and slowed it
  down. <spy-lazy-picture> keeps the real srcset in data-srcset and only sets it once
  the hero image is done (or the shopper scrolls), and the banner is near the screen.

  Until then the <source>/<img> show an empty SVG with the same width/height as the art,
  so the box keeps its size and nothing moves.
*/
(function () {
  if (customElements.get('spy-lazy-picture')) return;

  // The hero is the one image with fetchpriority="high"
  const heroDone = new Promise((resolve) => {
    const hero = document.querySelector('img[fetchpriority="high"]');
    if (!hero || hero.complete) return resolve();
    hero.addEventListener('load', resolve, { once: true });
    hero.addEventListener('error', resolve, { once: true });
    addEventListener('scroll', resolve, { once: true, passive: true });
  });

  const show = (picture) => {
    picture.querySelectorAll('[data-srcset]').forEach((el) => {
      el.srcset = el.dataset.srcset;
      el.removeAttribute('data-srcset');
    });
    picture.querySelectorAll('img[data-src]').forEach((img) => {
      img.src = img.dataset.src;
      img.removeAttribute('data-src');
    });
  };

  let observer;
  const watch = () =>
    (observer ||= new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          observer.unobserve(entry.target);
          show(entry.target.closest('spy-lazy-picture'));
        }
      },
      // One screen ahead, so the art is there before it scrolls in
      { rootMargin: '100% 0px' }
    ));

  class SpyLazyPicture extends HTMLElement {
    connectedCallback() {
      // The element is display: contents, so watch the <img> that has a box
      this.img = this.querySelector('img');
      if (!this.img) return;
      heroDone.then(() => this.isConnected && watch().observe(this.img));
    }

    disconnectedCallback() {
      if (observer && this.img) observer.unobserve(this.img);
    }
  }

  customElements.define('spy-lazy-picture', SpyLazyPicture);
})();
