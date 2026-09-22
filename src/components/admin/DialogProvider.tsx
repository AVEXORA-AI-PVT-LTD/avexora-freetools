"use client";

import React, { createContext, useContext, useState } from "react";

type DialogOptions = {
  title: string;
  message: string;
  type: "alert" | "confirm";
  onConfirm?: () => void;
  onCancel?: () => void;
};

type DialogContextType = {
  showAlert: (title: string, message: string) => void;
  showConfirm: (title: string, message: string, onConfirm: () => void, onCancel?: () => void) => void;
};

const DialogContext = createContext<DialogContextType | null>(null);

export function useDialog() {
  const context = useContext(DialogContext);
  if (!context) throw new Error("useDialog must be used within DialogProvider");
  return context;
}

export function DialogProvider({ children }: { children: React.ReactNode }) {
  const [dialog, setDialog] = useState<DialogOptions | null>(null);

  const handleConfirm = () => {
    dialog?.onConfirm?.();
    setDialog(null);
  };

  const handleCancel = () => {
    dialog?.onCancel?.();
    setDialog(null);
  };

  return (
    <DialogContext.Provider
      value={{
        showAlert: (title, message) => setDialog({ type: "alert", title, message }),
        showConfirm: (title, message, onConfirm, onCancel) =>
          setDialog({ type: "confirm", title, message, onConfirm, onCancel }),
      }}
    >
      {children}
      {dialog && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-sm p-6 animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-lg font-semibold text-slate-900">{dialog.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{dialog.message}</p>
            <div className="mt-6 flex justify-end gap-3">
              {dialog.type === "confirm" && (
                <button
                  onClick={handleCancel}
                  className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-md hover:bg-slate-50"
                >
                  Cancel
                </button>
              )}
              <button
                onClick={handleConfirm}
                className="px-4 py-2 text-sm font-medium text-white bg-orange-600 rounded-md hover:bg-orange-700"
              >
                {dialog.type === "confirm" ? "Confirm" : "OK"}
              </button>
            </div>
          </div>
        </div>
      )}
    </DialogContext.Provider>
  );
}
