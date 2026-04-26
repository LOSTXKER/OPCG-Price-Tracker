"use client";

import { useState, useCallback, createContext, useContext, useRef } from "react";
import { AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

interface ConfirmOptions {
  title: string;
  description: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: "default" | "destructive";
}

interface ConfirmDialogState extends ConfirmOptions {
  open: boolean;
}

type ConfirmFn = (options: ConfirmOptions) => Promise<boolean>;

const ConfirmContext = createContext<ConfirmFn | null>(null);

export function useConfirm(): ConfirmFn {
  const ctx = useContext(ConfirmContext);
  if (!ctx) {
    return async (opts) => window.confirm(`${opts.title}\n\n${opts.description}`);
  }
  return ctx;
}

export function ConfirmDialogProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [state, setState] = useState<ConfirmDialogState>({
    open: false,
    title: "",
    description: "",
  });

  const resolveRef = useRef<((value: boolean) => void) | null>(null);

  const confirm = useCallback<ConfirmFn>((options) => {
    return new Promise<boolean>((resolve) => {
      resolveRef.current = resolve;
      setState({ ...options, open: true });
    });
  }, []);

  function handleClose(result: boolean) {
    setState((s) => ({ ...s, open: false }));
    resolveRef.current?.(result);
    resolveRef.current = null;
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog
        open={state.open}
        onOpenChange={(open) => {
          if (!open) handleClose(false);
        }}
      >
        <DialogContent showCloseButton={false}>
          <DialogHeader>
            <div className="flex items-start gap-3">
              {state.variant === "destructive" && (
                <div className="flex size-10 shrink-0 items-center justify-center rounded-full bg-destructive/10">
                  <AlertTriangle className="size-5 text-destructive" />
                </div>
              )}
              <div>
                <DialogTitle>{state.title}</DialogTitle>
                <DialogDescription>{state.description}</DialogDescription>
              </div>
            </div>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleClose(false)}
            >
              {state.cancelLabel ?? "ยกเลิก"}
            </Button>
            <Button
              variant={
                state.variant === "destructive" ? "destructive" : "default"
              }
              size="sm"
              onClick={() => handleClose(true)}
            >
              {state.confirmLabel ?? "ยืนยัน"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  );
}
