import nodemailer from 'nodemailer';

interface EmailOptions {
  to: string;
  subject: string;
  text: string;
  html?: string;
}

class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.EMAIL_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.EMAIL_PORT || '587'),
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD,
      },
    });
  }

  async sendEmail(options: EmailOptions): Promise<void> {
    try {
      await this.transporter.sendMail({
        from: process.env.EMAIL_FROM || 'Lost and Found <noreply@lostandfound.com>',
        to: options.to,
        subject: options.subject,
        text: options.text,
        html: options.html || options.text,
      });
      console.log('Email sent successfully to:', options.to);
    } catch (error) {
      console.error('Error sending email:', error);
      throw new Error('Failed to send email');
    }
  }

  async sendContactEmail(
    recipientEmail: string,
    itemHeadline: string,
    message: string
  ): Promise<void> {
    const subject = `Someone is interested in: ${itemHeadline}`;
    const text = `
You received a message about your lost/found item: "${itemHeadline}"

Message:
${message}

---
This is an anonymous message sent through the Lost and Found application.
Reply to this email to respond to the sender.
    `.trim();

    const html = `
      <h2>You received a message about your item</h2>
      <p><strong>Item:</strong> ${itemHeadline}</p>
      <h3>Message:</h3>
      <p>${message.replace(/\n/g, '<br>')}</p>
      <hr>
      <p style="color: #666; font-size: 12px;">
        This is an anonymous message sent through the Lost and Found application.
      </p>
    `;

    await this.sendEmail({
      to: recipientEmail,
      subject,
      text,
      html,
    });
  }
}

export default new EmailService();
