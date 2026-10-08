"use client";

import React from "react";
import { Navbar } from "@/components/design3/Navbar";

interface HeaderNavProps {
  onOpenAuth?: () => void;
  onSearchClick?: () => void;
  onNavigateSection?: (sectionId: string) => void;
}

export function HeaderNav(props: HeaderNavProps) {
  return (
    <Navbar
      onSearchClick={props.onSearchClick}
      onNavigateSection={props.onNavigateSection}
    />
  );
}

export function ThemeToggle() {
  return null;
}
