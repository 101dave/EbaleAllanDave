/* =========================================================
   Allan Dave Ebale — Portfolio
   Shared behaviour: theme toggle, mobile nav, project deck,
   contact form. Loaded with `defer`, so the DOM is parsed.
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

  /* ---------- Project deck (bryl-style carousel) ----------
     No buttons: click a side card to bring it to the center.
     Keyboard arrows and swipe still work. */
  var deck = document.getElementById("projectDeck");
  if (deck) {
    var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck-card"));
    var stage = deck.querySelector(".deck-stage");
    var n = cards.length;
    var idx = 0;
    var swiped = false;

    function render() {
      cards.forEach(function (card, i) {
        var rel = (((i - idx) % n) + n) % n;
        var pos = rel === 0 ? "pos-center" : rel === 1 ? "pos-right" : rel === n - 1 ? "pos-left" : "is-hidden";
        card.classList.remove("pos-center", "pos-right", "pos-left", "is-hidden");
        card.classList.add(pos);

        var isCenter = pos === "pos-center";
        card.setAttribute("aria-hidden", pos === "is-hidden" ? "true" : "false");

        // Only the centered card exposes its links to the keyboard;
        // side cards are click targets that bring themselves forward.
        Array.prototype.forEach.call(card.querySelectorAll("a"), function (link) {
          if (isCenter) {
            link.removeAttribute("tabindex");
          } else {
            link.setAttribute("tabindex", "-1");
          }
        });
      });
    }

    function go(delta) {
      idx = (((idx + delta) % n) + n) % n;
      render();
    }

    // Click a side card to bring it to the center
    cards.forEach(function (card, i) {
      card.addEventListener("click", function (event) {
        if (swiped) { swiped = false; return; }
        if (i === idx) return;
        event.preventDefault();
        idx = i;
        render();
      });
    });

    // Keyboard support
    deck.addEventListener("keydown", function (event) {
      if (event.key === "ArrowLeft") { event.preventDefault(); go(-1); }
      if (event.key === "ArrowRight") { event.preventDefault(); go(1); }
    });

    // Swipe support (touch & mouse drag)
    var startX = null;
    stage.addEventListener("pointerdown", function (event) { startX = event.clientX; swiped = false; });
    stage.addEventListener("pointerup", function (event) {
      if (startX === null) return;
      var dx = event.clientX - startX;
      if (Math.abs(dx) > 40) {
        swiped = true;
        go(dx < 0 ? 1 : -1);
      }
      startX = null;
    });
    stage.addEventListener("pointercancel", function () { startX = null; });

    render();
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
