import { Router } from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import { createApiController } from '#controllers/api-controller.js';
import { requireAuthentication } from '#middleware/auth.js';

export function createApiV1Router(container) {
  if (!container.config.features.api) {
    return Router();
  }

  const router = Router();
  const api = createApiController(container);

  /**
   * @openapi
   * /api/v1/me:
   *   get:
   *     summary: Current user
   *     security:
   *       - cookieAuth: []
   *     responses:
   *       200:
   *         description: The authenticated user
   *       401:
   *         description: Authentication required
   */
  router.get('/me', requireAuthentication(), api.me);

  if (container.config.features.formbarHttpExample && container.formbarHttpExample) {
    router.get('/examples/formbar', requireAuthentication(), api.exampleFormbarHttp);
  }

  if (container.config.features.apiDocs) {
    const spec = swaggerJsdoc({
      definition: {
        openapi: '3.0.3',
        info: {
          title: `${container.config.appName} API`,
          version: '1.0.0',
        },
        servers: [{ url: container.config.baseUrl }],
        components: {
          securitySchemes: {
            cookieAuth: { type: 'apiKey', in: 'cookie', name: container.config.session.cookieName },
          },
        },
      },
      apis: ['./src/routes/api.v1.js'],
    });
    router.use('/docs', swaggerUi.serve, swaggerUi.setup(spec));
    router.get('/openapi.json', (req, res) => res.json(spec));
  }

  return router;
}
