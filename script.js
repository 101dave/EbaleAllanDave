document.addEventListener('DOMContentLoaded', () => {
  // 1. Dark Mode / Theme Toggle
  const themeBtn = document.getElementById('themeToggle');
  const savedTheme = localStorage.getItem('darkMode');
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;

  // I-check ang saved preference o system theme
  if (savedTheme === 'enabled' || (!savedTheme && prefersDark)) {
    document.body.classList.add('dark-mode');
  }

  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      document.body.classList.toggle('dark-mode');
      if (document.body.classList.contains('dark-mode')) {
        localStorage.setItem('darkMode', 'enabled');
      } else {
        localStorage.setItem('darkMode', 'disabled');
      }
    });
  }

  // 2. Active Link Highlighting kapag nag-s-scroll
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('nav.Nav-Links a[href^="#"]');

  function highlightNavOnScroll() {
    const scrollY = window.pageYOffset;

    sections.forEach((current) => {
      const sectionHeight = current.offsetHeight;
      const sectionTop = current.offsetTop - 100;
      const sectionId = current.getAttribute('id');

      if (scrollY > sectionTop && scrollY <= sectionTop + sectionHeight) {
        navLinks.forEach((link) => {
          link.classList.remove('active');
          if (link.getAttribute('href') === `#${sectionId}`) {
            link.classList.add('active');
          }
        });
      }
    });
  }

  window.addEventListener('scroll', highlightNavOnScroll);
});