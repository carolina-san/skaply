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
                url: 'https://skaply.ovh/api',
                description: 'Production server',
            },
            {
                url: 'http://localhost:3000/api',
                description: 'Local server',
            },
        ],
        tags: [
            { name: 'Health', description: 'API health check endpoints' },
            { name: 'Auth', description: 'Authentication endpoints' },
            { name: 'Providers', description: 'Public provider endpoints' },
            { name: 'Furniture', description: 'Public furniture endpoints' },
            { name: 'Categories', description: 'Category endpoints' },
            { name: 'Colors', description: 'Color endpoints' },
            { name: 'Chatbot', description: 'Chatbot and assembly assistant endpoints' },
            { name: 'Private - Furniture', description: 'Protected furniture management endpoints (requires authentication)' },
            { name: 'Private - Providers', description: 'Protected provider management endpoints (requires authentication)' },
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
                Provider: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        company_name: { type: 'string', example: 'Muebles SA' },
                        cif: { type: 'string', example: 'B12345678' },
                        tax_address: { type: 'string', example: 'Calle Industria 4, Madrid' },
                        email: { type: 'string', format: 'email', example: 'contact@mueblessa.com' },
                        telephone: { type: 'string', example: '+34600123456' },
                    },
                },
                Furniture: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Mesa de Comedor Roble' },
                        estimated_time: { type: 'string', example: '45 min' },
                        file_uri: { type: 'string', example: 'mesa_comedor_v1.glb' },
                        color: { type: 'string', example: 'Roble Natural' },
                        reference_number: { type: 'string', example: 'REF-2024-001' },
                        category: { type: 'integer', example: 3 },
                        provider: { type: 'integer', example: 5 },
                        short_description: { type: 'string', example: 'Mesa extensible de madera maciza para 6 personas.' },
                        image_url: { type: 'string', example: 'https://storage.googleapis.com/muebles/mesa1.jpg' },
                    },
                },
                Category: {
                    type: 'object',
                    properties: {
                        id: { type: 'integer', example: 1 },
                        name: { type: 'string', example: 'Mesas' },
                    },
                },
                User: {
                    type: 'object',
                    properties: {
                        email: { type: 'string', format: 'email', example: 'provider@example.com' },
                        company_name: { type: 'string', example: 'Muebles SA' },
                        cif: { type: 'string', example: 'B12345678' },
                        role: { type: 'string', enum: ['admin', 'user', 'provider'], example: 'provider' },
                    },
                },
                LoginResponse: {
                    type: 'object',
                    properties: {
                        message: { type: 'string', example: 'Login successful' },
                        data: {
                            type: 'object',
                            properties: {
                                email: { type: 'string', example: 'provider@example.com' },
                                token: { type: 'string', example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...' }
                            }
                        }
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
