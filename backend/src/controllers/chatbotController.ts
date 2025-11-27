import { Request, Response } from 'express';
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
            keyFilename: 'dialogflow.json' // JSON de servicio de Dialogflow
        });
    }

    handleChatbot = async (req: Request, res: Response): Promise<void> => {

        try {
            const userMessage = req.body.text;
            const ref = req.body.ref;

            if (!userMessage) {
                res.status(400).json({ fulfillmentText: 'No recibí ningún mensaje.' });
                return;
            }

            const sessionId = '123456';
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            const request: dialogflow.protos.google.cloud.dialogflow.v2.IDetectIntentRequest = {
                session: sessionPath,
                queryInput: {
                    text: {
                        text: userMessage +' '+ ref,
                        languageCode: 'es'
                    }
                },
                queryParams: {
                    contexts: [{
                        name: `${sessionPath}/contexts/prueba-context`,
                        lifespanCount: 3,
                        parameters: {
                            fields: {
                                furniture_ref: {
                                    stringValue: ref || ''
                                }
                            }
                        }
                    }]
                }
            };


            const responses = await this.sessionClient.detectIntent(request);
            const result = responses[0].queryResult;

            // Envía todo tal cual lo devuelve Dialogflow
            res.json({
                fulfillmentText: result?.fulfillmentText ?? "",
                fulfillmentMessages: result?.fulfillmentMessages ?? []
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({ fulfillmentText: 'Error al conectar con Dialogflow.' });
        }
    };

    handleWebhook = async (req: Request, res: Response): Promise<void> => {
        console.log("Received webhook request:", JSON.stringify(req.body, null, 2));
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
                    await this.completeIssue(req, res);
                    return;
                case "get.provider.by.name":
                    await this.getProviderByName(req, res);
                    return;
                default:
                    res.status(200).json({
                        fulfillmentText: "No entiendo esa consulta."
                    });
                    return;
            }
        } catch (error) {
            console.error("Error en ChatbotController:", error);
            res.status(500).json({ fulfillmentText: "Error interno" });
        }
    };

    inicioMontaje = async (req: Request, res: Response): Promise<void> => {
        try {
            const { furniture_ref } = req.body;
            console.log("Referencia de mueble recibida:", furniture_ref);
            if (!furniture_ref) {
                res.status(400).json({ message: "No se recibió el mueble" });
                return;
            }

            const sessionId = "123456";
            const sessionPath = this.sessionClient.projectAgentSessionPath(
                this.projectId,
                sessionId
            );

            // ⭐ Convertir parámetros a Struct protobuf
            const parametersStruct = struct.encode({ furniture_ref });

            const request = {
                session: sessionPath,
                queryInput: {
                    event: {
                        name: "INICIAR_MONTAJE",
                        parameters: parametersStruct,  // <-- AQUI
                        languageCode: "es"
                    }
                }
            };

            const [responses] = await this.sessionClient.detectIntent(request);
            const result = responses.queryResult;
            console.log("Respuesta de Dialogflow para inicioMontaje:", JSON.stringify(result, null, 2));
            res.json({
                fulfillmentText: result?.fulfillmentText ?? "",
                fulfillmentMessages: result?.fulfillmentMessages ?? []
            });

        } catch (error) {
            console.error("Error en startAssembly:", error);
            res.status(500).json({ message: "Error al enviar evento a Dialogflow" });
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

        // Obtener el parámetro furniture_ref del contexto
        const ref = ctx?.parameters?.furniture_ref;

        if (!ref) {
            res.status(200).json({
                fulfillmentText: "Necesito el número de referencia del mueble."
            });
            return;
        }

        // Llamada al servicio para obtener herramientas
        const result = await this.toolService.getFurnitureTools(ref);

        res.status(200).json({
            fulfillmentMessages: [
                {
                    text: { text: [`Para el mueble ${ref} necesitas:`] }
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

    private completeIssue = async (req: Request, res: Response): Promise<void> => {
        const ctx = req.body.queryResult.outputContexts?.find((c: any) =>
            c.name.endsWith("/contexts/flow")
        );
        if (!ctx) {
            res.status(400).json({
                fulfillmentText: "Faltan datos para crear la incidencia."
            });
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

            await this.issueService.postChatbotIssues(issue);

            res.status(200).json({
                fulfillmentText: "Tu incidencia ha sido creada con éxito y será atendida pronto. Gracias."
            });

        } catch (err) {
            console.error(err);
            res.status(500).json({
                fulfillmentText: "Error al registrar la incidencia."
            });
        }
    };

}
