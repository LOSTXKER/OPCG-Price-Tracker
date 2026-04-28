"use client";

import { useCallback, useState } from "react";
import { toast } from "sonner";
import { useConfirm } from "@/components/admin/confirm-dialog";
import { adminFetch } from "./admin-fetch";

export type EditingId<TId = number> = TId | "new" | null;

export interface UseAdminCrudOptions<TId = number> {
  /** Base path for collection — e.g. `/api/admin/honey/achievements`. */
  basePath: string;
  /**
   * HTTP method to use when updating an existing record. Defaults to `PATCH`.
   * Most Honey routes use `PUT`; pass it here if so.
   */
  updateMethod?: "PATCH" | "PUT";
  /** Builds the path for an item by id. Defaults to `${basePath}/${id}`. */
  itemPath?: (id: TId) => string;
  /** Reload list after a successful save. Defaults to true. */
  reloadOnSave?: boolean;
  /** Reload list after a successful delete. Defaults to true. */
  reloadOnDelete?: boolean;
  /** Async reloader (typically `refetch` from `useAdminList`). */
  reload?: () => Promise<void> | void;
  /** Toast text shown on successful create. Pass null to disable. */
  createSuccessMessage?: string | null;
  /** Toast text shown on successful update. Pass null to disable. */
  updateSuccessMessage?: string | null;
  /** Toast text shown on successful delete. Pass null to disable. */
  deleteSuccessMessage?: string | null;
  /** Confirmation dialog when deleting. */
  deleteConfirm?: {
    title: string;
    description: (id: TId) => string;
    confirmLabel?: string;
  };
}

export interface UseAdminCrudResult<TId = number, TResponse = unknown> {
  /** Currently edited id, "new" for create, or null for closed editor. */
  editing: EditingId<TId>;
  /** Open the create form. */
  startCreate: () => void;
  /** Open the edit form for `id`. */
  startEdit: (id: TId) => void;
  /** Close the form and clear errors. */
  cancel: () => void;
  /** Save form payload. POST when `editing === "new"`, otherwise PATCH/PUT to itemPath. */
  save: (payload: unknown) => Promise<TResponse | null>;
  /** DELETE itemPath(id) with optional confirmation. Resolves to `true` if deleted. */
  remove: (id: TId) => Promise<boolean>;
  saving: boolean;
  deleting: TId | null;
  error: string | null;
  /** Manually clear error/loading flags. */
  reset: () => void;
}

const DEFAULT_ITEM_PATH = (basePath: string, id: unknown) => `${basePath}/${id}`;

/**
 * Standardizes the `editing | save | delete | reload` pattern used in every
 * Honey/admin CRUD manager. Supports id types beyond number via the TId generic.
 */
export function useAdminCrud<TId = number, TResponse = unknown>(
  opts: UseAdminCrudOptions<TId>,
): UseAdminCrudResult<TId, TResponse> {
  const {
    basePath,
    updateMethod = "PATCH",
    itemPath = (id: TId) => DEFAULT_ITEM_PATH(basePath, id),
    reload,
    reloadOnSave = true,
    reloadOnDelete = true,
    createSuccessMessage = "สร้างรายการแล้ว",
    updateSuccessMessage = "บันทึกการเปลี่ยนแปลงแล้ว",
    deleteSuccessMessage = "ลบรายการแล้ว",
    deleteConfirm,
  } = opts;

  const confirmDialog = useConfirm();
  const [editing, setEditing] = useState<EditingId<TId>>(null);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState<TId | null>(null);
  const [error, setError] = useState<string | null>(null);

  const startCreate = useCallback(() => {
    setEditing("new");
    setError(null);
  }, []);

  const startEdit = useCallback((id: TId) => {
    setEditing(id);
    setError(null);
  }, []);

  const cancel = useCallback(() => {
    setEditing(null);
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setSaving(false);
    setDeleting(null);
    setError(null);
  }, []);

  const save = useCallback(
    async (payload: unknown): Promise<TResponse | null> => {
      setSaving(true);
      setError(null);
      const isNew = editing === "new";
      const url = isNew ? basePath : itemPath(editing as TId);
      const method = isNew ? "POST" : updateMethod;
      const successMessage = isNew ? createSuccessMessage : updateSuccessMessage;
      try {
        const result = await adminFetch<TResponse>(url, { method, body: payload });
        if (successMessage) toast.success(successMessage);
        setEditing(null);
        if (reloadOnSave && reload) await reload();
        return result;
      } catch (err) {
        const message = err instanceof Error ? err.message : "บันทึกไม่สำเร็จ";
        setError(message);
        toast.error(message);
        return null;
      } finally {
        setSaving(false);
      }
    },
    [
      editing,
      basePath,
      itemPath,
      updateMethod,
      createSuccessMessage,
      updateSuccessMessage,
      reload,
      reloadOnSave,
    ],
  );

  const remove = useCallback(
    async (id: TId): Promise<boolean> => {
      if (deleteConfirm) {
        const ok = await confirmDialog({
          title: deleteConfirm.title,
          description: deleteConfirm.description(id),
          confirmLabel: deleteConfirm.confirmLabel ?? "ลบ",
          variant: "destructive",
        });
        if (!ok) return false;
      }
      setDeleting(id);
      try {
        await adminFetch(itemPath(id), { method: "DELETE" });
        if (deleteSuccessMessage) toast.success(deleteSuccessMessage);
        if (reloadOnDelete && reload) await reload();
        return true;
      } catch (err) {
        const message = err instanceof Error ? err.message : "ลบไม่สำเร็จ";
        toast.error(message);
        return false;
      } finally {
        setDeleting(null);
      }
    },
    [confirmDialog, deleteConfirm, deleteSuccessMessage, itemPath, reload, reloadOnDelete],
  );

  return {
    editing,
    startCreate,
    startEdit,
    cancel,
    save,
    remove,
    saving,
    deleting,
    error,
    reset,
  };
}
