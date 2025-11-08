// Interfaz básica - Para cards del catálogo
export interface FurnitureBasic {
    id: number;
    name: string;
    reference_number: string;
    color: string;
    difficulty: 'low' | 'medium' | 'high';
    file_uri?: string;
    //   provider_id: number;
    //   category_id: number;
}


// Se pueden hacer todas las interfaces necesarias según el nivel de información que se necesite del recurso.

// Ejemplos de posibles interfaces de Furniture:

// // Interfaz para listado admin
// export interface Furniture extends FurnitureBasic {
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