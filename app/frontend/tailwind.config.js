import themeConfig from '../../theme.config.json'

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: themeConfig.colors.primary,
        secondary: themeConfig.colors.secondary,
        accent: themeConfig.colors.accent,
        success: themeConfig.colors.success,
        warning: themeConfig.colors.warning,
        error: themeConfig.colors.error,
        neutral: themeConfig.colors.neutral,
      },
      fontFamily: {
        sans: themeConfig.typography.fontFamily.sans,
        mono: themeConfig.typography.fontFamily.mono,
      },
      borderRadius: {
        sm: themeConfig.borderRadius.sm,
        md: themeConfig.borderRadius.md,
        lg: themeConfig.borderRadius.lg,
        xl: themeConfig.borderRadius.xl,
      },
      maxWidth: {
        container: themeConfig.spacing.containerMaxWidth,
      },
    },
  },
  plugins: [],
}
