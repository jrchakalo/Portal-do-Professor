import {
  createSystem,
  defaultConfig,
  defineConfig,
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
      value: { base: '{colors.gray.50}', _dark: '{colors.gray.900}' },
    },
    'fg.muted': {
      value: { base: '{colors.gray.600}', _dark: '{colors.gray.300}' },
    },
  },
});

const customConfig = defineConfig({
  theme: {
    tokens,
    semanticTokens,
  },
});

export const system = createSystem(defaultConfig, customConfig);
