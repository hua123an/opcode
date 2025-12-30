import { ThemeMode } from '@/contexts/ThemeContext';

/**
 * Claude-themed syntax highlighting theme factory
 * Returns different syntax themes based on the current theme mode
 * Supports both Prism and HLJS key formats
 * 
 * @param theme - The current theme mode
 * @returns Syntax highlighting theme object
 */
export const getClaudeSyntaxTheme = (theme: ThemeMode): any => {
  const themes = {
    dark: {
      base: '#e3e8f0',
      background: 'transparent',
      comment: '#6b7280',
      punctuation: '#9ca3af',
      property: '#f59e0b', // Amber/Orange
      tag: '#8b5cf6', // Violet
      string: '#10b981', // Emerald Green
      function: '#818cf8', // Indigo
      keyword: '#c084fc', // Light Violet
      variable: '#a78bfa', // Light Purple
      operator: '#9ca3af',
    },
    gray: {
      base: '#e3e8f0',
      background: 'transparent',
      comment: '#71717a',
      punctuation: '#a1a1aa',
      property: '#fbbf24', // Yellow
      tag: '#a78bfa', // Light Purple
      string: '#34d399', // Green
      function: '#93bbfc', // Light Blue
      keyword: '#d8b4fe', // Light Purple
      variable: '#c084fc', // Purple
      operator: '#a1a1aa',
    },
    light: {
      base: '#24292e',
      background: 'transparent',
      comment: '#6a737d',
      punctuation: '#24292e',
      property: '#e36209', // Orange
      tag: '#6f42c1', // Purple
      string: '#22863a', // Green
      function: '#005cc5', // Blue
      keyword: '#d73a49', // Red/Pink
      variable: '#6f42c1', // Purple
      operator: '#24292e',
    },
    white: {
      base: '#000000',
      background: 'transparent',
      comment: '#6b7280',
      punctuation: '#374151',
      property: '#dc2626', // Red
      tag: '#5b21b6', // Deep Purple
      string: '#047857', // Dark Green
      function: '#1e40af', // Dark Blue
      keyword: '#6b21a8', // Dark Purple
      variable: '#6d28d9', // Dark Violet
      operator: '#374151',
    },
    custom: {
      // Default to dark theme colors for custom
      base: '#e3e8f0',
      background: 'transparent',
      comment: '#6b7280',
      punctuation: '#9ca3af',
      property: '#f59e0b',
      tag: '#8b5cf6',
      string: '#10b981',
      function: '#818cf8',
      keyword: '#c084fc',
      variable: '#a78bfa',
      operator: '#9ca3af',
    }
  };

  const colors = themes[theme] || themes.dark;

  // Base styles shared by Prism and HLJS
  const baseStyles = {
    color: colors.base,
    background: colors.background,
    textShadow: 'none',
    fontFamily: 'var(--font-mono)',
    fontSize: '0.875em',
    textAlign: 'left' as 'left',
    whiteSpace: 'pre' as 'pre',
    wordSpacing: 'normal',
    wordBreak: 'normal',
    wordWrap: 'normal',
    lineHeight: '1.5',
    tabSize: '4',
    hyphens: 'none' as 'none',
  };

  return {
    // Prism Base
    'code[class*="language-"]': baseStyles,
    'pre[class*="language-"]': {
      ...baseStyles,
      padding: '1em',
      margin: '0',
      overflow: 'auto',
    },
    // HLJS Base
    'hljs': baseStyles,

    // Shared Tokens
    'comment': { color: colors.comment, fontStyle: 'italic' },
    'hljs-comment': { color: colors.comment, fontStyle: 'italic' },
    'hljs-quote': { color: colors.comment, fontStyle: 'italic' },

    'punctuation': { color: colors.punctuation },
    'hljs-punctuation': { color: colors.punctuation },

    'property': { color: colors.property },
    'hljs-attr': { color: colors.property },
    'hljs-attribute': { color: colors.property },
    'hljs-variable': { color: colors.property },
    'hljs-template-variable': { color: colors.property },

    'tag': { color: colors.tag },
    'hljs-section': { color: colors.tag },
    'hljs-name': { color: colors.tag },
    'hljs-selector-tag': { color: colors.tag },

    'string': { color: colors.string },
    'hljs-string': { color: colors.string },
    'hljs-bullet': { color: colors.string },
    'hljs-type': { color: colors.string },

    'function': { color: colors.function },
    'hljs-function': { color: colors.function },
    'hljs-title': { color: colors.function },
    'hljs-title.function_': { color: colors.function },

    'keyword': { color: colors.keyword },
    'hljs-keyword': { color: colors.keyword },
    'hljs-selector-attr': { color: colors.keyword },
    'hljs-selector-pseudo': { color: colors.keyword },

    'variable': { color: colors.variable },
    'hljs-params': { color: colors.variable },

    'operator': { color: colors.operator },
    'hljs-operator': { color: colors.operator },

    'number': { color: colors.property },
    'hljs-number': { color: colors.property },

    'constant': { color: colors.property },
    'hljs-variable.constant_': { color: colors.property },

    'boolean': { color: colors.property },
    'hljs-literal': { color: colors.property },

    'important': { fontWeight: 'bold' },
    'bold': { fontWeight: 'bold' },
    'italic': { fontStyle: 'italic' },

    'hljs-addition': { color: '#10b981', backgroundColor: 'rgba(16, 185, 129, 0.1)' },
    'hljs-deletion': { color: '#ef4444', backgroundColor: 'rgba(239, 68, 68, 0.1)' },
  };
};

// Export default dark theme for backward compatibility
export const claudeSyntaxTheme = getClaudeSyntaxTheme('dark');