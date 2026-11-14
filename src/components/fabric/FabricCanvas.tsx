"use client";

import dynamic from "next/dynamic";
import type { FabricSceneProps } from "./FabricScene";

// WebGL cannot render on the server, so the scene loads in the browser only.
const FabricScene = dynamic(() => import("./FabricScene"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-[var(--muted)]">
      Hanging the cloth…
    </div>
  ),
});

export default function FabricCanvas(props: FabricSceneProps) {
  return <FabricScene {...props} />;
}
