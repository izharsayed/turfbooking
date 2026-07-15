import { Router } from 'express';
import { bookingRepository, turfRepository, paymentRepository } from '../../repositories/index.js';
import { sendResponse } from '../../shared/utils/response.js';
import { authenticate } from '../../middlewares/auth.js';
import { NotFoundError } from '../../shared/utils/errors.js';
import Razorpay from 'razorpay';
import { env } from '../../config/env.js';
import crypto from 'crypto';
import { logger } from '../../config/logger.js';
import { firestoreDb } from '../../config/firebase.js';

const router = Router();

// Initialize Razorpay if credentials exist
const razorpay = (env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET)
  ? new (Razorpay as any)({
      key_id: env.RAZORPAY_KEY_ID,
      key_secret: env.RAZORPAY_KEY_SECRET,
    })
  : null;

/**
 * @openapi
 * /bookings:
 *   get:
 *     summary: Retrieve booking history for authenticated customer
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Bookings retrieved successfully
 */
router.get('/', authenticate as any, async (req: any, res, next) => {
  try {
    const rawBookings = await bookingRepository.findByUserId(req.user.id);
    
    // Enrich bookings with Turf details
    const bookings = await Promise.all(
      rawBookings.map(async (b) => {
        const turf = await turfRepository.findById(b.turfId);
        return {
          id: b.id,
          turfId: b.turfId,
          turfName: turf?.name || 'Unknown Turf',
          area: turf?.location?.address || 'Ahmednagar',
          amount: b.totalAmount,
          status: b.status === 'CONFIRMED' ? 'active' : b.status === 'COMPLETED' ? 'completed' : 'cancelled',
          date: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
          time: (b as any).timeSlot || b.slotId || '17:00 - 18:00',
          timestamp: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
        };
      })
    );

    return sendResponse(res, 200, true, 'User bookings retrieved successfully', bookings);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings:
 *   post:
 *     summary: Create a new customer booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - turfId
 *               - amount
 *             properties:
 *               turfId:
 *                 type: string
 *               slotId:
 *                 type: string
 *               amount:
 *                 type: number
 *     responses:
 *       201:
 *         description: Booking created successfully
 */
router.post('/', authenticate as any, async (req: any, res, next) => {
  try {
    const { turfId, slotId, amount, totalAmount, time, date, bookingDate } = req.body;
    
    const targetDate = date || bookingDate || new Date().toISOString().split('T')[0];
    const targetSlots = (slotId || time || '17:00 - 18:00').split(',');

    // Check existing bookings for this turf to verify slots are not already booked or reserved
    const existingBookings = await bookingRepository.findByTurfId(turfId);
    const now = new Date().getTime();

    const conflict = existingBookings.find((b) => {
      const bDate = b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : '';
      if (bDate !== targetDate) return false;

      const bookedSlots = (b.slotId || '').split(',');
      const hasOverlap = targetSlots.some((slot: string) => bookedSlots.includes(slot));
      if (!hasOverlap) return false;

      // If already confirmed or pending manager confirmation, it's a conflict
      if (b.status === 'CONFIRMED' || b.status === 'PENDING_CONFIRMATION') return true;

      // If pending and created less than 5 minutes ago, it's a conflict (temporary reservation active)
      if (b.status === 'PENDING') {
        const createdAtTime = new Date(b.createdAt).getTime();
        const ageMs = now - createdAtTime;
        if (ageMs < 5 * 60 * 1000) {
          return true;
        }
      }

      return false;
    });

    if (conflict) {
      return sendResponse(res, 400, false, 'One or more of the selected slots are already booked or temporarily reserved by another user. Please choose other slots.');
    }

    // 1. Create booking in PENDING status (requires payment verification)
    const booking = await bookingRepository.create({
      userId: req.user.id,
      turfId,
      slotId: slotId || time || '17:00 - 18:00',
      totalAmount: totalAmount || amount,
      status: 'PENDING',
      bookingDate: date || bookingDate || new Date(),
    });

    // 2. Generate Razorpay Order ID (real or mock dev fallback)
    let razorpayOrderId = `order_mock_${Math.random().toString(36).substring(2, 15)}`;
    
    if (razorpay) {
      try {
        const order = await razorpay.orders.create({
          amount: Math.round(amount * 100), // in paise
          currency: 'INR',
          receipt: booking.id,
        });
        razorpayOrderId = order.id;
      } catch (err) {
        console.error('Failed to create Razorpay order, using mock ID instead', err);
      }
    }

    // 3. Create Payment record in PENDING status
    await paymentRepository.create({
      bookingId: booking.id,
      userId: req.user.id,
      amount,
      razorpayOrderId,
      status: 'PENDING',
    });

    return sendResponse(res, 201, true, 'Booking initiated successfully', {
      booking,
      razorpayOrderId,
      amount,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/verify:
 *   post:
 *     summary: Verify payment signature and confirm booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - bookingId
 *               - status
 *             properties:
 *               bookingId:
 *                 type: string
 *               razorpayOrderId:
 *                 type: string
 *               razorpayPaymentId:
 *                 type: string
 *               razorpaySignature:
 *                 type: string
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment processed
 */
router.post('/verify', authenticate as any, async (req: any, res, next) => {
  try {
    const { bookingId, razorpayOrderId, razorpayPaymentId, razorpaySignature, status, transactionId, paymentProof } = req.body;

    const booking = await bookingRepository.findById(bookingId);
    if (!booking) {
      throw new NotFoundError('Booking not found');
    }

    const payment = await paymentRepository.findByBookingId(bookingId);
    if (!payment) {
      throw new NotFoundError('Payment record not found');
    }

    if (status === 'FAILED') {
      await bookingRepository.updateStatus(bookingId, 'CANCELLED');
      await paymentRepository.updateStatus(payment.id, 'FAILED');
      return sendResponse(res, 200, false, 'Payment failed. Booking cancelled.');
    }

    if (status === 'PENDING_CONFIRMATION') {
      await bookingRepository.updateStatus(bookingId, 'PENDING_CONFIRMATION');
      await paymentRepository.updateStatus(payment.id, 'PENDING_CONFIRMATION', {
        razorpayPaymentId: transactionId || 'mock-txn-id',
        razorpaySignature: 'mock-proof-sig',
      });
      const docRef = firestoreDb!.collection('bookings').doc(bookingId);
      await docRef.update({
        transactionId: transactionId || '',
        paymentProof: paymentProof || '',
        updatedAt: new Date(),
      });
      return sendResponse(res, 200, true, 'Verification proof submitted. Pending manager approval.');
    }

    // Verify signature if using real Razorpay
    if (razorpay && razorpaySignature && !razorpaySignature.startsWith('sig_mock') && !razorpaySignature.startsWith('mock-')) {
      try {
        const hmac = crypto.createHmac('sha256', env.RAZORPAY_KEY_SECRET!);
        hmac.update(razorpayOrderId + '|' + razorpayPaymentId);
        const generatedSignature = hmac.digest('hex');
        if (generatedSignature !== razorpaySignature) {
          await bookingRepository.updateStatus(bookingId, 'CANCELLED');
          await paymentRepository.updateStatus(payment.id, 'FAILED');
          return sendResponse(res, 400, false, 'Signature verification failed. Payment invalid.');
        }
      } catch (err) {
        console.error('Signature verification error', err);
        return sendResponse(res, 500, false, 'Error verifying signature');
      }
    }

    // Payment Successful -> Update states to CONFIRMED / PAID
    await bookingRepository.updateStatus(bookingId, 'CONFIRMED');
    await paymentRepository.updateStatus(payment.id, 'PAID', {
      razorpayPaymentId,
      razorpaySignature: razorpaySignature || 'mock-signature',
    });

    // Send confirmation notification (simulate by logging)
    logger.info(`🔔 Booking Confirmed notification sent for Booking ID: ${bookingId}, User: ${req.user.id}, Turf: ${booking.turfId}, Slots: ${booking.slotId}`);

    return sendResponse(res, 200, true, 'Payment verified and booking confirmed successfully');
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/{id}:
 *   get:
 *     summary: Retrieve single booking details
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking retrieved successfully
 */
router.get('/:id', authenticate as any, async (req: any, res, next) => {
  try {
    const b = await bookingRepository.findById(req.params.id);
    if (!b || b.userId !== req.user.id) {
      throw new NotFoundError('Booking not found');
    }
    const turf = await turfRepository.findById(b.turfId);
    const result = {
      id: b.id,
      turfId: b.turfId,
      turfName: turf?.name || 'Unknown Turf',
      area: turf?.location?.address || 'Ahmednagar',
      amount: b.totalAmount,
      status: b.status === 'CONFIRMED' ? 'active' : b.status === 'COMPLETED' ? 'completed' : 'cancelled',
      date: b.bookingDate ? new Date(b.bookingDate).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      time: (b as any).timeSlot || b.slotId || '17:00 - 18:00',
      timestamp: b.createdAt ? new Date(b.createdAt).toLocaleDateString() : new Date().toLocaleDateString(),
    };
    return sendResponse(res, 200, true, 'Booking retrieved successfully', result);
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/{id}:
 *   delete:
 *     summary: Cancel a booking by ID
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Booking cancelled successfully
 *       404:
 *         description: Booking not found or not owned by user
 */
router.delete('/:id', authenticate as any, async (req: any, res, next) => {
  try {
    const { reason } = req.body;
    const b = await bookingRepository.findById(req.params.id);
    if (!b || b.userId !== req.user.id) {
      throw new NotFoundError('Booking not found');
    }

    if (b.status === 'CANCELLED') {
      return sendResponse(res, 200, true, 'Booking was already cancelled');
    }

    // Enforce 3-hour cancellation limit
    const timeSlotStr = (b as any).timeSlot || b.slotId || '';
    const bookingDateVal = b.bookingDate;
    if (bookingDateVal && timeSlotStr) {
      const getSlotStartDateTime = (dateVal: Date | string, timeStr: string): Date | null => {
        try {
          const d = new Date(dateVal);
          if (isNaN(d.getTime())) return null;
          const startPart = timeStr.split('-')[0].trim();
          const [hPart, mPart] = startPart.split(':');
          const hr = parseInt(hPart, 10);
          const mn = parseInt(mPart || '0', 10);
          if (isNaN(hr)) return null;
          d.setHours(hr, mn, 0, 0);
          return d;
        } catch {
          return null;
        }
      };

      const startDateTime = getSlotStartDateTime(bookingDateVal, timeSlotStr);
      if (startDateTime) {
        const now = new Date();
        const diffHours = (startDateTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (diffHours < 3) {
          return sendResponse(res, 400, false, 'Cancellations are only allowed at least 3 hours before the slot start time.');
        }
      }
    }

    // Mark booking as cancelled
    await bookingRepository.updateStatus(req.params.id, 'CANCELLED', reason);

    // Mark associated payment as refunded/failed (if exists)
    const payment = await paymentRepository.findByBookingId(req.params.id);
    if (payment && payment.status === 'PAID') {
      await paymentRepository.updateStatus(payment.id, 'REFUNDED');
    } else if (payment && payment.status === 'PENDING') {
      await paymentRepository.updateStatus(payment.id, 'FAILED');
    }

    return sendResponse(res, 200, true, 'Booking cancelled successfully');
  } catch (error) {
    return next(error);
  }
});

/**
 * @openapi
 * /bookings/{id}/reschedule:
 *   put:
 *     summary: Reschedule a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - date
 *               - time
 *             properties:
 *               date:
 *                 type: string
 *               time:
 *                 type: string
 *     responses:
 *       200:
 *         description: Booking rescheduled successfully
 *       400:
 *         description: Slot already booked or missing parameters
 *       404:
 *         description: Booking not found
 */
router.put('/:id/reschedule', authenticate as any, async (req: any, res, next) => {
  try {
    const { date, time } = req.body;
    if (!date || !time) {
      return sendResponse(res, 400, false, 'Date and time are required for rescheduling');
    }

    const b = await bookingRepository.findById(req.params.id);
    if (!b || b.userId !== req.user.id) {
      throw new NotFoundError('Booking not found');
    }

    if (b.status === 'CANCELLED') {
      return sendResponse(res, 400, false, 'Cannot reschedule a cancelled booking');
    }

    // Check if the selected slot is already booked on the target date
    const existingBookings = await bookingRepository.findByTurfId(b.turfId);
    const targetDateStr = new Date(date).toISOString().split('T')[0];
    
    const isBooked = existingBookings.some((eb) => {
      if (eb.id === b.id || eb.status === 'CANCELLED') return false;
      const ebDate = eb.bookingDate ? new Date(eb.bookingDate).toISOString().split('T')[0] : '';
      const ebTime = (eb as any).timeSlot || eb.slotId || '';
      
      // Split and match slots (since it can support comma-separated list of slots)
      const ebSlots = ebTime.split(',').map((s: string) => s.trim());
      const targetSlots = time.split(',').map((s: string) => s.trim());
      
      const hasOverlap = ebSlots.some((slot: string) => targetSlots.includes(slot));
      return ebDate === targetDateStr && hasOverlap;
    });

    if (isBooked) {
      return sendResponse(res, 400, false, 'The selected time slot is already booked on this date');
    }

    await bookingRepository.reschedule(req.params.id, date, time);
    return sendResponse(res, 200, true, 'Booking rescheduled successfully');
  } catch (error) {
    return next(error);
  }
});

/**
 * Check booking status — used by mobile app after returning from Razorpay checkout
 */
router.get('/:id/status', async (req, res, next) => {
  try {
    const booking = await bookingRepository.findById(req.params.id);
    if (!booking) {
      return sendResponse(res, 404, false, 'Booking not found');
    }
    return sendResponse(res, 200, true, 'Booking status retrieved', {
      status: booking.status,
      id: booking.id,
    });
  } catch (error) {
    return next(error);
  }
});

/**
 * Public HTML checkout gateway page for mobile deep link integration
 */
router.get('/:id/checkout-page', async (req, res) => {
  try {
    const booking = await bookingRepository.findById(req.params.id);
    if (!booking) {
      return res.status(404).send('Booking not found');
    }
    const payment = await paymentRepository.findByBookingId(booking.id);
    if (!payment) {
      return res.status(404).send('Payment record not found');
    }

    const keyId = (env.RAZORPAY_KEY_ID || '').replace(/^["']|["']$/g, '');
    const amountInPaise = Math.round(booking.totalAmount * 100);
    const orderId = (payment.razorpayOrderId || '').replace(/^["']|["']$/g, '');
    const bookingId = (booking.id || '').replace(/^["']|["']$/g, '');

    const html = `
<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>TurfBook Checkout</title>
  <script>
    function showError(msg) {
      console.error("Payment error:", msg);
      var spinner = document.getElementById('spinner');
      if (spinner) spinner.style.display = 'none';
      var title = document.getElementById('status-title');
      if (title) {
        title.innerText = 'Payment Request Failed';
        title.style.color = '#ef4444';
      }
      var msgBox = document.getElementById('status-message');
      if (msgBox) msgBox.innerText = 'Could not load the payment interface.';
      var errBox = document.getElementById('error-container');
      if (errBox) {
        errBox.innerText = msg;
        errBox.style.display = 'block';
      }
    }

    window.onerror = function(message, source, lineno, colno, error) {
      showError(message + " (at " + source + ":" + lineno + ")");
      return true;
    };
  </script>
  <script src="https://checkout.razorpay.com/v1/checkout.js" onerror="showError('Failed to load Razorpay library (network/blocked)')"></script>
  <style>
    body {
      background-color: #030712;
      color: #f3f4f6;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      margin: 0;
      padding: 20px;
      box-sizing: border-box;
    }
    .card {
      background-color: #0f172a;
      border: 1px solid rgba(16, 185, 129, 0.15);
      border-radius: 20px;
      padding: 30px;
      text-align: center;
      max-width: 400px;
      width: 100%;
      box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3);
    }
    h2 {
      color: #10b981;
      margin-top: 0;
      font-size: 24px;
      font-weight: 800;
    }
    p {
      color: #94a3b8;
      font-size: 14px;
      margin-bottom: 25px;
    }
    .spinner {
      border: 3px solid rgba(16, 185, 129, 0.1);
      width: 36px;
      height: 36px;
      border-radius: 50%;
      border-left-color: #10b981;
      animation: spin 1s linear infinite;
      margin: 0 auto 20px;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
  </style>
</head>
<body>
  <div class="card" id="checkout-card">
    <div class="spinner" id="spinner"></div>
    <h2 id="status-title">Redirecting to Payment Gateway</h2>
    <p id="status-message">Please complete your payment on the secure Razorpay screen...</p>
    <div id="error-container" style="display: none; margin-top: 15px; padding: 10px; background-color: rgba(239, 68, 68, 0.1); border: 1px solid #ef4444; border-radius: 8px; color: #fca5a5; font-size: 13px; text-align: left; word-break: break-all;"></div>
  </div>
  <script>
    try {
      var options = {
        key: "${keyId}",
        amount: "${amountInPaise}",
        currency: "INR",
        name: "TurfBook",
        description: "Secure Booking Payment",
        order_id: "${orderId}",
        handler: function (response) {
          fetch('/api/v1/bookings/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              bookingId: "${bookingId}",
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              status: 'CONFIRMED'
            })
          }).then(function(res) {
            return res.json();
          }).then(function(data) {
            if (data.success) {
              window.location.href = "turfbook://payment/success?bookingId=${bookingId}";
            } else {
              window.location.href = "turfbook://payment/failed?error=Verification+failed";
            }
          }).catch(function(err) {
            window.location.href = "turfbook://payment/failed?error=Network+error";
          });
        },
        prefill: {
          name: "Customer",
          email: "customer@turfbook.com",
          contact: "9876543210"
        },
        theme: { color: "#10B981" },
        modal: {
          ondismiss: function() {
            window.location.href = "turfbook://payment/cancelled";
          }
        }
      };

      // If we are using a mock order ID, remove it so Razorpay opens in standard payment mode
      if (!options.order_id || options.order_id.startsWith('order_mock_')) {
        console.log("Mock order ID detected, removing order_id to enable fallback mode");
        delete options.order_id;
      }

      if (typeof Razorpay === 'undefined') {
        showError("Razorpay SDK failed to load. Please check your internet connection.");
      } else {
        var rzp = new Razorpay(options);
        rzp.on('payment.failed', function (response){
          showError("Payment Failed: " + response.error.description + " (" + response.error.code + ")");
        });
        rzp.open();
      }
    } catch (e) {
      showError(e.message || "An unexpected error occurred during checkout setup.");
    }
  </script>
</body>
</html>
    `;
    res.send(html);
  } catch (err: any) {
    console.error('Error serving checkout page', err);
    res.status(500).send('Internal Server Error');
  }
});

export default router;
