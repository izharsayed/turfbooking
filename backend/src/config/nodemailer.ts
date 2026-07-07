import nodemailer from 'nodemailer';
import { logger } from './logger.js';

const getMailTransporter = () => {
  const host = process.env.NODEMAILER_HOST;
  const port = parseInt(process.env.NODEMAILER_PORT || '2525', 10);
  const user = process.env.NODEMAILER_USER;
  const pass = process.env.NODEMAILER_PASS;

  if (!host || !user || !pass) {
    logger.warn('⚠️ Nodemailer SMTP mailer config is missing. Email features will print to console.');
    return nodemailer.createTransport({
      streamTransport: true,
      newline: 'windows',
      buffer: true,
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
  });
};

export const mailTransporter = getMailTransporter();
export const mailFromAddress = process.env.NODEMAILER_FROM || 'no-reply@turfbook.com';
