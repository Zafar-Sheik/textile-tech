import { create } from "zustand";
import { persist } from "zustand/middleware";
import { DEFAULT_FORM, type FormId } from "@/lib/forms";
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
  lighting: Lighting;
  /** Moving air and gentle turning. Off means the scene only renders on change. */
  motion: boolean;
  looks: Look[];
  setMaterial: (id: MaterialId) => void;
  /** Sets the colour of the material currently selected. */
  setColor: (hex: string) => void;
  setForm: (id: FormId) => void;
  setLighting: (lighting: Lighting) => void;
  setMotion: (motion: boolean) => void;
  saveLook: () => void;
  removeLook: (id: string) => void;
  applyLook: (look: Look) => void;
  reset: () => void;
}

export const useConfigurator = create<ConfiguratorState>()(
  persist(
    (set) => ({
      materialId: DEFAULT_MATERIAL,
      colors: defaultColors(),
      formId: DEFAULT_FORM,
      lighting: "studio",
      motion: true,
      looks: [],
      setMaterial: (materialId) => set({ materialId }),
      setColor: (hex) =>
        set((state) => ({
          colors: { ...state.colors, [state.materialId]: hex.toLowerCase() },
        })),
      setForm: (formId) => set({ formId }),
      setLighting: (lighting) => set({ lighting }),
      setMotion: (motion) => set({ motion }),
      saveLook: () =>
        set((state) => {
          const look: Look = {
            id: `${state.materialId}-${state.colors[state.materialId]}-${state.formId}`,
            materialId: state.materialId,
            color: state.colors[state.materialId],
            formId: state.formId,
          };
          const others = state.looks.filter((saved) => saved.id !== look.id);
          return { looks: [look, ...others].slice(0, MAX_LOOKS) };
        }),
      removeLook: (id) =>
        set((state) => ({ looks: state.looks.filter((look) => look.id !== id) })),
      applyLook: (look) =>
        set((state) => ({
          materialId: look.materialId,
          formId: look.formId,
          colors: { ...state.colors, [look.materialId]: look.color },
        })),
      reset: () =>
        set({
          materialId: DEFAULT_MATERIAL,
          colors: defaultColors(),
          formId: DEFAULT_FORM,
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
