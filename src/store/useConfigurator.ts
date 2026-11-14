import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FORM, type FormId } from "@/lib/forms";
import { DEFAULT_ACCENT, DEFAULT_PATTERN, type PatternId } from "@/lib/patterns";
import {
  DEFAULT_MATERIAL,
  MATERIALS,
  type MaterialId,
} from "@/lib/materials";

type ColorMap = Record<MaterialId, string>;

export type Lighting = "studio" | "daylight" | "evening";

/** A saved combination of material, colour and shape. */
export interface Look {
  id: string;
  materialId: MaterialId;
  color: string;
  formId: FormId;
  /** Absent on looks saved before patterns existed. */
  patternId?: PatternId;
  accent?: string;
}

const MAX_LOOKS = 12;

function defaultColors(): ColorMap {
  return Object.fromEntries(
    MATERIALS.map((m) => [m.id, m.palette[0].hex]),
  ) as ColorMap;
}

interface ConfiguratorState {
  materialId: MaterialId;
  /** Each material remembers its own colour. */
  colors: ColorMap;
  formId: FormId;
  patternId: PatternId;
  /** Second colour, used by patterns. */
  accent: string;
  lighting: Lighting;
  /** Moving air and gentle turning. Off means the scene only renders on change. */
  motion: boolean;
  looks: Look[];
  setMaterial: (id: MaterialId) => void;
  /** Sets the colour of the material currently selected. */
  setColor: (hex: string) => void;
  setForm: (id: FormId) => void;
  setPattern: (id: PatternId) => void;
  setAccent: (hex: string) => void;
  setLighting: (lighting: Lighting) => void;
  setMotion: (motion: boolean) => void;
  saveLook: () => void;
  removeLook: (id: string) => void;
  applyLook: (look: Look) => void;
  reset: () => void;
}

/** The combination currently on screen. */
export function currentLook(
  state: Pick<ConfiguratorState, "materialId" | "colors" | "formId" | "patternId" | "accent">,
): Look {
  const color = state.colors[state.materialId];
  const patterned = state.patternId !== DEFAULT_PATTERN;
  return {
    id: [state.materialId, color, state.formId, state.patternId, patterned ? state.accent : ""].join("-"),
    materialId: state.materialId,
    color,
    formId: state.formId,
    patternId: state.patternId,
    accent: state.accent,
  };
}

export const useConfigurator = create<ConfiguratorState>()(
  persist(
    (set) => ({
      materialId: DEFAULT_MATERIAL,
      colors: defaultColors(),
      formId: DEFAULT_FORM,
      patternId: DEFAULT_PATTERN,
      accent: DEFAULT_ACCENT,
      lighting: "studio",
      motion: true,
      looks: [],
      setMaterial: (materialId) => set({ materialId }),
      setColor: (hex) =>
        set((state) => ({
          colors: { ...state.colors, [state.materialId]: hex.toLowerCase() },
        })),
      setForm: (formId) => set({ formId }),
      setPattern: (patternId) => set({ patternId }),
      setAccent: (hex) => set({ accent: hex.toLowerCase() }),
      setLighting: (lighting) => set({ lighting }),
      setMotion: (motion) => set({ motion }),
      saveLook: () =>
        set((state) => {
          const look = currentLook(state);
          const others = state.looks.filter((saved) => saved.id !== look.id);
          return { looks: [look, ...others].slice(0, MAX_LOOKS) };
        }),
      removeLook: (id) =>
        set((state) => ({ looks: state.looks.filter((look) => look.id !== id) })),
      applyLook: (look) =>
        set((state) => ({
          materialId: look.materialId,
          formId: look.formId,
          patternId: look.patternId ?? DEFAULT_PATTERN,
          accent: look.accent ?? state.accent,
          colors: { ...state.colors, [look.materialId]: look.color },
        })),
      reset: () =>
        set({
          materialId: DEFAULT_MATERIAL,
          colors: defaultColors(),
          formId: DEFAULT_FORM,
          patternId: DEFAULT_PATTERN,
          accent: DEFAULT_ACCENT,
          lighting: "studio",
        }),
    }),
    {
      name: "textile-tech",
      version: 1,
      // Only saved looks outlive the session; hydrated after mount to keep
      // server and client markup identical.
      partialize: (state) => ({ looks: state.looks }),
      skipHydration: true,
    },
  ),
);
