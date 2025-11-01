import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../../lib/supabase'

// POST /api/coupons/[id]/use - Mark a coupon as used
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const { order_id, user_id } = body

    if (!order_id) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      )
    }

    // Get the current coupon
    const { data: coupon, error: fetchError } = await supabase
      .from('coupons')
      .select('*')
      .eq('coupon_id', params.id)
      .single()

    if (fetchError || !coupon) {
      return NextResponse.json(
        { error: 'Coupon not found' },
        { status: 404 }
      )
    }

    // Check if coupon is still valid
    if (!coupon.is_active) {
      return NextResponse.json(
        { error: 'Coupon is not active' },
        { status: 400 }
      )
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json(
        { error: 'Coupon usage limit exceeded' },
        { status: 400 }
      )
    }

    // Check if coupon has expired
    const now = new Date()
    const validUntil = new Date(coupon.valid_until)
    if (now > validUntil) {
      return NextResponse.json(
        { error: 'Coupon has expired' },
        { status: 400 }
      )
    }

    // Update the used count
    const { data, error } = await supabase
      .from('coupons')
      .update({ 
        used_count: coupon.used_count + 1,
        updated_at: new Date().toISOString()
      })
      .eq('coupon_id', params.id)
      .select()
      .single()

    if (error) {
      console.error('Error updating coupon usage:', error)
      return NextResponse.json(
        { error: 'Failed to update coupon usage' },
        { status: 500 }
      )
    }

    // Optional: Create a coupon usage record
    if (user_id) {
      const { error: usageError } = await supabase
        .from('coupon_usage')
        .insert([{
          coupon_id: params.id,
          user_id: user_id,
          order_id: order_id,
          used_at: new Date().toISOString()
        }])

      if (usageError) {
        console.error('Error creating coupon usage record:', usageError)
        // Don't fail the request if usage tracking fails
      }
    }

    return NextResponse.json({
      message: 'Coupon used successfully',
      coupon: data
    })
  } catch (error) {
    console.error('Error in POST /api/coupons/[id]/use:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
