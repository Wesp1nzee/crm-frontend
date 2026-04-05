import { useCallback, useMemo, useState } from "react";

export type SortField = "filename" | "file_size" | "content_type";
export type SortOrder = "asc" | "desc";

export interface FileItemLike {
  id: string;
  filename: string;
  content_type: string;
  file_size: number;
}

/**
 * Hook for client-side search, sort, and selection of file lists.
 */
export function useFileFilterSort<T extends FileItemLike>(files: T[]) {
  const [searchQuery, setSearchQuery] = useState("");
  const [sortField, setSortField] = useState<SortField>("filename");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filteredAndSorted = useMemo(() => {
    let result = files;

    // Filter by search query
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((f) => f.filename.toLowerCase().includes(q));
    }

    // Sort
    result = [...result].sort((a, b) => {
      let cmp = 0;
      if (sortField === "filename") {
        cmp = a.filename.localeCompare(b.filename);
      } else if (sortField === "file_size") {
        cmp = a.file_size - b.file_size;
      } else if (sortField === "content_type") {
        cmp = a.content_type.localeCompare(b.content_type);
      }
      return sortOrder === "asc" ? cmp : -cmp;
    });

    return result;
  }, [files, searchQuery, sortField, sortOrder]);

  const handleSort = useCallback(
    (field: SortField) => {
      if (sortField === field) {
        setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
      } else {
        setSortField(field);
        setSortOrder("asc");
      }
    },
    [sortField],
  );

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAll = useCallback(() => {
    setSelectedIds(new Set(filteredAndSorted.map((f) => f.id)));
  }, [filteredAndSorted]);

  const deselectAll = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);
  const isAllSelected = filteredAndSorted.length > 0 && filteredAndSorted.every((f) => selectedIds.has(f.id));

  return {
    searchQuery,
    setSearchQuery,
    sortField,
    sortOrder,
    handleSort,
    selectedIds,
    toggleSelect,
    selectAll,
    deselectAll,
    isSelected,
    isAllSelected,
    filteredAndSorted,
  };
}
