/**
 * @openapi
 * /colors:
 *   get:
 *     summary: Get all colors
 *     tags: [Colors]
 *     responses:
 *       200:
 *         description: List of colors
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */
