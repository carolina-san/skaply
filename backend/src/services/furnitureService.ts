import pool from '@config/database';
export class FurnitureService {
  async getAllFurnitures() {
    try{
        const result = await pool.query('SELECT * FROM public.mueble');
        return result
    }catch(error){
        throw new Error('Method not implemented');
    }
    
  }

  async getFurniture(id:number){
    try{
        const result = await pool.query('SELECT * FROM public.mueble WHERE ref = $1',[id])
        return result
    }catch(error){
        throw new Error('Method not implemented');
    }
  }
}
