export type Axis = 'x' | 'y' | 'z';

export interface AssemblyPartRef {
  reference_number: string; // should be the name on the object GLTF
  quantity: number;
}

export interface AssemblyStepDto {
  step_number: number;
  depends_on_step_number: number | null;
  parts: AssemblyPartRef[];
  tools?: { id: number; name: string; image_url?: string }[];
}

export interface FurnitureAssemblyDto {
  furniture: {
    id: number;
    reference_number: string;
    name: string;
    modelUrl: string; // URL accesible (assets or backend)
  };
  partsConfig?: Array<{
    reference_number: string;
    exploded_axis?: Axis;
    exploded_distance?: number;
  }>;
  steps: AssemblyStepDto[];
}
