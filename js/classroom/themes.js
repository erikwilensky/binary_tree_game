// Theme system for the classroom game
class ThemeManager {
    constructor() {
        this.themes = {
            electric: {
                name: 'Electric Arena',
                colors: {
                    primary: '#1E1F2B',
                    secondary: '#27293A',
                    accent: '#4F7BFF',
                    success: '#25D68A',
                    warning: '#FFC542',
                    danger: '#FF5F6D',
                    background: '#1E1F2B',
                    card: '#27293A',
                    text: '#EDEEFF',
                    textLight: '#B8B9C5',
                    gradientStart: '#1E1F2B',
                    gradientEnd: '#27293A'
                }
            },
            carnival: {
                name: 'Classroom Carnival',
                colors: {
                    primary: '#F5F7FA',
                    secondary: '#E8EEF5',
                    accent: '#FF7A59',
                    success: '#85D67E',
                    warning: '#F5C94C',
                    danger: '#E8505B',
                    background: '#F5F7FA',
                    card: '#FFFFFF',
                    text: '#2A2E33',
                    textLight: '#6B7280',
                    gradientStart: '#F5F7FA',
                    gradientEnd: '#E8EEF5'
                }
            },
            scifi: {
                name: 'Sci-Fi Neon Grid',
                colors: {
                    primary: '#0B0C10',
                    secondary: '#1F2833',
                    accent: '#66FCF1',
                    success: '#45A29E',
                    warning: '#FFC542',
                    danger: '#FF4B5C',
                    background: '#0B0C10',
                    card: '#1F2833',
                    text: '#C5C6C7',
                    textLight: '#B7B7B7',
                    gradientStart: '#0B0C10',
                    gradientEnd: '#1F2833'
                }
            },
            hardtoread: {
                name: 'Hard to Read',
                colors: {
                    primary: '#FF00FF',
                    secondary: '#00FFFF',
                    accent: '#FFFF00',
                    success: '#FF00FF',
                    warning: '#00FFFF',
                    danger: '#FFFF00',
                    background: '#FF00FF',
                    card: '#00FFFF',
                    text: '#FFFF00',
                    textLight: '#FF00FF',
                    gradientStart: '#FF00FF',
                    gradientEnd: '#00FFFF'
                }
            },
            forest: {
                name: 'Forest Green',
                colors: {
                    primary: '#1B4332',
                    secondary: '#2D6A4F',
                    accent: '#52B788',
                    success: '#95D5B2',
                    warning: '#F4A261',
                    danger: '#E76F51',
                    background: '#081C15',
                    card: '#1B4332',
                    text: '#D8F3DC',
                    textLight: '#B7E4C7',
                    gradientStart: '#081C15',
                    gradientEnd: '#1B4332'
                }
            },
            sunset: {
                name: 'Sunset Orange',
                colors: {
                    primary: '#FF6B35',
                    secondary: '#F7931E',
                    accent: '#FFB347',
                    success: '#90EE90',
                    warning: '#FFD700',
                    danger: '#FF4500',
                    background: '#FFF8DC',
                    card: '#FFFFFF',
                    text: '#2C1810',
                    textLight: '#5C4033',
                    gradientStart: '#FFF8DC',
                    gradientEnd: '#FFE4B5'
                }
            },
            ocean: {
                name: 'Ocean Blue',
                colors: {
                    primary: '#023047',
                    secondary: '#219EBC',
                    accent: '#8ECAE6',
                    success: '#06FFA5',
                    warning: '#FFB703',
                    danger: '#FB8500',
                    background: '#001D3D',
                    card: '#023047',
                    text: '#E0F2FE',
                    textLight: '#B3E5FC',
                    gradientStart: '#001D3D',
                    gradientEnd: '#023047'
                }
            }
        };

        this.currentTheme = this.loadTheme();
        this.applyTheme(this.currentTheme);
    }

    loadTheme() {
        const saved = localStorage.getItem('classroom-theme');
        return saved && this.themes[saved] ? saved : 'electric';
    }

    saveTheme(themeName) {
        localStorage.setItem('classroom-theme', themeName);
    }

    getTheme(themeName) {
        return this.themes[themeName] || this.themes.electric;
    }

    applyTheme(themeName) {
        const theme = this.getTheme(themeName);
        const root = document.documentElement;

        // Apply CSS variables
        root.style.setProperty('--theme-primary', theme.colors.primary);
        root.style.setProperty('--theme-secondary', theme.colors.secondary);
        root.style.setProperty('--theme-accent', theme.colors.accent);
        root.style.setProperty('--theme-success', theme.colors.success);
        root.style.setProperty('--theme-warning', theme.colors.warning);
        root.style.setProperty('--theme-danger', theme.colors.danger);
        root.style.setProperty('--theme-background', theme.colors.background);
        root.style.setProperty('--theme-card', theme.colors.card);
        root.style.setProperty('--theme-text', theme.colors.text);
        root.style.setProperty('--theme-text-light', theme.colors.textLight);
        root.style.setProperty('--theme-gradient-start', theme.colors.gradientStart);
        root.style.setProperty('--theme-gradient-end', theme.colors.gradientEnd);

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

// Expose globally for game controller to access
window.themeManager = themeManager;

