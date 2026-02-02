import { NextFunction, Request, Response } from 'express';
import { ApiError } from '@/utils/ApiError';
import { FurnitureService } from '../services/furnitureService'
import { ProviderService } from '../services/ProviderService'
import { Difficulty } from '@/types/common.types';
import { UserRole } from '@/types/user.types';
/*import { UserService } from '../services/UserService';*/

const validDifficulties = ['low', 'medium', 'high'];

export class FurnitureController {
  private furnitureService: FurnitureService;
  private providerService: ProviderService;

  constructor(furnitureService?: FurnitureService, providerService?: ProviderService) {
    this.furnitureService = furnitureService || new FurnitureService();
    this.providerService = providerService || new ProviderService();
  }

  getAllFurniture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Example database query
      const result = await this.furnitureService.getAllFurniture();

      res.status(200).json({
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      console.error('getAllFurniture error:', error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furnitures'));
    }
  };

  getFurnitureById = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const identifier = req.params.id;

      if (!identifier) {
        next(new ApiError('BAD_REQUEST', 'Furniture ID or reference is required'));
        return;
      }

      const result = await this.furnitureService.getFurnitureByIdOrReference(identifier);

      if (result.rows.length === 0) {
        next(new ApiError('NOT_FOUND', 'Furniture not found'));
        return;
      }

      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });
    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch this furniture'));
    }
  }

  filterFurniture = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const { difficulties, provider_ids, category_ids, color_ids, search } = req.body;

      const result = await this.furnitureService.getFilteredFurniture({
        difficulties,
        provider_ids,
        category_ids,
        color_ids,
        search
      });

      res.status(200).json({
        message: 'Furniture fetched',
        data: result.rows
      });

    } catch (error) {
      next(new ApiError('INTERNAL_SERVER', "Unable to fetch filtered furniture"));
    }
  }


  getFurnitureAssembly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const furnitureId = parseInt(req.params.id || '0');
      if (isNaN(furnitureId)) {
        next(new ApiError('BAD_REQUEST', 'Invalid furniture ID'));
        return;
      }

      const assemblyData = await this.furnitureService.getFurnitureAssembly(furnitureId);

      if (!assemblyData) {
        next(new ApiError('NOT_FOUND', 'Furniture assembly not found'));
        return;
      }

      res.status(200).json(assemblyData);

    } catch (error) {
      console.error('getFurnitureAssembly error:', error);
      next(new ApiError('INTERNAL_SERVER', 'Failed to fetch furniture assembly'));
    }
  }

  createFurniture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const {
        name,
        file_uri,
        difficulty,
        image_url,
        reference_number,
        category_id,
        provider_id,
        color_id,
        short_description
      } = req.body;

      if (!name || !file_uri || !difficulty) {
        return next(new ApiError('BAD_REQUEST', 'Name, file_uri and difficulty are required'));
      }

      if (!validDifficulties.includes(difficulty)) {
        throw new ApiError('UNPROCESSABLE', 'Invalid difficulty value');
      }

      const isProvider = await this.providerService.checkProviderRoleById(provider_id);

      if (!isProvider) {
        throw new ApiError('UNPROCESSABLE', 'User is not a provider');
      }

      await this.furnitureService.checkResourcesExist(category_id, provider_id, color_id);

      const furniture = await this.furnitureService.createFurniture({
        name,
        file_uri,
        difficulty,
        image_url,
        reference_number,
        category_id,
        provider_id,
        color_id,
        short_description
      });

      res.status(201).json({
        status: 'success',
        message: 'Furniture created successfully',
        data: furniture
      });

    } catch (error) {
      next(error);
    }
  }

  updateFurniture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        return next(new ApiError('UNAUTHORIZED', 'No se ha proporcionado autenticación'));
      }
      const furnitureId = Number(req.params.id);
      if (!furnitureId || isNaN(furnitureId)) {
        return next(new ApiError('BAD_REQUEST', 'Valid furniture ID is required'));
      }

      // Obtener ID del usuario que hace la petición
      const userId = await this.providerService.getProviderIdByEmail(req.user?.emailuser || '');
      if (!userId) return next(new ApiError('UNAUTHORIZED', 'User not found'));

      // Obtener provider_id del mueble
      const furnitureProviderId = await this.providerService.getProviderIdByFurnitureId(furnitureId);
      if (!furnitureProviderId) return next(new ApiError('NOT_FOUND', 'Furniture not found'));

      // Reglas de permisos
      if (req.user?.role === UserRole.ADMIN) {
        // Admin puede modificar cualquier mueble
      } else if (req.user?.role === UserRole.PROV) {
        if (furnitureProviderId !== userId) {
          return next(new ApiError('FORBIDDEN', 'You can only update your own furniture'));
        }
      } else {
        return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
      }

      const {
        name,
        file_uri,
        image_url,
        reference_number,
        difficulty,
        category_id,
        provider_id,
        color_id,
        short_description
      } = req.body;

      if (difficulty && !validDifficulties.includes(difficulty)) {
        throw new ApiError('UNPROCESSABLE', 'Invalid difficulty value');
      }

      const updatedFurniture = await this.furnitureService.updateFurniture(furnitureId, {
        name,
        file_uri,
        image_url,
        reference_number,
        difficulty,
        category_id,
        provider_id,
        color_id,
        short_description
      });

      res.status(200).json({
        message: 'Furniture updated successfully',
        data: updatedFurniture
      });
    } catch (error: any) {
      if (error.message === 'Furniture not found') {
        next(new ApiError('NOT_FOUND', error.message));
      } else {
        next(new ApiError('INTERNAL_SERVER', error.message));
      }
    }
  };

  // repasar
  deleteFurniture = async (req: Request, res: Response, next: NextFunction) => {
    try {
      const userId = await this.providerService.getProviderIdByEmail(req.user?.emailuser || '');
      if (!userId) {
        return next(new ApiError('UNAUTHORIZED', 'User not found'));
      }

      const furnitureId = Number(req.params.id);
      if (!furnitureId) {
        return next(new ApiError('BAD_REQUEST', 'Furniture ID is required'));
      }

      const furnitureProviderId = await this.providerService.getProviderIdByFurnitureId(furnitureId);
      if (!furnitureProviderId) {
        return next(new ApiError('NOT_FOUND', 'Furniture not found'));
      }

      // Reglas de permisos
      if (req.user?.role === UserRole.ADMIN) {
        // Admin puede eliminar cualquier mueble
      } else if (req.user?.role === UserRole.PROV) {
        if (furnitureProviderId !== userId) {
          return next(new ApiError('FORBIDDEN', 'You can only delete your own furniture'));
        }
      } else {
        return next(new ApiError('FORBIDDEN', 'Insufficient permissions'));
      }

      const deletedFurniture = await this.furnitureService.deleteFurniture(furnitureId);
      res.status(200).json({
        message: 'Furniture deleted successfully',
        data: deletedFurniture
      });

    } catch (error) {
      next(error);
    }
  };

  /**
   * Genera un código QR para un mueble a partir de su reference_number
   * GET /furniture/:reference/qr
   * Devuelve HTML con el QR renderizado directamente
   */
  generateQR = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const referenceNumber = req.params.reference;

      if (!referenceNumber) {
        next(new ApiError('BAD_REQUEST', 'Reference number is required'));
        return;
      }

      const qrData = await this.furnitureService.generateQRByReference(referenceNumber);

      // Devolver HTML con el QR renderizado - Diseño Skaply
      const html = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>QR - ${qrData.furniture_name} | LYNK by Skaply</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&family=Poppins:wght@600;700&display=swap" rel="stylesheet">
  <style>
    :root {
      --color-marron-secundario: #2f1b17;
      --color-marron-oscuro: #452621;
      --color-marron-claro: #997662;
      --color-azul-medio: #94adba;
      --color-azul-claro: #BAD5E3;
      --color-beige-oscuro: #D6CFC4;
      --color-beige: #dcd6d5;
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: linear-gradient(180deg, #4D2D28 0%, var(--color-marron-oscuro) 50%, var(--color-marron-secundario) 100%);
      min-height: 100vh;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      padding: 20px;
    }
    .logo {
      width: 220px;
      margin-bottom: 30px;
    }
    .card {
      background: var(--color-beige);
      border-radius: 25px;
      padding: 40px;
      box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.4);
      text-align: center;
      max-width: 420px;
      width: 100%;
    }
    .qr-container {
      background: white;
      padding: 20px;
      border-radius: 16px;
      margin: 24px auto;
      display: inline-block;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }
    .qr-image {
      width: 220px;
      height: 220px;
      display: block;
    }
    h1 {
      font-family: 'Poppins', sans-serif;
      color: var(--color-marron-oscuro);
      font-size: 1.5rem;
      font-weight: 700;
      margin-bottom: 8px;
    }
    .reference {
      color: var(--color-marron-claro);
      font-size: 0.875rem;
      font-weight: 500;
    }
    .url-container {
      background: var(--color-beige-oscuro);
      padding: 14px 18px;
      border-radius: 12px;
      font-size: 0.75rem;
      color: var(--color-marron-oscuro);
      word-break: break-all;
      margin-top: 20px;
    }
    .url-label {
      font-weight: 600;
      color: var(--color-marron-claro);
      display: block;
      margin-bottom: 4px;
      font-size: 0.7rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .footer {
      margin-top: 24px;
      font-size: 0.8rem;
      color: var(--color-marron-claro);
      font-weight: 500;
    }
    .btn-scan {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      margin-top: 20px;
      padding: 12px 24px;
      background: var(--color-azul-claro);
      color: var(--color-marron-oscuro);
      border-radius: 50px;
      font-weight: 600;
      font-size: 0.875rem;
      text-decoration: none;
      transition: all 0.3s ease;
      box-shadow: 0 4px 12px rgba(186, 213, 227, 0.4);
    }
    .btn-scan:hover {
      background: var(--color-azul-medio);
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(186, 213, 227, 0.5);
    }
    .powered-by {
      margin-top: 30px;
      font-size: 0.7rem;
      color: var(--color-beige-oscuro);
      opacity: 0.7;
    }
    .icon-3d {
      width: 20px;
      height: 20px;
    }
  </style>
</head>
<body>
  <!-- Logo Skaply -->
  <svg class="logo" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 375" preserveAspectRatio="xMidYMid meet"><g transform="matrix(1, 0, 0, 1, 60, 0)"><g><g><g transform="matrix(1, 0, 0, 1, 1098, 0)"><g><g fill="#bad5e3" fill-opacity="1"><g transform="translate(4.789198, 263.132294)"><g><path d="M 49.390625 -39.796875 C 47.734375 -34.109375 46.488281 -29.546875 45.65625 -26.109375 C 44.832031 -22.679688 44.421875 -19.78125 44.421875 -17.40625 C 44.421875 -15.75 44.832031 -14.503906 45.65625 -13.671875 C 46.488281 -12.847656 47.257812 -12.4375 47.96875 -12.4375 C 50.8125 -12.4375 55.664062 -15.867188 62.53125 -22.734375 C 69.40625 -29.609375 73.671875 -34.46875 75.328125 -37.3125 L 81.015625 -34.109375 C 73.429688 -23.691406 65.140625 -14.691406 56.140625 -7.109375 C 47.140625 0.472656 38.726562 4.265625 30.90625 4.265625 C 21.4375 4.265625 16.703125 -1.300781 16.703125 -12.4375 C 16.703125 -16.9375 17.648438 -22.503906 19.546875 -29.140625 C 21.441406 -35.773438 22.742188 -40.15625 23.453125 -42.28125 L 73.90625 -217.8125 C 75.332031 -223.257812 76.046875 -227.523438 76.046875 -230.609375 C 76.046875 -233.691406 74.976562 -236.175781 72.84375 -238.0625 C 70.707031 -239.957031 67.984375 -240.90625 64.671875 -240.90625 C 60.171875 -240.90625 56.144531 -240.550781 52.59375 -239.84375 L 52.59375 -246.59375 L 104.828125 -254.765625 L 110.859375 -254.765625 L 54.015625 -55.78125 C 51.640625 -47.257812 50.097656 -41.929688 49.390625 -39.796875 Z M 49.390625 -39.796875 "/></g></g></g><g fill="#bad5e3" fill-opacity="1"><g transform="translate(48.838034, 263.132294)"><g><path d="M 85.984375 -121.171875 L 91.3125 -17.765625 C 107.894531 -38.140625 122.9375 -58.570312 136.4375 -79.0625 C 149.945312 -99.550781 156.703125 -114.535156 156.703125 -124.015625 C 156.703125 -125.429688 156.164062 -126.550781 155.09375 -127.375 C 154.03125 -128.207031 152.316406 -129.21875 149.953125 -130.40625 C 145.921875 -132.0625 142.71875 -134.070312 140.34375 -136.4375 C 137.976562 -138.8125 136.796875 -142.488281 136.796875 -147.46875 C 136.796875 -151.726562 138.273438 -155.28125 141.234375 -158.125 C 144.203125 -160.96875 147.582031 -162.390625 151.375 -162.390625 C 155.632812 -162.390625 159.835938 -160.609375 163.984375 -157.046875 C 168.128906 -153.492188 170.203125 -146.742188 170.203125 -136.796875 C 170.203125 -127.796875 167.476562 -118.082031 162.03125 -107.65625 C 156.582031 -97.238281 147.9375 -83.144531 136.09375 -65.375 C 123.0625 -45.957031 106.832031 -24.109375 87.40625 0.171875 C 67.988281 24.453125 52.351562 42.753906 40.5 55.078125 C 26.757812 69.054688 14.328125 76.046875 3.203125 76.046875 C -0.585938 76.046875 -3.960938 74.679688 -6.921875 71.953125 C -9.890625 69.234375 -11.375 66.09375 -11.375 62.53125 C -11.375 58.03125 -9.476562 53.828125 -5.6875 49.921875 C -1.894531 46.015625 2.367188 44.0625 7.109375 44.0625 C 9.234375 44.0625 10.769531 44.648438 11.71875 45.828125 C 12.664062 47.015625 13.851562 48.796875 15.28125 51.171875 C 16.9375 54.960938 18.710938 56.859375 20.609375 56.859375 C 22.742188 56.859375 27.484375 53.894531 34.828125 47.96875 C 42.171875 42.050781 52.945312 30.207031 67.15625 12.4375 L 61.46875 -99.140625 C 60.757812 -110.984375 59.929688 -120.039062 58.984375 -126.3125 C 58.035156 -132.59375 55.960938 -137.628906 52.765625 -141.421875 C 49.566406 -145.210938 44.648438 -147.109375 38.015625 -147.109375 C 33.515625 -147.109375 29.367188 -146.632812 25.578125 -145.6875 L 23.8125 -152.078125 L 76.390625 -162.390625 C 79.941406 -156.941406 82.3125 -151.019531 83.5 -144.625 C 84.6875 -138.226562 85.515625 -130.410156 85.984375 -121.171875 Z M 85.984375 -121.171875 "/></g></g></g></g></g></g><g><path fill="#bad5e3" d="M 420.9375 -5.78125 L 390.886719 -88.015625 C 389.058594 -93.03125 384.285156 -96.371094 378.9375 -96.371094 L 332.859375 -96.371094 C 327.519531 -96.371094 322.742188 -93.03125 320.910156 -88.015625 L 290.859375 -5.78125 C 287.832031 2.523438 293.976562 11.3125 302.8125 11.3125 L 348.792969 11.3125 C 349.300781 11.3125 349.710938 11.722656 349.710938 12.230469 L 349.710938 240.167969 L 336.207031 240.167969 C 329.097656 240.167969 323.332031 245.929688 323.332031 253.035156 L 323.332031 275.207031 L 388.464844 275.207031 L 388.464844 253.035156 C 388.464844 245.929688 382.703125 240.167969 375.597656 240.167969 L 362.085938 240.167969 L 362.085938 12.230469 C 362.085938 11.722656 362.496094 11.3125 363.003906 11.3125 L 408.984375 11.3125 C 417.820312 11.3125 423.96875 2.523438 420.9375 -5.78125 Z M 273.777344 100.148438 C 260.820312 100.148438 250.320312 110.652344 250.320312 123.605469 L 250.320312 164.625 C 250.320312 174.261719 242.511719 182.074219 232.878906 182.074219 L 64.945312 182.074219 C 55.3125 182.074219 47.5 174.261719 47.5 164.625 L 47.5 123.605469 C 47.5 110.652344 37 100.148438 24.046875 100.148438 C 11.09375 100.148438 0.59375 110.652344 0.59375 123.605469 L 0.59375 251.753906 C 0.59375 264.707031 11.09375 275.207031 24.046875 275.207031 C 37 275.207031 47.5 264.707031 47.5 251.753906 L 250.320312 251.753906 C 250.320312 264.707031 260.820312 275.207031 273.777344 275.207031 C 286.730469 275.207031 297.230469 264.707031 297.230469 251.753906 L 297.230469 123.605469 C 297.230469 110.652344 286.730469 100.148438 273.777344 100.148438 Z M 211.984375 170.8125 L 85.839844 170.8125 C 70.417969 170.8125 57.917969 158.308594 57.917969 142.886719 L 57.917969 57.417969 C 57.917969 41.992188 70.417969 29.492188 85.839844 29.492188 L 211.984375 29.492188 C 227.40625 29.492188 239.90625 41.992188 239.90625 57.417969 L 239.90625 142.886719 C 239.90625 158.308594 227.40625 170.8125 211.984375 170.8125 " fill-opacity="1" fill-rule="evenodd"/></g><g transform="matrix(1, 0, 0, 1, 362, 44)"><g><g fill="#bad5e3" fill-opacity="1"><g transform="translate(1.366775, 230.501566)"><g><path d="M 105.765625 7.640625 C 87.835938 7.640625 71.6875 4.835938 57.3125 -0.765625 C 42.945312 -6.367188 31.332031 -14.617188 22.46875 -25.515625 C 13.601562 -36.421875 8.351562 -49.722656 6.71875 -65.421875 L 54.40625 -74.28125 C 56.039062 -61.238281 61.75 -50.796875 71.53125 -42.953125 C 81.3125 -35.109375 93.4375 -31.1875 107.90625 -31.1875 C 120.945312 -31.1875 131.238281 -33.882812 138.78125 -39.28125 C 146.320312 -44.675781 150.09375 -51.554688 150.09375 -59.921875 C 150.09375 -66.640625 147.238281 -72.085938 141.53125 -76.265625 C 135.820312 -80.441406 126.550781 -83.859375 113.71875 -86.515625 L 83.453125 -92.3125 C 59.398438 -97 41.820312 -104.335938 30.71875 -114.328125 C 19.613281 -124.316406 14.0625 -137.867188 14.0625 -154.984375 C 14.0625 -169.242188 17.78125 -181.625 25.21875 -192.125 C 32.65625 -202.625 42.945312 -210.773438 56.09375 -216.578125 C 69.238281 -222.390625 84.164062 -225.296875 100.875 -225.296875 C 116.15625 -225.296875 129.960938 -222.695312 142.296875 -217.5 C 154.628906 -212.300781 164.71875 -205.015625 172.5625 -195.640625 C 180.40625 -186.265625 185.242188 -175.257812 187.078125 -162.625 L 140.3125 -152.234375 C 138.882812 -162.828125 134.5 -171.234375 127.15625 -177.453125 C 119.820312 -183.671875 110.859375 -186.78125 100.265625 -186.78125 C 89.671875 -186.78125 81.210938 -184.226562 74.890625 -179.125 C 68.578125 -174.03125 65.421875 -167.613281 65.421875 -159.875 C 65.421875 -153.351562 68.015625 -148.15625 73.203125 -144.28125 C 78.398438 -140.40625 86.601562 -137.347656 97.8125 -135.109375 L 128.6875 -129.3125 C 153.550781 -125.226562 171.789062 -117.988281 183.40625 -107.59375 C 195.03125 -97.207031 200.84375 -83.148438 200.84375 -65.421875 C 200.84375 -50.335938 196.816406 -37.289062 188.765625 -26.28125 C 180.710938 -15.28125 169.550781 -6.875 155.28125 -1.0625 C 141.019531 4.738281 124.515625 7.640625 105.765625 7.640625 Z M 105.765625 7.640625 "/></g></g></g><g fill="#bad5e3" fill-opacity="1"><g transform="translate(206.791674, 230.501566)"><g><path d="M 12.234375 0 L 12.234375 -226.8125 L 59 -226.8125 L 59 -100.265625 L 59.296875 -100.265625 L 111.578125 -156.515625 L 165.984375 -156.515625 L 107.296875 -96.59375 L 168.734375 0 L 117.078125 0 L 76.421875 -68.46875 L 59 -50.125 L 59 0 Z M 12.234375 0 "/></g></g></g><g fill="#bad5e3" fill-opacity="1"><g transform="translate(375.533527, 230.501566)"><g><path d="M 49.515625 -180.96875 C 42.585938 -180.96875 36.78125 -183.207031 32.09375 -187.6875 C 27.40625 -192.175781 25.0625 -197.882812 25.0625 -204.8125 C 25.0625 -211.738281 27.40625 -217.390625 32.09375 -221.765625 C 36.78125 -226.148438 42.585938 -228.34375 49.515625 -228.34375 C 56.648438 -228.34375 62.5625 -226.148438 67.25 -221.765625 C 71.9375 -217.390625 74.28125 -211.738281 74.28125 -204.8125 C 74.28125 -197.882812 71.9375 -192.175781 67.25 -187.6875 C 62.5625 -183.207031 56.648438 -180.96875 49.515625 -180.96875 Z M 127.171875 -180.96875 C 120.035156 -180.96875 114.175781 -183.207031 109.59375 -187.6875 C 105.007812 -192.175781 102.71875 -197.882812 102.71875 -204.8125 C 102.71875 -211.738281 105.007812 -217.390625 109.59375 -221.765625 C 114.175781 -226.148438 120.035156 -228.34375 127.171875 -228.34375 C 134.296875 -228.34375 140.148438 -226.148438 144.734375 -221.765625 C 149.328125 -217.390625 151.625 -211.738281 151.625 -204.8125 C 151.625 -197.882812 149.328125 -192.175781 144.734375 -187.6875 C 140.148438 -183.207031 134.296875 -180.96875 127.171875 -180.96875 Z M 60.53125 4.578125 C 44.226562 4.578125 30.828125 0.503906 20.328125 -7.640625 C 9.828125 -15.796875 4.578125 -26.597656 4.578125 -40.046875 C 4.578125 -53.492188 10.382812 -64.800781 22 -73.96875 C 33.625 -83.144531 51.15625 -88.957031 74.59375 -91.40625 L 104.84375 -95.0625 C 108.519531 -95.476562 111.476562 -96.648438 113.71875 -98.578125 C 115.957031 -100.515625 117.078125 -103.113281 117.078125 -106.375 C 117.078125 -113.101562 114.425781 -118.503906 109.125 -122.578125 C 103.832031 -126.648438 97.007812 -128.6875 88.65625 -128.6875 C 79.28125 -128.6875 71.535156 -125.78125 65.421875 -119.96875 C 59.304688 -114.164062 55.84375 -107.394531 55.03125 -99.65625 L 9.46875 -106.6875 C 10.488281 -117.488281 14.3125 -127.117188 20.9375 -135.578125 C 27.5625 -144.035156 36.578125 -150.65625 47.984375 -155.4375 C 59.398438 -160.226562 72.546875 -162.625 87.421875 -162.625 C 110.453125 -162.625 128.796875 -156.96875 142.453125 -145.65625 C 156.109375 -134.34375 162.9375 -118.90625 162.9375 -99.34375 L 162.9375 -38.828125 C 162.9375 -31.285156 165.582031 -27.515625 170.875 -27.515625 C 175.363281 -27.515625 179.441406 -29.859375 183.109375 -34.546875 L 194.109375 -9.78125 C 189.421875 -5.09375 183.359375 -1.53125 175.921875 0.90625 C 168.484375 3.351562 161.195312 4.578125 154.0625 4.578125 C 144.6875 4.578125 136.632812 2.03125 129.90625 -3.0625 C 123.1875 -8.15625 119.316406 -14.265625 118.296875 -21.390625 L 117.6875 -26.90625 L 117.390625 -26.90625 C 112.285156 -17.53125 104.84375 -9.9375 95.0625 -4.125 C 85.28125 1.675781 73.769531 4.578125 60.53125 4.578125 Z M 78.25 -27.515625 C 89.257812 -27.515625 98.328125 -30.925781 105.453125 -37.75 C 112.585938 -44.582031 116.15625 -53.296875 116.15625 -63.890625 L 116.15625 -70.3125 L 86.203125 -66.953125 C 73.160156 -65.523438 64.09375 -62.875 59 -59 C 53.90625 -55.125 51.359375 -50.640625 51.359375 -45.546875 C 51.359375 -40.242188 53.90625 -35.910156 59 -32.546875 C 64.09375 -29.191406 70.507812 -27.515625 78.25 -27.515625 Z M 78.25 -27.515625 "/></g></g></g><g fill="#bad5e3" fill-opacity="1"><g transform="translate(569.64782, 230.501566)"><g><path d="M 12.234375 64.1875 L 12.234375 -156.515625 L 51.359375 -156.515625 L 58.390625 -126.546875 L 58.6875 -126.546875 C 69.894531 -149.578125 88.132812 -161.09375 113.40625 -161.09375 C 127.0625 -161.09375 139.132812 -157.628906 149.625 -150.703125 C 160.125 -143.773438 168.328125 -134.144531 174.234375 -121.8125 C 180.148438 -109.488281 183.109375 -94.96875 183.109375 -78.25 C 183.109375 -61.75 180.148438 -47.28125 174.234375 -34.84375 C 168.328125 -22.414062 160.125 -12.738281 149.625 -5.8125 C 139.132812 1.113281 127.0625 4.578125 113.40625 4.578125 C 88.539062 4.578125 70.503906 -6.929688 59.296875 -29.953125 L 59 -29.953125 L 59 64.1875 Z M 96.59375 -35.15625 C 108.207031 -35.15625 117.734375 -39.28125 125.171875 -47.53125 C 132.617188 -55.789062 136.34375 -66.03125 136.34375 -78.25 C 136.34375 -90.882812 132.617188 -101.273438 125.171875 -109.421875 C 117.734375 -117.578125 108.207031 -121.65625 96.59375 -121.65625 C 85.1875 -121.65625 75.757812 -117.53125 68.3125 -109.28125 C 60.875 -101.03125 57.15625 -90.6875 57.15625 -78.25 C 57.15625 -66.03125 60.875 -55.789062 68.3125 -47.53125 C 75.757812 -39.28125 85.1875 -35.15625 96.59375 -35.15625 Z M 96.59375 -35.15625 "/></g></g></g></g></g></g></g></svg>

  <div class="card">
    <h1>${qrData.furniture_name}</h1>
    <p class="reference">Ref: ${qrData.reference_number}</p>
    
    <div class="qr-container">
      <img src="${qrData.qr_data_url}" alt="QR Code - ${qrData.furniture_name}" class="qr-image" />
    </div>
    
    <div class="url-container">
      <span class="url-label">Enlace directo</span>
      ${qrData.qr_url}
    </div>
    
    <p class="footer">Escanea el código QR para ver el mueble en 3D</p>
    
    <a href="${qrData.qr_url}" class="btn-scan">
      <svg class="icon-3d" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M12 3L2 7l10 4 10-4-10-4z"/>
        <path d="M2 17l10 4 10-4"/>
        <path d="M2 12l10 4 10-4"/>
      </svg>
      Ver en 3D
    </a>
  </div>

  <p class="powered-by">Powered by LYNK</p>
</body>
</html>`;

      res.setHeader('Content-Type', 'text/html');
      res.status(200).send(html);
    } catch (error) {
      next(error);
    }
  };

}
