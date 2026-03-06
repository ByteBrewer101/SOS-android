const swaggerJsdoc = require('swagger-jsdoc');

const options = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'SOS Emergency Alert API',
            version: '1.0.0',
            description:
                'Backend API for the SOS Emergency Alert application. Enables elderly users to trigger SOS alerts and notifies verified volunteers.',
            contact: {
                name: 'API Support',
            },
        },
        servers: [
            {
                url: '/api',
                description: 'API Base URL',
            },
        ],
        components: {
            securitySchemes: {
                bearerAuth: {
                    type: 'http',
                    scheme: 'bearer',
                    bearerFormat: 'JWT',
                },
            },
        },
    },
    apis: ['./src/routes/*.js'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;
