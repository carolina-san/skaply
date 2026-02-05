import { Request, Response, NextFunction } from 'express';
import { ApiError } from '@/utils/ApiError';
import { ChatbotService } from '@/services/chatbotService';

export class ChatbotController {
    private chatbotService: ChatbotService;

    constructor(chatbotService?: ChatbotService) {
        this.chatbotService = chatbotService || new ChatbotService();
    }

    handleChatbot = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const userMessage = req.body.text;

            if (!userMessage) {
                next(new ApiError('BAD_REQUEST', 'No recibí ningún mensaje.'));
                return;
            }

            const sessionId = req.body.sessionId || 'default';
            const result = await this.chatbotService.sendMessage(userMessage, sessionId);

            res.json(result);

        } catch (err) {
            console.error(err);
            next(new ApiError('INTERNAL_SERVER', 'Error al conectar con Dialogflow.'));
        }
    };

    handleWebhook = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const action: string = req.body.queryResult.action;
            const outputContexts = req.body.queryResult.outputContexts || [];
            const parameters = req.body.queryResult.parameters || {};
            const session = req.body.session || '';

            switch (action) {
                case 'get.providers':
                    res.status(200).json(await this.chatbotService.getProviders());
                    return;
                case 'get.tools': {
                    const ctx = outputContexts.find((c: any) =>
                        c.name.endsWith('/contexts/montaje_context')
                    );
                    const ref = ctx?.parameters?.furniture_ref;
                    res.status(200).json(await this.chatbotService.getTools(ref));
                    return;
                }
                case 'issue.complete':
                    await this.handleCompleteIssue(req, res, next);
                    return;
                case 'get.provider.by.name': {
                    const name = parameters['proveedor'];
                    res.status(200).json(await this.chatbotService.getProviderByName(name));
                    return;
                }
                case 'get.furniture.info': {
                    let ref =
                        parameters.furniture_ref2 && parameters.furniture_ref2.trim() !== ''
                            ? parameters.furniture_ref2
                            : undefined;

                    if (!ref) {
                        const montajeCtx = outputContexts.find((c: any) =>
                            c.name.endsWith('/contexts/montaje_context')
                        );
                        ref = montajeCtx?.parameters?.furniture_ref;
                    }

                    res.status(200).json(await this.chatbotService.getFurnitureInfo(ref || '', session));
                    return;
                }
                case 'set.reference': {
                    const result = await this.chatbotService.setReference(
                        outputContexts,
                        session,
                        parameters.furniture_ref2
                    );
                    res.status(200).json(result);
                    return;
                }
                case 'get.dificultad': {
                    let ref = parameters?.furniture_ref2;

                    if (!ref) {
                        const ctx = outputContexts.find((c: any) =>
                            c.name.endsWith('/contexts/montaje_context')
                        );
                        ref = ctx?.parameters?.furniture_ref;
                    }

                    res.status(200).json(await this.chatbotService.getDifficulty(ref || '', session));
                    return;
                }
                case 'get.reference': {
                    const montajeContext = outputContexts.find((c: any) =>
                        c.name.endsWith('/contexts/montaje_context')
                    );

                    const furnitureRef = montajeContext?.parameters?.furniture_ref || parameters?.furniture_ref;
                    res.status(200).json(await this.chatbotService.checkReference(furnitureRef, session));
                    return;
                }
                case 'get.categories': {
                    res.status(200).json(await this.chatbotService.getCategories());
                    return;
                }
                case 'get.category.filters': {
                    res.status(200).json(await this.chatbotService.getCategoryFilters());
                    return;
                }
                case 'get.color.filters': {
                    res.status(200).json(await this.chatbotService.getColorFilters());
                    return;
                }
                case 'filter.by.color': {
                    const color = parameters['furniture_color'];
                    res.status(200).json(await this.chatbotService.filterByColor(color));
                    return;
                }
                case 'filter.by.category': {
                    const category = parameters['furniture_category'];
                    res.status(200).json(await this.chatbotService.filterByCategory(category));
                    return;
                }
                case 'get.furniture.recomendation': {
                    const ctx = req.body.queryResult.outputContexts?.find((c: any) =>
                        c.name.endsWith('/contexts/flujo_busqueda')
                    );
                    if (ctx) {
                        console.log('categoria:', ctx.parameters.furniture_category, 'color:', ctx.parameters.furniture_color);
                    }
                    if (!ctx) {
                        next(new ApiError('BAD_REQUEST', 'Faltan datos para buscar muebles'));
                        return;
                    }
                    res.status(200).json(await this.chatbotService.getFurnitureRecomendation(ctx.parameters.furniture_category, ctx.parameters.furniture_color, session));
                    return;
                }
                case 'get.furniture.recomendation.more': {
                    const ctx = req.body.queryResult.outputContexts?.find((c: any) =>
                        c.name.endsWith('/contexts/recommendation_vars')
                    ) || req.body.queryResult.outputContexts?.find((c: any) =>
                        c.name.endsWith('/contexts/flujo_busqueda')
                    );
                    if (ctx) {
                        console.log('categoria:', ctx.parameters.furniture_category, 'color:', ctx.parameters.furniture_color);
                    }
                    if (!ctx) {
                        next(new ApiError('BAD_REQUEST', 'Faltan datos para buscar más muebles'));
                        return;
                    }
                    const shownId = ctx.parameters.shown_furniture_id;
                    res.status(200).json(await this.chatbotService.getFurnitureRecomendationMore(ctx.parameters.furniture_category, ctx.parameters.furniture_color, shownId));
                    return;
                }
                default:
                    res.status(200).json({
                        fulfillmentText: 'No entiendo esa consulta. (backend)'
                    });
                    return;
            }
        } catch (error) {
            console.error('Error en ChatbotController:', error);
            next(new ApiError('INTERNAL_SERVER', 'Error interno en el webhook'));
        }
    };

    initAssembly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const { furniture_ref } = req.body;
            if (!furniture_ref) {
                next(new ApiError('BAD_REQUEST', 'No se recibió el mueble'));
                return;
            }

            const sessionId = req.body.sessionId || 'default';
            const result = await this.chatbotService.initAssembly(furniture_ref, sessionId);

            res.json(result);

        } catch (error) {
            console.error('Error en el inicio de montaje:', error);
            next(new ApiError('INTERNAL_SERVER', 'Error al enviar evento a Dialogflow'));
        }
    };

    resetAssembly = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sessionId = req.body.sessionId || 'default';
            const result = await this.chatbotService.resetAssembly(sessionId);

            res.json(result);

        } catch (error) {
            console.error('Error en resetAssembly:', error);
            next(new ApiError('INTERNAL_SERVER', 'Error enviando RESET_ASSEMBLY a Dialogflow'));
        }
    };

    sendWelcomeEvent = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const sessionId = req.body.sessionId || 'default';
            const result = await this.chatbotService.sendWelcomeEvent(sessionId);

            res.json(result);

        } catch (error) {
            console.error('Error en sendWelcomeEvent:', error);
            next(new ApiError('INTERNAL_SERVER', 'Error enviando evento de bienvenida'));
        }
    };

    private handleCompleteIssue = async (
        req: Request,
        res: Response,
        next: NextFunction
    ): Promise<void> => {
        const ctx = req.body.queryResult.outputContexts?.find((c: any) =>
            c.name.endsWith('/contexts/flow')
        );
        if (!ctx) {
            next(new ApiError('BAD_REQUEST', 'Faltan datos para crear la incidencia (Contexto no encontrado)'));
            return;
        }

        const { issue_description, furniture_ref, userEmail } = ctx.parameters;

        try {
            const result = await this.chatbotService.completeIssue(
                issue_description,
                furniture_ref,
                userEmail
            );
            res.status(200).json(result);
        } catch (err) {
            console.error(err);
            next(new ApiError('INTERNAL_SERVER', 'Error al registrar la incidencia'));
        }
    };

    getFurnitureRecomendation = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const category = req.body.category;
            const color = req.body.color;
            const result = await this.chatbotService.getFurnitureRecomendation(category, color);
            res.json(result);
        } catch (error) {
            console.error('Error en getFurnitureRecomendation:', error);
            next(new ApiError('INTERNAL_SERVER', 'Error al obtener las recomendaciones de muebles'));
        }
    };
}
