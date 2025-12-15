import swaggerJSDoc from 'swagger-jsdoc';

const options: swaggerJSDoc.Options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'Lynk API',
            version: '1.0.0',
            description: 'API documentation for Lynk application',
        },
        servers: [
            {
                url: 'http://localhost:3000/api',
                description: 'Local server',
            },
        ],
        components: {
            schemas: {
                Error: {
                    type: 'object',
                    properties: {
                        message: {
                            type: 'string',
                            description: 'Error description',
                            example: 'Internal Server Error'
                        },
                        stack: {
                            type: 'string',
                            description: 'Stack trace (only in development)',
                        },
                    },
                },
            },
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.ts', './src/routes/**/*.ts', './src/config/openapi/*.ts'],
};

export const swaggerSpec = swaggerJSDoc(options);
