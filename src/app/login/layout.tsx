"use client";

import { Suspense } from "react";

export default function LoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center">
          Loading...
        </div>
      }
    >
      {children}
    </Suspense>
  );
}
