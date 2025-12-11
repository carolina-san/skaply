import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import * as dialogflow from '@google-cloud/dialogflow';
import { ProviderService } from '@/services/ProviderService';
import { ToolService } from '@/services/toolService';
import { IssueService } from '@/services/issueService';
import { FurnitureService } from '@/services/furnitureService';
import { Issue } from '@/types';
import { struct } from "pb-util";


export class ChatbotController {
    private providerService: ProviderService;
    private toolService: ToolService;
    private issueService: IssueService;
    private furnitureService: FurnitureService;
    private sessionClient: dialogflow.SessionsClient;
    private projectId: string;

    constructor(providerService?: ProviderService, toolService?: ToolService, furnitureService?: FurnitureService) {
        this.providerService = providerService || new ProviderService();
        this.toolService = toolService || new ToolService();
        this.issueService = new IssueService();
        this.furnitureService = furnitureService || new FurnitureService();
        this.projectId = 'allen-hmmc';
        this.sessionClient = new dialogflow.SessionsClient({
            keyFilename: 'dialogflow.json'
        });
    }

    handleChatbot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userMessage = req.body.text;
            const ref = req.body.ref;

            if (!userMessage) {
                // res.status(400).json({ fulfillmentText: 'No recibí ningún mensaje.' });
                next(new ApiError('BAD_REQUEST', 'No recibí ningún mensaje.'));
                return;
            }

