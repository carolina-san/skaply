/**
 * @openapi
 * /furniture:
 *   get:
 *     summary: Get all furniture
 *     tags: [Furniture]
 *     responses:
 *       200:
 *         description: List of furniture
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Database connected successfully'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Furniture'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /furniture/filter:
 *   post:
 *     summary: Filter furniture
 *     tags: [Furniture]
 *     requestBody:
 *       required: false
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               category:
 *                 type: integer
 *                 example: 1
 *               provider:
 *                 type: integer
 *                 example: 2
 *               color:
 *                 type: string
 *                 example: 'Roble Natural'
 *     responses:
 *       200:
 *         description: Filtered list of furniture
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Furniture fetched'
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Furniture'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /furniture/{id}:
 *   get:
 *     summary: Get furniture by ID
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Furniture details
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Furniture fetched'
 *                 data:
 *                   type: array
 *                   description: "Returns an array with the furniture"
 *                   items:
 *                     $ref: '#/components/schemas/Furniture'
 *       404:
 *         description: Furniture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /furniture/{id}/issues:
 *   get:
 *     summary: Get furniture issues
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of issues
 *       404:
 *         description: Furniture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Report an issue
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 example: 'Missing screw'
 *               description:
 *                 type: string
 *                 example: 'The package is missing one screw on step 3'
 *     responses:
 *       201:
 *         description: Issue reported
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Furniture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /furniture/{id}/reviews:
 *   get:
 *     summary: Get furniture reviews
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: List of reviews
 *       404:
 *         description: Furniture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *   post:
 *     summary: Create furniture review
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: integer
 *                 minimum: 1
 *                 maximum: 5
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: 'Great furniture, easy to assemble'
 *     responses:
 *       201:
 *         description: Review created
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Furniture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /furniture/{id}/assembly:
 *   get:
 *     summary: Get furniture assembly details
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Assembly details
 *       404:
 *         description: Furniture not found
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 * /furniture/{reference}/qr:
 *   get:
 *     summary: Generate QR code for furniture
 *     description: Generates a QR code for a furniture item based on its reference number. The QR encodes the furniture's configured URL.
 *     tags: [Furniture]
 *     parameters:
 *       - in: path
 *         name: reference
 *         required: true
 *         description: The furniture reference number (e.g., F001)
 *         schema:
 *           type: string
 *           example: 'F001'
 *     responses:
 *       200:
 *         description: QR code generated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'QR code generated successfully'
 *                 data:
 *                   type: object
 *                   properties:
 *                     reference_number:
 *                       type: string
 *                       description: The furniture reference number
 *                       example: 'F001'
 *                     furniture_name:
 *                       type: string
 *                       description: The name of the furniture
 *                       example: 'Silla de madera'
 *                     qr_url:
 *                       type: string
 *                       description: The URL encoded in the QR code
 *                       example: 'https://lynk.app/furniture/1'
 *                     qr_data_url:
 *                       type: string
 *                       description: The QR code image as a base64 Data URL (can be used directly in img src)
 *                       example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAA...'
 *       400:
 *         description: Bad Request - Reference number is required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Furniture not found or QR URL not configured
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       500:
 *         description: Internal Server Error
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

