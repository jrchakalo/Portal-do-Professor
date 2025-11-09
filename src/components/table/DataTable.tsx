import {
  Box,
  TableBody,
  TableCaption,
  TableCell,
  TableColumnHeader,
  TableHeader,
  TableRow,
  TableRoot,
} from '@chakra-ui/react';
import type { ReactElement, ReactNode } from 'react';

interface DataTableProps {
  headers: ReactNode[];
  rows: ReactNode[];
  caption?: ReactNode;
  emptyState?: ReactNode;
}

export const DataTable = ({ headers, rows, caption, emptyState }: DataTableProps): ReactElement => {
  const renderEmptyState = emptyState ?? (
    <Box px={4} py={6} textAlign="center" color="fg.muted">
      Nenhum registro encontrado.
    </Box>
  );

  return (
    <Box borderWidth="1px" borderRadius="lg" overflow="hidden" bg="white" _dark={{ bg: 'gray.800' }}>
      <TableRoot variant="outline">
        {caption ? <TableCaption>{caption}</TableCaption> : null}
        <TableHeader>
          <TableRow>
            {headers.map((header, index) => (
              <TableColumnHeader key={index}>{header}</TableColumnHeader>
            ))}
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.length > 0 ? (
            rows
          ) : (
            <TableRow>
              <TableCell colSpan={headers.length}>{renderEmptyState}</TableCell>
            </TableRow>
          )}
        </TableBody>
      </TableRoot>
    </Box>
  );
};
