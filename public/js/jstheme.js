// public/js/jstheme.js

// --- Search Form Logic ---
document.addEventListener('DOMContentLoaded', () => {
  const searchForm = document.getElementById('searchForm');
  if (searchForm) {
    searchForm.addEventListener('submit', function(event) {
      event.preventDefault();
      const input = searchForm.querySelector('input[name="query"]');
      const query = input ? input.value.trim() : '';
      if (query) {
        const slugifiedQuery = query.toLowerCase().replace(/\s+/g, '-');
        window.location.href = `/video/${slugifiedQuery}`;
      } else {
        window.location.href = `/video/`;
      }
    });
  }

  // --- Dark Mode Toggle Logic ---
  const toggleButton = document.getElementById('darkModeToggle');
  const body = document.body;
  const LIGHT_ICON = '☀️';
  const DARK_ICON = '🌙';
  const STORAGE_KEY = 'darkModeEnabled';

  function applyTheme(isDarkMode) {
    if (isDarkMode) {
      body.classList.add('dark-mode');
      if (toggleButton) toggleButton.textContent = DARK_ICON;
    } else {
      body.classList.remove('dark-mode');
      if (toggleButton) toggleButton.textContent = LIGHT_ICON;
    }
  }

  // Apply theme on load
  const savedMode = localStorage.getItem(STORAGE_KEY);
  if (savedMode === 'true') {
    applyTheme(true);
  } else if (savedMode === null && window.matchMedia('(prefers-color-scheme: dark)').matches) {
    applyTheme(true);
  } else {
    applyTheme(false);
  }

  // Add event listener for button click
  if (toggleButton) { // Pastikan tombol ada sebelum menambahkan event listener
    toggleButton.addEventListener('click', () => {
      const isCurrentlyDarkMode = body.classList.contains('dark-mode');
      const newMode = !isCurrentlyDarkMode;
      applyTheme(newMode);
      localStorage.setItem(STORAGE_KEY, newMode);
    });
  }
});