/*
 * Light/dark theme switching. Loaded in <head> without defer so the saved theme is
 * applied before the page is painted (no flash of the wrong theme).
 *
 * The theme is set as Bootstrap's data-bs-theme attribute on <html>. A saved choice
 * wins; otherwise the operating system preference is used.
 */
(function () {
	var STORAGE_KEY = 'petclinic-theme';
	var root = document.documentElement;
	var systemDark = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

	function savedTheme() {
		try {
			var theme = localStorage.getItem(STORAGE_KEY);
			return theme === 'light' || theme === 'dark' ? theme : null;
		}
		catch (e) {
			return null;
		}
	}

	function systemTheme() {
		return systemDark && systemDark.matches ? 'dark' : 'light';
	}

	function applyTheme(theme) {
		root.setAttribute('data-bs-theme', theme);
		var toggle = document.getElementById('theme-toggle');
		if (toggle) {
			toggle.checked = theme === 'dark';
		}
	}

	applyTheme(savedTheme() || systemTheme());

	// Follow OS changes until the user picks a theme themselves.
	if (systemDark && systemDark.addEventListener) {
		systemDark.addEventListener('change', function () {
			if (!savedTheme()) {
				applyTheme(systemTheme());
			}
		});
	}

	document.addEventListener('DOMContentLoaded', function () {
		var toggle = document.getElementById('theme-toggle');
		if (!toggle) {
			return;
		}
		toggle.checked = root.getAttribute('data-bs-theme') === 'dark';
		toggle.addEventListener('change', function () {
			var theme = toggle.checked ? 'dark' : 'light';
			applyTheme(theme);
			try {
				localStorage.setItem(STORAGE_KEY, theme);
			}
			catch (e) {
				// Storage unavailable (private mode): the theme still applies for this page.
			}
		});
	});
})();
