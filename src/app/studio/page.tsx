import type { Metadata } from "next";
import Studio from "@/components/studio/Studio";

export const metadata: Metadata = {
  title: "Studio — Textile Tech",
  description: "Pick a material and a colour and see the drape update live.",
};

export default function StudioPage() {
  return <Studio />;
}
