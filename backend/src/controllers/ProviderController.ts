import { Request, Response } from 'express';
import { ProviderService } from '../services/providerService';

export class ProviderController {

  private providerService: ProviderService;

  constructor(providerService?: ProviderService) {
    this.providerService = providerService || new ProviderService();
  }

  getProviders = async (req: Request, res: Response): Promise<void> => {
    try {
      // Example database query
      const result = await this.providerService.getAllProviders();
      res.status(200).json({ 
        message: 'Database connected successfully',
        data: result.rows
      });
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch providers' });
    }
  };

  getProviderById = async (req: Request, res: Response): Promise<void> => {
    try{
        const id = parseInt(req.params.id || '0');
        if (isNaN(id)) {
            res.status(400).json({error: 'Invalid provider ID'});
            return;
        }
        const result = await this.providerService.getProvider(id);
        res.status(200).json({
            message: 'Furniture fetched',
            data: result.rows[0]
        });
    }catch (error){
        res.status(500).json({error: 'Failed to fetch this provider'})
    }
  };

  


//   updateProvider = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { id } = req.params;
//       // Implementation here
//       res.status(200).json({ message: `Update user ${id} endpoint` });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to update user' });
//     }
//   };

//   deleteProvider = async (req: Request, res: Response): Promise<void> => {
//     try {
//       const { id } = req.params;
//       // Implementation here
//       res.status(200).json({ message: `Delete user ${id} endpoint` });
//     } catch (error) {
//       res.status(500).json({ error: 'Failed to delete user' });
//     }
//   };

}
