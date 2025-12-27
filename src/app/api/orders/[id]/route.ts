import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'
import { sendOrderStatusUpdateEmail, sendDeliveryPartnerAssignmentEmail } from '@/lib/email'

interface RouteParams {
  params: {
    id: string
  }
}

// GET: Fetch a single order by ID
export async function GET(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        profiles!inner(
          user_id,
          name,
          full_name,
          email,
          mobile_number,
          city,
          state,
          country
        ),
        order_items!inner(
          order_item_id,
          product_id,
          selected_size,
          quantity,
          unit_price,
          total_price,
          products!inner(
            product_id,
            title,
            images,
            vendor_id,
            vendors(
              vendor_id,
              name,
              email,
              phone,
              business_name
            )
          )
        )
      `)
      .eq('order_id', id)
      .single()

    if (error) {
      console.error('Error fetching order:', error)
      return NextResponse.json(
        { error: 'Failed to fetch order', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ order: data }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// PATCH: Update order status, payment status, or other fields
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()

    // Extract notes, updated_by, and assign_delivery_partner flag as they're not part of the orders table
    const { notes, updated_by, assign_delivery_partner, ...orderUpdates } = body

    // Auto-cancel payment if order is being cancelled
    if (orderUpdates.status && orderUpdates.status.toLowerCase() === 'cancelled') {
      orderUpdates.payment_status = 'cancelled'
      console.log('💳 Auto-cancelling payment since order is cancelled')
    }

    // Fetch the current order data before updating (for email notification)
    let orderBeforeUpdate = null
    if (orderUpdates.status || assign_delivery_partner) {
      const { data: orderData } = await supabase
        .from('orders')
        .select(`
          *,
          profiles!inner(
            user_id,
            name,
            full_name,
            email,
            mobile_number
          ),
          order_items!inner(
            order_item_id,
            product_id,
            selected_size,
            quantity,
            products!inner(
              title,
              images
            )
          )
        `)
        .eq('order_id', id)
        .single()
      
      orderBeforeUpdate = orderData
    }

    // Only update if there are fields to update
    if (Object.keys(orderUpdates).length > 0) {
      const { error } = await supabase
        .from('orders')
        .update({
          ...orderUpdates,
          updated_at: new Date().toISOString()
        })
        .eq('order_id', id)

      if (error) {
        console.error('Error updating order:', error)
        return NextResponse.json(
          { error: 'Failed to update order', details: error.message },
          { status: 500 }
        )
      }

      // Log payment status change (no email sent for payment status changes)
      if (orderUpdates.payment_status && !orderUpdates.status) {
        console.log('💳 Payment status updated to:', orderUpdates.payment_status)
        console.log('   No email sent (payment status change only)')
      }
    }

    // If status was updated, create a record in order_status_history
    if (orderUpdates.status) {
      await supabase
        .from('order_status_history')
        .insert([{
          order_id: id,
          status: orderUpdates.status,
          notes: notes || null,
          updated_by: updated_by || 'admin'
        }])

      // Send email notification to customer if status changed and we have order data
      if (orderBeforeUpdate && orderBeforeUpdate.profiles?.email) {
        console.log('📧 Attempting to send order status update email...')
        console.log(`   Order: ${orderBeforeUpdate.order_number}`)
        console.log(`   Customer: ${orderBeforeUpdate.profiles.email}`)
        console.log(`   Status: ${orderBeforeUpdate.status} -> ${orderUpdates.status}`)
        
        try {
          const customerName = orderBeforeUpdate.profiles?.name || 
                              orderBeforeUpdate.profiles?.full_name || 
                              'Customer'
          
          const products = orderBeforeUpdate.order_items?.map((item: any) => ({
            title: item.products?.title || 'Product',
            quantity: item.quantity,
            image: item.products?.images?.[0] || undefined
          })) || []

          const emailResult = await sendOrderStatusUpdateEmail({
            customerName,
            customerEmail: orderBeforeUpdate.profiles.email,
            orderNumber: orderBeforeUpdate.order_number,
            orderStatus: orderUpdates.status,
            previousStatus: orderBeforeUpdate.status,
            orderDate: orderBeforeUpdate.created_at,
            rentalStartDate: orderBeforeUpdate.rental_start_date,
            rentalEndDate: orderBeforeUpdate.rental_end_date,
            rentalDays: orderBeforeUpdate.rental_days,
            totalAmount: orderBeforeUpdate.total_amount,
            products,
            notes: notes || undefined
          })

          if (emailResult.success) {
            console.log('✅ EMAIL SENT SUCCESSFULLY!')
            console.log(`   Message ID: ${emailResult.data?.messageId}`)
            console.log(`   Recipient: ${orderBeforeUpdate.profiles.email}`)
          } else {
            console.error('❌ EMAIL FAILED TO SEND')
            console.error('   Error:', emailResult.error)
          }
        } catch (emailError) {
          // Log error but don't fail the request
          console.error('❌ EMAIL ERROR (Exception caught)')
          console.error('   Error details:', emailError)
        }
      } else {
        console.log('⚠️  Email not sent - missing order data or customer email')
      }
    }

    // Send email to delivery partner only when:
    // 1. Delivery partner is being assigned (not already assigned)
    // 2. Payment info changes (status or method)
    // 3. Delivery address changes
    // 4. Delivery partner is unassigned
    const shouldSendDeliveryEmail = (
      // New assignment
      (assign_delivery_partner && orderUpdates.delivery_partner_id && orderBeforeUpdate?.delivery_partner_id !== orderUpdates.delivery_partner_id) ||
      // Payment changes and partner is assigned
      ((orderUpdates.payment_status || orderUpdates.payment_method) && (orderBeforeUpdate?.delivery_partner_id || orderUpdates.delivery_partner_id)) ||
      // Delivery address changes and partner is assigned
      (orderUpdates.delivery_address && (orderBeforeUpdate?.delivery_partner_id || orderUpdates.delivery_partner_id)) ||
      // Partner is being unassigned
      (orderBeforeUpdate?.delivery_partner_id && !orderUpdates.delivery_partner_id)
    )

    if (shouldSendDeliveryEmail && orderBeforeUpdate) {
      // Get the delivery partner ID (either the new one or the existing one)
      const deliveryPartnerId = orderUpdates.delivery_partner_id || orderBeforeUpdate.delivery_partner_id

      if (deliveryPartnerId) {
        console.log('🚚 Attempting to send delivery partner notification email...')
        console.log(`   Order: ${orderBeforeUpdate.order_number}`)
        console.log(`   Delivery Partner ID: ${deliveryPartnerId}`)

        try {
          // Fetch delivery partner details
          const { data: deliveryPartner, error: dpError } = await supabase
            .from('delivery_partners')
            .select('*')
            .eq('delivery_partner_id', deliveryPartnerId)
            .single()

          if (dpError || !deliveryPartner) {
            console.error('❌ Failed to fetch delivery partner details:', dpError)
          } else {
            // Use updated values if they exist, otherwise use old values
            const finalDeliveryAddress = orderUpdates.delivery_address || orderBeforeUpdate.delivery_address
            const finalPaymentStatus = orderUpdates.payment_status || orderBeforeUpdate.payment_status
            const finalPaymentMethod = orderUpdates.payment_method || orderBeforeUpdate.payment_method

            const emailResult = await sendDeliveryPartnerAssignmentEmail({
              partnerName: deliveryPartner.name,
              partnerEmail: deliveryPartner.email,
              orderNumber: orderBeforeUpdate.order_number,
              deliveryAddress: finalDeliveryAddress,
              contactNumber: orderBeforeUpdate.contact_number,
              totalAmount: orderBeforeUpdate.total_amount,
              paymentStatus: finalPaymentStatus,
              paymentMethod: finalPaymentMethod
            })

            if (emailResult.success) {
              console.log('✅ DELIVERY PARTNER EMAIL SENT SUCCESSFULLY!')
              console.log(`   Message ID: ${emailResult.data?.messageId}`)
              console.log(`   Recipient: ${deliveryPartner.email}`)
            } else {
              console.error('❌ DELIVERY PARTNER EMAIL FAILED TO SEND')
              console.error('   Error:', emailResult.error)
            }
          }
        } catch (emailError) {
          // Log error but don't fail the request
          console.error('❌ DELIVERY PARTNER EMAIL ERROR (Exception caught)')
          console.error('   Error details:', emailError)
        }
      }
    }

    return NextResponse.json(
      { message: 'Order updated successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// DELETE: Delete an order
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    // Delete the order (CASCADE will automatically delete related order_items and order_status_history)
    const { error } = await supabase
      .from('orders')
      .delete()
      .eq('order_id', id)

    if (error) {
      console.error('Error deleting order:', error)
      return NextResponse.json(
        { error: 'Failed to delete order', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Order deleted successfully' },
      { status: 200 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}


