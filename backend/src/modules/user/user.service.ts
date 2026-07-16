import { userRepository } from '../../repositories/index.js';
import { NotFoundError, ValidationError } from '../../shared/utils/errors.js';
import { cloudinaryClient } from '../../config/cloudinary.js';
import { logger } from '../../config/logger.js';

export class UserService {
  public async getProfile(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    const profile = await userRepository.getProfile(userId);
    const ownerProfile = await userRepository.getOwnerProfile(userId);

    return {
      user,
      profile: profile || null,
      ownerProfile: ownerProfile || null,
    };
  }

  public async updateProfile(userId: string, data: any) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (user.role === 'TURF_OWNER') {
      const ownerProfileData = {
        companyName: data.companyName,
        businessAddress: data.businessAddress,
        billingEmail: data.billingEmail,
        businessRegisterNumber: data.businessRegisterNumber,
      };
      
      // Clean undefined keys
      Object.keys(ownerProfileData).forEach(
        (key) => (ownerProfileData as any)[key] === undefined && delete (ownerProfileData as any)[key]
      );

      const ownerProfile = await userRepository.updateOwnerProfile(userId, ownerProfileData);
      return { user, ownerProfile };
    } else {
      const profileData = {
        firstName: data.firstName,
        lastName: data.lastName,
        gender: data.gender,
        dob: data.dob ? new Date(data.dob) : undefined,
        address: data.address,
      };

      Object.keys(profileData).forEach(
        (key) => (profileData as any)[key] === undefined && delete (profileData as any)[key]
      );

      const profile = await userRepository.updateProfile(userId, profileData);
      return { user, profile };
    }
  }

  public async uploadAvatar(userId: string, fileBuffer: Buffer): Promise<string> {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    let avatarUrl = '';

    if (cloudinaryClient) {
      try {
        avatarUrl = await new Promise<string>((resolve, reject) => {
          const uploadStream = cloudinaryClient!.uploader.upload_stream(
            { folder: 'turfbook_avatars', public_id: `avatar_${userId}`, overwrite: true },
            (error, result) => {
              if (error) return reject(error);
              resolve(result?.secure_url || '');
            }
          );
          uploadStream.end(fileBuffer);
        });
      } catch (err: any) {
        logger.error('❌ Cloudinary upload failed:', err);
        throw new ValidationError('File upload to CDN failed.');
      }
    } else {
      // Local dev fallback if Cloudinary settings are missing
      logger.warn('⚠️ Cloudinary not connected: simulating local file path');
      avatarUrl = `/uploads/avatars/avatar_${userId}.png`;
    }

    // Update user record
    await userRepository.update(userId, { avatarUrl });
    return avatarUrl;
  }

  public async deleteAvatar(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    if (cloudinaryClient && user.avatarUrl && user.avatarUrl.includes('cloudinary')) {
      try {
        await cloudinaryClient.uploader.destroy(`turfbook_avatars/avatar_${userId}`);
      } catch (err) {
        logger.error('❌ Failed to destroy Cloudinary resource:', err);
      }
    }

    await userRepository.update(userId, { avatarUrl: undefined });
    return { message: 'Profile picture removed successfully' };
  }
  public async deleteAccount(userId: string) {
    const user = await userRepository.findById(userId);
    if (!user) {
      throw new NotFoundError('User not found');
    }

    // Anonymize all PII before marking as deleted (GDPR Art. 17 — Right to Erasure)
    const anonymizedData = {
      email: `deleted_${userId}@deleted.invalid`,
      phone: '0000000000',
      name: 'Deleted User',
      avatarUrl: undefined,
      isActive: false,
      deletedAt: new Date(),
    };

    await userRepository.update(userId, anonymizedData as any);

    // Remove Cloudinary avatar if it exists
    if (cloudinaryClient && user.avatarUrl && user.avatarUrl.includes('cloudinary')) {
      try {
        await cloudinaryClient.uploader.destroy(`turfbook_avatars/avatar_${userId}`);
      } catch (err) {
        logger.error('❌ Failed to destroy Cloudinary avatar during account deletion:', err);
      }
    }

    logger.info(`🗑️ Account deletion: user anonymized and soft-deleted.`);
    return { message: 'Your account and personal data have been permanently deleted.' };
  }
}
export const userService = new UserService();
