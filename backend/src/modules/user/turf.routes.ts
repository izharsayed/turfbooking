import { Router } from 'express';
import { turfRepository } from '../../repositories/index.js';
import { sendResponse } from '../../shared/utils/response.js';
import { NotFoundError } from '../../shared/utils/errors.js';

const router = Router();

/**
 * @openapi
 * /turfs:
 *   get:
 *     summary: Retrieve list of all active turfs
 *     tags: [Turfs]
 *     responses:
 *       200:
 *         description: Turfs retrieved successfully
 */
router.get('/', async (req, res, next) => {
  try {
    const turfs = await turfRepository.findAllActive();
    return sendResponse(res, 200, true, 'Turfs retrieved successfully', turfs);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /turfs/{id}:
 *   get:
 *     summary: Get turf details by ID
 *     tags: [Turfs]
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Turf details retrieved successfully
 */
router.get('/:id', async (req, res, next) => {
  try {
    const turf = await turfRepository.findById(req.params.id);
    if (!turf) {
      throw new NotFoundError('Turf not found');
    }
    return sendResponse(res, 200, true, 'Turf details retrieved successfully', turf);
  } catch (error) {
    return next(error);
  }
});

export default router;
