import { IUserRepository } from './interfaces/IUserRepository.js';
import { ITurfRepository } from './interfaces/ITurfRepository.js';
import { IBookingRepository } from './interfaces/IBookingRepository.js';
import { IPaymentRepository } from './interfaces/IPaymentRepository.js';
import { IAdminRepository } from './interfaces/IAdminRepository.js';
import { IOwnerRepository } from './interfaces/IOwnerRepository.js';
import {
  ISportRepository,
  IAmenityRepository,
  ICityRepository,
  ICouponRepository,
  ISubscriptionRepository,
  ISettingRepository,
} from './interfaces/ITaxonomyRepositories.js';

import { PrismaUserRepository } from './prisma/PrismaUserRepository.js';
import { PrismaTurfRepository } from './prisma/PrismaTurfRepository.js';
import { PrismaBookingRepository } from './prisma/PrismaBookingRepository.js';
import { PrismaPaymentRepository } from './prisma/PrismaPaymentRepository.js';
import { PrismaAdminRepository } from './prisma/PrismaAdminRepository.js';
import { PrismaOwnerRepository } from './prisma/PrismaOwnerRepository.js';
import {
  PrismaSportRepository,
  PrismaAmenityRepository,
  PrismaCityRepository,
  PrismaCouponRepository,
  PrismaSubscriptionRepository,
  PrismaSettingRepository,
} from './prisma/PrismaTaxonomyRepository.js';

import { FirebaseUserRepository } from './firebase/FirebaseUserRepository.js';
import { FirebaseTurfRepository } from './firebase/FirebaseTurfRepository.js';
import { FirebaseBookingRepository } from './firebase/FirebaseBookingRepository.js';
import { FirebasePaymentRepository } from './firebase/FirebasePaymentRepository.js';
import { FirebaseAdminRepository } from './firebase/FirebaseAdminRepository.js';
import { FirebaseOwnerRepository } from './firebase/FirebaseOwnerRepository.js';
import {
  FirebaseSportRepository,
  FirebaseAmenityRepository,
  FirebaseCityRepository,
  FirebaseCouponRepository,
  FirebaseSubscriptionRepository,
  FirebaseSettingRepository,
} from './firebase/FirebaseTaxonomyRepository.js';

import { logger } from '../config/logger.js';

const provider = process.env.DATABASE_PROVIDER || 'prisma';
logger.info(`🔌 Initializing database repository provider: ${provider.toUpperCase()}`);

let userRepository: IUserRepository;
let turfRepository: ITurfRepository;
let bookingRepository: IBookingRepository;
let paymentRepository: IPaymentRepository;
let adminRepository: IAdminRepository;
let ownerRepository: IOwnerRepository;
let sportRepository: ISportRepository;
let amenityRepository: IAmenityRepository;
let cityRepository: ICityRepository;
let couponRepository: ICouponRepository;
let subscriptionRepository: ISubscriptionRepository;
let settingRepository: ISettingRepository;

if (provider === 'firebase') {
  userRepository = new FirebaseUserRepository();
  turfRepository = new FirebaseTurfRepository();
  bookingRepository = new FirebaseBookingRepository();
  paymentRepository = new FirebasePaymentRepository();
  adminRepository = new FirebaseAdminRepository();
  ownerRepository = new FirebaseOwnerRepository();
  sportRepository = new FirebaseSportRepository();
  amenityRepository = new FirebaseAmenityRepository();
  cityRepository = new FirebaseCityRepository();
  couponRepository = new FirebaseCouponRepository();
  subscriptionRepository = new FirebaseSubscriptionRepository();
  settingRepository = new FirebaseSettingRepository();
} else {
  userRepository = new PrismaUserRepository();
  turfRepository = new PrismaTurfRepository();
  bookingRepository = new PrismaBookingRepository();
  paymentRepository = new PrismaPaymentRepository();
  adminRepository = new PrismaAdminRepository();
  ownerRepository = new PrismaOwnerRepository();
  sportRepository = new PrismaSportRepository();
  amenityRepository = new PrismaAmenityRepository();
  cityRepository = new PrismaCityRepository();
  couponRepository = new PrismaCouponRepository();
  subscriptionRepository = new PrismaSubscriptionRepository();
  settingRepository = new PrismaSettingRepository();
}

export {
  userRepository,
  turfRepository,
  bookingRepository,
  paymentRepository,
  adminRepository,
  ownerRepository,
  sportRepository,
  amenityRepository,
  cityRepository,
  couponRepository,
  subscriptionRepository,
  settingRepository,
};
