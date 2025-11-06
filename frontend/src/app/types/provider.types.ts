// Basic interface - Basic info for filter panel, etc.
export interface ProviderBasic {
  id: number;
  company_name: string;
}

// Se pueden hacer todas las interfaces necesarias según el nivel de información que se necesite del recurso.

// Ejemplos de posibles interfaces de Provider:

// // Interfaz para listado admin
// export interface Provider extends ProviderBasic {
//   logo?: string;
//   contact_email?: string;
//   phone?: string;
//   created_at?: Date;
//   // Campos para vista de lista admin
// }

// // Interfaz completa - Para vista detalle
// export interface ProviderDetail extends Provider {
//   website?: string;
//   address?: string;
//   description?: string;
//   total_furniture?: number;
//   // Todos los campos que tengas
// }