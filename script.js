/* =========================================================
   Allan Dave Ebale — Portfolio
   Shared behaviour: theme toggle, mobile nav, contact form.
   Loaded with `defer`, so the DOM is already parsed.
   ========================================================= */
(function () {
  "use strict";

  var root = document.documentElement;
  var body = document.body;

  function currentlyDark() {
    return body.classList.contains("dark-mode") ||
      root.classList.contains("dark-mode-init");
  }

  /* ---------- Theme toggle ---------- */
  var themeToggle = document.getElementById("themeToggle");
  if (themeToggle) {
    themeToggle.setAttribute("aria-pressed", String(currentlyDark()));
    themeToggle.addEventListener("click", function () {
      var activeDark = body.classList.toggle("dark-mode");
      root.classList.remove("dark-mode-init");
      try {
        localStorage.setItem("darkMode", activeDark ? "enabled" : "disabled");
      } catch (e) { /* storage unavailable (private mode) — ignore */ }
      themeToggle.setAttribute("aria-pressed", String(activeDark));
    });
  }

  /* ---------- Mobile navigation ---------- */
  var sidebar = document.getElementById("sidebar");
  var menuToggle = document.getElementById("menuToggle");

  function setNav(open) {
    sidebar.classList.toggle("nav-open", open);
    menuToggle.setAttribute("aria-expanded", String(open));
  }

  if (sidebar && menuToggle) {
    menuToggle.setAttribute("aria-expanded", "false");

    menuToggle.addEventListener("click", function (event) {
      event.stopPropagation();
      setNav(!sidebar.classList.contains("nav-open"));
    });

    // Close when tapping outside the sidebar
    document.addEventListener("click", function (event) {
      if (!sidebar.contains(event.target) && sidebar.classList.contains("nav-open")) {
        setNav(false);
      }
    });

    // Close with the Escape key (and return focus to the button)
    document.addEventListener("keydown", function (event) {
      if (event.key === "Escape" && sidebar.classList.contains("nav-open")) {
        setNav(false);
        menuToggle.focus();
      }
    });

    // Close after choosing a destination
    sidebar.querySelectorAll("nav.Nav-Links a").forEach(function (link) {
      link.addEventListener("click", function () { setNav(false); });
    });
  }

  /* ---------- Contact form → opens the visitor's mail app ---------- */
  var contactForm = document.getElementById("contactForm");
  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      var name = contactForm.querySelector("#name").value.trim();
      var email = contactForm.querySelector("#email").value.trim();
      var message = contactForm.querySelector("#message").value.trim();
      var status = document.getElementById("formStatus");

      var subject = encodeURIComponent("Portfolio message from " + name);
      var mailBody = encodeURIComponent(message + "\n\n— " + name + " (" + email + ")");
      window.location.href = "mailto:davea0153@gmail.com?subject=" + subject + "&body=" + mailBody;

      if (status) {
        status.textContent = "Opening your mail app… if nothing happens, email davea0153@gmail.com directly.";
      }
    });
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll(".year").forEach(function (el) {
    el.textContent = new Date().getFullYear();
  });
})();
