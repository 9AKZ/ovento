import logger from '../config/logger.js';

/**
   * Email Service - Stub implementation
   * In production, replace with actual email provider (SendGrid, SES, etc.)
   */

/**
   * Send verification email
   * @param {string} email - Recipient email
   * @param {string} token - Verification token
   */
export async function sendVerificationEmail(email, token) {
  const verificationUrl = `${process.env.FRONTEND_URL}/verify-email?token=${token}`;
    
  // Stub: Log the email instead of sending
  logger.info(`📧 [EMAIL STUB] Verification email to ${email}`);
  logger.info(`📧 Verification URL: ${verificationUrl}`);
    
  // In production, use actual email service:
  // await sendgrid.send({
  //   to: email,
  //   subject: 'Verify your OneLastEvent account',
  //   html: `<p>Click <a href="${verificationUrl}">here</a> to verify your account.</p>`,
  // });
    
  return true;
}

/**
   * Send password reset email
   * @param {string} email - Recipient email
   * @param {string} token - Reset token
   */
export async function sendPasswordResetEmail(email, token) {
  const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${token}`;
    
  // Stub: Log the email instead of sending
  logger.info(`📧 [EMAIL STUB] Password reset email to ${email}`);
  logger.info(`📧 Reset URL: ${resetUrl}`);
    
  return true;
}

/**
   * Send event registration confirmation
   * @param {string} email - Recipient email
   * @param {Object} event - Event details
   * @param {Object} inscription - Inscription details
   */
export async function sendRegistrationConfirmation(email, event, inscription) {
  logger.info(`📧 [EMAIL STUB] Registration confirmation to ${email}`);
  logger.info(`📧 Event: ${event.title} on ${event.start_datetime}`);
  logger.info(`📧 Inscription ID: ${inscription.id}`);
    
  return true;
}

/**
   * Send payment confirmation
   * @param {string} email - Recipient email
   * @param {Object} payment - Payment details
   * @param {Object} event - Event details
   */
export async function sendPaymentConfirmation(email, payment, event) {
  logger.info(`📧 [EMAIL STUB] Payment confirmation to ${email}`);
  logger.info(`📧 Amount: ${payment.amount} ${payment.currency}`);
  logger.info(`📧 Event: ${event.title}`);
    
  return true;
}

/**
   * Send event cancellation notification
   * @param {string} email - Recipient email
   * @param {Object} event - Event details
   */
export async function sendEventCancellationNotification(email, event) {
  logger.info(`📧 [EMAIL STUB] Event cancellation to ${email}`);
  logger.info(`📧 Event: ${event.title} has been cancelled`);
    
  return true;
}

/**
   * Send event reminder
   * @param {string} email - Recipient email
   * @param {Object} event - Event details
   */
export async function sendEventReminder(email, event) {
  logger.info(`📧 [EMAIL STUB] Event reminder to ${email}`);
  logger.info(`📧 Event: ${event.title} starts on ${event.start_datetime}`);
    
  return true;
}

export default {
  sendVerificationEmail,
  sendPasswordResetEmail,
  sendRegistrationConfirmation,
  sendPaymentConfirmation,
  sendEventCancellationNotification,
  sendEventReminder,
};

