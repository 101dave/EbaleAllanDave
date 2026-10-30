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
      var activeDark = !currentlyDark();
      body.classList.toggle("dark-mode", activeDark);
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
    deck.setAttribute("tabindex", "0");
    deck.setAttribute("aria-roledescription", "carousel");
    deck.setAttribute("aria-label", "Projects. Use left and right arrow keys to browse.");
    var cards = Array.prototype.slice.call(deck.querySelectorAll(".deck-card"));
    var stage = deck.querySelector(".deck-stage");
    var status = document.getElementById("deckStatus");
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
        card.setAttribute("aria-hidden", isCenter ? "false" : "true");

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
      if (status) {
        var heading = cards[idx].querySelector("h3");
        status.textContent = "Project " + (idx + 1) + " of " + n + ": " + (heading ? heading.textContent.trim() : "");
      }
    }

    function select(nextIndex) {
      // Do not hide a card while keyboard focus is still inside it.
      if (cards[idx].contains(document.activeElement)) deck.focus({ preventScroll: true });
      idx = nextIndex;
      render();
    }

    function go(delta) {
      select((((idx + delta) % n) + n) % n);
    }

    // Click a side card to bring it to the center
    cards.forEach(function (card, i) {
      card.addEventListener("click", function (event) {
        if (swiped) { swiped = false; event.preventDefault(); return; }
        if (i === idx) return;
        event.preventDefault();
        select(i);
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

  /* ---------- Full-size project images ----------
     Each preview remains a normal image link when JS or <dialog> is unavailable. */
  var previewLinks = document.querySelectorAll("a[data-preview]");
  if (previewLinks.length) {
    var previewDialog = document.createElement("dialog");
    if (typeof previewDialog.showModal === "function") {
      previewDialog.className = "preview-dialog";
      previewDialog.setAttribute("aria-labelledby", "projectPreviewTitle");
      previewDialog.setAttribute("aria-describedby", "projectPreviewCaption");
      previewDialog.innerHTML =
        '<div class="preview-dialog__header">' +
          '<h2 class="preview-dialog__title" id="projectPreviewTitle"></h2>' +
          '<button type="button" class="preview-dialog__close" aria-label="Close preview">&times;</button>' +
        '</div>' +
        '<div class="preview-dialog__media"><img alt=""></div>' +
        '<div class="preview-dialog__footer">' +
          '<p class="preview-dialog__caption" id="projectPreviewCaption"></p>' +
          '<div class="preview-dialog__actions">' +
            '<button type="button" class="preview-dialog__zoom" aria-pressed="false">Zoom in</button>' +
            '<a class="preview-dialog__original" target="_blank" rel="noopener noreferrer">Open original &#8599;</a>' +
          '</div>' +
        '</div>';
      body.appendChild(previewDialog);

      var previewTitle = previewDialog.querySelector(".preview-dialog__title");
      var previewCaption = previewDialog.querySelector(".preview-dialog__caption");
      var previewMedia = previewDialog.querySelector(".preview-dialog__media");
      var previewImage = previewMedia.querySelector("img");
      var previewOriginal = previewDialog.querySelector(".preview-dialog__original");
      var previewClose = previewDialog.querySelector(".preview-dialog__close");
      var previewZoom = previewDialog.querySelector(".preview-dialog__zoom");
      var previewTrigger = null;
      var previewBaseCaption = "";

      function setPreviewZoom(zoomed) {
        previewMedia.classList.toggle("preview-dialog__media--zoomed", zoomed);
        previewCaption.textContent = previewBaseCaption + (zoomed ? " Scroll the image to explore." : "");
        previewZoom.setAttribute("aria-pressed", String(zoomed));
        previewZoom.textContent = zoomed ? "Zoom out" : "Zoom in";
        if (zoomed) {
          previewMedia.setAttribute("tabindex", "0");
          previewMedia.setAttribute("aria-label", "Zoomed preview; scroll to explore");
          previewMedia.setAttribute("role", "region");
        } else {
          previewMedia.removeAttribute("tabindex");
          previewMedia.removeAttribute("aria-label");
          previewMedia.removeAttribute("role");
        }
        previewMedia.scrollTop = 0;
        previewMedia.scrollLeft = 0;
      }

      document.addEventListener("click", function (event) {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey ||
            event.ctrlKey || event.shiftKey || event.altKey || !event.target.closest) return;
        var link = event.target.closest("a[data-preview]");
        if (!link || previewDialog.open) return;
        var image = link.querySelector("img");
        if (!image) return;

        previewTitle.textContent = link.getAttribute("data-preview-title") || "Project preview";
        previewBaseCaption = link.getAttribute("data-preview-caption") || "";
        previewImage.src = link.href;
        previewImage.alt = image.alt;
        previewOriginal.href = link.href;
        setPreviewZoom(false);
        previewMedia.classList.toggle("preview-dialog__media--terminal", link.classList.contains("thumb--terminal") || link.classList.contains("case-preview--terminal"));
        previewTrigger = link;
        try {
          previewDialog.showModal();
          event.preventDefault();
          previewClose.focus();
        } catch (_) {
          // Keep the original link usable if the browser cannot open a modal.
          previewTrigger = null;
        }
      });

      previewZoom.addEventListener("click", function () {
        setPreviewZoom(previewZoom.getAttribute("aria-pressed") !== "true");
      });
      previewDialog.addEventListener("keydown", function (event) {
        if (event.key !== "Tab") return;
        var focusable = previewDialog.querySelectorAll('button:not([disabled]), a[href], [tabindex="0"]');
        var first = focusable[0];
        var last = focusable[focusable.length - 1];
        if (event.shiftKey && document.activeElement === first) {
          event.preventDefault();
          last.focus();
        } else if (!event.shiftKey && document.activeElement === last) {
          event.preventDefault();
          first.focus();
        }
      });
      previewClose.addEventListener("click", function () { previewDialog.close(); });
      previewDialog.addEventListener("click", function (event) {
        if (event.target === previewDialog) previewDialog.close();
      });
      previewDialog.addEventListener("close", function () {
        if (previewTrigger && document.contains(previewTrigger)) {
          previewTrigger.focus({ preventScroll: true });
        }
        previewTrigger = null;
      });
    }
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
