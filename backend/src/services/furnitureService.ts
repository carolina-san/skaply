import pool from '@config/database';
import { Difficulty } from '@/types/common.types';
import { ApiError } from '@/utils/ApiError';
import QRCode from 'qrcode';

interface FurnitureFilters {
  visible?: boolean;
  category_id?: number;
  provider_id?: number;
}

export class FurnitureService {

  // PRIVATE ROUTES

  // async getPrivateFurniture(filters?: FurnitureFilters) {
  //   try {
  //     const conditions: string[] = ['1=1'];
  //     const values: any[] = [];
  //     let paramIndex = 1;

  //     // Visible
  //     if (filters?.visible !== undefined) {
  //       conditions.push(`visible = $${paramIndex++}`);
  //       values.push(filters.visible);
  //     }

  //     // Category
  //     if (filters?.category_id !== undefined) {
  //       conditions.push(`category_id = $${paramIndex++}`);
  //       values.push(filters.category_id);
  //     }

  //     // Provider
  //     if (filters?.provider_id !== undefined) {
  //       conditions.push(`provider_id = $${paramIndex++}`);
  //       values.push(filters.provider_id);
  //     }

  //     const whereClause = conditions.join(' AND ');

  //     const query = `
  //       SELECT *
  //       FROM furniture
  //       WHERE ${whereClause}
  //       ORDER BY created_at DESC
  //     `;

  //     const result = await pool.query(query, values);
  //     return result.rows;

  //   } catch (error) {
  //     throw error;
  //   }
  // }

  // Checks if the furniture id is valid
  async furnitureExists(id: number): Promise<boolean> {
    const result = await pool.query(
      'SELECT 1 FROM public.furniture WHERE id = $1 LIMIT 1',
      [id]
    );
    return result.rows.length > 0;
  }

  // Checks if the furniture step number is valid
  async stepExists(idFurniture: number, stepNumber: number): Promise<boolean> {
    const result = await pool.query(
      `SELECT 1 FROM public.Step 
      WHERE id = $1 AND step_number = $2
      LIMIT 1`,
      [idFurniture, stepNumber]
    );
    return result.rows.length > 0;
  }

  async getAllFurniture() {
    try {
      const result = await pool.query(`
          SELECT DISTINCT 
              f.id, 
              f.name, 
              f.file_uri, 
              f.image_url,
              f.reference_number, 
              f.category_id, 
              c.name AS category_name, 
              f.provider_id, 
              p.company_name as provider_name, 
              f.color_id, 
              cl.name AS color_name,
              cl.hex AS color_hex,
              f.difficulty,
              f.short_description
          FROM public.furniture f
          INNER JOIN Step s ON s.furniture_id = f.id
          INNER JOIN Category c ON f.category_id = c.id
          INNER JOIN "User" p ON f.provider_id = p.id
          INNER JOIN Color cl ON f.color_id = cl.id`);
      return result;
    } catch (error) {
      console.error('getAllFurniture error:', error);
      throw error;
    }
  }

