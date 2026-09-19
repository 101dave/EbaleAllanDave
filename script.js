// script.js
document.addEventListener("DOMContentLoaded", () => {
  const toggleBtn = document.getElementById("Dark");

  // Check saved preference on page load
  if (localStorage.getItem("darkMode") === "enabled") {
    enableDarkMode();
    if (toggleBtn) toggleBtn.checked = true;
  }

  // Toggle dark mode and save preference
  if (toggleBtn) {
    toggleBtn.addEventListener("change", () => {
      if (toggleBtn.checked) {
        enableDarkMode();
        localStorage.setItem("darkMode", "enabled");
      } else {
        disableDarkMode();
        localStorage.setItem("darkMode", "disabled");
      }
    });
  }

  function enableDarkMode() {
    document.body.classList.add("dark-mode");

    const header = document.querySelector("header");
    if (header) header.classList.add("dark-mode");

    document.querySelectorAll(".Nav-Links a").forEach(link => {
      link.classList.add("dark-mode");
    });

    const contactBox = document.querySelector(".contact-container");
    if (contactBox) contactBox.classList.add("dark-mode");

    const resumeBox = document.querySelector(".resume");
    if (resumeBox) resumeBox.classList.add("dark-mode");

    const sectionBox = document.querySelector("section");
    if (sectionBox) sectionBox.classList.add("dark-mode");

    document.querySelectorAll(".Socials-Links a").forEach(link => {
      link.classList.add("dark-mode");
    });

    document.querySelectorAll(".project-item").forEach(item => {
      item.classList.add("dark-mode");
    });

    const footer = document.querySelector(".footer-socials");
    if (footer) footer.classList.add("dark-mode");
  }

  function disableDarkMode() {
    document.body.classList.remove("dark-mode");

    const header = document.querySelector("header");
    if (header) header.classList.remove("dark-mode");

    document.querySelectorAll(".Nav-Links a").forEach(link => {
      link.classList.remove("dark-mode");
    });

    const contactBox = document.querySelector(".contact-container");
    if (contactBox) contactBox.classList.remove("dark-mode");

    const resumeBox = document.querySelector(".resume");
    if (resumeBox) resumeBox.classList.remove("dark-mode");

    const sectionBox = document.querySelector("section");
    if (sectionBox) sectionBox.classList.remove("dark-mode");

    document.querySelectorAll(".Socials-Links a").forEach(link => {
      link.classList.remove("dark-mode");
    });

    document.querySelectorAll(".project-item").forEach(item => {
      item.classList.remove("dark-mode");
    });

    const footer = document.querySelector(".footer-socials");
    if (footer) footer.classList.remove("dark-mode");
  }
});
