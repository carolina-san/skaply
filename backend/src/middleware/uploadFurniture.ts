import multer from 'multer';
import { Request } from 'express';

// Extensiones permitidas por carpeta
export const IMAGE_EXTENSIONS  = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
export const MODEL_EXTENSIONS  = ['.3ds', '.obj', '.fbx', '.glb', '.gltf', '.stl', '.dae', '.ply'];
export const PDF_EXTENSIONS    = ['.pdf'];

/**
 * Determina la subcarpeta de destino dentro de /storage
 * según la extensión del archivo.
 *
 *  - Imágenes  → fotos
 *  - Modelos 3D → modelos_3d
 *  - PDFs       → pdfs
 */
export function getStorageSubfolder(ext: string): 'fotos' | 'modelos_3d' | 'pdfs' | null {
  const lower = ext.toLowerCase();
  if (IMAGE_EXTENSIONS.includes(lower))  return 'fotos';
  if (MODEL_EXTENSIONS.includes(lower))  return 'modelos_3d';
  if (PDF_EXTENSIONS.includes(lower))    return 'pdfs';
  return null;
}

function fileFilter(_req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const ext = require('path').extname(file.originalname).toLowerCase();
  const allowed = [...IMAGE_EXTENSIONS, ...MODEL_EXTENSIONS, ...PDF_EXTENSIONS];

  if (allowed.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error(`Extensión de archivo no permitida: ${ext}`));
  }
}

/**
 * Multer configurado con almacenamiento en memoria (buffer).
 * El controller escribe los archivos en disco con el nombre correcto
 * una vez que tiene disponible el company_name del proveedor.
 *
 * Campos esperados en el formulario (multipart/form-data):
 *   - file_3d       → modelo 3D   → /storage/modelos_3d/
 *   - image_uri     → foto/imagen  → /storage/fotos/
 *   - assembly_pdf  → PDF          → /storage/pdfs/
 */
export const uploadFurnitureFiles = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: { fileSize: 200 * 1024 * 1024 } // 200 MB máximo por archivo
}).fields([
  { name: 'file_3d',      maxCount: 1 },
  { name: 'image_uri',    maxCount: 1 },
  { name: 'assembly_pdf', maxCount: 1 }
]);
