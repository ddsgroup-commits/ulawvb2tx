"use client";

import { Toaster as HotToaster } from "react-hot-toast";

export function Toaster() {
  return (
    <HotToaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        className: "!rounded-xl !text-sm !font-medium",
        success: {
          iconTheme: { primary: "#10b981", secondary: "#fff" },
          style: { background: "#ecfdf5", color: "#065f46", border: "1px solid #a7f3d0" },
        },
        error: {
          iconTheme: { primary: "#B32024", secondary: "#fff" },
          style: { background: "#fef2f2", color: "#7f1d1d", border: "1px solid #fecaca" },
        },
      }}
    />
  );
}