            const sessionId = req.body.sessionId || "default";
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            const request: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentRequest = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: userMessage,
                        languageCode: 'es'
                    }
                }
            };


            const responses = await this.sessionClient.detectIntent(request);
            const result = responses[0].queryResult;

            res.json({
                fulfillmentText: result?.fulfillmentText ?? "",
                fulfillmentMessages: result?.fulfillmentMessages ?? []
            });

        } catch (err) {
            console.error(err);
            next(new ApiError('INTERNAL_SERVER', 'Error al conectar con Dialogflow.'));
        }
    };

    handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const action: string = req.body.queryResult.action;
            switch (action) {
                case "get.providers":
                    await this.getProviders(req, res);
                    return;
                case "get.tools":
                    await this.getTools(req, res);
                    return;
                case "issue.complete":
                    await this.completeIssue(req, res, next);
                    return;
                case "get.provider.by.name":
                    await this.getProviderByName(req, res);
                    return;
                case "get.furniture.info":
                    await this.getFurnitureInfo(req, res);
                    return;
                case "set.reference":
                    await this.setReference(req, res);
                    return;
                case "get.dificultad":
                    await this.getDificultad(req, res);
                    return;
                case "get.reference":
                    await this.comprobarReferencia(req, res);
                    return;
                default:
                    res.status(200).json({
                        fulfillmentText: "No entiendo esa consulta. (backend)"
                    });
                    return;
            }
        } catch (error) {
            console.error("Error en ChatbotController:", error);
            next(new ApiError('INTERNAL_SERVER', "Error interno en el webhook"));
        }
    };

    inicioMontaje = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { furniture_ref } = req.body;
            if (!furniture_ref) {
                next(new ApiError('BAD_REQUEST', "No se recibió el mueble"));
                return;
            }

            const sessionId = req.body.sessionId || "default";
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            const parametersStruct = struct.encode({ furniture_ref });

            const request = {
                session: sessionPath,
                queryInput: {
                    event: {
                        name: "INICIAR_MONTAJE",
                        parameters: parametersStruct,
                        languageCode: "es"
                    }
                }
            };

            const [responses] = await this.sessionClient.detectIntent(request);
            const result = responses.queryResult;
            res.json({
                fulfillmentText: result?.fulfillmentText ?? "",
                fulfillmentMessages: result?.fulfillmentMessages ?? []
            });

        } catch (error) {
            console.error("Error en el inicio de montaje:", error);
            next(new ApiError('INTERNAL_SERVER', "Error al enviar evento a Dialogflow"));
        }
    };

    resetMontaje = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {


            const sessionId = req.body.sessionId || "default";
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            const request = {
                session: sessionPath,
                queryInput: {
                    event: {
                        name: "RESET_MONTAJE",
                        languageCode: "es"
                    }
                }
            };

            const [responses] = await this.sessionClient.detectIntent(request);
            const result = responses.queryResult;

            res.json({
                fulfillmentText: result?.fulfillmentText ?? "",
                fulfillmentMessages: result?.fulfillmentMessages ?? []
            });

        } catch (error) {
            console.error("Error en resetMontaje:", error);
            next(new ApiError('INTERNAL_SERVER', "Error enviando RESET_MONTAJE"));
        }
    };

    sendWelcomeEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sessionId = req.body.sessionId || "default";
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            const request = {
                session: sessionPath,
                queryInput: {
                    event: {
                        name: "DEFAULT_WELCOME_INTENT",
                        languageCode: "es"
                    }
                }
            };

            const [responses] = await this.sessionClient.detectIntent(request);
            const result = responses.queryResult;

            res.json({
                fulfillmentText: result?.fulfillmentText ?? "",
                fulfillmentMessages: result?.fulfillmentMessages ?? []
            });

        } catch (error) {
            console.error("Error en sendWelcomeEvent:", error);
            next(new ApiError('INTERNAL_SERVER', "Error enviando evento de bienvenida"));
        }
    };

    private getProviders = async (req: Request, res: Response): Promise<void> => {
        const result = await this.providerService.getAllProvidersChatbot();

        res.status(200).json({
            fulfillmentMessages: [
                {
                    text: {
                        text: [`Tenemos ${result.rows.length} proveedores disponibles:`]
                    }
                },
                ...result.rows.map((p: any) => ({
                    card: {
                        title: p.company_name,
                        subtitle: `${p.email}\n${p.tax_address}`,
                        imageUri: p.image_url || "https://via.placeholder.com/150",
                        buttons: [
                            {
                                text: "Ver más información",
                                postback: `https://tudominio.com/proveedores/${p.id}`
                            }
                        ]
                    }
                }))
            ]
        });
    };

    private getProviderByName = async (req: Request, res: Response): Promise<void> => {
        const name = req.body.queryResult.parameters["proveedor"];
        if (!name) {
            res.status(200).json({
                fulfillmentText: "Necesito el nombre del proveedor."
            });
            return;
        }
        const result = await this.providerService.getProviderByName(name);
        if (result.rows.length === 0) {
            res.status(200).json({
                fulfillmentText: `No, "${name}" no forma parte de Skäply todavía.`
            });
            return;
        }
        res.status(200).json({
            fulfillmentMessages: [
                {
                    text: { text: [`Sí, el proveedor "${name}" está registrado en Skäply:`] }
                },
                ...result.rows.map((p: any) => ({
                    card: {
                        title: p.company_name,
                        subtitle: `${p.email}\n${p.tax_address}`,
                        imageUri: p.image_url || "https://via.placeholder.com/150",
                        buttons: [
                            {
                                text: "Ver más información",
                                postback: `https://tudominio.com/proveedores/${p.id}`
                            }
                        ]
                    }
                }))
            ]
        });
    };

    private getTools = async (req: Request, res: Response): Promise<void> => {
        const ctx = req.body.queryResult.outputContexts?.find(
            (c: any) => c.name.endsWith("/contexts/montaje_context")
        );
    console.log("montaje_context completo en get tools:", JSON.stringify(ctx, null, 2));

        const ref = ctx?.parameters?.furniture_ref;

        if (!ref) {
            res.status(200).json({
                fulfillmentText: "No puedo decirte qué herramientas usar sin que hayas iniciado el montaje de un mueble."
            });
            return;
        }

        const result = await this.toolService.getFurnitureTools(ref);

        res.status(200).json({
            fulfillmentMessages: [
                {
                    text: { text: [`Para montar este mueble necesitas:`] }
                },
                ...result.rows.map((t: any) => ({
                    card: {
                        title: t.name,
                        imageUri: t.image_url || "https://via.placeholder.com/150"
                    }
                }))
            ]
        });
    };

    private completeIssue = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        const ctx = req.body.queryResult.outputContexts?.find((c: any) =>
            c.name.endsWith("/contexts/flow")
        );
        if (!ctx) {
            // NOTE: Here we might use ApiError, but Dialogflow expects a 200 with text usually.
            // If we throw error, Dialogflow receives 400/500 and shows generic error.
            // Keeping it consistent with "ApiError" request:
            next(new ApiError('BAD_REQUEST', "Faltan datos para crear la incidencia (Contexto no encontrado)"));
            return;
        }

        const { issue_description, furniture_ref, userEmail } = ctx.parameters;

        try {
            const furnitureId = await this.furnitureService.getFurnitureIdByRef(furniture_ref);

            const issue: Issue = {
                description: issue_description,
                furniture_id: furnitureId,
                user_email: userEmail,
                date: new Date().toISOString()
            };

            await this.issueService.postIssue(issue);

            res.status(200).json({
                fulfillmentText: "Tu incidencia ha sido creada con éxito y será atendida pronto. Gracias."
            });

        } catch (err) {
            console.error(err);
            next(new ApiError('INTERNAL_SERVER', "Error al registrar la incidencia"));
        }
    };

    private getFurnitureInfo = async (req: Request, res: Response): Promise<void> => {
        const parameters = req.body.queryResult.parameters || {};
        const outputContexts = req.body.queryResult.outputContexts || [];
        
        let ref = parameters.furniture_ref2 && parameters.furniture_ref2.trim() !== ""
            ? parameters.furniture_ref2
            : undefined;

        if (!ref) {
            const montajeCtx = outputContexts.find((c: any) =>
                c.name.endsWith("/contexts/montaje_context")
            );
            ref = montajeCtx?.parameters?.furniture_ref;
        }


        if (!ref) {
            res.status(200).json({
                fulfillmentText: "Dime la referencia del mueble del que quieres información.",
                outputContexts: [
                    {
                        name: `${req.body.session}/contexts/pedir_referencia_context`,
                        lifespanCount: 2,
                        parameters: {}
                    },
                    {
                        name: `${req.body.session}/contexts/info_mueble_context`,
                        lifespanCount: 2
                    }
                ]
            });
            return;
        }

        try {
            const furniture = await this.furnitureService.getFurnitureIdByRef(ref);
            const furnitureData = await this.furnitureService.getFurnitureById(furniture);

            if (furnitureData.rows.length === 0) {
                res.status(200).json({
                    fulfillmentText: `No encontré el mueble con referencia "${ref}".`
                });
                return;
            }

            const furnitureDetails = furnitureData.rows[0];
            const difficulty = await this.furnitureService.getFurnitureDifficulty(furniture);

            res.status(200).json({
                fulfillmentMessages: [
                    {
                        card: {
                            title: furnitureDetails.name,
                            subtitle: `Referencia: ${furnitureDetails.reference_number}`,
                            imageUri: furnitureDetails.image_url || "https://via.placeholder.com/300",
                            formattedText: `
**Detalles del Mueble**

• **Descripción:** ${furnitureDetails.short_description || 'N/A'}
• **Categoría:** ${furnitureDetails.category_name}
• **Proveedor:** ${furnitureDetails.provider_name}
• **Color:** ${furnitureDetails.color_name}
• **Dificultad:** ${difficulty}
• **Pasos de montaje:** ${furnitureDetails.total_steps || 'N/A'}
• **ID:** ${furnitureDetails.id}`
                        }
                    }
                ]
            });
        } catch (error) {
            console.error('Error fetching furniture info:', error);
            res.status(200).json({
                fulfillmentText: `Error al obtener la información del mueble con referencia "${ref}".`
            });
        }
    };

    private getDificultad = async (req: Request, res: Response): Promise<void> => {
        let ref = req.body.queryResult.parameters?.furniture_ref2;

        if (!ref) {
            const ctx = req.body.queryResult.outputContexts?.find(
                (c: any) => c.name.endsWith("/contexts/montaje_context")
            );
            ref = ctx?.parameters?.furniture_ref;
        }

        if (!ref) {
            res.status(200).json({
                fulfillmentText: "Dime la referencia del mueble del que quieres saber la dificultad.",
                outputContexts: [
                    {
                        name: `${req.body.session}/contexts/pedir_referencia_context`,
                        lifespanCount: 2,
                        parameters: {}
                    },
                    {
                        name: `${req.body.session}/contexts/dificultad_mueble_context`,
                        lifespanCount: 2
                    }
                ]
            });
            return;
        }

        try {
            const id = await this.furnitureService.getFurnitureIdByRef(ref);
            const dificultad = await this.furnitureService.getFurnitureDifficulty(id);

            res.status(200).json({
                fulfillmentText: `La dificultad de montaje del mueble con referencia "${ref}" es: ${dificultad}.`
            });
        } catch (error) {
            console.error("Error en getDificultad:", error);
            res.status(200).json({
                fulfillmentText: `No encontré el mueble con referencia "${ref}".`
            });
        }
    }

    private comprobarReferencia = async (req: Request, res: Response): Promise<void> => {
        try {
            const outputContexts = req.body.queryResult.outputContexts || [];
            const parameters = req.body.queryResult.parameters || {};
            const session = req.body.session || "";

            // Buscar contexto del montaje
            const montajeContext = outputContexts.find((c: any) =>
                c.name.endsWith("/contexts/montaje_context")
            );

            const furnitureRef =
                montajeContext?.parameters?.furniture_ref ||
                parameters?.furniture_ref;


            if (furnitureRef) {
                res.status(200).json({
                    fulfillmentText: `Perfecto, voy a registrar la incidencia del mueble actual ${furnitureRef}. ¿Cuál es la descripción del problema?`,
                    outputContexts: [
                        {
                            name: `${session}/contexts/flow`,
                            lifespanCount: 5,
                            parameters: {
                                furniture_ref: furnitureRef
                            }
                        },
                        {
                            name: `${session}/contexts/awaiting_issue_desc`,
                            lifespanCount: 1
                        }
                    ]
                });
            } else {
                res.status(200).json({
                    fulfillmentText: "Para registrar la incidencia, necesito saber qué mueble es. ¿Cuál es su referencia?",
                    outputContexts: [
                        {
                            name: `${session}/contexts/awaiting_issue_ref`,
                            lifespanCount: 5
                        }
                    ]
                });
            }
        } catch (error) {
            console.error("Error en comprobarReferencia:", error);
            res.status(500).json({ fulfillmentText: "Error al procesar la incidencia" });
        }
    }


    private setReference = async (req: Request, res: Response): Promise<void> => {
        const outputContexts = req.body.queryResult.outputContexts || [];

        const hasInfoContext = outputContexts.some((c: any) =>
            c.name.endsWith("/contexts/info_mueble_context")
        );

        const hasMontajeContext = outputContexts.some((c: any) =>
            c.name.endsWith("/contexts/montaje_context")
        );

        const hasDificultadContext = outputContexts.some((c: any) =>
            c.name.endsWith("/contexts/dificultad_mueble_context")
        );

        if (hasInfoContext) {
            await this.getFurnitureInfo(req, res);
            return;
        }

        if (hasDificultadContext) {
            await this.getDificultad(req, res);
            return;
        }

        if (hasMontajeContext) {
            res.status(200).json({
                fulfillmentText: `Perfecto, ya tengo la referencia del montaje. ¿Continuamos?`
            });
            return;
        }

        res.status(200).json({
            fulfillmentText: `Has indicado una referencia. ¿Qué quieres hacer con ella?`
        });
    };

}
