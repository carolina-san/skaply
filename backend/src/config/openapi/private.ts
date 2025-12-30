/**
 * @openapi
 * /private/furniture:
 *   post:
 *     summary: Create new furniture
 *     description: Creates a new furniture item. Requires ADMIN role.
 *     tags: [Private - Furniture]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - reference_number
 *               - category
 *               - provider
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Mesa de Comedor Roble'
 *               estimated_time:
 *                 type: string
 *                 example: '45 min'
 *               file_uri:
 *                 type: string
 *                 example: 'mesa_comedor_v1.glb'
 *               color:
 *                 type: string
 *                 example: 'Roble Natural'
 *               reference_number:
 *                 type: string
 *                 example: 'REF-2024-001'
 *               category:
 *                 type: integer
 *                 example: 3
 *               provider:
 *                 type: integer
 *                 example: 5
 *               short_description:
 *                 type: string
 *                 example: 'Mesa extensible de madera maciza para 6 personas.'
 *               image_url:
 *                 type: string
 *                 example: 'https://storage.googleapis.com/muebles/mesa1.jpg'
 *     responses:
 *       201:
 *         description: Furniture created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Furniture created successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Furniture'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
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
 * /private/furniture/{id}:
 *   put:
 *     summary: Update furniture
 *     description: Updates an existing furniture item. Requires ADMIN or PROVIDER role.
 *     tags: [Private - Furniture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Furniture ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 example: 'Mesa de Comedor Roble Actualizada'
 *               estimated_time:
 *                 type: string
 *                 example: '50 min'
 *               file_uri:
 *                 type: string
 *                 example: 'mesa_comedor_v2.glb'
 *               color:
 *                 type: string
 *                 example: 'Roble Oscuro'
 *               reference_number:
 *                 type: string
 *                 example: 'REF-2024-002'
 *               category:
 *                 type: integer
 *                 example: 3
 *               provider:
 *                 type: integer
 *                 example: 5
 *               short_description:
 *                 type: string
 *                 example: 'Mesa extensible actualizada para 8 personas.'
 *               image_url:
 *                 type: string
 *                 example: 'https://storage.googleapis.com/muebles/mesa2.jpg'
 *     responses:
 *       200:
 *         description: Furniture updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Furniture updated successfully'
 *                 data:
 *                   $ref: '#/components/schemas/Furniture'
 *       400:
 *         description: Bad Request
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Provider role required
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
 *   delete:
 *     summary: Delete furniture
 *     description: Deletes an existing furniture item. Requires ADMIN or PROVIDER role.
 *     tags: [Private - Furniture]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Furniture ID
 *     responses:
 *       200:
 *         description: Furniture deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Furniture deleted successfully'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin or Provider role required
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
 * /private/providers/{id}:
 *   delete:
 *     summary: Delete provider
 *     description: Deletes an existing provider. Requires ADMIN role.
 *     tags: [Private - Providers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Provider ID
 *     responses:
 *       200:
 *         description: Provider deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: 'Provider deleted successfully'
 *       401:
 *         description: Unauthorized
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       403:
 *         description: Forbidden - Admin role required
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 *       404:
 *         description: Provider not found
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
