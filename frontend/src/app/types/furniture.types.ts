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
    // category_name: number;
}