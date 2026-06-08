import nodemailer from 'nodemailer';
import { client } from '@/sanity/lib/client';
import { getUserEmailPreferences } from '@/sanity/lib/user-preferences';

// Email configuration - using same config as main email system
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || '',
    pass: process.env.SMTP_PASS || '',
  },
};

const transporter = nodemailer.createTransport(emailConfig);

// Check if email is properly configured
export function isEmailConfigured(): boolean {
  return !!(process.env.SMTP_USER && process.env.SMTP_PASS);
}

export interface InterestedSubmissionEmailData {
  startupOwnerName: string;
  startupOwnerEmail: string;
  startupTitle: string;
  interestedUserName: string;
  interestedUserEmail: string;
  interestedUserPhone?: string;
  interestedUserCompany?: string;
  interestedUserRole?: string;
  message: string;
  investmentAmount?: string;
  investmentType?: string;
  timeline?: string;
  preferredContact: string;
  linkedin?: string;
  website?: string;
  experience?: string;
  howDidYouHear?: string;
  submittedAt: string;
}

export async function sendInterestedSubmissionEmail(data: InterestedSubmissionEmailData) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>New Interest in Your Startup</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .highlight {
            background: #e3f2fd;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
            border-left: 4px solid #2196f3;
          }
          .info-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            margin: 20px 0;
          }
          .info-item {
            background: white;
            padding: 15px;
            border-radius: 6px;
            border: 1px solid #e0e0e0;
          }
          .info-label {
            font-weight: 600;
            color: #666;
            font-size: 14px;
            margin-bottom: 5px;
          }
          .info-value {
            color: #333;
            font-size: 16px;
          }
          .message-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>🎉 New Interest in Your Startup!</h1>
          <p>Someone is interested in "${data.startupTitle}"</p>
        </div>
        
        <div class="content">
          <div class="highlight">
            <h2>Great news, ${data.startupOwnerName}!</h2>
            <p><strong>${data.interestedUserName}</strong> has shown interest in your startup <strong>"${data.startupTitle}"</strong> and submitted a detailed form.</p>
          </div>

          <h3>Contact Information</h3>
          <div class="info-grid">
            <div class="info-item">
              <div class="info-label">Name</div>
              <div class="info-value">${data.interestedUserName}</div>
            </div>
            <div class="info-item">
              <div class="info-label">Email</div>
              <div class="info-value">${data.interestedUserEmail}</div>
            </div>
            ${data.interestedUserPhone ? `
            <div class="info-item">
              <div class="info-label">Phone</div>
              <div class="info-value">${data.interestedUserPhone}</div>
            </div>
            ` : ''}
            ${data.interestedUserCompany ? `
            <div class="info-item">
              <div class="info-label">Company</div>
              <div class="info-value">${data.interestedUserCompany}</div>
            </div>
            ` : ''}
            ${data.interestedUserRole ? `
            <div class="info-item">
              <div class="info-label">Role</div>
              <div class="info-value">${data.interestedUserRole}</div>
            </div>
            ` : ''}
            <div class="info-item">
              <div class="info-label">Preferred Contact</div>
              <div class="info-value">${data.preferredContact}</div>
            </div>
          </div>

          ${data.investmentAmount || data.investmentType ? `
          <h3>Investment Details</h3>
          <div class="info-grid">
            ${data.investmentAmount ? `
            <div class="info-item">
              <div class="info-label">Investment Amount</div>
              <div class="info-value">${data.investmentAmount}</div>
            </div>
            ` : ''}
            ${data.investmentType ? `
            <div class="info-item">
              <div class="info-label">Investment Type</div>
              <div class="info-value">${data.investmentType}</div>
            </div>
            ` : ''}
            ${data.timeline ? `
            <div class="info-item">
              <div class="info-label">Timeline</div>
              <div class="info-value">${data.timeline}</div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <h3>Message</h3>
          <div class="message-box">
            <p>${data.message}</p>
          </div>

          ${data.linkedin || data.website ? `
          <h3>Additional Links</h3>
          <div class="info-grid">
            ${data.linkedin ? `
            <div class="info-item">
              <div class="info-label">LinkedIn</div>
              <div class="info-value"><a href="${data.linkedin}" target="_blank">${data.linkedin}</a></div>
            </div>
            ` : ''}
            ${data.website ? `
            <div class="info-item">
              <div class="info-label">Website</div>
              <div class="info-value"><a href="${data.website}" target="_blank">${data.website}</a></div>
            </div>
            ` : ''}
          </div>
          ` : ''}

          <div style="text-align: center;">
            <a href="${process.env.NEXTAUTH_URL}/interested" class="cta-button">
              View All Interested Users
            </a>
          </div>

          <div class="footer">
            <p>This notification was sent on ${new Date(data.submittedAt).toLocaleDateString()} at ${new Date(data.submittedAt).toLocaleTimeString()}</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Foundrly" <${process.env.SMTP_USER}>`,
      to: data.startupOwnerEmail,
      subject: `🎉 New Interest in "${data.startupTitle}" - ${data.interestedUserName}`,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending email:', error);
    return { success: false, error: error.message };
  }
}

