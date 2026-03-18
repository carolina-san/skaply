import { Difficulty } from "./common.types";

// Interfaz básica - Para cards del catálogo
export interface Furniture {
    id: number;
    name: string;
    reference_number: string;
    color_name: string;
    color_hex: string
    difficulty: Difficulty;
    file_uri?: string;
    short_description: string;
    provider_id: number;
    provider_name?: string;
    image_url?: string;
    category_id: number;
    total_steps?: number;
    // category_name: number;
}

// Interfaces para los pasos de montaje (Assembly Steps)
export interface AssemblyPartRef {
    axis: string; // 'x', 'y', 'z'
    part_id: number;
    color_id: number;
    distance: number;
    file_uri: string;
    quantity: number;
    reference_number: string;
    pos_x: number;
    pos_y: number;
    pos_z: number;
}

export interface AssemblyStep {
    required_people: number;
    step_id: number;
    step_number: number;
    description: string | null;
    used_in_step_with_id: number | null;
    scene_camera_angle: number | null;
    scene_camera_rotation_axis: string | null;
    parts: AssemblyPartRef[];
    tools: any[]; // Define tool interface if needed
}

export interface FurnitureAssembly {
    furniture_id: number;
    required_people: number;
    steps: AssemblyStep[];
}

import { RenderableObject, Vector3 } from '../engine/interfaces';

export interface AssemblyPart {
    object: RenderableObject;
    startPosition: Vector3;
    targetPosition: Vector3;
    appearStep: number;
    joinStep: number;
    name: string;
    description: string;
    arrow?: RenderableObject;
    arrowOpacity?: number;
}