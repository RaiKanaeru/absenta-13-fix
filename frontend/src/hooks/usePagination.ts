import { useState, useCallback, useEffect } from 'react';

interface UsePaginationOptions<T> {
  fetchFunction: (page: number, limit: number, search: string) => Promise<{
    data: T[];
    pagination?: {
      current_page: number;
      per_page: number;
      total: number;
      total_pages: number;
    };
  }>;
  initialPage?: number;
  initialLimit?: number;
  searchTerm?: string;
  dependencies?: any[];
}

interface UsePaginationReturn<T> {
  data: T[];
  loading: boolean;
  error: string | null;
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  setCurrentPage: (page: number) => void;
  setItemsPerPage: (limit: number) => void;
  refreshData: () => void;
  PaginationComponent: React.FC<{ className?: string }>;
}

export function usePagination<T = any>({
  fetchFunction,
  initialPage = 1,
  initialLimit = 20,
  searchTerm = '',
  dependencies = []
}: UsePaginationOptions<T>): UsePaginationReturn<T> {
  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(initialPage);
  const [itemsPerPage, setItemsPerPage] = useState(initialLimit);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetchFunction(currentPage, itemsPerPage, searchTerm);

      if (response.data) {
        setData(response.data);

        // Extract pagination metadata
        if (response.pagination) {
          setTotalItems(response.pagination.total);
          setTotalPages(response.pagination.total_pages);
        } else {
          // If no pagination metadata, assume single page
          setTotalItems(response.data.length);
          setTotalPages(1);
        }
      } else {
        setData([]);
        setTotalItems(0);
        setTotalPages(0);
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch data';
      setError(errorMessage);
      console.error('Pagination fetch error:', err);
    } finally {
      setLoading(false);
    }
  }, [fetchFunction, currentPage, itemsPerPage, searchTerm, ...dependencies]);

  // Fetch data when dependencies change
  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Reset to page 1 when search term changes
  useEffect(() => {
    if (searchTerm !== undefined) {
      setCurrentPage(1);
    }
  }, [searchTerm]);

  // Handler for page change
  const handlePageChange = useCallback((page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  }, [totalPages]);

  // Handler for items per page change
  const handleItemsPerPageChange = useCallback((limit: number) => {
    setItemsPerPage(limit);
    setCurrentPage(1); // Reset to first page when changing per-page
  }, []);

  // Refresh data function
  const refreshData = useCallback(() => {
    fetchData();
  }, [fetchData]);

  // Pagination component (lazy loaded to avoid circular dependency)
  const PaginationComponent: React.FC<{ className?: string }> = ({ className }) => {
    // Import Pagination component dynamically to avoid issues
    const { Pagination } = require('@/components/Pagination');
    
    return (
      <Pagination
        currentPage={currentPage}
        totalPages={totalPages}
        totalItems={totalItems}
        itemsPerPage={itemsPerPage}
        onPageChange={handlePageChange}
        onItemsPerPageChange={handleItemsPerPageChange}
        showItemsPerPage={true}
        className={className}
      />
    );
  };

  return {
    data,
    loading,
    error,
    currentPage,
    totalPages,
    totalItems,
    itemsPerPage,
    setCurrentPage: handlePageChange,
    setItemsPerPage: handleItemsPerPageChange,
    refreshData,
    PaginationComponent
  };
}

export default usePagination;


