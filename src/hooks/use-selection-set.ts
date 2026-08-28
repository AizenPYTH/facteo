import { useCallback, useMemo, useState } from 'react';

/**
 * Generic multi-select set for list batch actions.
 */
export function useSelectionSet(ids: readonly string[] = []) {
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(() => new Set());

  const visibleIdSet = useMemo(() => new Set(ids), [ids]);

  const selectedCount = selectedIds.size;
  const selectedVisibleCount = useMemo(() => {
    let count = 0;
    for (const id of selectedIds) {
      if (visibleIdSet.has(id)) count += 1;
    }
    return count;
  }, [selectedIds, visibleIdSet]);

  const allVisibleSelected =
    ids.length > 0 && selectedVisibleCount === ids.length;

  const enterSelectionMode = useCallback((seedId?: string) => {
    setSelectionMode(true);
    if (seedId) {
      setSelectedIds(new Set([seedId]));
    }
  }, []);

  const exitSelectionMode = useCallback(() => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  }, []);

  const toggle = useCallback((id: string) => {
    setSelectedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const selectAllVisible = useCallback(() => {
    setSelectedIds(new Set(ids));
  }, [ids]);

  const clearSelection = useCallback(() => {
    setSelectedIds(new Set());
  }, []);

  const isSelected = useCallback((id: string) => selectedIds.has(id), [selectedIds]);

  const getSelectedIds = useCallback(() => Array.from(selectedIds), [selectedIds]);

  return {
    selectionMode,
    selectedIds,
    selectedCount,
    allVisibleSelected,
    enterSelectionMode,
    exitSelectionMode,
    toggle,
    selectAllVisible,
    clearSelection,
    isSelected,
    getSelectedIds,
  };
}
