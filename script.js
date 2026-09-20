document.addEventListener("DOMContentLoaded", () => {
  // Theme Toggle Functionality
  const themeToggle = document.getElementById("themeToggle");
  
  // Check persisted dark mode state
  const isDarkMode = localStorage.getItem("darkMode") === "enabled" ||
    (!localStorage.getItem("darkMode") && window.matchMedia("(prefers-color-scheme: dark)").matches);

  if (isDarkMode) {
    document.body.classList.add("dark-mode");
  }

  if (themeToggle) {
    themeToggle.addEventListener("click", () => {
      const activeDark = document.body.classList.toggle("dark-mode");
      document.documentElement.classList.remove("dark-mode-init");
      localStorage.setItem("darkMode", activeDark ? "enabled" : "disabled");
    });
  }

  // Mobile Menu Toggle Functionality
  const sidebar = document.getElementById("sidebar");
  const menuToggle = document.getElementById("menuToggle");

  if (menuToggle && sidebar) {
    menuToggle.addEventListener("click", () => {
      sidebar.classList.toggle("nav-open");
    });

    // Close menu when clicking outside on mobile view
    document.addEventListener("click", (event) => {
      if (!sidebar.contains(event.target) && sidebar.classList.contains("nav-open")) {
        sidebar.classList.remove("nav-open");
      }
    });
  }
});