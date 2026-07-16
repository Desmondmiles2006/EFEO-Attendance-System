"use client";

import { useState } from "react";

const HEIGHTS = { sm: 28, md: 34, lg: 52 };

export function Logo({ size = "md" }: { size?: "sm" | "md" | "lg" }) {
  const [imgError, setImgError] = useState(false);
  const height = HEIGHTS[size];

  if (!imgError) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- logo file is user-provided at runtime, aspect ratio must stay intact
      <img
        src="/efeo-logo.png"
        alt="EFEO — École française d'Extrême-Orient"
        height={height}
        onError={() => setImgError(true)}
        className="w-auto object-contain"
        style={{ height }}
      />
    );
  }

  return (
    <div className="leading-tight">
      <div
        className="font-semibold tracking-wide text-[var(--color-accent)]"
        style={{ fontSize: size === "lg" ? "1.15rem" : "0.9rem" }}
      >
        EFEO
      </div>
      {size !== "sm" && (
        <div className="text-[10px] text-[var(--color-text-faint)]">
          École française d&apos;Extrême-Orient
        </div>
      )}
    </div>
  );
}