  async getFurnitureById(id: number) {
    try {
      const result = await pool.query(`
          SELECT 
              f.id, 
              f.name, 
              f.file_uri, 
              f.image_url,
              f.reference_number, 
              f.category_id, 
              c.name AS category_name, 
              f.provider_id, 
              p.company_name as provider_name, 
              f.color_id, 
              cl.name AS color_name,
              cl.hex AS color_hex,
              f.difficulty,
              f.short_description,
              COUNT(*) AS total_steps
          FROM public.furniture f
          INNER JOIN Step s ON s.furniture_id = f.id
          INNER JOIN Category c ON f.category_id = c.id
          INNER JOIN "User" p ON f.provider_id = p.id
          INNER JOIN Color cl ON f.color_id = cl.id
          WHERE f.id = $1
          GROUP BY 
              f.id, 
              f.name, 
              f.file_uri, 
              f.image_url,
              f.reference_number, 
              f.category_id, 
              c.name, 
              f.provider_id, 
              p.company_name, 
              f.color_id, 
              cl.name,
              cl.hex,
              f.difficulty,
              f.short_description`,
        [id]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the furniture included in the parameters');
    }
  }

  async getFurnitureByIdOrReference(identifier: string) {
    try {
      // Intentar buscar por ID numérico primero
      const numId = parseInt(identifier);
      const isNumeric = !isNaN(numId) && identifier === numId.toString();

      const result = await pool.query(`
          SELECT 
              f.id, 
              f.name, 
              f.file_uri, 
              f.image_url,
              f.reference_number, 
              f.category_id, 
              c.name AS category_name, 
              f.provider_id, 
              p.company_name as provider_name, 
              f.color_id, 
              cl.name AS color_name,
              cl.hex AS color_hex,
              f.difficulty,
              f.short_description,
              COUNT(*) AS total_steps
          FROM public.furniture f
          INNER JOIN Step s ON s.furniture_id = f.id
          INNER JOIN Category c ON f.category_id = c.id
          INNER JOIN "User" p ON f.provider_id = p.id
          INNER JOIN Color cl ON f.color_id = cl.id
          WHERE ${isNumeric ? 'f.id = $1' : 'f.reference_number = $1'}
          GROUP BY 
              f.id, 
              f.name, 
              f.file_uri, 
              f.image_url,
              f.reference_number, 
              f.category_id, 
              c.name, 
              f.provider_id, 
              p.company_name, 
              f.color_id, 
              cl.name,
              cl.hex,
              f.difficulty,
              f.short_description`,
        [isNumeric ? numId : identifier]);
      return result;
    } catch (error) {
      throw new Error('Unable to fetch the furniture included in the parameters');
    }
  }

  async getFilteredFurniture(filters: {
    difficulties?: ('low' | 'medium' | 'high')[];
    provider_ids?: number[];
    category_ids?: number[];
    color_ids: number[];
    search?: string;
  }) {
    try {
      const { difficulties, provider_ids, category_ids, color_ids, search } = filters;
      let sql = `
        SELECT DISTINCT 
            f.id, 
            f.name, 
            f.file_uri, 
            f.image_url,
            f.reference_number, 
            f.category_id, 
            c.name AS category_name, 
            f.provider_id, 
            p.company_name as provider_name, 
            f.color_id, 
            cl.name AS color_name,
            cl.hex AS color_hex,
            f.difficulty,
            f.short_description
        FROM public.furniture f
        INNER JOIN Step s ON s.furniture_id = f.id
        INNER JOIN Category c ON f.category_id = c.id
        INNER JOIN "User" p ON f.provider_id = p.id
        INNER JOIN Color cl ON f.color_id = cl.id
        WHERE 1=1`;
      const params: any[] = [];
      let paramIndex = 1; // Shows the number of parameters used

      if (color_ids && color_ids.length > 0) {
        sql += ` AND color_id = ANY($${paramIndex}::int[])`;
        params.push(color_ids);
        paramIndex++;
      }

      if (difficulties && difficulties.length > 0) {
        sql += ` AND difficulty = ANY($${paramIndex}::diff[])`;
        params.push(difficulties);
        paramIndex++;
      }

      if (provider_ids && provider_ids.length > 0) {
        sql += ` AND provider_id = ANY($${paramIndex}::int[])`;
        params.push(provider_ids);
        paramIndex++;
      }

      if (category_ids && category_ids.length > 0) {
        sql += ` AND category_id = ANY($${paramIndex}::int[])`;
        params.push(category_ids);
        paramIndex++;
      }

      if (search && search.trim() !== '') {
        sql += ` AND (f.name ILIKE $${paramIndex} OR f.reference_number ILIKE $${paramIndex})`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      const result = await pool.query(sql, params);
      return result;
    } catch (error) {
      throw new Error('Error fetching furniture parts')
    }
  }

  async getFurnitureIdByRef(ref: string): Promise<number> {
    try {
      const result = await pool.query(`SELECT id FROM furniture 
        WHERE reference_number = $1`, [ref]);

      if (result.rows.length === 0) {
        throw new Error(`Furniture with reference ${ref} not found`);
      }

      return result.rows[0].id;
    } catch (error) {
      throw new Error('Error fetching the furniture id by the ref provided');
    }
  }

  async getFurnitureDifficulty(furnitureId: number): Promise<string> {
    try {
      const result = await pool.query(
        'SELECT difficulty FROM furniture WHERE id = $1',
        [furnitureId]
      );
      if (result.rows.length === 0) {
        throw new Error('Furniture not found');
      }

      const difficulty = result.rows[0].difficulty.toLowerCase();

      // Map database values to Difficulty enum
      const difficultyMap: { [key: string]: string } = {
        'low': Difficulty.LOW,
        'medium': Difficulty.MEDIUM,
        'high': Difficulty.HIGH
      };

      return difficultyMap[difficulty] || result.rows[0].difficulty;

    } catch (error) {
      throw new Error('Error fetching furniture difficulty');
    }
  }


  // Devuelve toda la iformación necesaria para el motor gráfico
  async getFurnitureAssembly(furnitureId: number) {
    try {
      const query = `
      SELECT
        f.required_people,
        s.id AS step_id,
        s.step_number,
        s.description,
        s.used_in_step_with_id,
        s.scene_camera_angle,
        COALESCE(json_agg(
          DISTINCT jsonb_build_object(
            'part_id', p.id,
            'reference_number', p.reference_number,
            'file_uri', p.file_uri,
            'color_id', p.color_id,
            'quantity', sp.quantity,
            'axis', fp.exploded_axis,
            'distance', fp.exploded_distance
          )
        ) FILTER (WHERE p.id IS NOT NULL), '[]') AS parts,
        COALESCE(json_agg(
          DISTINCT jsonb_build_object(
            'tool_id', t.id,
            'name', t.name
          )
        ) FILTER (WHERE t.id IS NOT NULL), '[]') AS tools
      FROM Step s
      JOIN Furniture f ON f.id = s.furniture_id
      LEFT JOIN Step_Part sp ON sp.stepid = s.id  -- Changed stepId to stepid
      LEFT JOIN Part p ON p.id = sp.part_id
      LEFT JOIN Furniture_Part fp 
        ON fp.part_id = p.id 
        AND fp.furniture_id = s.furniture_id
      LEFT JOIN Step_Tool st ON st.stepid = s.id  -- Changed stepId to stepid
      LEFT JOIN Tool t ON t.id = st.tool_id
      WHERE s.furniture_id = $1
      GROUP BY 
        f.required_people,
        s.id
      ORDER BY s.step_number ASC
    `;

      const result = await pool.query(query, [furnitureId]);

      // Check if we found any steps; if not, return null or an empty object
      if (result.rows.length === 0) return null;

      return {
        furniture_id: furnitureId,
        required_people: result.rows[0].required_people,
        steps: result.rows
      };

    } catch (error) {
      // SECURITY TIP: Log the actual error internally, but don't expose 
      // DB details to the user.
      console.error('Database Error:', error);
      throw error;
    }
  }

  async createFurniture(data: {
    name: string;
    file_uri: string;
    assemblyPDF_uri: string;
    difficulty: 'low' | 'medium' | 'high';
    image_url?: string;
    reference_number?: string;
    category_id?: number;
    provider_id?: number;
    color_id?: number;
    short_description?: string;
    required_people?: number;
    visible?: boolean;
  }) {
    const {
      name,
      file_uri,
      assemblyPDF_uri,
      difficulty,
      image_url,
      reference_number,
      category_id,
      provider_id,
      color_id,
      short_description,
      required_people = 1,
      visible = false
    } = data;

    try {
      // Insertar en DB
      const result = await pool.query(
        `INSERT INTO Furniture 
        (name, file_uri, assemblyPDF_uri, image_url, reference_number, difficulty, category_id, provider_id, color_id, short_description, required_people, visible)
        VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12)
        RETURNING *`,
        [
          name,
          file_uri,
          assemblyPDF_uri,
          image_url,
          reference_number,
          difficulty,
          category_id,
          provider_id,
          color_id,
          short_description,
          required_people,
          visible
        ]
      );

      return result.rows[0];
    } catch (error: any) {
      // Detectar errores de claves foráneas
      if (error.code === '23503') {
        throw new ApiError('BAD_REQUEST', 'Invalid foreign key (category, provider, or color)');
      }
      throw new ApiError('INTERNAL_SERVER', 'Failed to create furniture');
    }
  }

  // Validar existencia de category, provider y color
  async checkResourcesExist(category_id?: number, provider_id?: number, color_id?: number) {
    if (category_id) {
      const category = await pool.query('SELECT id FROM Category WHERE id = $1', [category_id]);
      if (!category.rows.length) throw new ApiError('NOT_FOUND', 'Category not found');
    }
    if (provider_id) {
      const provider = await pool.query('SELECT id FROM "User" WHERE id = $1', [provider_id]);
      if (!provider.rows.length) throw new ApiError('NOT_FOUND', 'Provider not found');
    }
    if (color_id) {
      const color = await pool.query('SELECT id FROM Color WHERE id = $1', [color_id]);
      if (!color.rows.length) throw new ApiError('NOT_FOUND', 'Color not found');
    }
  }

  async updateFurniture(id: number, data: {
    name?: string;
    file_uri?: string;
    image_url?: string;
    reference_number?: string;
    difficulty?: Difficulty;
    category_id?: number;
    provider_id?: number;
    color_id?: number;
    short_description?: string;
  }) {
    const fields: string[] = [];
    const values: any[] = [];
    let index = 1;

    for (const key in data) {
      if (data[key as keyof typeof data] !== undefined) {
        fields.push(`${key} = $${index}`);
        values.push(data[key as keyof typeof data]);
        index++;
      }
    }

    if (fields.length === 0) {
      throw new Error('No fields to update');
    }

    values.push(id); // último valor para el WHERE
    const query = `UPDATE Furniture SET ${fields.join(', ')} WHERE id = $${index} RETURNING *`;
    const result = await pool.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Furniture not found');
    }

    return result.rows[0];
  }

  async deleteFurniture(id: number) {
    const result = await pool.query(
      `DELETE FROM Furniture WHERE id = $1 RETURNING *`,
      [id]
    );
    return result.rows[0];
  }

  /**
   * Genera un código QR para un mueble a partir de su reference_number
   * @param referenceNumber - Código de referencia del mueble (ej: 'F001')
   * @returns Objeto con la información del mueble y el QR en formato Data URL (base64)
   */
  async generateQRByReference(referenceNumber: string): Promise<{
    reference_number: string;
    furniture_name: string;
    qr_url: string;
    qr_data_url: string;
  }> {
    try {
      // Buscar el mueble por reference_number
      const result = await pool.query(
        `SELECT id, name, reference_number, qr_url 
         FROM public.furniture 
         WHERE reference_number = $1`,
        [referenceNumber]
      );

      if (result.rows.length === 0) {
        throw new ApiError('NOT_FOUND', `Furniture with reference '${referenceNumber}' not found`);
      }

      const furniture = result.rows[0];

      if (!furniture.qr_url) {
        throw new ApiError('NOT_FOUND', `Furniture '${referenceNumber}' does not have a QR URL configured`);
      }

      // Generar el código QR como Data URL (base64)
      const qrDataUrl = await QRCode.toDataURL(furniture.qr_url, {
        errorCorrectionLevel: 'M',
        type: 'image/png',
        width: 300,
        margin: 2,
        color: {
          dark: '#000000',
          light: '#FFFFFF'
        }
      });

      return {
        reference_number: furniture.reference_number,
        furniture_name: furniture.name,
        qr_url: furniture.qr_url,
        qr_data_url: qrDataUrl
      };
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('INTERNAL_SERVER', 'Error generating QR code');
    }
  }

  async getFurnitureByName(name: string): Promise<any> {
    try {

      const result = await pool.query(
        `SELECT id, name, image_url, reference_number, provider_id, short_description
         FROM public.furniture 
         WHERE name ILIKE $1 AND visible = true`,
        [name]
      );
      return result.rows;
    } catch (error) {
      if (error instanceof ApiError) {
        throw error;
      }
      throw new ApiError('INTERNAL_SERVER', 'Error fetching furniture by name');
    }
  }
}
