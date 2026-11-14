import { create } from "zustand";
import {
  DEFAULT_MATERIAL,
  MATERIALS,
  type MaterialId,
} from "@/lib/materials";

type ColorMap = Record<MaterialId, string>;

function defaultColors(): ColorMap {
  return Object.fromEntries(
    MATERIALS.map((m) => [m.id, m.palette[0].hex]),
  ) as ColorMap;
}

interface ConfiguratorState {
  materialId: MaterialId;
  /** Each material remembers its own colour. */
  colors: ColorMap;
  setMaterial: (id: MaterialId) => void;
  /** Sets the colour of the material currently selected. */
  setColor: (hex: string) => void;
  reset: () => void;
}

export const useConfigurator = create<ConfiguratorState>((set) => ({
  materialId: DEFAULT_MATERIAL,
  colors: defaultColors(),
  setMaterial: (materialId) => set({ materialId }),
  setColor: (hex) =>
    set((state) => ({
      colors: { ...state.colors, [state.materialId]: hex.toLowerCase() },
    })),
  reset: () => set({ materialId: DEFAULT_MATERIAL, colors: defaultColors() }),
}));
