/**
 * Data Table Component
 * Presentation layer - Tabla de datos mejorada y reutilizable
 * Adaptado desde diseño de referencia, manteniendo estructura pero optimizado para Aaron
 */

'use client';

import React, { useState, useMemo } from 'react';
import { Pagination } from './pagination';
import { StatusBadge } from './status-badge';
import { type StateType } from './budget-card';

// Icono de búsqueda SVG inline
const SearchIcon = ({ className = 'h-4 w-4' }: { className?: string }) => (
  <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
  </svg>
);

export interface TableColumn<T> {
  /** Clave del campo en los datos */
  key: string;
  /** Label para mostrar en el header */
  label: string;
  /** Si la columna es ordenable */
  sortable?: boolean;
  /** Renderizar celda personalizada */
  render?: (item: T, index: number) => React.ReactNode;
  /** Alineación del contenido */
  align?: 'left' | 'center' | 'right';
  /** Ancho de la columna */
  width?: string;
}

export interface DataTableProps<T> {
  /** Datos a mostrar */
  data: T[];
  /** Configuración de columnas */
  columns: TableColumn<T>[];
  /** Items por página */
  itemsPerPage?: number;
  /** Si está cargando */
  isLoading?: boolean;
  /** Skeleton component personalizado */
  skeleton?: React.ReactNode;
  /** Función para renderizar acciones personalizadas por fila */
  renderActions?: (item: T, index: number) => React.ReactNode;
  /** Columna para estado (si existe) */
  statusColumn?: {
    key: string;
    getStatus: (item: T) => StateType;
    onStatusClick?: (item: T) => void;
  };
  /** Indicador de actualización */
  isUpdating?: boolean;
  /** Mensaje cuando no hay datos */
  emptyMessage?: string;
  /** Clase CSS adicional */
  className?: string;
  /** Callback cuando se hace clic en una fila */
  onRowClick?: (item: T) => void;
}

type SortConfig = {
  key: string;
  direction: 'asc' | 'desc';
} | null;

/**
 * DataTable - Componente de tabla mejorado y reutilizable
 */
export function DataTable<T extends Record<string, any>>({
  data,
  columns,
  itemsPerPage = 10,
  isLoading = false,
  skeleton,
  renderActions,
  statusColumn,
  isUpdating = false,
  emptyMessage = 'No hay datos disponibles',
  className = '',
  onRowClick,
}: DataTableProps<T>) {
  const [currentPage, setCurrentPage] = useState(1);
  const [sortConfig, setSortConfig] = useState<SortConfig>(null);

  // Función para ordenar
  const handleSort = (key: string) => {
    setSortConfig((current) => {
      if (!current || current.key !== key) {
        return { key, direction: 'asc' };
      }
      if (current.direction === 'asc') {
        return { key, direction: 'desc' };
      }
      return null;
    });
  };

  // Datos ordenados
  const sortedData = useMemo(() => {
    if (!sortConfig) return data;

    return [...data].sort((a, b) => {
      const aValue = a[sortConfig.key];
      const bValue = b[sortConfig.key];

      const aStr = String(aValue || '').toLowerCase();
      const bStr = String(bValue || '').toLowerCase();

      if (aStr < bStr) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (aStr > bStr) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [data, sortConfig]);

  // Datos paginados
  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return sortedData.slice(start, start + itemsPerPage);
  }, [sortedData, currentPage, itemsPerPage]);

  const totalPages = Math.ceil(sortedData.length / itemsPerPage);

  // Skeleton por defecto
  const defaultSkeleton = (
    <div className="flex h-32 items-center justify-center">
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
    </div>
  );

  if (isLoading) {
    return <div className={className}>{skeleton || defaultSkeleton}</div>;
  }

  return (
    <div className={`overflow-hidden ${className}`}>
      {/* Indicador de actualización */}
      {isUpdating && (
        <div className="bg-blue-50 border-l-4 border-blue-500 text-blue-700 p-3 mb-4 rounded-md shadow-sm">
          <div className="flex items-center">
            <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-blue-500 mr-2"></div>
            <span className="text-sm font-medium">Actualizando datos...</span>
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              {/* Columna de acciones (si hay renderActions) */}
              {renderActions && (
                <th className="w-10 px-3 py-3.5 text-center">
                  <span className="sr-only">Acciones</span>
                </th>
              )}

              {/* Headers de columnas */}
              {columns.map((column) => (
                <th
                  key={column.key}
                  onClick={() => column.sortable !== false && handleSort(column.key)}
                  className={`
                    px-3 py-3.5 text-sm font-semibold text-gray-900
                    ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                    ${column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 transition-colors' : ''}
                    ${column.width ? `w-[${column.width}]` : ''}
                  `}
                  style={column.width ? { width: column.width } : undefined}
                >
                  <div className="flex items-center gap-1">
                    {column.label}
                    {sortConfig?.key === column.key && (
                      <span className="text-gray-400">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>

          <tbody className="divide-y divide-gray-200 bg-white">
            {paginatedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (renderActions ? 1 : 0)}
                  className="px-6 py-12 text-center text-sm text-gray-500"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              paginatedData.map((item, index) => (
                <tr
                  key={`row-${index}-${item.id || index}`}
                  className={`hover:bg-gray-50 transition-colors ${onRowClick ? 'cursor-pointer' : ''}`}
                  onClick={() => onRowClick && onRowClick(item)}
                >
                  {/* Columna de acciones */}
                  {renderActions && (
                    <td className="w-10 py-4 text-center">
                      {renderActions(item, index)}
                    </td>
                  )}

                  {/* Celdas de datos */}
                  {columns.map((column) => (
                    <td
                      key={column.key}
                      className={`
                        px-3 py-4 text-sm text-gray-900
                        ${column.align === 'center' ? 'text-center' : column.align === 'right' ? 'text-right' : 'text-left'}
                      `}
                    >
                      {column.render ? (
                        column.render(item, index)
                      ) : statusColumn && column.key === statusColumn.key ? (
                        <StatusBadge
                          state={statusColumn.getStatus(item)}
                          onClick={statusColumn.onStatusClick ? () => statusColumn.onStatusClick!(item) : undefined}
                        />
                      ) : (
                        <>{item[column.key] ?? '-'}</>
                      )}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {sortedData.length > 0 && (
        <Pagination
          totalItems={sortedData.length}
          itemsPerPage={itemsPerPage}
          currentPage={currentPage}
          onPageChange={setCurrentPage}
        />
      )}
    </div>
  );
}

