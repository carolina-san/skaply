import { Request, Response } from 'express';
import { ProviderService } from '@/services/providerService';
import { ToolService } from '@/services/toolService';

export class ChatbotController{
    private providerService: ProviderService
    private toolService: ToolService

    constructor(providerService?: ProviderService, toolService?: ToolService) {
        this.providerService = providerService || new ProviderService();
        this.toolService = toolService || new ToolService();
    }

    getProviders =  async(req:Request,res:Response):Promise <void> =>{

        const intentName = req.body.queryResult.intent.displayName;

        if(intentName === 'general.proveedores.skaply'){
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
                });
            }
        } else if(intentName === 'funcionalidad.herramientas.necesarias'){
            try{
                const ref_number = req.body.queryResult.parameters['furniture_ref'];

                if(ref_number != null && ref_number != ''){
                    const result = await this.toolService.getFurnitureTools(ref_number);
                    res.status(200).json({
                        fulfillmentMessages: [
                            {
                            text: {
                                text: [`Para el mueble ${ref_number} necesitarás las siguientes herramientas:`]
                            }
                            },
                            ...result.rows.map((row: any) => ({
                            card: {
                                title: row.name,
                                imageUri: "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeJKe0KLma4NjDkp_NoSjOX8kG_F0Z9vwHB_kBTns1J7zBTCHB85k1nGH_CCOLFU9HoeM4&usqp=CAU"
                            }
                            }))
                        ]
                    });
                } else {
                    res.status(400).json({
                        fulfillmentText: 'No se proporcionó un número de referencia válido para el mueble'
                    });
                }
            }catch(error){
                res.status(500).json({
                    fulfillmentText: 'Error al obtener herramientas',
                    error:'Error fetching tools'
                });
            }
        } else {
            res.status(200).json({
                fulfillmentText: 'No entiendo esa consulta'
            });
        }
    }
}