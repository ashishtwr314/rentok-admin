import nodemailer from 'nodemailer';

// Configure SMTP transporter
const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

interface VendorWelcomeEmailData {
  vendorName: string;
  email: string;
  password: string;
  businessName?: string;
  phone: string;
  city?: string;
  state?: string;
  gstNumber?: string;
  panNumber?: string;
  bankAccountNumber?: string;
  bankIfscCode?: string;
  bankAccountHolderName?: string;
  commissionRate: number;
  loginUrl: string;
}

export async function sendVendorWelcomeEmail(data: VendorWelcomeEmailData) {
  try {
    const emailHtml = generateVendorWelcomeEmailHTML(data);

    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'RentOK'} <${process.env.SMTP_FROM_EMAIL}>`,
      to: data.email,
      subject: '🎉 Welcome to RentOK - Your Vendor Account is Ready!',
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending vendor welcome email:', error);
    return { success: false, error };
  }
}

interface OrderStatusUpdateEmailData {
  customerName: string;
  customerEmail: string;
  orderNumber: string;
  orderStatus: string;
  previousStatus?: string;
  orderDate: string;
  rentalStartDate: string;
  rentalEndDate: string;
  rentalDays: number;
  totalAmount: number;
  products: Array<{
    title: string;
    quantity: number;
    image?: string;
  }>;
  notes?: string;
  trackingUrl?: string;
}

export async function sendOrderStatusUpdateEmail(data: OrderStatusUpdateEmailData) {
  try {
    const emailHtml = generateOrderStatusUpdateEmailHTML(data);
    const statusEmoji = getStatusEmoji(data.orderStatus);
    
    const mailOptions = {
      from: `${process.env.SMTP_FROM_NAME || 'RentOK'} <${process.env.SMTP_FROM_EMAIL}>`,
      to: data.customerEmail,
      subject: `${statusEmoji} Order ${data.orderNumber} - Status Update: ${data.orderStatus}`,
      html: emailHtml,
    };

    const result = await transporter.sendMail(mailOptions);

    return { success: true, data: result };
  } catch (error) {
    console.error('Error sending order status update email:', error);
    return { success: false, error };
  }
}

function getStatusEmoji(status: string): string {
  const statusEmojis: { [key: string]: string } = {
    pending: '⏳',
    confirmed: '✓',
    processing: '⚙️',
    shipped: '🚚',
    delivered: '✅',
    cancelled: '❌',
    rejected: '❌',
  };
  return statusEmojis[status.toLowerCase()] || '📦';
}

function formatPrice(price: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0,
  }).format(price);
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

function generateOrderStatusUpdateEmailHTML(data: OrderStatusUpdateEmailData): string {
  const statusEmoji = getStatusEmoji(data.orderStatus);
  const statusColors: { [key: string]: string } = {
    pending: '#ff9800',
    confirmed: '#2196f3',
    processing: '#2196f3',
    shipped: '#673ab7',
    delivered: '#4caf50',
    cancelled: '#f44336',
    rejected: '#f44336',
  };
  const statusColor = statusColors[data.orderStatus.toLowerCase()] || '#9A2143';

  const statusMessages: { [key: string]: string } = {
    pending: 'Your order is being reviewed and will be confirmed soon.',
    confirmed: 'Great news! Your order has been confirmed and will be processed shortly.',
    processing: 'Your order is being prepared for shipment.',
    shipped: 'Your order is on its way! It will be delivered soon.',
    delivered: 'Your order has been successfully delivered. Enjoy your rental!',
    cancelled: 'Your order has been cancelled. If you have questions, please contact support.',
    rejected: 'Unfortunately, your order could not be processed. Please contact support for more information.',
  };
  const statusMessage = statusMessages[data.orderStatus.toLowerCase()] || 'Your order status has been updated.';

  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Order Status Update - ${data.orderNumber}</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #FBA800 0%, #9A2143 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 28px;
      font-weight: bold;
    }
    .header p {
      color: #ffffff;
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .status-badge {
      background-color: ${statusColor};
      color: #ffffff;
      display: inline-block;
      padding: 12px 30px;
      border-radius: 25px;
      font-size: 20px;
      font-weight: bold;
      margin: 20px 0;
      text-transform: uppercase;
      letter-spacing: 1px;
    }
    .content {
      padding: 40px 30px;
    }
    .message-box {
      background: linear-gradient(135deg, #FCF5E9 0%, #FFF9F0 100%);
      border-left: 4px solid #FBA800;
      padding: 20px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .message-box p {
      margin: 0;
      color: #333333;
      font-size: 16px;
      line-height: 1.6;
    }
    .order-info {
      background-color: #f9f9f9;
      padding: 20px;
      border-radius: 8px;
      margin: 25px 0;
    }
    .order-info h2 {
      color: #9A2143;
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #666666;
      min-width: 150px;
    }
    .info-value {
      color: #333333;
      flex: 1;
    }
    .product-item {
      display: flex;
      align-items: center;
      padding: 15px;
      margin: 10px 0;
      background-color: #ffffff;
      border: 1px solid #e0e0e0;
      border-radius: 8px;
    }
    .product-image {
      width: 60px;
      height: 60px;
      object-fit: cover;
      border-radius: 5px;
      margin-right: 15px;
    }
    .product-info {
      flex: 1;
    }
    .product-title {
      font-weight: 600;
      color: #333333;
      margin: 0 0 5px 0;
    }
    .product-quantity {
      color: #666666;
      font-size: 14px;
    }
    .notes-box {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .notes-box p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #FBA800 0%, #9A2143 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .footer {
      background-color: #333333;
      color: #ffffff;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #FBA800;
      text-decoration: none;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #FBA800, #9A2143, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>${statusEmoji} Order Status Update</h1>
      <p>Order #${data.orderNumber}</p>
      <div class="status-badge">${data.orderStatus}</div>
    </div>

    <!-- Content -->
    <div class="content">
      <p style="font-size: 18px; color: #333333; margin-bottom: 20px;">
        Dear <strong>${data.customerName}</strong>,
      </p>

      <div class="message-box">
        <p><strong>Update:</strong> ${statusMessage}</p>
      </div>

      ${data.notes ? `
      <div class="notes-box">
        <p><strong>Note from vendor:</strong> ${data.notes}</p>
      </div>
      ` : ''}

      <div class="divider"></div>

      <!-- Order Information -->
      <div class="order-info">
        <h2>📦 Order Details</h2>
        <div class="info-row">
          <div class="info-label">Order Number:</div>
          <div class="info-value"><strong>#${data.orderNumber}</strong></div>
        </div>
        <div class="info-row">
          <div class="info-label">Order Date:</div>
          <div class="info-value">${formatDate(data.orderDate)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Total Amount:</div>
          <div class="info-value"><strong>${formatPrice(data.totalAmount)}</strong></div>
        </div>
      </div>

      <!-- Rental Period -->
      <div class="order-info">
        <h2>📅 Rental Period</h2>
        <div class="info-row">
          <div class="info-label">Start Date:</div>
          <div class="info-value">${formatDate(data.rentalStartDate)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">End Date:</div>
          <div class="info-value">${formatDate(data.rentalEndDate)}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Duration:</div>
          <div class="info-value">${data.rentalDays} days</div>
        </div>
      </div>

      <!-- Products -->
      <div class="order-info">
        <h2>🛍️ Products</h2>
        ${data.products.map(product => `
          <div class="product-item">
            ${product.image ? `
              <img src="${product.image}" alt="${product.title}" class="product-image">
            ` : ''}
            <div class="product-info">
              <div class="product-title">${product.title}</div>
              <div class="product-quantity">Quantity: ${product.quantity}</div>
            </div>
          </div>
        `).join('')}
      </div>

      ${data.trackingUrl ? `
      <div style="text-align: center;">
        <a href="${data.trackingUrl}" class="cta-button">Track Your Order →</a>
      </div>
      ` : ''}

      <div class="divider"></div>

      <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 8px;">
        <p style="margin: 0; color: #2e7d32; text-align: center;">
          <strong>Need Help?</strong> Contact us at 
          <a href="mailto:support@rentok.com" style="color: #2e7d32; text-decoration: underline;">support@rentok.com</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>RentOK</strong> - Your Trusted Rental Marketplace</p>
      <p style="margin: 5px 0;">
        <a href="https://rentok.com">Visit Website</a> | 
        <a href="https://rentok.com/support">Support</a> | 
        <a href="https://rentok.com/terms">Terms</a>
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #999999;">
        © ${new Date().getFullYear()} RentOK. All rights reserved.<br>
        This email was sent to ${data.customerEmail}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

function generateVendorWelcomeEmailHTML(data: VendorWelcomeEmailData): string {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Welcome to RentOK</title>
  <style>
    body {
      margin: 0;
      padding: 0;
      font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
      background-color: #f5f5f5;
    }
    .container {
      max-width: 600px;
      margin: 0 auto;
      background-color: #ffffff;
    }
    .header {
      background: linear-gradient(135deg, #FBA800 0%, #9A2143 100%);
      padding: 40px 30px;
      text-align: center;
    }
    .header h1 {
      color: #ffffff;
      margin: 0;
      font-size: 32px;
      font-weight: bold;
    }
    .header p {
      color: #ffffff;
      margin: 10px 0 0 0;
      font-size: 16px;
      opacity: 0.9;
    }
    .content {
      padding: 40px 30px;
    }
    .welcome-message {
      font-size: 18px;
      color: #333333;
      line-height: 1.6;
      margin-bottom: 30px;
    }
    .credentials-box {
      background: linear-gradient(135deg, #FCF5E9 0%, #FFF9F0 100%);
      border-left: 4px solid #FBA800;
      padding: 25px;
      margin: 25px 0;
      border-radius: 8px;
    }
    .credentials-box h2 {
      color: #9A2143;
      margin: 0 0 20px 0;
      font-size: 20px;
    }
    .credential-item {
      margin: 15px 0;
    }
    .credential-label {
      color: #666666;
      font-size: 14px;
      font-weight: 600;
      margin-bottom: 5px;
    }
    .credential-value {
      color: #333333;
      font-size: 16px;
      font-weight: bold;
      font-family: 'Courier New', monospace;
      background-color: #ffffff;
      padding: 10px 15px;
      border-radius: 5px;
      border: 1px solid #e0e0e0;
      word-break: break-all;
    }
    .info-section {
      margin: 30px 0;
      padding: 20px;
      background-color: #f9f9f9;
      border-radius: 8px;
    }
    .info-section h3 {
      color: #9A2143;
      margin: 0 0 15px 0;
      font-size: 18px;
    }
    .info-row {
      display: flex;
      padding: 10px 0;
      border-bottom: 1px solid #e0e0e0;
    }
    .info-row:last-child {
      border-bottom: none;
    }
    .info-label {
      font-weight: 600;
      color: #666666;
      min-width: 180px;
    }
    .info-value {
      color: #333333;
      flex: 1;
    }
    .cta-button {
      display: inline-block;
      background: linear-gradient(135deg, #FBA800 0%, #9A2143 100%);
      color: #ffffff;
      text-decoration: none;
      padding: 15px 40px;
      border-radius: 8px;
      font-weight: bold;
      font-size: 16px;
      margin: 20px 0;
      text-align: center;
    }
    .security-notice {
      background-color: #fff3cd;
      border: 1px solid #ffc107;
      padding: 15px;
      border-radius: 5px;
      margin: 20px 0;
    }
    .security-notice p {
      margin: 0;
      color: #856404;
      font-size: 14px;
    }
    .footer {
      background-color: #333333;
      color: #ffffff;
      padding: 30px;
      text-align: center;
      font-size: 14px;
    }
    .footer a {
      color: #FBA800;
      text-decoration: none;
    }
    .divider {
      height: 2px;
      background: linear-gradient(90deg, transparent, #FBA800, #9A2143, transparent);
      margin: 30px 0;
    }
  </style>
</head>
<body>
  <div class="container">
    <!-- Header -->
    <div class="header">
      <h1>🎉 Welcome to RentOK!</h1>
      <p>Your Vendor Account is Ready</p>
    </div>

    <!-- Content -->
    <div class="content">
      <div class="welcome-message">
        <p>Dear <strong>${data.vendorName}</strong>,</p>
        <p>
          Welcome to the <strong>RentOK family</strong>! We're thrilled to have you on board as a valued vendor partner. 
          Your account has been successfully created, and you can now start managing your products and growing your business with us.
        </p>
        <p>
          At RentOK, we're committed to providing you with the best platform to showcase your rental products and reach 
          thousands of customers across India. Let's build something great together!
        </p>
      </div>

      <div class="divider"></div>

      <!-- Login Credentials -->
      <div class="credentials-box">
        <h2>🔐 Your Login Credentials</h2>
        <div class="credential-item">
          <div class="credential-label">Email Address:</div>
          <div class="credential-value">${data.email}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Temporary Password:</div>
          <div class="credential-value">${data.password}</div>
        </div>
        <div class="credential-item">
          <div class="credential-label">Login URL:</div>
          <div class="credential-value">${data.loginUrl}</div>
        </div>
      </div>

      <div style="text-align: center;">
        <a href="${data.loginUrl}" class="cta-button">Login to Your Dashboard →</a>
      </div>

      <div class="security-notice">
        <p><strong>⚠️ Security Notice:</strong> For your security, please change your password after your first login. Keep your login credentials confidential and never share them with anyone.</p>
      </div>

      <div class="divider"></div>

      <!-- Personal Information -->
      <div class="info-section">
        <h3>👤 Your Personal Information</h3>
        <div class="info-row">
          <div class="info-label">Full Name:</div>
          <div class="info-value">${data.vendorName}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Email:</div>
          <div class="info-value">${data.email}</div>
        </div>
        <div class="info-row">
          <div class="info-label">Phone Number:</div>
          <div class="info-value">${data.phone}</div>
        </div>
        ${data.city && data.state ? `
        <div class="info-row">
          <div class="info-label">Location:</div>
          <div class="info-value">${data.city}, ${data.state}</div>
        </div>
        ` : ''}
      </div>

      <!-- Business Information -->
      ${data.businessName ? `
      <div class="info-section">
        <h3>🏢 Business Information</h3>
        <div class="info-row">
          <div class="info-label">Business Name:</div>
          <div class="info-value">${data.businessName}</div>
        </div>
        ${data.gstNumber ? `
        <div class="info-row">
          <div class="info-label">GST Number:</div>
          <div class="info-value">${data.gstNumber}</div>
        </div>
        ` : ''}
        ${data.panNumber ? `
        <div class="info-row">
          <div class="info-label">PAN Number:</div>
          <div class="info-value">${data.panNumber}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="info-label">Commission Rate:</div>
          <div class="info-value">${data.commissionRate}%</div>
        </div>
      </div>
      ` : ''}

      <!-- Bank Information -->
      ${data.bankAccountNumber ? `
      <div class="info-section">
        <h3>🏦 Bank Information</h3>
        ${data.bankAccountHolderName ? `
        <div class="info-row">
          <div class="info-label">Account Holder:</div>
          <div class="info-value">${data.bankAccountHolderName}</div>
        </div>
        ` : ''}
        <div class="info-row">
          <div class="info-label">Account Number:</div>
          <div class="info-value">${data.bankAccountNumber}</div>
        </div>
        ${data.bankIfscCode ? `
        <div class="info-row">
          <div class="info-label">IFSC Code:</div>
          <div class="info-value">${data.bankIfscCode}</div>
        </div>
        ` : ''}
      </div>
      ` : ''}

      <div class="divider"></div>

      <!-- Next Steps -->
      <div class="info-section">
        <h3>🚀 Next Steps</h3>
        <ol style="color: #333333; line-height: 1.8;">
          <li><strong>Login to your dashboard</strong> using the credentials above</li>
          <li><strong>Change your password</strong> to something secure and memorable</li>
          <li><strong>Complete your profile</strong> by adding additional business details</li>
          <li><strong>Add your first product</strong> and start reaching customers</li>
          <li><strong>Set up your payout preferences</strong> in the settings</li>
        </ol>
      </div>

      <div style="margin-top: 30px; padding: 20px; background-color: #e8f5e9; border-radius: 8px;">
        <p style="margin: 0; color: #2e7d32; text-align: center;">
          <strong>Need Help?</strong> Our support team is here to assist you. Reach out anytime at 
          <a href="mailto:support@rentok.com" style="color: #2e7d32; text-decoration: underline;">support@rentok.com</a>
        </p>
      </div>
    </div>

    <!-- Footer -->
    <div class="footer">
      <p style="margin: 0 0 10px 0;"><strong>RentOK</strong> - Your Trusted Rental Marketplace</p>
      <p style="margin: 5px 0;">
        <a href="${data.loginUrl}">Vendor Dashboard</a> | 
        <a href="https://rentok.com/support">Support</a> | 
        <a href="https://rentok.com/terms">Terms</a>
      </p>
      <p style="margin: 15px 0 0 0; font-size: 12px; color: #999999;">
        © ${new Date().getFullYear()} RentOK. All rights reserved.<br>
        This email was sent to ${data.email}
      </p>
    </div>
  </div>
</body>
</html>
  `.trim();
}

