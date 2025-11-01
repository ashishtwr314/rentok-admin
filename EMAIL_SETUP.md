# Email Setup Guide for RentOK Admin Panel

## Overview
This document explains how to configure email functionality for sending welcome emails to new vendors.

## Features
- ✉️ **Automated Welcome Emails**: Automatically sends a beautifully designed welcome email when a new vendor is created
- 🔐 **Login Credentials**: Includes login email, temporary password, and login URL
- 📋 **Vendor Information**: Displays all vendor details including personal, business, and bank information
- 🎨 **Professional Design**: Modern, responsive HTML email template with RentOK branding

## Email Configuration

### SMTP Settings (Gmail Example)

Add the following environment variables to your `.env.local` file:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=rentok.studio@gmail.com
SMTP_PASS=your-app-password-here
SMTP_FROM_NAME=Rent.OK
SMTP_FROM_EMAIL=rentok.studio@gmail.com
```

### Gmail App Password Setup

If you're using Gmail, you need to create an App Password:

1. Go to your [Google Account](https://myaccount.google.com/)
2. Navigate to **Security**
3. Enable **2-Step Verification** (if not already enabled)
4. Go to **App passwords**
5. Select **Mail** and **Other (Custom name)**
6. Name it "RentOK Admin Panel"
7. Click **Generate**
8. Copy the 16-character password and paste it as `SMTP_PASS` in your `.env.local`

### Other SMTP Providers

#### SendGrid
```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
```

#### AWS SES
```env
SMTP_HOST=email-smtp.us-east-1.amazonaws.com
SMTP_PORT=587
SMTP_USER=your-smtp-username
SMTP_PASS=your-smtp-password
```

#### Mailgun
```env
SMTP_HOST=smtp.mailgun.org
SMTP_PORT=587
SMTP_USER=your-mailgun-username
SMTP_PASS=your-mailgun-password
```

## Email Template Details

The welcome email includes:

### 1. **Header Section**
- RentOK branding with gradient colors
- Welcome message

### 2. **Login Credentials Box**
- Email address
- Temporary password (plaintext for first login)
- Login URL
- Security notice about changing password

### 3. **Personal Information**
- Full name
- Email
- Phone number
- Location (City, State)

### 4. **Business Information** (if provided)
- Business name
- GST number
- PAN number
- Commission rate

### 5. **Bank Information** (if provided)
- Account holder name
- Account number
- IFSC code

### 6. **Next Steps**
- Step-by-step onboarding instructions
- Help and support information

### 7. **Footer**
- Company links
- Contact information
- Copyright notice

## API Endpoint

### Send Welcome Email
**POST** `/api/vendors/welcome-email`

#### Request Body
```json
{
  "vendorName": "John Doe",
  "email": "john@example.com",
  "password": "TempPass123!",
  "businessName": "John's Rental Store",
  "phone": "+919876543210",
  "city": "Jagdalpur",
  "state": "Chhattisgarh",
  "gstNumber": "29ABCDE1234F1Z5",
  "panNumber": "ABCDE1234F",
  "bankAccountNumber": "1234567890",
  "bankIfscCode": "SBIN0001234",
  "bankAccountHolderName": "John Doe",
  "commissionRate": 10,
  "loginUrl": "https://example.com/login"
}
```

#### Response (Success)
```json
{
  "message": "Welcome email sent successfully",
  "data": {
    "messageId": "<unique-message-id>"
  }
}
```

#### Response (Error)
```json
{
  "error": "Failed to send welcome email",
  "details": "Error message details"
}
```

## Testing Email Setup

### Test Email Function

Create a test file `test-email.js` in your project root:

```javascript
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function testEmail() {
  try {
    const info = await transporter.sendMail({
      from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_EMAIL}>`,
      to: 'test@example.com',
      subject: 'Test Email from RentOK',
      text: 'This is a test email.',
      html: '<b>This is a test email.</b>',
    });

    console.log('Message sent: %s', info.messageId);
    console.log('✅ Email configuration is working!');
  } catch (error) {
    console.error('❌ Email configuration error:', error);
  }
}

testEmail();
```

Run: `node test-email.js`

## Troubleshooting

### Common Issues

#### 1. "Invalid login" error
- **Solution**: Make sure you're using an App Password (not your regular Gmail password)
- Verify 2-Step Verification is enabled

#### 2. "Connection timeout"
- **Solution**: Check your SMTP_HOST and SMTP_PORT
- Verify your firewall isn't blocking port 587

#### 3. "Must provide a valid sender email address"
- **Solution**: Ensure SMTP_FROM_EMAIL matches your SMTP_USER (for Gmail)

#### 4. Email goes to spam
- **Solution**: 
  - Add SPF records to your domain
  - Set up DKIM signing
  - Use a custom domain instead of Gmail

### Debug Mode

Enable debug logging by modifying the transporter configuration:

```typescript
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
  debug: true, // Add this
  logger: true, // Add this
});
```

## Security Best Practices

1. ✅ **Never commit** `.env.local` or actual credentials to version control
2. ✅ **Use App Passwords** instead of account passwords
3. ✅ **Rotate credentials** regularly
4. ✅ **Monitor email sending** for suspicious activity
5. ✅ **Use rate limiting** to prevent abuse
6. ✅ **Validate email addresses** before sending

## Production Recommendations

For production environments, consider:

1. **Professional Email Service**: Use SendGrid, AWS SES, or Mailgun for better deliverability
2. **Email Queue**: Implement a queue system (e.g., Bull, BullMQ) for handling high volume
3. **Retry Logic**: Add retry mechanisms for failed emails
4. **Email Templates**: Use a template engine like MJML or React Email
5. **Analytics**: Track email opens, clicks, and bounces
6. **Unsubscribe**: Add unsubscribe functionality
7. **Logging**: Log all email sending activities

## Files Modified

- `src/lib/email.ts` - Email sending functionality
- `src/app/api/vendors/welcome-email/route.ts` - API endpoint for sending emails
- `src/app/admin/vendors/page.tsx` - Vendor creation with email trigger
- `env.example` - SMTP configuration template

## Support

For issues or questions about email setup:
- Check the troubleshooting section above
- Review Gmail App Password setup instructions
- Contact the development team

---

**Last Updated**: November 2025  
**Version**: 1.0

