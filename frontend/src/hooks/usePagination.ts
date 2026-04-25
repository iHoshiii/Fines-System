import { useState, useMemo } from 'react';

const DEFAULT_PAGE_SIZE = 15;

export function usePagination<T>(items: T[], pageSize = DEFAULT_PAGE_SIZE) {
    const [currentPage, setCurrentPage] = useState(1);

    const totalPages = Math.ceil(items.length / pageSize);

    const paginatedItems = useMemo(
        () => items.slice((currentPage - 1) * pageSize, currentPage * pageSize),
        [items, currentPage, pageSize]
    );

    function resetPage() {
        setCurrentPage(1);
    }

    return { currentPage, setCurrentPage, totalPages, paginatedItems, resetPage };
}
