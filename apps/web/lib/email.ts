import nodemailer from 'nodemailer';

// Email configuration
export const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

// Create transporter function (lazy loading)
export function getTransporter() {
  if (!isEmailConfigured()) {
    throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
  }
  return nodemailer.createTransport(emailConfig);
}

// Check if email is properly configured
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

// Email templates
export const emailTemplates = {
  // Account Security & Moderation
  accountSuspended: {
    subject: '🚨 Account Suspended - Action Required',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #dc2626; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Account Suspended</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Hello ${data.userName},</h2>
          
          <p>Your Foundrly account has been suspended due to community guidelines violations.</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #dc2626; padding: 15px; margin: 20px 0;">
            <h3 style="color: #dc2626; margin-top: 0;">Suspension Details:</h3>
            <p><strong>Reason:</strong> ${data.reportReason}</p>
            <p><strong>Action Taken:</strong> ${data.actionTaken}</p>
            <p><strong>Duration:</strong> ${data.duration || '7 days'}</p>
            <p><strong>Strike:</strong> ${data.strikeNumber || '1'} of 3</p>
          </div>
          
          <p>To restore your account access, please review our community guidelines and ensure compliance.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/guidelines" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review Guidelines
            </a>
          </div>
          
          <p>If you believe this action was taken in error, please contact our support team.</p>
          
          <p>Best regards,<br>The Foundrly Team</p>
        </div>
      </div>
    `
  },









  // New templates aligned with Sanity moderation system
  warningIssued: {
    subject: '⚠️ Warning Issued - Community Guidelines',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Warning Issued</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Hello ${data.userName},</h2>
          
          <p>This is a warning about content that violates our community guidelines.</p>
          
          <div style="background: #fffbeb; border-left: 4px solid #f59e0b; padding: 15px; margin: 20px 0;">
            <h3 style="color: #f59e0b; margin-top: 0;">Warning Details:</h3>
            <p><strong>Content Type:</strong> ${data.contentType || 'Content'}</p>
            <p><strong>Reason:</strong> ${data.reportReason}</p>
            <p><strong>Action:</strong> Warning issued</p>
            <p><strong>Strike:</strong> ${data.strikeNumber || '1'} of 3</p>
          </div>
          
          <p>This is a warning only. Please review our community guidelines to avoid further action.</p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/guidelines" 
               style="background: #3b82f6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px;">
              Review Guidelines
            </a>
          </div>
          
          <p>Best regards,<br>The Foundrly Team</p>
        </div>
      </div>
    `
  },

  permanentBan: {
    subject: '🚨 Account Permanently Banned - Final Notice',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #991b1b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Account Permanently Banned</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Hello ${data.userName},</h2>
          
          <p>Your Foundrly account has been permanently banned due to repeated community guidelines violations.</p>
          
          <div style="background: #fef2f2; border-left: 4px solid #991b1b; padding: 15px; margin: 20px 0;">
            <h3 style="color: #991b1b; margin-top: 0;">Ban Details:</h3>
            <p><strong>Reason:</strong> ${data.reportReason}</p>
            <p><strong>Action Taken:</strong> ${data.actionTaken}</p>
            <p><strong>Strike:</strong> 3 of 3 - Final Strike</p>
            <p><strong>Duration:</strong> Permanent</p>
          </div>
          
          <p>This decision is final and cannot be appealed. Your account access has been permanently revoked.</p>
          
          <p>Best regards,<br>The Foundrly Team</p>
        </div>
      </div>
    `
  },

  reportSubmitted: {
    subject: '📝 Report Submitted - Under Review',
    template: (data: any) => `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Report Submitted</h1>
        </div>
        
        <div style="padding: 20px; background: #f9fafb;">
          <h2>Hello ${data.userName},</h2>
          
          <p>Thank you for submitting a report. Our moderation team will review it and take appropriate action.</p>
          
          <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
            <h3 style="color: #3b82f6; margin-top: 0;">Report Details:</h3>
            <p><strong>Content Reported:</strong> ${data.contentType || 'Content'}</p>
            <p><strong>Reason:</strong> ${data.reportReason}</p>
            <p><strong>Status:</strong> Under Review</p>
            <p><strong>Submitted:</strong> ${data.timestamp || new Date().toLocaleString()}</p>
          </div>
          
          <p>We'll notify you once the report has been reviewed and action has been taken.</p>
          
          <p>Best regards,<br>The Foundrly Team</p>
        </div>
      </div>
    `
  }
};

// Email sending function
export async function sendEmail(to: string, template: keyof typeof emailTemplates, data: any) {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    const emailTemplate = emailTemplates[template];
    
    if (!emailTemplate) {
      throw new Error(`Email template '${template}' not found`);
    }

    const mailOptions = {
      from: `"Foundrly" <${process.env.SMTP_USER}>`,
      to: to,
      subject: emailTemplate.subject,
      html: emailTemplate.template(data),
    };

    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send email:', error);
    throw error;
  }
 }

// Test email function
export async function sendTestEmail(to: string) {
  try {
    // Check if email is configured
    if (!isEmailConfigured()) {
      throw new Error('Email service not configured. Please set SMTP_USER and SMTP_PASS environment variables.');
    }

    const mailOptions = {
      from: `"Foundrly" <${process.env.SMTP_USER}>`,
      to: to,
      subject: '🧪 Test Email - Foundrly Notification System',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #3b82f6; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0;">Test Email</h1>
          </div>
          
          <div style="padding: 20px; background: #f9fafb;">
            <h2>Hello! 👋</h2>
            
            <p>This is a test email to verify that the Foundrly email notification system is working correctly.</p>
            
            <div style="background: #eff6ff; border-left: 4px solid #3b82f6; padding: 15px; margin: 20px 0;">
              <h3 style="color: #3b82f6; margin-top: 0;">Test Details:</h3>
              <p><strong>Time:</strong> ${new Date().toLocaleString()}</p>
              <p><strong>System:</strong> Foundrly Email Service</p>
              <p><strong>Status:</strong> ✅ Working</p>
            </div>
            
            <p>If you received this email, the notification system is properly configured!</p>
            
            <p>Best regards,<br>The Foundrly Team</p>
          </div>
        </div>
      `,
    };

    const transporter = getTransporter();
    const result = await transporter.sendMail(mailOptions);
    console.log('✅ Test email sent successfully:', result.messageId);
    return result;
  } catch (error) {
    console.error('❌ Failed to send test email:', error);
    throw error;
  }
} 