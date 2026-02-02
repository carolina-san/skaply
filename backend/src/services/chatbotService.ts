import * as dialogflow from '@google-cloud/dialogflow';
import { ProviderService } from '@/services/ProviderService';
import { ToolService } from '@/services/toolService';
import { IssueService } from '@/services/issueService';
import { FurnitureService } from '@/services/furnitureService';
import { CategoryService } from '@/services/categoryService';
import { ColorService } from './colorService';
import { Issue } from '@/types';
import { struct } from 'pb-util';

export class ChatbotService {
  private providerService: ProviderService;
  private toolService: ToolService;
  private issueService: IssueService;
  private furnitureService: FurnitureService;
  private sessionClient: dialogflow.SessionsClient;
  private categoryService: CategoryService;
  private projectId: string;
  private colorService: ColorService;

  constructor(
    providerService?: ProviderService,
    toolService?: ToolService,
    issueService?: IssueService,
    furnitureService?: FurnitureService,
    categoryService?: CategoryService,
    colorService?: ColorService
  ) {
    this.providerService = providerService || new ProviderService();
    this.toolService = toolService || new ToolService();
    this.issueService = issueService || new IssueService();
    this.furnitureService = furnitureService || new FurnitureService();
    this.categoryService = categoryService || new CategoryService();
    this.colorService = colorService || new ColorService();
    this.projectId = 'allen-hmmc';
    this.sessionClient = new dialogflow.SessionsClient({
      keyFilename: 'dialogflow.json'
    });
  }

  /**
   * Envía un mensaje de usuario a Dialogflow
   */
  async sendMessage(userMessage: string, sessionId: string): Promise<any> {
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

    return {
      fulfillmentText: result?.fulfillmentText ?? '',
      fulfillmentMessages: result?.fulfillmentMessages ?? []
    };
  }

  /**
   * Inicia el evento de montaje en Dialogflow
   */
  async initAssembly(furnitureRef: string, sessionId: string): Promise<any> {
    // Validar que el mueble existe antes de iniciar el montaje
    try {
      await this.furnitureService.getFurnitureIdByRef(furnitureRef);
    } catch (error) {
      return {
        fulfillmentText: `No existe un mueble con la referencia "${furnitureRef}". Por favor, verifica la referencia e intenta de nuevo.`
      };
    }

    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      sessionId
    );

