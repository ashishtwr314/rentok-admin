import { NextRequest, NextResponse } from 'next/server'
import { sendOrderStatusUpdateEmail } from '@/lib/email'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    
    const {
      customerName,
      customerEmail,
      orderNumber,
      orderStatus,
      previousStatus,
      orderDate,
      rentalStartDate,
      rentalEndDate,
      rentalDays,
      totalAmount,
      products,
      notes,
      trackingUrl
    } = body

    // Validate required fields
    if (!customerEmail || !orderNumber || !orderStatus) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    console.log('📧 Sending order status update email...')
    console.log(`   Order: ${orderNumber}`)
    console.log(`   Customer: ${customerEmail}`)
    console.log(`   Status: ${previousStatus} -> ${orderStatus}`)

    // Send the email
    const emailResult = await sendOrderStatusUpdateEmail({
      customerName: customerName || 'Customer',
      customerEmail,
      orderNumber,
      orderStatus,
      previousStatus,
      orderDate,
      rentalStartDate,
      rentalEndDate,
      rentalDays,
      totalAmount,
      products: products || [],
      notes,
      trackingUrl
    })

    if (emailResult.success) {
      console.log('✅ EMAIL SENT SUCCESSFULLY!')
      console.log(`   Message ID: ${emailResult.data?.messageId}`)
      console.log(`   Recipient: ${customerEmail}`)
      
      return NextResponse.json(
        { 
          success: true, 
          message: 'Email sent successfully',
          messageId: emailResult.data?.messageId 
        },
        { status: 200 }
      )
    } else {
      console.error('❌ EMAIL FAILED TO SEND')
      console.error('   Error:', emailResult.error)
      
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to send email',
          details: emailResult.error 
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('❌ EMAIL ERROR (Exception caught)')
    console.error('   Error details:', error)
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'An unexpected error occurred',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

