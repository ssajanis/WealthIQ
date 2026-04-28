'use client';

import { Button } from '@/components/ui/button';

interface Column<T> {
  key: keyof T;
  label: string;
  format?: (value: T[keyof T]) => string;
}

interface DataTableProps<T extends { id: string }> {
  rows: T[];
  columns: Column<T>[];
  onDelete: (id: string) => void;
  deleting?: string | null;
}

export default function DataTable<T extends { id: string }>({
  rows,
  columns,
  onDelete,
  deleting,
}: DataTableProps<T>) {
  if (rows.length === 0) {
    return (
      <p className="text-sm text-gray-500 py-4 text-center">
        No entries yet. Use the form above to add one.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-gray-200">
      <table className="w-full text-sm">
        <thead className="bg-gray-50 text-gray-600">
          <tr>
            {columns.map((col) => (
              <th key={String(col.key)} className="px-4 py-3 text-left font-medium">
                {col.label}
              </th>
            ))}
            <th className="px-4 py-3 text-right font-medium">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {rows.map((row) => (
            <tr key={row.id} className="bg-white hover:bg-gray-50 transition-colors">
              {columns.map((col) => (
                <td key={String(col.key)} className="px-4 py-3 text-gray-700">
                  {col.format ? col.format(row[col.key]) : String(row[col.key] ?? '')}
                </td>
              ))}
              <td className="px-4 py-3 text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onDelete(row.id)}
                  disabled={deleting === row.id}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  aria-label="Delete row"
                >
                  {deleting === row.id ? 'Deleting…' : 'Delete'}
                </Button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
