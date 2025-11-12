import { Request, Response } from 'express';
import { ProviderService } from '@/services/providerService';
import { ToolService } from '@/services/toolService';
import { IssueService } from '@/services/issueService';
import { FurnitureService } from '@/services/furnitureService';
import { Issue } from '@/types';

export class ChatbotController {
    private providerService: ProviderService;
    private toolService: ToolService;
    private issueService: IssueService;
    private furnitureService: FurnitureService;

    constructor(providerService?: ProviderService, toolService?: ToolService, furnitureService?: FurnitureService) {
        this.providerService = providerService || new ProviderService();
        this.toolService = toolService || new ToolService();
        this.issueService = new IssueService();
        this.furnitureService = furnitureService || new FurnitureService();
    }

    getProviders = async (req: Request, res: Response): Promise<void> => {
        const action = req.body.queryResult.action;

        try {
            switch (action) {
                case 'get.providers': {
                    const result = await this.providerService.getAllProvidersChatbot();
                    res.status(200).json({
                        fulfillmentMessages: [
                            {
                                text: { text: [`Tenemos ${result.rows.length} proveedores disponibles:`] }
                            },
                            ...result.rows.map((row: any) => ({
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
                    break;
                }

                case 'get.tools': {
                    const ref_number = req.body.queryResult.parameters['furniture_ref'];
                    if (!ref_number) {
                        res.status(400).json({
                            fulfillmentText: 'No se proporcionó un número de referencia válido para el mueble'
                        });
                        return;
                    }

                    const result = await this.toolService.getFurnitureTools(ref_number);
                    res.status(200).json({
                        fulfillmentMessages: [
                            {
                                text: { text: [`Para el mueble ${ref_number} necesitarás las siguientes herramientas:`] }
                            },
                            ...result.rows.map((row: any) => ({
                                card: {
                                    title: row.name,
                                    imageUri: row.image_url || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSeJKe0KLma4NjDkp_NoSjOX8kG_F0Z9vwHB_kBTns1J7zBTCHB85k1nGH_CCLFU9HoeM4&usqp=CAU"
                                }
                            }))
                        ]
                    });
                    break;
                }
                case 'issue.complete': {
                    const flowContext = req.body.queryResult.outputContexts?.find((context: any) =>
                        context.name.endsWith('/contexts/flow')
                    );

                    if (flowContext) {
                        const { issue_description, furniture_ref, userEmail } = flowContext.parameters;

                        try {
                            const date = new Date().toISOString();
                            const furnitureId = await this.furnitureService.getFurnitureIdByRef(furniture_ref);
                            
                            const issue: Issue = {
                                description: issue_description,
                                furniture_id: furnitureId,
                                user_email: userEmail,
                                date: date
                            };

                            if(issue!=null){
                                 await this.issueService.postChatbotIssues(issue);
                            }
                           
                            
                            console.log('Issue creado exitosamente:', issue);
                            
                            res.status(200).json({
                                fulfillmentText: 'Tu incidencia ha sido registrada exitosamente. Nos pondremos en contacto contigo pronto.'
                            });
                        } catch (error) {
                            console.error('Error al procesar el issue:', error);
                            res.status(500).json({
                                fulfillmentText: 'Hubo un problema al registrar tu incidencia. Por favor, inténtalo de nuevo.'
                            });
                            return;
                        }
                    } else {
                        console.log('No se encontró el contexto flow');
                        res.status(400).json({
                            fulfillmentText: 'No se pudo procesar tu reporte. Faltan datos necesarios.'
                        });
                    }

                    break;
                }

                default:
                    res.status(200).json({
                        fulfillmentText: 'No entiendo esa consulta.'
                    });
            }
        } catch (error) {
            console.error('Error en ChatbotController:', error);
            res.status(500).json({
                fulfillmentText: 'Ocurrió un error al procesar la solicitud.'
            });
        }
    }
}
