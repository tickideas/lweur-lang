import nodemailer from 'nodemailer';
import { Partner, Campaign, Language } from '@/types';

// Create email transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.BREVO_SMTP_HOST || 'smtp-relay.brevo.com',
    port: parseInt(process.env.BREVO_SMTP_PORT || '587'),
    secure: false, // Use STARTTLS
    auth: {
      user: process.env.BREVO_SMTP_USER, // Your Brevo email
      pass: process.env.BREVO_SMTP_KEY,  // Your Brevo SMTP key (not password)
    },
    tls: {
      ciphers: 'SSLv3',
      rejectUnauthorized: false
    }
  });
};

// Email templates
const templates = {
  welcome: {
    subject: 'Welcome to Loveworld Europe - Your Support Changes Lives',
    html: (partner: Partner, campaign: Campaign & { language: Language }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to Loveworld Europe</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B365D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .button { display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
    .highlight { background: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 6px; margin: 20px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Welcome to Loveworld Europe!</h1>
      <p>Thank you for joining our mission to reach Europe with the Gospel</p>
    </div>
    
    <div class="content">
      <h2>Dear ${partner.firstName},</h2>
      
      <p>We are thrilled to welcome you as a partner in our mission to spread the Gospel across Europe! Your support is already making a difference.</p>
      
      <div class="highlight">
        <h3>Your Sponsorship Details:</h3>
        <ul>
          <li><strong>Campaign Type:</strong> ${campaign.type === 'ADOPT_LANGUAGE' ? 'Language Adoption' : 'Translation Sponsorship'}</li>
          <li><strong>Language:</strong> ${campaign.language.name} (${campaign.language.nativeName})</li>
          <li><strong>Monthly Contribution:</strong> £${(campaign.monthlyAmount / 100).toFixed(2)}</li>
          <li><strong>Speaker Population:</strong> ${campaign.language.speakerCount.toLocaleString()} people</li>
        </ul>
      </div>
      
      <h3>What happens next?</h3>
      <ol>
        <li><strong>Immediate Impact:</strong> Your sponsorship is now active and enabling broadcasts</li>
        <li><strong>Monthly Updates:</strong> You'll receive progress reports showing your impact</li>
        <li><strong>Prayer Requests:</strong> We'll share specific ways you can pray for the communities you're reaching</li>
      </ol>
      
      <p>Your partnership enables us to broadcast life-transforming Christian programming to millions of ${campaign.language.name} speakers across ${campaign.language.region}.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://give.loveworldeurope.org/impact" class="button">View Your Impact Dashboard</a>
      </div>
      
      <p>If you have any questions or would like to learn more about how your support is making a difference, please don't hesitate to contact us.</p>
      
      <p>Blessings,<br>The Loveworld Europe Team</p>
    </div>
    
    <div class="footer">
      <p><strong>Loveworld Europe</strong><br>
      Spreading the Gospel, Changing Lives, in Every Language</p>
      <p>📧 support@loveworldeurope.org | 📞 +44 20 1234 5678</p>
      <p><a href="https://loveworldeurope.org">loveworldeurope.org</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  monthlyUpdate: {
    subject: 'Your Monthly Impact Report - Lives Transformed',
    html: (partner: Partner, campaign: Campaign & { language: Language }) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Monthly Impact Report</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { background: #1B365D; color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; }
    .footer { background: #f8f9fa; padding: 20px; text-align: center; border-radius: 0 0 8px 8px; }
    .stats { display: flex; justify-content: space-around; margin: 20px 0; }
    .stat { text-align: center; padding: 15px; background: #f8f9fa; border-radius: 6px; }
    .stat-number { font-size: 24px; font-weight: bold; color: #1B365D; }
    .testimony { background: #e8f5e8; border-left: 4px solid #28a745; padding: 15px; margin: 20px 0; font-style: italic; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>Your Monthly Impact Report</h1>
      <p>${new Date().toLocaleDateString('en-GB', { month: 'long', year: 'numeric' })}</p>
    </div>
    
    <div class="content">
      <h2>Dear ${partner.firstName},</h2>
      
      <p>Thank you for your continued support of ${campaign.language.name} programming! Here's how your partnership is changing lives this month:</p>
      
      <div class="stats">
        <div class="stat">
          <div class="stat-number">1,247</div>
          <div>Hours Broadcast</div>
        </div>
        <div class="stat">
          <div class="stat-number">12,500</div>
          <div>Estimated Viewers</div>
        </div>
        <div class="stat">
          <div class="stat-number">89</div>
          <div>Prayer Requests</div>
        </div>
      </div>
      
      <h3>This Month's Highlights:</h3>
      <ul>
        <li>Special Passacris program reached 15,000 viewers across ${campaign.language.region}</li>
        <li>Partnership with local churches increased viewership by 23%</li>
        <li>New language dubbing technology improved broadcast quality</li>
      </ul>
      
      <div class="testimony">
        <p>"I was struggling with depression when I found Loveworld Europe on TV. The messages of hope in my native language have completely transformed my life. Thank you for making this possible!" - Maria, viewer from ${campaign.language.region}</p>
      </div>
      
      <h3>Prayer Requests:</h3>
      <ul>
        <li>Pray for the production team creating ${campaign.language.name} content</li>
        <li>Pray for viewers to encounter God's love through the programs</li>
        <li>Pray for expansion into new regions where ${campaign.language.name} is spoken</li>
      </ul>
      
      <p>Your faithfulness enables us to continue reaching precious souls with the Gospel. We are deeply grateful for your partnership!</p>
      
      <p>Blessings,<br>The Loveworld Europe Team</p>
    </div>
    
    <div class="footer">
      <p>Want to increase your impact? <a href="https://give.loveworldeurope.org">Support another language</a></p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  paymentConfirmation: {
    subject: 'Payment Confirmation - Thank You for Your Support',
    html: (partner: Partner, amount: number, currency: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Confirmation</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .amount { background: #d4edda; border: 1px solid #c3e6cb; padding: 20px; border-radius: 6px; text-align: center; margin: 20px 0; }
    .amount-number { font-size: 32px; font-weight: bold; color: #155724; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h2>Payment Confirmation</h2>
      
      <p>Dear ${partner.firstName},</p>
      
      <p>Thank you! We have successfully processed your monthly contribution to Loveworld Europe.</p>
      
      <div class="amount">
        <div class="amount-number">${new Intl.NumberFormat('en-GB', { style: 'currency', currency }).format(amount / 100)}</div>
        <div>Processed on ${new Date().toLocaleDateString('en-GB')}</div>
      </div>
      
      <p>Your support is enabling life-transforming broadcasts across Europe right now. Thank you for your faithfulness in supporting our mission!</p>
      
      <p>This email serves as your receipt for tax purposes. Please retain it for your records.</p>
      
      <p>Blessings,<br>The Loveworld Europe Finance Team</p>
    </div>
  </div>
</body>
</html>
    `,
  },
  
  paymentFailed: {
    subject: 'Payment Issue - Please Update Your Payment Method',
    html: (partner: Partner) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Payment Issue</title>
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .content { background: white; padding: 30px; border: 1px solid #e0e0e0; border-radius: 8px; }
    .alert { background: #f8d7da; border: 1px solid #f5c6cb; padding: 15px; border-radius: 6px; margin: 20px 0; }
    .button { display: inline-block; background: #DC143C; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; }
  </style>
</head>
<body>
  <div class="container">
    <div class="content">
      <h2>Payment Method Update Needed</h2>
      
      <p>Dear ${partner.firstName},</p>
      
      <div class="alert">
        <p><strong>Action Required:</strong> We were unable to process your recent payment for your Loveworld Europe sponsorship.</p>
      </div>
      
      <p>This can happen for various reasons:</p>
      <ul>
        <li>Your card may have expired</li>
        <li>Your bank may have declined the transaction</li>
        <li>Your billing address may have changed</li>
      </ul>
      
      <p>To continue your vital support for spreading the Gospel across Europe, please update your payment method at your earliest convenience.</p>
      
      <div style="text-align: center; margin: 30px 0;">
        <a href="https://give.loveworldeurope.org/update-payment" class="button">Update Payment Method</a>
      </div>
      
      <p>If you have any questions or need assistance, please contact our support team at support@loveworldeurope.org or +44 20 1234 5678.</p>
      
      <p>Thank you for your understanding and continued partnership!</p>
      
      <p>Blessings,<br>The Loveworld Europe Team</p>
    </div>
  </div>
</body>
</html>
    `,
  },
};

// Email service functions
export const emailService = {
  async sendWelcomeEmail(
    partner: Partner,
    campaign: Campaign & { language: Language }
  ) {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Loveworld Europe" <${process.env.BREVO_SMTP_USER}>`,
      to: partner.email,
      subject: templates.welcome.subject,
      html: templates.welcome.html(partner, campaign),
    };
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Welcome email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return { success: false, error };
    }
  },
  
  async sendMonthlyUpdate(
    partner: Partner,
    campaign: Campaign & { language: Language }
  ) {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Loveworld Europe" <${process.env.BREVO_SMTP_USER}>`,
      to: partner.email,
      subject: templates.monthlyUpdate.subject,
      html: templates.monthlyUpdate.html(partner, campaign),
    };
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Monthly update sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send monthly update:', error);
      return { success: false, error };
    }
  },
  
  async sendPaymentConfirmation(
    partner: Partner,
    amount: number,
    currency: string = 'GBP'
  ) {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Loveworld Europe" <${process.env.BREVO_SMTP_USER}>`,
      to: partner.email,
      subject: templates.paymentConfirmation.subject,
      html: templates.paymentConfirmation.html(partner, amount, currency),
    };
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Payment confirmation sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send payment confirmation:', error);
      return { success: false, error };
    }
  },
  
  async sendPaymentFailedNotification(partner: Partner) {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: `"Loveworld Europe" <${process.env.BREVO_SMTP_USER}>`,
      to: partner.email,
      subject: templates.paymentFailed.subject,
      html: templates.paymentFailed.html(partner),
    };
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Payment failed notification sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send payment failed notification:', error);
      return { success: false, error };
    }
  },
  
  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    from?: string
  ) {
    const transporter = createTransporter();
    
    const mailOptions = {
      from: from || `"Loveworld Europe" <${process.env.BREVO_SMTP_USER}>`,
      to,
      subject,
      html,
    };
    
    try {
      const result = await transporter.sendMail(mailOptions);
      console.log('Custom email sent:', result.messageId);
      return { success: true, messageId: result.messageId };
    } catch (error) {
      console.error('Failed to send custom email:', error);
      return { success: false, error };
    }
  },
};

// Email automation scheduler (this would typically run as a cron job)
export const emailAutomation = {
  async sendMonthlyUpdates() {
    // This would fetch all active campaigns and send monthly updates
    console.log('Monthly update automation triggered');
    // Implementation would go here
  },
  
  async processWelcomeSeries() {
    // This would send follow-up emails to new partners
    console.log('Welcome series automation triggered');
    // Implementation would go here
  },
  
  async sendPaymentReminders() {
    // This would send reminders for failed payments
    console.log('Payment reminder automation triggered');
    // Implementation would go here
  },
};

// EmailService class for dependency injection compatibility
export class EmailService {
  async sendWelcomeEmail(
    partner: Partner,
    campaign?: Campaign & { language: Language }
  ) {
    return emailService.sendWelcomeEmail(partner, campaign!);
  }
  
  async sendMonthlyUpdate(
    partner: Partner,
    campaign: Campaign & { language: Language }
  ) {
    return emailService.sendMonthlyUpdate(partner, campaign);
  }
  
  async sendPaymentConfirmation(
    partner: Partner,
    amount: number,
    currency: string = 'GBP'
  ) {
    return emailService.sendPaymentConfirmation(partner, amount, currency);
  }
  
  async sendPaymentFailed(partner: Partner) {
    return emailService.sendPaymentFailedNotification(partner);
  }
  
  async sendMonthlyImpactReport(
    partner: Partner,
    campaign: Campaign & { language: Language }
  ) {
    return emailService.sendMonthlyUpdate(partner, campaign);
  }
  
  async sendCustomEmail(
    to: string,
    subject: string,
    html: string,
    from?: string
  ) {
    return emailService.sendCustomEmail(to, subject, html, from);
  }
}