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

    red: {
      50: { value: '#ffe5e5' },
      100: { value: '#ffbaba' },
      200: { value: '#ff8f8f' },
      300: { value: '#ff6464' },
      400: { value: '#ff3a3a' },
      500: { value: '#e51f1f' },
      600: { value: '#c40c0c' },
      700: { value: '#9d0606' },
      800: { value: '#780303' },
      900: { value: '#530101' },
    },

    yellow: {
      50: { value: '#fffde6' },
      100: { value: '#fff7b8' },
      200: { value: '#ffef8a' },
      300: { value: '#ffe75c' },
      400: { value: '#ffdb2e' },
      500: { value: '#ffd000' },
      600: { value: '#d1aa00' },
      700: { value: '#a38500' },
      800: { value: '#756000' },
      900: { value: '#473c00' },
    },

    green: {
      50: { value: '#e6f9ed' },
      100: { value: '#b8eccd' },
      200: { value: '#8bdcae' },
      300: { value: '#5fcb8e' },
      400: { value: '#33b96f' },
      500: { value: '#1f9f56' },
      600: { value: '#177d44' },
      700: { value: '#105c33' },
      800: { value: '#083b21' },
      900: { value: '#001a10' },
    },

    beige: {
      50: { value: "#FFF8EE" },
      100: { value: "#F3E6D3" },
      200: { value: "#E5D2B3" },
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
