import {
  createSystem,
  defaultConfig,
  defineConfig,
  defineGlobalStyles,
  defineSemanticTokens,
  defineTokens,
} from '@chakra-ui/react';

const tokens = defineTokens({
  colors: {
    brand: {
      50: { value: '#e3f2fd' },
      100: { value: '#bbdefb' },
      200: { value: '#90caf9' },
      300: { value: '#64b5f6' },
      400: { value: '#42a5f5' },
      500: { value: '#1e88e5' },
      600: { value: '#1976d2' },
      700: { value: '#1565c0' },
      800: { value: '#0d47a1' },
      900: { value: '#0b3c84' },
    },
  },
  fonts: {
    heading: {
      value:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
    body: {
      value:
        'Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    },
  },
});

const semanticTokens = defineSemanticTokens({
  colors: {
    'bg.canvas': {
      value: { base: '{colors.gray.100}', _dark: '{colors.gray.900}' },
    },
    'bg.surface': {
      value: { base: 'white', _dark: '{colors.gray.800}' },
    },
    'fg.default': {
      value: { base: '{colors.gray.900}', _dark: '{colors.gray.100}' },
    },
    'fg.muted': {
      value: { base: '{colors.gray.600}', _dark: '{colors.gray.300}' },
    },
  },
});

const globalCss = defineGlobalStyles({
  body: {
    bg: 'bg.canvas',
    bgGradient: 'linear(to-br, brand.50, bg.canvas, white)',
    color: 'fg.default',
    backgroundAttachment: 'fixed',
  },
  '#root': {
    minHeight: '100vh',
  },
});

const customConfig = defineConfig({
  theme: {
    tokens,
    semanticTokens,
  },
  globalCss,
});

export const system = createSystem(defaultConfig, customConfig);
