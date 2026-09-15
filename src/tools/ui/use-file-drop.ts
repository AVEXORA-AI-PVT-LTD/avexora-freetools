"use client";

import { useState } from "react";
import type { DragEvent } from "react";

/**
 * Drag-and-drop handlers shared by every file/image upload surface. Feeds the
 * dropped FileList through the same callback each picker already uses for its
 * hidden <input type="file"> onChange, so drag-and-drop and click-to-choose
 * always go through identical validation/error handling.
 */
export function useFileDrop(onDrop: (files: FileList) => void) {
  const [isDragging, setIsDragging] = useState(false);

  return {
    isDragging,
    dragHandlers: {
      onDragOver: (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      },
      onDragEnter: (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(true);
      },
      onDragLeave: (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
      },
      onDrop: (e: DragEvent) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files.length > 0) onDrop(e.dataTransfer.files);
      },
    },
  };
}
