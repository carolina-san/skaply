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
    // category_id: number;
    // category_name: number;
}


// Se pueden hacer todas las interfaces necesarias según el nivel de información que se necesite del recurso.

// Ejemplos de posibles interfaces de Furniture:

// // Interfaz para listado admin
// export interface FurnitureAdmin extends Furniture {
//   provider_id: number;
//   category_id: number;
//   created_at?: Date;
//   updated_at?: Date;
//   status?: string;
//   // Campos adicionales para admin
// }

// // Interfaz completa - Para vista detalle individual
// export interface FurnitureDetail extends Furniture {
//   description?: string;
//   dimensions?: {
//     width: number;
//     height: number;
//     depth: number;
//   };
//   materials?: string[];
//   assembly_time?: number;
//   provider?: ProviderBasic; // Relación con provider
//   category?: {
//     id: number;
//     name: string;
//   };
//   instructions?: string;
//   // Toda la información detallada
// }