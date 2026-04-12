"use client";

import { useCallback, useEffect, useState } from "react";
import { adminJsonFetch } from "@/lib/api/admin-client";
import type { PaginatedApiResponse } from "@/app/admin/admin-types";

interface BaseMapping {
  id: number;
  matchedCardId: number | null;
  status: string;
  candidates: unknown[];
}

interface UseAdminMatchingOptions<T extends PaginatedApiResponse> {
  apiEndpoint: string;
  defaultStatus?: string;
  extraParams?: () => URLSearchParams;
  perPage?: number;
  parseResponse?: (json: T) => void;
}

export function useAdminMatching<T extends PaginatedApiResponse>({
  apiEndpoint,
  defaultStatus = "suggested",
  extraParams,
  perPage: defaultPerPage = 20,
}: UseAdminMatchingOptions<T>) {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState(defaultStatus);
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState(defaultPerPage);
  const [saving, setSaving] = useState<Set<number>>(new Set());
  const [bulkBusy, setBulkBusy] = useState(false);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [pickedCandidate, setPickedCandidate] = useState<Record<number, number>>({});

  useEffect(() => { setSelected(new Set()); }, [data]);
  useEffect(() => {
    const t = setTimeout(() => { setSearchQuery(searchInput); setPage(1); }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const params = extraParams?.() ?? new URLSearchParams();
    if (statusFilter) params.set("status", statusFilter);
    if (searchQuery) params.set("q", searchQuery);
    params.set("page", String(page));
    params.set("limit", String(perPage));
    const res = await fetch(`${apiEndpoint}?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [apiEndpoint, statusFilter, searchQuery, page, perPage, extraParams]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addSaving = (id: number) => setSaving((s) => new Set(s).add(id));
  const removeSaving = (id: number) => setSaving((s) => { const n = new Set(s); n.delete(id); return n; });

  const handleApprove = async (mappingId: number, cardId: number) => {
    addSaving(mappingId);
    await adminJsonFetch(apiEndpoint, { method: "PATCH", body: { id: mappingId, matchedCardId: cardId } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleUnmatch = async (mappingId: number) => {
    addSaving(mappingId);
    await adminJsonFetch(apiEndpoint, { method: "PATCH", body: { id: mappingId, action: "unmatch" } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleReject = async (mappingId: number) => {
    addSaving(mappingId);
    await adminJsonFetch(apiEndpoint, { method: "DELETE", body: { id: mappingId } });
    removeSaving(mappingId);
    await fetchData();
  };

  const handleBulkApproveSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Approve ${ids.length} รายการที่เลือก?`)) return;
    setBulkBusy(true);
    const overrides: Record<string, number> = {};
    for (const id of ids) { if (pickedCandidate[id]) overrides[String(id)] = pickedCandidate[id]; }
    await adminJsonFetch(apiEndpoint, { method: "PATCH", body: { action: "bulk-approve-ids", ids, overrides } });
    setBulkBusy(false);
    await fetchData();
  };

  const handleBulkRejectSelected = async () => {
    const ids = [...selected];
    if (ids.length === 0) return;
    if (!confirm(`Reject ${ids.length} รายการที่เลือก?`)) return;
    setBulkBusy(true);
    await adminJsonFetch(apiEndpoint, { method: "PATCH", body: { action: "bulk-reject-ids", ids } });
    setBulkBusy(false);
    await fetchData();
  };

  const toggleSelect = (id: number) => {
    setSelected((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  };

  const toggleSelectAll = (mappings: BaseMapping[]) => {
    setSelected((s) => {
      const ids = mappings.map((m) => m.id);
      if (ids.every((id) => s.has(id))) return new Set();
      return new Set(ids);
    });
  };

  return {
    data,
    loading,
    statusFilter,
    setStatusFilter,
    searchInput,
    setSearchInput,
    page,
    setPage,
    perPage,
    setPerPage,
    saving,
    bulkBusy,
    selected,
    pickedCandidate,
    setPickedCandidate,
    fetchData,
    handleApprove,
    handleUnmatch,
    handleReject,
    handleBulkApproveSelected,
    handleBulkRejectSelected,
    toggleSelect,
    toggleSelectAll,
  };
}
