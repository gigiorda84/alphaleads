"use client";

import React, { useState, useMemo } from "react";
import { Search, ChevronUp, ChevronDown } from "lucide-react";

export interface Column<T = Record<string, unknown>> {
  key: string;
  label: string;
  render?: (value: unknown, row: T) => React.ReactNode;
}

interface DataTableProps<T = Record<string, unknown>> {
  columns: Column<T>[];
  data: T[];
  pageSize?: number;
  searchable?: boolean;
  onSelectionChange?: (selectedRows: T[]) => void;
  totalCount?: number;
}

export default function DataTable<T extends Record<string, unknown>>({
  columns,
  data,
  pageSize = 25,
  searchable = false,
  onSelectionChange,
  totalCount,
}: DataTableProps<T>) {
  const [search, setSearch] = useState("");
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<number>>(new Set());

  /* ---- Filtering ---- */
  const filtered = useMemo(() => {
    if (!search.trim()) return data;
    const q = search.toLowerCase();
    return data.filter((row) =>
      columns.some((col) => {
        const val = row[col.key];
        return val !== null && val !== undefined && String(val).toLowerCase().includes(q);
      })
    );
  }, [data, search, columns]);

  /* ---- Sorting ---- */
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1;
      if (bVal == null) return -1;
      const cmp = String(aVal).localeCompare(String(bVal), undefined, { numeric: true });
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [filtered, sortKey, sortDir]);

  /* ---- Pagination ---- */
  const totalPages = Math.max(1, Math.ceil(sorted.length / pageSize));
  const safeCurrentPage = Math.min(page, totalPages);
  const paged = sorted.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const displayTotal = totalCount ?? data.length;

  /* ---- Selection ---- */
  function toggleRow(index: number) {
    const globalIndex = (safeCurrentPage - 1) * pageSize + index;
    const next = new Set(selectedIds);
    if (next.has(globalIndex)) {
      next.delete(globalIndex);
    } else {
      next.add(globalIndex);
    }
    setSelectedIds(next);
    onSelectionChange?.(sorted.filter((_, i) => next.has(i)));
  }

  function toggleAll() {
    const start = (safeCurrentPage - 1) * pageSize;
    const end = start + paged.length;
    const pageIndices = Array.from({ length: end - start }, (_, i) => start + i);
    const allSelected = pageIndices.every((i) => selectedIds.has(i));

    const next = new Set(selectedIds);
    if (allSelected) {
      pageIndices.forEach((i) => next.delete(i));
    } else {
      pageIndices.forEach((i) => next.add(i));
    }
    setSelectedIds(next);
    onSelectionChange?.(sorted.filter((_, i) => next.has(i)));
  }

  function handleSort(key: string) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
  }

  /* ---- Page numbers to show ---- */
  function getPageNumbers(): (number | "...")[] {
    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      pages.push(1);
      if (safeCurrentPage > 3) pages.push("...");
      const start = Math.max(2, safeCurrentPage - 1);
      const end = Math.min(totalPages - 1, safeCurrentPage + 1);
      for (let i = start; i <= end; i++) pages.push(i);
      if (safeCurrentPage < totalPages - 2) pages.push("...");
      pages.push(totalPages);
    }
    return pages;
  }

  const allPageSelected = paged.length > 0 && (() => {
    const start = (safeCurrentPage - 1) * pageSize;
    return paged.every((_, i) => selectedIds.has(start + i));
  })();

  return (
    <div
      className="bg-white rounded-xl border border-neutral-200 overflow-hidden"
      style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.04)" }}
    >
      {/* Search bar */}
      {searchable && (
        <div className="px-4 pt-4 pb-2">
          <div className="relative">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Cerca..."
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              className="w-full pl-9 pr-4 py-[9px] rounded-lg border border-neutral-200 bg-neutral-50 text-[13px] text-neutral-700 placeholder:text-neutral-400 focus:border-orange-500 focus:bg-white"
            />
          </div>
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-neutral-50 border-b border-neutral-200">
              {/* Checkbox header */}
              <th className="px-4 py-[10px] w-10">
                <input
                  type="checkbox"
                  checked={allPageSelected}
                  onChange={toggleAll}
                  className="cursor-pointer"
                  style={{ accentColor: "var(--orange-600)" }}
                />
              </th>
              {columns.map((col) => (
                <th
                  key={col.key}
                  onClick={() => handleSort(col.key)}
                  className="px-4 py-[10px] text-left text-[11px] font-bold uppercase text-neutral-500 cursor-pointer select-none whitespace-nowrap"
                  style={{ letterSpacing: "0.06em" }}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.label}
                    {sortKey === col.key ? (
                      sortDir === "asc" ? (
                        <ChevronUp size={12} />
                      ) : (
                        <ChevronDown size={12} />
                      )
                    ) : (
                      <span className="opacity-0 inline-flex">
                        <ChevronUp size={12} />
                      </span>
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + 1}
                  className="text-center py-12 text-[13px] text-neutral-400"
                >
                  Nessun risultato trovato
                </td>
              </tr>
            ) : (
              paged.map((row, rowIdx) => {
                const globalIdx = (safeCurrentPage - 1) * pageSize + rowIdx;
                const isSelected = selectedIds.has(globalIdx);
                return (
                  <tr
                    key={rowIdx}
                    className={`border-b border-neutral-100 hover:bg-neutral-50 transition-colors ${
                      isSelected ? "bg-orange-50/40" : ""
                    }`}
                  >
                    <td className="px-4 py-3 w-10">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleRow(rowIdx)}
                        className="cursor-pointer"
                        style={{ accentColor: "var(--orange-600)" }}
                      />
                    </td>
                    {columns.map((col) => (
                      <td
                        key={col.key}
                        className="px-4 py-3 text-[13px] text-neutral-700"
                      >
                        {col.render
                          ? col.render(row[col.key], row)
                          : row[col.key] != null
                          ? String(row[col.key])
                          : ""}
                      </td>
                    ))}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer: counter + pagination */}
      <div className="flex items-center justify-between px-4 py-3 border-t border-neutral-100">
        <p className="text-[13px] text-neutral-500">
          Mostrando {paged.length} di {displayTotal} lead
        </p>

        {totalPages > 1 && (
          <div className="flex items-center gap-1">
            {getPageNumbers().map((p, i) =>
              p === "..." ? (
                <span
                  key={`dots-${i}`}
                  className="px-2 text-[13px] text-neutral-400"
                >
                  ...
                </span>
              ) : (
                <button
                  key={p}
                  onClick={() => setPage(p as number)}
                  className={`px-[12px] py-[7px] rounded-md text-[13px] font-medium cursor-pointer transition-colors ${
                    safeCurrentPage === p
                      ? "bg-orange-600 text-white border-transparent"
                      : "bg-white text-neutral-600 border border-neutral-200 hover:bg-neutral-50"
                  }`}
                  style={
                    safeCurrentPage === p
                      ? { border: "none" }
                      : undefined
                  }
                >
                  {p}
                </button>
              )
            )}
          </div>
        )}
      </div>
    </div>
  );
}