export async function sendNotificationEmail(
  recipientEmail: string,
  recipientName: string,
  title: string,
  message: string,
  actionUrl?: string,
  notificationType?: string
) {
  try {
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>${title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
          }
          .header {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            color: white;
            padding: 30px;
            text-align: center;
            border-radius: 10px 10px 0 0;
          }
          .content {
            background: #f8f9fa;
            padding: 30px;
            border-radius: 0 0 10px 10px;
          }
          .message-box {
            background: white;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e0e0e0;
            margin: 20px 0;
          }
          .cta-button {
            display: inline-block;
            background: #667eea;
            color: white;
            padding: 12px 24px;
            text-decoration: none;
            border-radius: 6px;
            font-weight: 600;
            margin: 20px 0;
          }
          .footer {
            text-align: center;
            color: #666;
            font-size: 14px;
            margin-top: 30px;
            padding-top: 20px;
            border-top: 1px solid #e0e0e0;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${title}</h1>
        </div>
        
        <div class="content">
          <p>Hi ${recipientName},</p>
          
          <div class="message-box">
            <p>${message}</p>
          </div>

          ${actionUrl ? `
          <div style="text-align: center;">
            <a href="${actionUrl}" class="cta-button">
              View Details
            </a>
          </div>
          ` : ''}

          <div class="footer">
            <p>This notification was sent on ${new Date().toLocaleDateString()}</p>
            <p>You can manage your notification preferences in your account settings.</p>
          </div>
        </div>
      </body>
      </html>
    `;

    const mailOptions = {
      from: `"Foundrly" <${process.env.SMTP_USER}>`,
      to: recipientEmail,
      subject: `🔔 ${title} - Foundrly`,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);
    console.log('Notification email sent successfully:', result.messageId);
    return { success: true, messageId: result.messageId };
  } catch (error) {
    console.error('Error sending notification email:', error);
    return { success: false, error: error.message };
  }
}

export interface CriticalNotificationEmailData {
  type: string;
  recipientId: string;
  metadata?: {
    startupTitle?: string;
    commentText?: string;
    userName?: string;
    userImage?: string;
    parentCommentText?: string;
    reportReason?: string;
    reportStatus?: string;
    actionTaken?: string;
  };
  title: string;
  message: string;
}

export async function sendCriticalNotificationEmail(data: CriticalNotificationEmailData) {
  try {
    console.log('🔔 Critical notification email requested:', {
      type: data.type,
      title: data.title,
      message: data.message,
      recipientId: data.recipientId
    });

    // Check if email is configured
    if (!isEmailConfigured()) {
      console.warn('⚠️ Email not configured, skipping critical notification email');
      return { success: false, error: 'Email service not configured' };
    }

    // Check user email preferences
    const prefs = await getUserEmailPreferences(data.recipientId);
    if (!prefs.enabled) {
      console.log('🔕 Email notifications disabled by user');
      return { success: true, messageId: 'email-disabled-by-user' };
    }

    // Get recipient email from user ID
    const user = await client.fetch(
      `*[_type == "author" && _id == $userId][0]{
        name,
        email
      }`,
      { userId: data.recipientId }
    );

    if (!user || !user.email) {
      console.warn('⚠️ User not found or no email address:', data.recipientId);
      return { success: false, error: 'User email not found' };
    }

    // Determine if this notification type should trigger an email
    const shouldSendEmail = shouldSendNotificationEmail(data.type) && (prefs.types?.[data.type as keyof typeof prefs.types] ?? true);
    if (!shouldSendEmail) {
      console.log('🔕 Email not sent for notification type:', data.type);
      return { success: true, messageId: 'email-skipped-by-type' };
    }

    // Send the email
    const result = await sendNotificationEmail(
      user.email,
      user.name || 'User',
      data.title,
      data.message,
      data.metadata?.actionUrl,
      data.type
    );

    if (result.success) {
      console.log('✅ Critical notification email sent successfully:', result.messageId);
    } else {
      console.error('❌ Failed to send critical notification email:', result.error);
    }

    return result;
  } catch (error) {
    console.error('❌ Error sending critical notification email:', error);
    return { success: false, error: error.message };
  }
}

// Determine which notification types should trigger emails
function shouldSendNotificationEmail(type: string): boolean {
  const emailEnabledTypes = [
    'follow',
    'comment', 
    'reply',
    'like',
    'interested_submission',
    'report',
    'system'
  ];
  
  return emailEnabledTypes.includes(type);
}

// Test function to verify email configuration
export async function testEmailConfiguration(): Promise<{ success: boolean; message: string }> {
  try {
    if (!isEmailConfigured()) {
      return { 
        success: false, 
        message: 'Email not configured. Please set SMTP_USER and SMTP_PASS environment variables.' 
      };
    }

    // Test the transporter
    await transporter.verify();
    
    return { 
      success: true, 
      message: 'Email configuration is valid and ready to send notifications.' 
    };
  } catch (error) {
    return { 
      success: false, 
      message: `Email configuration error: ${error.message}` 
    };
  }
}