import { Router } from 'express';
import { authenticate } from '../../middlewares/auth.js';
import { sendResponse } from '../../shared/utils/response.js';
import { prisma } from '../../database/index.js';
import { firestoreDb } from '../../config/firebase.js';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const provider = process.env.DATABASE_PROVIDER || 'prisma';

/**
 * @openapi
 * /tickets:
 *   post:
 *     summary: Create a support ticket
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - subject
 *               - description
 *               - category
 *             properties:
 *               subject:
 *                 type: string
 *               description:
 *                 type: string
 *               category:
 *                 type: string
 *     responses:
 *       201:
 *         description: Ticket created successfully
 */
router.post('/', authenticate as any, async (req: any, res, next) => {
  try {
    const { subject, description, category } = req.body;
    if (!subject || !description || !category) {
      return sendResponse(res, 400, false, 'Subject, description, and category are required');
    }

    const userId = req.user.id;
    let newTicket: any = null;

    if (provider === 'firebase') {
      if (!firestoreDb) {
        throw new Error('Firestore is not initialized');
      }
      const docId = uuidv4();
      newTicket = {
        id: docId,
        userId,
        subject,
        description,
        category: category.toUpperCase(),
        status: 'OPEN',
        priority: 'MEDIUM',
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      await firestoreDb.collection('support_tickets').doc(docId).set(newTicket);
    } else {
      // Prisma
      newTicket = await prisma.supportTicket.create({
        data: {
          userId,
          subject,
          description,
          category: category.toUpperCase(),
          status: 'OPEN',
          priority: 'MEDIUM',
        },
      });
    }

    return sendResponse(res, 201, true, 'Support ticket created successfully', newTicket);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /tickets:
 *   get:
 *     summary: Retrieve user's support tickets
 *     tags: [Support]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Tickets retrieved successfully
 */
router.get('/', authenticate as any, async (req: any, res, next) => {
  try {
    const userId = req.user.id;
    let tickets: any[] = [];

    if (provider === 'firebase') {
      if (!firestoreDb) {
        throw new Error('Firestore is not initialized');
      }
      const snap = await firestoreDb.collection('support_tickets').where('userId', '==', userId).get();
      tickets = snap.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
    } else {
      tickets = await prisma.supportTicket.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
      });
    }

    return sendResponse(res, 200, true, 'Tickets retrieved successfully', tickets);
  } catch (error) {
    return next(error);
  }
});

export default router;
