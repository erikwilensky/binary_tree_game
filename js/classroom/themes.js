// Theme system for the classroom game
class ThemeManager {
    constructor() {
        this.themes = {
            default: {
                name: 'Default',
                colors: {
                    primary: '#667eea',
                    secondary: '#764ba2',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    background: '#f8f9fa',
                    card: '#ffffff',
                    text: '#1f2937',
                    textLight: '#6b7280'
                }
            },
            dark: {
                name: 'Dark Mode',
                colors: {
                    primary: '#8b5cf6',
                    secondary: '#6366f1',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    background: '#111827',
                    card: '#1f2937',
                    text: '#f9fafb',
                    textLight: '#d1d5db'
                }
            },
            ocean: {
                name: 'Ocean',
                colors: {
                    primary: '#06b6d4',
                    secondary: '#0891b2',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    background: '#ecfeff',
                    card: '#ffffff',
                    text: '#0c4a6e',
                    textLight: '#075985'
                }
            },
            forest: {
                name: 'Forest',
                colors: {
                    primary: '#059669',
                    secondary: '#047857',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    background: '#f0fdf4',
                    card: '#ffffff',
                    text: '#064e3b',
                    textLight: '#065f46'
                }
            },
            sunset: {
                name: 'Sunset',
                colors: {
                    primary: '#f97316',
                    secondary: '#ea580c',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    background: '#fff7ed',
                    card: '#ffffff',
                    text: '#7c2d12',
                    textLight: '#9a3412'
                }
            },
            neon: {
                name: 'Neon',
                colors: {
                    primary: '#a855f7',
                    secondary: '#ec4899',
                    success: '#10b981',
                    warning: '#f59e0b',
                    danger: '#ef4444',
                    background: '#0f172a',
                    card: '#1e293b',
                    text: '#f1f5f9',
                    textLight: '#cbd5e1'
                }
            }
        };

        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        const saved = localStorage.getItem('classroom-theme');
        return saved && this.themes[saved] ? saved : 'default';
    }

    saveTheme(themeName) {
        localStorage.setItem('classroom-theme', themeName);
    }

    getTheme(themeName) {
        return this.themes[themeName] || this.themes.default;
    }

    applyTheme(themeName) {
        const theme = this.getTheme(themeName);
        const root = document.documentElement;

        // Apply CSS variables
        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-success', theme.colors.success);
        root.style.setProperty('--theme-warning', theme.colors.warning);
        root.style.setProperty('--theme-danger', theme.colors.danger);
        root.style.setProperty('--theme-background', theme.colors.background);
        root.style.setProperty('--theme-card', theme.colors.card);
        root.style.setProperty('--theme-text', theme.colors.text);
        root.style.setProperty('--theme-text-light', theme.colors.textLight);

        // Apply theme class to body
        document.body.className = document.body.className.replace(/theme-\w+/g, '');
        document.body.classList.add(`theme-${themeName}`);

        this.currentTheme = themeName;
        this.saveTheme(themeName);
    }

    getAvailableThemes() {
        return Object.keys(this.themes).map(key => ({
            key,
            ...this.themes[key]
        }));
    }
}

// Export singleton instance
const themeManager = new ThemeManager();

