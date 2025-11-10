/* eslint-disable react-refresh/only-export-components */
import { ChakraProvider } from '@chakra-ui/react';
import { render } from '@testing-library/react';
import type { RenderOptions } from '@testing-library/react';
import type { ReactElement } from 'react';

import { system } from './styles/theme';

const renderWithProviders = (
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>,
) => {
  return render(ui, {
    wrapper: ({ children }) => <ChakraProvider value={system}>{children}</ChakraProvider>,
    ...options,
  });
};

export * from '@testing-library/react';
export { renderWithProviders as render };
