/**
 * @openapi
 * /chatbot:
 *   post:
 *     summary: Handle chatbot message
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: Chatbot response
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /chatbot/webhook:
 *   post:
 *     summary: Dialogflow webhook
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: Webhook response
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /chatbot/start:
 *   post:
 *     summary: Start assembly session
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: Session started
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /chatbot/reset:
 *   post:
 *     summary: Reset assembly session
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: Session reset
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /chatbot/welcome:
 *   post:
 *     summary: Send welcome event
 *     tags: [Chatbot]
 *     responses:
 *       200:
 *         description: Welcome message sent
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
