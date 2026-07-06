"use client";

import { useCallback, useState, useTransition, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { adminFetch } from "./admin-fetch";

/**
 * The one create/edit page form engine (ADMIN-06). Every dedicated admin
 * form page (the `new` + `[id]` routes) duplicated the same ~50-line
 * skeleton line-for-line: `useState<FormData>(initialState)` seeded from an
 * `initial` record (edit) or defaults (create), an `error` string, a
 * `useTransition` submit that validates → POST/PATCH via {@link adminFetch} →
 * toast → `router.push` + `router.refresh`, a `dirty` diff via `JSON.stringify`,
 * and an {@link AdminSaveBar} in the page footer wired to the form through
 * `requestSubmit()`.
 *
 * This hook owns all of that. Each form passes only what actually differs —
 * `initialState`, `validate`, `toBody`, the endpoints/methods, and the success
 * copy — so per-form behaviour (extra local state like image upload or preview
 * toggles, conditional fields, custom slugify) stays in the component.
 *
 * NOT for the inline list-editor pattern (editing-id state + reload, no
 * navigation) — that is {@link useAdminCrud}.
 */
export interface UseAdminFormOptions<TForm, TResult = unknown> {
  /** Initial values — mapped from the record when editing, defaults when creating. Snapshotted once for dirty-diff + reset. */
  initialState: TForm;
  /** True when editing an existing record. Drives method / endpoint / message / save-bar visibility. */
  isEdit: boolean;
  /** Stable `id` for the `<form>` element so the footer save bar can `requestSubmit()`. */
  formId: string;
  /** Synchronous validation — return an error message to block submit, or `null`/`undefined` to proceed. */
  validate?: (form: TForm, isEdit: boolean) => string | null | undefined;
  /** Build the request body. Receives `isEdit` because some forms send a different shape on create vs edit. */
  toBody: (form: TForm, isEdit: boolean) => unknown;
  /** Collection endpoint used when creating. */
  createEndpoint: string;
  /** Item endpoint used when editing — the caller interpolates the id (may equal `createEndpoint` when the id travels in the body). */
  editEndpoint: string;
  /** HTTP method for create. Defaults to `POST`. */
  createMethod?: "POST" | "PUT";
  /** HTTP method for edit. Defaults to `PATCH`. */
  updateMethod?: "PATCH" | "PUT";
  /** Success toast copy. Omit for a silent redirect (some forms don't toast). */
  successMessage?: { create: string; edit: string };
  /** Show a `toast.error` on failure. Defaults to `true`. */
  errorToast?: boolean;
  /** Where to navigate after a successful save. */
  redirectTo: string;
  /** Replace the default success side-effect (`router.push(redirectTo)` + `router.refresh()`). */
  onSuccess?: (result: TResult, isEdit: boolean) => void;
  /** Message used when a thrown error carries none. */
  fallbackError?: string;
}

export interface UseAdminFormResult<TForm> {
  form: TForm;
  setForm: React.Dispatch<React.SetStateAction<TForm>>;
  error: string;
  setError: React.Dispatch<React.SetStateAction<string>>;
  /** True while the submit transition is pending. Pass to `AdminSaveBar.saving`. */
  saving: boolean;
  /** `JSON.stringify(form) !== JSON.stringify(initialState)`. */
  dirty: boolean;
  /** `dirty || !isEdit` — pass straight to `AdminSaveBar.dirty` (create always shows the bar). */
  saveBarActive: boolean;
  /** `<form onSubmit={handleSubmit}>`. */
  handleSubmit: (e: FormEvent) => void;
  /** `AdminSaveBar.onSave` — triggers the form's native submit so HTML validation runs first. */
  submitFromBar: () => void;
  /** Restore the snapshotted initial values and clear the error. */
  reset: () => void;
  formId: string;
}

export function useAdminForm<TForm, TResult = unknown>(
  opts: UseAdminFormOptions<TForm, TResult>,
): UseAdminFormResult<TForm> {
  const {
    initialState,
    isEdit,
    formId,
    validate,
    toBody,
    createEndpoint,
    editEndpoint,
    createMethod = "POST",
    updateMethod = "PATCH",
    successMessage,
    errorToast = true,
    redirectTo,
    onSuccess,
    fallbackError = "บันทึกไม่สำเร็จ",
  } = opts;

  const router = useRouter();
  // Snapshot once: the caller recomputes `initialState` each render, but it is
  // value-stable, so the first render's copy is the correct dirty/reset baseline.
  const [snapshot] = useState(initialState);
  const [form, setForm] = useState<TForm>(initialState);
  const [error, setError] = useState("");
  const [isPending, startTransition] = useTransition();

  const dirty = JSON.stringify(form) !== JSON.stringify(snapshot);

  const reset = useCallback(() => {
    setForm(snapshot);
    setError("");
  }, [snapshot]);

  const handleSubmit = useCallback(
    (e: FormEvent) => {
      e.preventDefault();
      setError("");

      const message = validate?.(form, isEdit);
      if (message) {
        setError(message);
        return;
      }

      startTransition(async () => {
        try {
          const result = await adminFetch<TResult>(
            isEdit ? editEndpoint : createEndpoint,
            { method: isEdit ? updateMethod : createMethod, body: toBody(form, isEdit) },
          );
          if (successMessage) {
            toast.success(isEdit ? successMessage.edit : successMessage.create);
          }
          if (onSuccess) {
            onSuccess(result, isEdit);
          } else {
            router.push(redirectTo);
            router.refresh();
          }
        } catch (err) {
          const msg = err instanceof Error ? err.message : fallbackError;
          setError(msg);
          if (errorToast) toast.error(msg);
        }
      });
    },
    [
      form,
      isEdit,
      validate,
      toBody,
      createEndpoint,
      editEndpoint,
      createMethod,
      updateMethod,
      successMessage,
      errorToast,
      redirectTo,
      onSuccess,
      fallbackError,
      router,
    ],
  );

  const submitFromBar = useCallback(() => {
    const el =
      typeof document !== "undefined"
        ? (document.getElementById(formId) as HTMLFormElement | null)
        : null;
    el?.requestSubmit();
  }, [formId]);

  return {
    form,
    setForm,
    error,
    setError,
    saving: isPending,
    dirty,
    saveBarActive: dirty || !isEdit,
    handleSubmit,
    submitFromBar,
    reset,
    formId,
  };
}
