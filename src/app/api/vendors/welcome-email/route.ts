import { NextRequest, NextResponse } from 'next/server';
import { sendVendorWelcomeEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    const {
      vendorName,
      email,
      password,
      businessName,
      phone,
      city,
      state,
      gstNumber,
      panNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      commissionRate,
      loginUrl
    } = body;

    // Validate required fields
    if (!vendorName || !email || !password || !phone) {
      return NextResponse.json(
        { error: 'Missing required fields: vendorName, email, password, phone' },
        { status: 400 }
      );
    }

    // Send welcome email
    const result = await sendVendorWelcomeEmail({
      vendorName,
      email,
      password,
      businessName,
      phone,
      city,
      state,
      gstNumber,
      panNumber,
      bankAccountNumber,
      bankIfscCode,
      bankAccountHolderName,
      commissionRate: commissionRate || 10,
      loginUrl: loginUrl || 'https://example.com/login'
    });

    if (result.success) {
      return NextResponse.json(
        { 
          message: 'Welcome email sent successfully',
          data: result.data 
        },
        { status: 200 }
      );
    } else {
      throw new Error('Failed to send email');
    }
  } catch (error) {
    console.error('Error in welcome email API:', error);
    return NextResponse.json(
      { 
        error: 'Failed to send welcome email',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}


