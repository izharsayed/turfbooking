import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { userRepository } from '../../repositories/index.js';
import { firebaseAuth } from '../../config/firebase.js';
import { logger } from '../../config/logger.js';
import {
  AppError,
  AuthenticationError,
  ConflictError,
  NotFoundError,
  ValidationError,
} from '../../shared/utils/errors.js';
import {
  generateAccessToken,
  generateRefreshToken,
  generateNumericOTP,
  generateRandomToken,
  TokenPayload,
  verifyRefreshToken,
} from '../../shared/utils/token.js';
import { sessionManager } from '../../shared/utils/sessionManager.js';
import { mailTransporter, mailFromAddress } from '../../config/nodemailer.js';

export class AuthService {
  // --- Registration ---
  public async registerCustomer(data: any) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('User already exists with this email');
    }

    const existingPhone = await userRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new ConflictError('User already exists with this phone number');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.createCustomer({
      email: data.email,
      phone: data.phone,
      passwordHash,
      firstName: data.firstName,
      lastName: data.lastName,
      avatarUrl: data.avatarUrl,
    });

    // Send verification email
    const token = generateRandomToken();
    await sessionManager.storeVerificationToken(token, user.id);
    await this.sendVerificationEmail(user.email, token);

    return { user };
  }

  public async registerOwner(data: any) {
    const existingEmail = await userRepository.findByEmail(data.email);
    if (existingEmail) {
      throw new ConflictError('User already exists with this email');
    }

    const existingPhone = await userRepository.findByPhone(data.phone);
    if (existingPhone) {
      throw new ConflictError('User already exists with this phone number');
    }

    const passwordHash = await bcrypt.hash(data.password, 10);
    const user = await userRepository.createOwner({
      email: data.email,
      phone: data.phone,
      passwordHash,
      companyName: data.companyName,
      businessRegisterNumber: data.businessRegisterNumber,
      businessAddress: data.businessAddress,
      billingEmail: data.billingEmail,
      avatarUrl: data.avatarUrl,
    });

    return {
      message: 'Owner registration successful. Account is pending admin approval.',
      user,
    };
  }

  // --- Email Verification ---
  public async verifyEmail(token: string) {
    const userId = await sessionManager.getUserIdByVerificationToken(token);
    if (!userId) {
      throw new ValidationError('Invalid or expired verification token');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    await userRepository.update(userId, { isActive: true });
    return { message: 'Email verified successfully. Account activated.' };
  }

  public async resendVerification(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.isActive) {
      return { message: 'Account is already verified and active' };
    }

    const token = generateRandomToken();
    await sessionManager.storeVerificationToken(token, user.id);
    await this.sendVerificationEmail(user.email, token);

    return { message: 'Verification email resent successfully' };
  }

  // --- Login ---
  public async login(email: string, pass: string, deviceMetadata: any = {}) {
    let searchEmail = email;

    // Check if the email is a phone-based auto-email (e.g. "9876543210@turfbook.com")
    if (email.endsWith('@turfbook.com')) {
      const phoneCandidate = email.split('@')[0];
      if (/^[0-9]{10,15}$/.test(phoneCandidate)) {
        // Find the user by their phone number first to get their actual email
        const userByPhone = await userRepository.findByPhone(phoneCandidate);
        if (userByPhone) {
          searchEmail = userByPhone.email;
        }
      }
    }

    // 1. Check lockout state using the resolved email
    if (await sessionManager.isAccountLocked(searchEmail)) {
      throw new AuthenticationError('Account locked due to too many failed attempts. Try again in 15 minutes.');
    }

    const credentials = await userRepository.findByEmailWithPassword(searchEmail);
    if (!credentials) {
      await sessionManager.trackFailedLoginAttempt(searchEmail);
      throw new AuthenticationError('Invalid email or password');
    }

    const { user, passwordHash } = credentials;

    // 2. Check if active
    if (!user.isActive) {
      throw new AuthenticationError('Account is pending verification or admin approval.');
    }

    // 3. Verify password
    const isMatch = await bcrypt.compare(pass, passwordHash);
    if (!isMatch) {
      const lockStatus = await sessionManager.trackFailedLoginAttempt(searchEmail);
      if (lockStatus.locked) {
        throw new AuthenticationError('Account locked due to too many failed attempts. Try again in 15 minutes.');
      }
      throw new AuthenticationError(`Invalid email or password. ${lockStatus.remainingAttempts} attempts remaining.`);
    }

    // Reset failed counter
    await sessionManager.resetFailedAttempts(searchEmail);

    // 4. Issue Tokens
    return this.createSession(user, deviceMetadata);
  }

  // --- Phone OTP ---
  public async sendOtp(phone: string) {
    const user = await userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundError('No user found registered with this phone number');
    }

    const code = generateNumericOTP();
    await sessionManager.storeOTP(phone, code);
    
    // Simulate SMS sending (log to logger)
    logger.info(`💬 SMS OTP Sent to ${phone}: [ ${code} ] (expires in 5 minutes)`);

    return { message: 'OTP sent successfully to registered phone number' };
  }

  public async verifyOtp(phone: string, code: string, deviceMetadata: any = {}) {
    const isValid = await sessionManager.verifyOTP(phone, code);
    if (!isValid) {
      throw new ValidationError('Invalid or expired OTP');
    }

    const user = await userRepository.findByPhone(phone);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    return this.createSession(user, deviceMetadata);
  }

  // --- Google Login (Firebase OAuth) ---
  public async googleLogin(idToken: string, deviceMetadata: any = {}) {
    let email = '';
    let name = '';
    let phone = '';

    if (firebaseAuth) {
      try {
        const decoded = await firebaseAuth.verifyIdToken(idToken);
        email = decoded.email || '';
        name = decoded.name || '';
        phone = decoded.phone_number || '';
      } catch (err: any) {
        throw new ValidationError(`Firebase signature verification failed: ${err.message}`);
      }
    } else {
      // In-development mock fallback for testing without firebase credentials configured
      logger.warn('🔑 Firebase credentials missing. Processing mock JWT payload decoding...');
      email = 'google.mock@turfbook.com';
      name = 'Google Mock User';
      phone = '+919999988888';
    }

    let user = await userRepository.findByEmail(email);

    if (!user) {
      // Automatically register a new Customer account
      const mockPasswordHash = await bcrypt.hash(uuidv4(), 10); // Random secure pass
      const nameParts = name.split(' ');
      const firstName = nameParts[0] || 'Google';
      const lastName = nameParts.slice(1).join(' ') || 'User';

      user = await userRepository.createCustomer({
        email,
        phone: phone || `+910000${Math.floor(100000 + Math.random() * 900000)}`,
        passwordHash: mockPasswordHash,
        firstName,
        lastName,
      });
    }

    return this.createSession(user, deviceMetadata);
  }

  // --- Refresh Token Rotation ---
  public async refreshSession(refreshToken: string, deviceMetadata: any = {}) {
    try {
      const decoded = verifyRefreshToken(refreshToken);
      const jti = decoded.jti;

      if (!jti) {
        throw new AuthenticationError('Invalid refresh token');
      }

      // Check if session is active (to prevent reuse attacks)
      const isActive = await sessionManager.isSessionActive(decoded.id, jti);
      if (!isActive) {
        // Potential reuse attack: revoke all sessions for security
        await sessionManager.revokeAllSessions(decoded.id);
        throw new AuthenticationError('Refresh token reuse detected. All sessions revoked.');
      }

      // Revoke the old session key
      await sessionManager.revokeSession(decoded.id, jti);

      const user = await userRepository.findById(decoded.id);
      if (!user || !user.isActive) {
        throw new AuthenticationError('User is no longer active');
      }

      // Issue rotated pair
      return this.createSession(user, deviceMetadata);
    } catch (err) {
      throw new AuthenticationError('Session expired or invalid refresh token');
    }
  }

  // --- Logout ---
  public async logout(userId: string, jti: string) {
    await sessionManager.revokeSession(userId, jti);
    await sessionManager.blacklistAccessToken(jti, 900); // Access token blacklist duration (15 mins)
    return { message: 'Logged out successfully from this device.' };
  }

  public async logoutAll(userId: string) {
    await sessionManager.revokeAllSessions(userId);
    return { message: 'Logged out successfully from all active devices.' };
  }

  // --- Password Management ---
  public async forgotPassword(email: string) {
    const user = await userRepository.findByEmail(email);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const token = generateRandomToken();
    await sessionManager.storeResetToken(token, user.id);
    await this.sendResetEmail(user.email, token);

    return { message: 'Password reset link sent to your registered email' };
  }

  public async resetPassword(token: string, newPass: string) {
    const userId = await sessionManager.getUserIdByResetToken(token);
    if (!userId) {
      throw new ValidationError('Invalid or expired reset token');
    }

    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const passwordHash = await bcrypt.hash(newPass, 10);
    // Directly update the password hash in the user record
    await userRepository.update(userId, { deletedAt: undefined } as any); // trigger updates
    
    // We update password using direct prisma/firebase hook
    const dbProvider = process.env.DATABASE_PROVIDER || 'prisma';
    if (dbProvider === 'prisma') {
      const { prisma } = await import('../../database/index.js');
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash },
      });
    } else {
      const { firestoreDb } = await import('../../config/firebase.js');
      await firestoreDb!.collection('users').doc(userId).update({ passwordHash });
    }

    // Revoke all sessions on password reset
    await sessionManager.revokeAllSessions(userId);

    return { message: 'Password reset successfully. You can now login.' };
  }

  public async changePassword(userId: string, currentPass: string, newPass: string) {
    // Get password hash
    let passwordHash = '';
    const dbProvider = process.env.DATABASE_PROVIDER || 'prisma';
    if (dbProvider === 'prisma') {
      const { prisma } = await import('../../database/index.js');
      const record = await prisma.user.findUnique({ where: { id: userId } });
      passwordHash = record?.passwordHash || '';
    } else {
      const { firestoreDb } = await import('../../config/firebase.js');
      const doc = await firestoreDb!.collection('users').doc(userId).get();
      passwordHash = doc.data()?.passwordHash || '';
    }

    const isMatch = await bcrypt.compare(currentPass, passwordHash);
    if (!isMatch) {
      throw new ValidationError('Current password does not match');
    }

    const newHash = await bcrypt.hash(newPass, 10);
    if (dbProvider === 'prisma') {
      const { prisma } = await import('../../database/index.js');
      await prisma.user.update({
        where: { id: userId },
        data: { passwordHash: newHash },
      });
    } else {
      const { firestoreDb } = await import('../../config/firebase.js');
      await firestoreDb!.collection('users').doc(userId).update({ passwordHash: newHash });
    }

    // Clear sessions
    await sessionManager.revokeAllSessions(userId);

    return { message: 'Password changed successfully' };
  }

  // --- Helper Methods ---
  private async createSession(user: any, deviceMetadata: any) {
    const jti = uuidv4();
    const payload: TokenPayload = {
      id: user.id,
      email: user.email,
      role: user.role,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload, jti);

    // Save refresh session in Redis (7 days TTL)
    await sessionManager.saveSession(user.id, jti, deviceMetadata, 604800);

    return {
      accessToken,
      refreshToken,
      user,
    };
  }

  private async sendVerificationEmail(email: string, token: string) {
    const url = `http://localhost:5000/api/v1/auth/verify?token=${token}`;
    logger.info(`📧 Send Email: Verification email dispatched to ${email}. Link: ${url}`);
    
    // Attempt SMTP send
    try {
      await mailTransporter.sendMail({
        from: mailFromAddress,
        to: email,
        subject: 'Verify your Turf Book account',
        html: `<p>Please verify your email by clicking the link below:</p><a href="${url}">${url}</a>`,
      });
    } catch (err) {
      logger.error('❌ Nodemailer failed to send email:', err);
    }
  }

  private async sendResetEmail(email: string, token: string) {
    const url = `http://localhost:5000/api/v1/auth/reset-password?token=${token}`;
    logger.info(`📧 Send Email: Password reset email dispatched to ${email}. Link: ${url}`);

    try {
      await mailTransporter.sendMail({
        from: mailFromAddress,
        to: email,
        subject: 'Reset your Turf Book password',
        html: `<p>Reset your password by clicking the link below:</p><a href="${url}">${url}</a>`,
      });
    } catch (err) {
      logger.error('❌ Nodemailer failed to send password reset email:', err);
    }
  }
}
