import { Request, Response } from 'express';
import { ProviderService } from '@/services/providerService';

export class ChatbotController{
    private providerService: ProviderService

    constructor(providerService?: ProviderService) {
        this.providerService = providerService || new ProviderService();
    }

    getProviders =  async(req:Request,res:Response):Promise <void> =>{

        const intentName = req.body.queryResult.intent.displayName;

        if(intentName === 'info.proveedores.skaply'){
             try{
            const result = await this.providerService.getAllProvidersChatbot();
            res.status(200).json({
                fulfillmentMessages: [
                    {
                    text: {
                        text: [`Tenemos ${result.rows.length} proveedores disponibles:`]
                    }
                    },
                    ...result.rows.map(row => ({
                    card: {
                        title: row.company_name,
                        subtitle: `${row.email}\n${row.tax_address}`,
                        imageUri: row.image_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeJKe0KLma4NjDkp_NoSjOX8kG_F0Z9vwHB_kBTns1J7zBTCHB85k1nGH_CCLFU9HoeM4&usqp=CAU",
                        buttons: [
                        {
                            text: "Ver más información",
                            postback: `https://tudominio.com/proveedores/${row.id}`
                        }
                        ]
                    }
                    }))
                ]
                });

            }catch(error){
                res.status(500).json({
                    fulfillmentText: 'Error al obtener proveedores',
                    error:'Error fetching providers'
                })
            }
        } else {
            res.status(200).json({
                fulfillmentText: 'No entiendo esa consulta sobre proveedores'
            })
        }
       
    }
}