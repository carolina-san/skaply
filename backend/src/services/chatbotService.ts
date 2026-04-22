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

    const parametersStruct = struct.encode({ furniture_ref: furnitureRef, furniture_step: 0 });

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
   * Actualiza el parametro step_number en el contexto de montaje_context de Dialogflow
   */
  async changeStepContext(furnitureRef: string, stepNumber: number, sessionId: string): Promise<any> {
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

    const parametersStruct = struct.encode({ furniture_ref: furnitureRef, furniture_step: stepNumber });
    console.log("Cambio el paso del context a ", stepNumber);
    const request = {
      session: sessionPath,
      queryInput: {
        event: {
          name: 'CAMBIAR_PASO_MONTAJE',
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
    const result = await this.providerService.getVisibleProviders();

    return {
      fulfillmentMessages: [
        {
          text: {
            text: [`Tenemos ${result.length} proveedores disponibles:`]
          }
        },
        ...result.map((p: any) => ({
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

    if (result.length === 0) {
      return {
        fulfillmentText: `No, "${name}" no forma parte de Skäply todavía.`
      };
    }

    return {
      fulfillmentMessages: [
        {
          text: { text: [`Sí, el proveedor "${name}" está registrado en Skäply:`] }
        },
        ...result.map((p: any) => ({
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
        ...result.map((t: any) => ({
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
        'Tu incidencia ha sido cr eada con éxito y será atendida pronto. Gracias.'
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

      if (furnitureData.length === 0) {
        return {
          fulfillmentText: `No encontré el mueble con referencia "${furnitureRef}".`
        };
      }

      const furnitureDetails = furnitureData;
      const difficulty = await this.furnitureService.getFurnitureDifficulty(furniture);

      return {
        fulfillmentMessages: [
          {
            card: {
              title: furnitureDetails.name,
              subtitle: `${furnitureDetails.reference_number}`,
              imageUri: furnitureDetails.image_url || 'https://via.placeholder.com/300'
            }
          },
          {
            payload: {
              richContent: [
                [
                  {
                    type: "description",
                    text: [
                      `Descripción: ${furnitureDetails.short_description || 'N/A'}`,
                      `Categoría: ${furnitureDetails.category_name}`,
                      `Proveedor: ${furnitureDetails.provider_name}`,
                      `Color: ${furnitureDetails.color_name}`,
                      `Dificultad: ${difficulty}`
                    ]
                  },
                  {
                    type: "button",
                    text: "Acceder al montaje",
                    link: `https://skaply.ovh/viewer-3d/${furnitureDetails.reference_number}`
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

  async getFurnitureInfoByName(name: string, session: string): Promise<any> {
    if (!name) {
      return {
        fulfillmentText: 'No he recibido el nombre del mueble.',
      };
    }

    try {
      const furniture = await this.furnitureService.getFurnitureByName(name);

      if (furniture.length === 0) {
        return {
          fulfillmentText: `No encontré el mueble con nombre "${name}".`
        };
      }

      const furnitureDetails = furniture[0];
      const difficulty = await this.furnitureService.getFurnitureDifficulty(furnitureDetails.id);

      return {
        fulfillmentMessages: [
          {
            card: {
              title: furnitureDetails.name,
              subtitle: `${furnitureDetails.reference_number}`,
              imageUri: furnitureDetails.image_url || 'https://via.placeholder.com/300'
            }
          },
          {
            payload: {
              richContent: [
                [
                  {
                    type: "description",
                    text: [
                      `Descripción: ${furnitureDetails.short_description || 'N/A'}`,
                      `Categoría: ${furnitureDetails.category_name}`,
                      `Proveedor: ${furnitureDetails.provider_name}`,
                      `Color: ${furnitureDetails.color_name}`,
                      `Dificultad: ${difficulty}`
                    ]
                  },
                  {
                    type: "button",
                    text: "Acceder al montaje",
                    link: `https://skaply.ovh/viewer-3d/${furnitureDetails.reference_number}`
                  }

                ]
              ]
            }
          }
        ]

      };
    } catch (error) {
      return {
        fulfillmentText: `No existe un mueble con el nombre "${name}". Por favor, verifica el nombre e intenta de nuevo.`
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
  async getNeededPeople(furnitureRef: string, session: string): Promise<any> {
    if (!furnitureRef) {
      return {
        fulfillmentText:
          'Dime la referencia del mueble del que quieres saber las personas necesarias.',
        outputContexts: [
          {
            name: `${session}/contexts/pedir_referencia_context`,
            lifespanCount: 2,
            parameters: {}
          },
          {
            name: `${session}/contexts/personas_necesarias_context`,
            lifespanCount: 2
          }
        ]
      };
    }

    try {
      const furniture = await this.furnitureService.getFurnitureByIdOrReference(furnitureRef);
      console.log(furniture);

      return {
        fulfillmentText: `Para montar el mueble "${furniture.name}" se necesitan ${furniture.required_people} personas.`
      };
    } catch (error) {
      return {
        fulfillmentText: `No existe un mueble con la referencia "${furnitureRef}". Por favor, verifica la referencia e intenta de nuevo.`
      };
    }
  }
  async getStepInfo(furnitureRef: string, stepNumber: number, session: string): Promise<any> {
    if (!furnitureRef) {
      return {
        fulfillmentText:
          'No puedo explicarte un paso sin que hayas iniciado el montaje de un mueble.'
      };
    }

    try {
      const step = await this.furnitureService.getStepByRef(furnitureRef, stepNumber);
      console.log(step);

      const messages: any[] = [
        {
          text: {
            text: [`El paso ${step.step_number} consiste en: ${step.description}.`]
          }
        }
      ];

      if (step.pieces && step.pieces.length > 0) {
        const piecesList = step.pieces.map((p: any) => `${p.quantity}x ${p.reference_number}`).join(', ');
        messages.push({
          text: {
            text: [`Para este paso necesitarás las siguientes piezas: ${piecesList}.`]
          }
        });
      }

      messages.push(
        {
          text: {
            text: ["¿Quieres que te lleve a ese paso?"]
          }
        },
        {
          payload: {
            richContent: [
              [
                {
                  type: "chips",
                  options: [
                    { text: "Sí" },
                    { text: "No" }
                  ]
                }
              ]
            ]
          }
        }
      );

      return {
        fulfillmentMessages: messages,
        outputContexts: [
          {
            name: `${session}/contexts/funcionalidadinfopaso-followup`,
            lifespanCount: 2,
            parameters: {
              step_number: step.step_number,
              furniture_ref: furnitureRef
            }
          }
        ]
      };
    } catch (error) {
      return {
        fulfillmentText: `No existe un paso con el número ${stepNumber}. Por favor, verifica el número del paso e intenta de nuevo.`
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

    const hasNeededPeopleContext = outputContexts.some((c: any) =>
      c.name.endsWith('/contexts/personas_necesarias_context')
    );

    if (hasInfoContext && furnitureRef) {
      return this.getFurnitureInfo(furnitureRef, session);
    }

    if (hasDificultadContext && furnitureRef) {
      return this.getDifficulty(furnitureRef, session);
    }

    if (hasNeededPeopleContext && furnitureRef) {
      return this.getNeededPeople(furnitureRef, session);
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
          options: categories.map((c: any) => ({
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
          options: categories.map((c: any) => ({
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
          options: colors.map((c: any) => ({
            text: c.name
          })),
          type: 'chips'
        }
      ]
    ];
    return {
      fulfillmentMessages: [
        {
          text: { text: ['¡Perfecto! Ahora dime, ¿qué color de mueble prefieres?'] }
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

      if (colorResult) {
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

      if (categoryResult) {
        console.log("Category found:", categoryResult);
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

  async getFurnitureRecomendation(category?: string, color?: string, session?: string): Promise<any> {
    let category_id = null;
    let color_id = null;
    if (category) {
      const categoryResult = await this.categoryService.getCategoryByName(category);
      if (categoryResult) {
        category_id = categoryResult.id;
      }
    }
    if (color) {
      const colorResult = await this.colorService.getColorByName(color);
      if (colorResult) {
        color_id = colorResult.id;
      }
    }
    const filters: any = {};
    if (category_id) filters.category_ids = [category_id];
    if (color_id) filters.color_ids = [color_id];

    try {
      let furnitureResult = await this.furnitureService.getFilteredFurniture(filters) as any[];
      let matchType = 'exact';

      if (furnitureResult.length === 0 && category_id) {
        const fallbackFilters = { category_ids: [category_id], color_ids: [] };
        furnitureResult = await this.furnitureService.getFilteredFurniture(fallbackFilters) as any[];
        matchType = 'fallback';
      }

      if (furnitureResult.length === 0) {
        return {
          fulfillmentText: "Lo siento, no encontré muebles con esas características."
        };
      }

      const randomIndex = Math.floor(Math.random() * furnitureResult.length);
      const exactMatch = furnitureResult[randomIndex];

      let introText = 'Este es tu mueble ideal:';
      if (matchType === 'fallback') {
        introText = `No encontré muebles con esas características, pero aquí tienes una opción en esa categoría:`;
      }

      return {
        fulfillmentMessages: [
          {
            text: { text: [introText] }
          },
          {
            card: {
              title: exactMatch.name,
              subtitle: `${exactMatch.short_description || ''}`,
              imageUri: exactMatch.image_url || 'https://via.placeholder.com/300',
              buttons: [
                {
                  text: 'Empezar montaje',
                  postback: `https://skaply.ovh/viewer-3d/${exactMatch.reference_number}`
                }
              ]
            }
          },
          {
            text: { text: ['¿Quieres más recomendaciones?'] }
          },
          {
            payload: {
              richContent: [
                [
                  {
                    type: "chips",
                    options: [
                      { text: "Sí, ver más" },
                      { text: "No, gracias" }
                    ]
                  }
                ]
              ]
            }
          }
        ],
        outputContexts: session ? [
          {
            name: `${session}/contexts/recommendation_vars`,
            lifespanCount: 5,
            parameters: {
              furniture_category: category,
              furniture_color: color,
              shown_furniture_id: exactMatch.id
            }
          }
        ] : []
      };
    } catch (error) {
      console.error("Error in getFurnitureRecomendation:", error);
      return {
        fulfillmentText: "Hubo un error al obtener las recomendaciones de muebles."
      };
    }
  }

  async getFurnitureRecomendationMore(category?: string, color?: string, shownId?: number): Promise<any> {
    let category_id = null;
    let color_id = null;
    if (category) {
      const categoryResult = await this.categoryService.getCategoryByName(category);
      if (categoryResult) {
        category_id = categoryResult.id;
      }
    }
    if (color) {
      const colorResult = await this.colorService.getColorByName(color);
      if (colorResult.length > 0) {
        color_id = colorResult.id;
      }
    }
    const filters: any = {};
    if (category_id) filters.category_ids = [category_id];
    if (color_id) filters.color_ids = [color_id];

    try {
      let furnitureResult = await this.furnitureService.getFilteredFurniture(filters) as any[];

      if (furnitureResult.length === 0 && category_id) {
        const fallbackFilters = { category_ids: [category_id], color_ids: [] };
        furnitureResult = await this.furnitureService.getFilteredFurniture(fallbackFilters) as any[];
      }

      const moreOptions = furnitureResult.filter((f: any) => f.id != shownId);

      if (moreOptions.length === 0) {
        return {
          fulfillmentText: "Lo siento, no tengo más recomendaciones que mostrarte por ahora."
        };
      }

      return {
        fulfillmentMessages: [
          {
            text: { text: ["Aquí tienes otras opciones que te pueden interesar:"] }
          },
          ...moreOptions.map((f: any) => ({
            card: {
              title: f.name,
              subtitle: f.short_description || '',
              imageUri: f.image_url || 'https://via.placeholder.com/300',
              buttons: [
                {
                  text: 'Empezar montaje',
                  postback: `https://skaply.ovh/viewer-3d/${f.reference_number}`
                }
              ]
            }
          }))
        ]
      };

    } catch (error) {
      console.error("Error in getFurnitureRecomendationMore:", error);
      return {
        fulfillmentText: "Hubo un error al obtener más recomendaciones."
      };
    }
  }

  async getFurnitureRef(name: string, session?: string): Promise<any> {
    try {
      const furnitureResult = await this.furnitureService.getFurnitureByName(name);
      if (furnitureResult.length === 0) {
        return {
          fulfillmentText: "Lo siento, no encontré el mueble con el nombre proporcionado."
        };
      }
      else if (furnitureResult.length > 1) {
        return {
          fulfillmentText: "Lo siento, hay más de un mueble con ese nombre."
        };
      }
      const furniture = furnitureResult[0];
      console.log(furniture);
      return {
        fulfillmentMessages: [
          {
            text: { text: [`La referencia de ese mueble es: ${furniture.reference_number}`] }
          }
        ]
      };
    } catch (error) {
      console.error("Error in getFurnitureRef:", error);
      return {
        fulfillmentText: "Hubo un error al obtener el mueble."
      };
    }
  }

  async goToStep(furnitureRef: string, stepNumber: number, session?: string): Promise<any> {
    try {
      return {
        fulfillmentMessages: [
          {
            payload: {
              action: "go.to.step",
              step_number: stepNumber,
              furniture_ref: furnitureRef,
              richContent: [
                [
                  {
                    type: "description",
                    text: [
                      `Te llevo al paso ${stepNumber}...`
                    ]
                  }
                ]
              ]
            }
          },
          {
            text: { text: [`¡Listo! Ya estás en el paso ${stepNumber}.`] }
          }
        ]
      };
    } catch (error) {
      console.error("Error in goToStep:", error);
      return {
        fulfillmentText: "Hubo un error al intentar ir a ese paso."
      };
    }
  }

  async isolatePart(furnitureRef: string, partName: string, session?: string): Promise<any> {
    try {
      const furnitureId = await this.furnitureService.getFurnitureIdByRef(furnitureRef);
      const fullPartName = await this.furnitureService.getFullPartNameInFurniture(furnitureId, partName);
      if (!fullPartName) {
        return {
          fulfillmentText: `La pieza ${partName} no existe en este mueble.`
        };
      }
      return {
        fulfillmentMessages: [
          {
            payload: {
              action: "isolate.part",
              furniture_ref: furnitureRef,
              part_name: fullPartName,
              richContent: [
                [
                  {
                    type: "description",
                    text: [
                      `Pieza ${fullPartName} aislada correctamente.`
                    ]
                  }
                ]
              ]
            }
          }
        ]
      };
    } catch (error) {
      console.error("Error in isolatePart:", error);
      return {
        fulfillmentText: "Hubo un error al intentar aislar la pieza."
      };
    }
  }

  async getStepParts(furnitureRef: string, stepNumber: number, session?: string): Promise<any> {
    try {
      const furnitureId = await this.furnitureService.getFurnitureIdByRef(furnitureRef);
      const stepParts = await this.furnitureService.getParts(furnitureId, stepNumber);
      if (stepParts.length === 0) {
        return {
          fulfillmentText: `No hay piezas nuevas en el paso ${stepNumber}.`
        };
      }

      return {
        fulfillmentMessages: [
          {
            text: { text: [`Las piezas nuevas del paso ${stepNumber} son:`] }
          },
          {
            payload: {
              action: "get.step.parts",
              furniture_ref: furnitureRef,
              furniture_step: stepNumber,
              richContent: [
                [
                  {
                    type: "chips",
                    options: stepParts.map((part: any) => ({
                      text: part.reference_number,
                    }))
                  }
                ]
              ]
            }
          }
        ]
      };
    } catch (error) {
      console.error("Error in getStepParts:", error);
      return {
        fulfillmentText: "Hubo un error al intentar obtener las piezas del paso."
      };
    }
  }
}
