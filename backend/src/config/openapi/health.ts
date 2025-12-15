/**
 * @openapi
 * /health:
 *   get:
 *     summary: API Health Check
 *     description: Checks if the API is running and returns the status of tools.
 *     tags:
 *       - Health
 *     responses:
 *       200:
 *         description: API is operating correctly
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: API is running
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 healthTool:
 *                   type: array
 *                   description: Status of internal tools
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
