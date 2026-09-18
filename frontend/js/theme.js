/* =============================================
   THEME MANAGER — StudyFlow
   Handles dark / light mode toggle
   Saves preference to localStorage
============================================= */

const ThemeManager = (function () {

    // The key we save in localStorage
    const STORAGE_KEY = 'studyflow-theme';

    // Read saved theme — default to 'light'
    function getSavedTheme() {
        return localStorage.getItem(STORAGE_KEY) || 'light';
    }

    // Apply theme to <html> tag
    function applyTheme(theme) {
        $('html').attr('data-theme', theme);
    }

    // Sync the toggle switch position
    function syncToggle(theme) {
        if (theme === 'dark') {
            $('#themeSwitch').prop('checked', true);
        } else {
            $('#themeSwitch').prop('checked', false);
        }
    }

    // Save theme to localStorage
    function saveTheme(theme) {
        localStorage.setItem(STORAGE_KEY, theme);
    }

    // Get current active theme
    function getCurrentTheme() {
        return $('html').attr('data-theme') || 'light';
    }

    // Initialize — called on page load
    function init() {
        const saved = getSavedTheme();
        applyTheme(saved);
        syncToggle(saved);

        // Listen for toggle switch change
        $('#themeSwitch').on('change', function () {
            const newTheme = $(this).is(':checked') ? 'dark' : 'light';
            applyTheme(newTheme);
            saveTheme(newTheme);

            // Show a little toast feedback
            const msg = newTheme === 'dark'
                ? '🌙 Dark mode on!'
                : '☀️ Light mode on!';
            showToast(msg, 'info');
        });
    }

    // Public API
    return { init, getCurrentTheme };

})();
/* =============================================
   TOAST NOTIFICATION HELPER
   Used across the whole app
============================================= */

function showToast(message, type = 'info', duration = 3000) {
    // Remove any existing toast first
    $('.toast-notification').remove();

    // Create toast element
    const toast = $(`
        <div class="toast-notification ${type}">
            ${message}
        </div>
    `);

    // Add to page
    $('body').append(toast);

    // Animate in after tiny delay
    setTimeout(() => toast.addClass('show'), 50);

    // Auto remove after duration
    setTimeout(() => {
        toast.removeClass('show');
        setTimeout(() => toast.remove(), 400);
    }, duration);
}