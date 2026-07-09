/**
 * dashboard.js — Dashboard-specific interactions.
 * Daily tip rotation is handled in main.js.
 */

// Animate stat cards on intersection
document.addEventListener('DOMContentLoaded', () => {
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.style.animationPlayState = 'running';
          observer.unobserve(e.target);
        }
      });
    }, { threshold: 0.15 });

    document.querySelectorAll('.animate-slide-up, .animate-fade-in').forEach(el => {
      el.style.animationPlayState = 'paused';
      observer.observe(el);
    });
  }
});