    const parametersStruct = struct.encode({ furniture_ref: furnitureRef });

    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: 'INICIAR_MONTAJE',
          parameters: parametersStruct,
          languageCode: 'es'
        }
      }
    };

    const [responses] = await this.sessionClient.detectIntent(request);
    const result = responses.queryResult;

    return {
      fulfillmentText: result?.fulfillmentText ?? '',
      fulfillmentMessages: result?.fulfillmentMessages ?? []
    };
  }

  /**
   * Reinicia el contexto de montaje
   */
  async resetAssembly(sessionId: string): Promise<any> {
    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: 'RESET_MONTAJE',
          languageCode: 'es'
        }
      }
    };

    const [responses] = await this.sessionClient.detectIntent(request);
    const result = responses.queryResult;

    return {
      fulfillmentText: result?.fulfillmentText ?? '',
      fulfillmentMessages: result?.fulfillmentMessages ?? []
    };
  }

  /**
   * Envía evento de bienvenida
   */
  async sendWelcomeEvent(sessionId: string): Promise<any> {
    const sessionPath = this.sessionClient.projectAgentSessionPath(
      this.projectId,
      sessionId
    );

    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: 'DEFAULT_WELCOME_INTENT',
          languageCode: 'es'
        }
      }
    };

    const [responses] = await this.sessionClient.detectIntent(request);
    const result = responses.queryResult;

    return {
      fulfillmentText: result?.fulfillmentText ?? '',
      fulfillmentMessages: result?.fulfillmentMessages ?? []
    };
  }

  /**
   * Obtiene lista de proveedores
   */
  async getProviders(): Promise<any> {
    const result = await this.providerService.getAllProvidersChatbot(); // no debería devolver providers que tengan active = false

    return {
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
            imageUri: p.image_url || 'https://via.placeholder.com/150',
            buttons: [
              {
                text: 'Ver más información',
                postback: `https://tudominio.com/proveedores/${p.id}`
              }
            ]
          }
        }))
      ]
    };
  }

  /**
   * Obtiene proveedor por nombre
   */
  async getProviderByName(name: string): Promise<any> {
    if (!name) {
      return {
        fulfillmentText: 'Necesito el nombre del proveedor.'
      };
    }

    const result = await this.providerService.getProviderByName(name);

    if (result.rows.length === 0) {
      return {
        fulfillmentText: `No, "${name}" no forma parte de Skäply todavía.`
      };
    }

    return {
      fulfillmentMessages: [
        {
          text: { text: [`Sí, el proveedor "${name}" está registrado en Skäply:`] }
        },
        ...result.rows.map((p: any) => ({
          card: {
            title: p.company_name,
            subtitle: `${p.email}\n${p.tax_address}`,
            imageUri: p.image_url || 'https://via.placeholder.com/150',
            buttons: [
              {
                text: 'Ver más información',
                postback: `https://tudominio.com/proveedores/${p.id}`
              }
            ]
          }
        }))
      ]
    };
  }

  /**
   * Obtiene herramientas necesarias para un mueble
   */
  async getTools(furnitureRef: string | undefined): Promise<any> {
    if (!furnitureRef) {
      return {
        fulfillmentText:
          'No puedo decirte qué herramientas usar sin que hayas iniciado el montaje de un mueble.'
      };
    }

    const result = await this.toolService.getFurnitureTools(furnitureRef);

    return {
      fulfillmentMessages: [
        {
          text: { text: [`Para montar este mueble necesitas las siguientes herramientas`] }
        },
        ...result.rows.map((t: any) => ({
          card: {
            title: t.name,
            imageUri: t.image_url || 'https://via.placeholder.com/150'
          }
        }))
      ]
    };
  }

  /**
   * Completa una incidencia
   */
  async completeIssue(
    issueDescription: string,
    furnitureRef: string,
    userEmail: string
  ): Promise<any> {
    const furnitureId = await this.furnitureService.getFurnitureIdByRef(
      furnitureRef
    );

    const issue: Issue = {
      description: issueDescription,
      furniture_id: furnitureId,
      user_email: userEmail,
      date: new Date().toISOString()
    };

    await this.issueService.postIssue(issue);

    return {
      fulfillmentText:
        'Tu incidencia ha sido creada con éxito y será atendida pronto. Gracias.'
    };
  }

  /**
   * Obtiene información del mueble
   */
  async getFurnitureInfo(furnitureRef: string, session: string): Promise<any> {
    if (!furnitureRef) {
      return {
        fulfillmentText: 'Dime la referencia del mueble del que quieres información.',
        outputContexts: [
          {
            name: `${session}/contexts/pedir_referencia_context`,
            lifespanCount: 2,
            parameters: {}
          },
          {
            name: `${session}/contexts/info_mueble_context`,
            lifespanCount: 2
          }
        ]
      };
    }

    try {
      const furniture = await this.furnitureService.getFurnitureIdByRef(furnitureRef);
      const furnitureData = await this.furnitureService.getFurnitureById(furniture);

      if (furnitureData.rows.length === 0) {
        return {
          fulfillmentText: `No encontré el mueble con referencia "${furnitureRef}".`
        };
      }

      const furnitureDetails = furnitureData.rows[0];
      const difficulty = await this.furnitureService.getFurnitureDifficulty(furniture);

      return {
        fulfillmentMessages: [
          {
            card: {
              title: furnitureDetails.name,
              subtitle: `Referencia: ${furnitureDetails.reference_number}`,
              imageUri: furnitureDetails.image_url || 'https://via.placeholder.com/300'
            }
          },
          {
            payload: {
              richContent: [
                [
                  {
                    type: "info",
                    title: "Detalles del Mueble",
                  },
                  {
                    type: "description",
                    text: [
                      `Descripción: ${furnitureDetails.short_description || 'N/A'}`,
                      `Categoría: ${furnitureDetails.category_name}`,
                      `Proveedor: ${furnitureDetails.provider_name}`,
                      `Color: ${furnitureDetails.color_name}`,
                      `Dificultad: ${difficulty}`
                    ]
                  }
                ]
              ]
            }
          }
        ]

      };
    } catch (error) {
      return {
        fulfillmentText: `No existe un mueble con la referencia "${furnitureRef}". Por favor, verifica la referencia e intenta de nuevo.`
      };
    }
  }

  /**
   * Obtiene dificultad del mueble
   */
  async getDifficulty(furnitureRef: string, session: string): Promise<any> {
    if (!furnitureRef) {
      return {
        fulfillmentText:
          'Dime la referencia del mueble del que quieres saber la dificultad.',
        outputContexts: [
          {
            name: `${session}/contexts/pedir_referencia_context`,
            lifespanCount: 2,
            parameters: {}
          },
          {
            name: `${session}/contexts/dificultad_mueble_context`,
            lifespanCount: 2
          }
        ]
      };
    }

    try {
      const id = await this.furnitureService.getFurnitureIdByRef(furnitureRef);
      const difficulty = await this.furnitureService.getFurnitureDifficulty(id);

      return {
        fulfillmentText: `La dificultad de montaje del mueble con referencia "${furnitureRef}" es: ${difficulty}.`
      };
    } catch (error) {
      return {
        fulfillmentText: `No existe un mueble con la referencia "${furnitureRef}". Por favor, verifica la referencia e intenta de nuevo.`
      };
    }
  }

  /**
   * Comprueba la referencia del mueble para registrar incidencia
   */
  async checkReference(
    furnitureRef: string | undefined,
    session: string
  ): Promise<any> {
    if (furnitureRef) {
      return {
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
      };
    } else {
      return {
        fulfillmentText:
          'Para registrar la incidencia, necesito saber qué mueble es. ¿Cuál es su referencia?',
        outputContexts: [
          {
            name: `${session}/contexts/awaiting_issue_ref`,
            lifespanCount: 5
          }
        ]
      };
    }
  }

  /**
   * Establece la referencia según el contexto
   */
  async setReference(
    outputContexts: any[],
    session: string,
    furnitureRef?: string
  ): Promise<any> {
    const hasInfoContext = outputContexts.some((c: any) =>
      c.name.endsWith('/contexts/info_mueble_context')
    );

    const hasMontajeContext = outputContexts.some((c: any) =>
      c.name.endsWith('/contexts/montaje_context')
    );

    const hasDificultadContext = outputContexts.some((c: any) =>
      c.name.endsWith('/contexts/dificultad_mueble_context')
    );

    if (hasInfoContext && furnitureRef) {
      return this.getFurnitureInfo(furnitureRef, session);
    }

    if (hasDificultadContext && furnitureRef) {
      return this.getDifficulty(furnitureRef, session);
    }

    if (hasMontajeContext) {
      return {
        fulfillmentText: `Perfecto, ya tengo la referencia del montaje. ¿Continuamos?`
      };
    }

    return {
      fulfillmentText: `Has indicado una referencia. ¿Qué quieres hacer con ella?`
    };
  }
  async getCategoryFilters(): Promise<any> {
    const categories = await this.categoryService.getAllCategories();

    const richContent = [
      [

        {
          options: categories.rows.map((c: any) => ({
            text: c.name
          })),
          type: 'chips'
        }
      ]
    ];

    return {
      fulfillmentMessages: [
        {
          text: { text: ['¿Qué tipo de mueble te interesa?'] }
        },
        {
          payload: {
            richContent: richContent
          }
        }
      ]
    };
  }

  async getCategories(): Promise<any> {
    const categories = await this.categoryService.getAllCategories();

    const richContent = [
      [
        {
          title: 'En Skäply puedes encontrar estos tipos de muebles:',
          type: 'info'
        },
        {
          options: categories.rows.map((c: any) => ({
            text: c.name
          })),
          type: 'chips'
        }
      ]
    ];

    return {
      fulfillmentMessages: [
        {
          payload: {
            richContent: richContent
          }
        }
      ]
    };
  }
  async getColorFilters(): Promise<any> {
    const colors = await this.colorService.getAllColorsFoundInFurniture();
    const richContent = [
      [
        {
          options: colors.rows.map((c: any) => ({
            text: c.name
          })),
          type: 'chips'
        }
      ]
    ];
    return {
      fulfillmentMessages: [
        {
          text: { text: ['¿Qué color de mueble prefieres?'] }
        },
        {
          payload: {
            richContent: richContent
          }
        }
      ]
    };
  }

  async filterByColor(colorName: string): Promise<any> {
    try {
      const colorResult = await this.colorService.getColorByName(colorName);

      if (colorResult.rows.length > 0) {
        return {
          fulfillmentMessages: [
            {
              payload: {
                action: "filter.by.color",
                color: colorName,
                richContent: [
                  [
                    {
                      type: "description",
                      text: [
                        `Buscando muebles de color ${colorName}`
                      ]
                    }
                  ]
                ]
              }
            },
            {
              text: { text: ["¡Catálogo filtrado!"] }
            }
          ]
        };
      } else {
        return {
          fulfillmentText: `Lo siento, no encontré muebles de color ${colorName}.`
        };
      }
    } catch (error) {
      console.error("Error in filterByColor:", error);
      return {
        fulfillmentText: "Hubo un error al buscar el color."
      };
    }
  }

  async filterByCategory(categoryName: string): Promise<any> {
    try {
      const categoryResult = await this.categoryService.getCategoryByName(categoryName);

      if (categoryResult.rows.length > 0) {
        return {
          fulfillmentMessages: [
            {
              payload: {
                action: "filter.by.category",
                category: categoryName,
                richContent: [
                  [
                    {
                      type: "description",
                      text: [
                        `Buscando muebles en la categoría ${categoryName}`
                      ]
                    }
                  ]
                ]
              }
            },
            {
              text: { text: ["¡Catálogo filtrado!"] }
            }
          ]
        };
      } else {
        return {
          fulfillmentText: `Lo siento, no encontré muebles de categoría ${categoryName}.`
        };
      }
    } catch (error) {
      console.error("Error in filterByCategory:", error);
      return {
        fulfillmentText: "Hubo un error al buscar la categoría."
      };
    }
  }
}
