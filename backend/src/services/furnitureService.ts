import pool from '@config/database';
export class FurnitureService {
  async getAllFurnitures() {
    try{
        const result = await pool.query('SELECT * FROM public.furniture');
        return result
    }catch(error){
        throw new Error('Method not implemented');
    }
    
  }

  async getFurniture(id:number){
    try{
        const result = await pool.query('SELECT * FROM public.furniture WHERE ref = $1',[id])
        return result
    }catch(error){
        throw new Error('Unable to fetch the furniture included in the parameters');
    }
  }

  async getFurnitureByCategory(cat:number){
    try{
      const result = await pool.query('SELECT * FROM public.furniture WHERE category = $1',[cat])
      return result
    }catch(error){
      throw new Error('Unable to fetch furnitures included in this category')
    }
  }

  async getFurnitureByReference(ref:string){
    try{
      const result = await pool.query('SELECT * FROM public.furniture WHERE reference_number = $1',[ref]);
      return result;
    }catch(error){
      throw new Error('Unable to fetch the furniture included in the reference number');
    }
  }
}
