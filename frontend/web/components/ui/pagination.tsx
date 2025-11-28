/**
 * Pagination Component
 * Presentation layer - Componente reutilizable de paginación
 * Extraído y adaptado desde OrdersTable, manteniendo estructura pero optimizado
 */

'use client';

import React from 'react';

export interface PaginationProps {
  /** Número total de items */
  totalItems: number;
  /** Items por página */
  itemsPerPage?: number;
  /** Página actual (1-indexed) */
  currentPage: number;
  /** Callback cuando cambia la página */
  onPageChange: (page: number) => void;
  /** Clase CSS adicional */
  className?: string;
  /** Texto personalizado para el label (opcional) */
  labelText?: string;
}

/**
 * Pagination - Componente reutilizable de paginación
 * Adaptado desde OrdersTable con mejoras de accesibilidad y diseño
 */
export function Pagination({
  totalItems,
  itemsPerPage = 10,
  currentPage,
  onPageChange,
  className = '',
  labelText,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Si no hay items o solo una página, no mostrar paginación
  if (totalItems === 0 || totalPages <= 1) {
    return null;
  }

  const startItem = totalItems > 0 ? (currentPage - 1) * itemsPerPage + 1 : 0;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const defaultLabel = (
    <>
      Mostrando <span className="font-medium">{startItem}</span> a{' '}
      <span className="font-medium">{endItem}</span> de{' '}
      <span className="font-medium">{totalItems}</span> resultados
    </>
  );

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange(page);
    }
  };

  // Generar números de página a mostrar
  const getPageNumbers = () => {
    const pages: Array<number | 'ellipsis'> = [];

    // Si hay pocas páginas, mostrar todas
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
      return pages;
    }

    // Siempre mostrar primera página
    pages.push(1);

    // Lógica para páginas intermedias
    if (currentPage <= 4) {
      // Cerca del inicio
      for (let i = 2; i <= 5; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    } else if (currentPage >= totalPages - 3) {
      // Cerca del final
      pages.push('ellipsis');
      for (let i = totalPages - 4; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // En el medio
      pages.push('ellipsis');
      for (let i = currentPage - 1; i <= currentPage + 1; i++) {
        pages.push(i);
      }
      pages.push('ellipsis');
      pages.push(totalPages);
    }

    return pages;
  };

  return (
    <div className={`flex items-center justify-between bg-white px-4 py-3 sm:px-6 ${className}`}>
      {/* Información de resultados (desktop) */}
      <div className="hidden sm:block">
        <p className="text-sm text-gray-700">
          {labelText || defaultLabel}
        </p>
      </div>

      {/* Controles de paginación */}
      {totalPages > 0 && (
        <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Paginación">
          {/* Botón Anterior */}
          <button
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className="relative inline-flex items-center rounded-l-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página anterior"
          >
            <span className="sr-only">Anterior</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>

          {/* Números de página */}
          {getPageNumbers().map((page, index) => {
            if (page === 'ellipsis') {
              return (
                <span
                  key={`ellipsis-${index}`}
                  className="relative inline-flex items-center px-4 py-2 text-sm font-semibold text-gray-700 ring-1 ring-inset ring-gray-300"
                >
                  ...
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <button
                key={page}
                onClick={() => handlePageClick(page)}
                className={`
                  relative inline-flex items-center px-4 py-2 text-sm font-semibold transition-colors duration-200
                  ring-1 ring-inset ring-gray-300
                  ${
                    isActive
                      ? 'z-10 bg-blue-600 text-white hover:bg-blue-700 focus:z-20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600'
                      : 'text-gray-900 hover:bg-gray-50 focus:z-20 focus:outline-offset-0'
                  }
                `}
                aria-label={`Ir a página ${page}`}
                aria-current={isActive ? 'page' : undefined}
              >
                {page}
              </button>
            );
          })}

          {/* Botón Siguiente */}
          <button
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className="relative inline-flex items-center rounded-r-md px-2 py-2 text-gray-400 ring-1 ring-inset ring-gray-300 hover:bg-gray-50 focus:z-20 focus:outline-offset-0 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Página siguiente"
          >
            <span className="sr-only">Siguiente</span>
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </button>
        </nav>
      )}
    </div>
  );
}

/**
 * usePagination - Hook para manejar lógica de paginación
 */
export function usePagination<T>(
  items: T[],
  itemsPerPage: number = 10
): {
  paginatedItems: T[];
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  goToNextPage: () => void;
  goToPreviousPage: () => void;
} {
  const [currentPage, setCurrentPage] = React.useState(1);

  const totalPages = Math.ceil(items.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = items.slice(startIndex, endIndex);

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(currentPage + 1);
    }
  };

  const goToPreviousPage = () => {
    if (currentPage > 1) {
      setCurrentPage(currentPage - 1);
    }
  };

  // Resetear a página 1 si cambian los items
  React.useEffect(() => {
    setCurrentPage(1);
  }, [items.length]);

  return {
    paginatedItems,
    currentPage,
    totalPages,
    setCurrentPage,
    goToNextPage,
    goToPreviousPage,
  };
}

