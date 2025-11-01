import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// POST /api/coupons/validate - Validate a coupon code
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { code, amount, items } = body

    if (!code) {
      return NextResponse.json(
        { error: 'Coupon code is required' },
        { status: 400 }
      )
    }

    // Find the coupon
    const { data: coupon, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('code', code.toUpperCase())
      .single()

    if (error || !coupon) {
      return NextResponse.json(
        { 
          valid: false, 
          error: 'Invalid coupon code' 
        },
        { status: 404 }
      )
    }

    // Check if coupon is active
    if (!coupon.is_active) {
      return NextResponse.json({
        valid: false,
        error: 'Coupon is not active'
      })
    }

    // Check if coupon has expired
    const now = new Date()
    const validFrom = new Date(coupon.valid_from)
    const validUntil = new Date(coupon.valid_until)

    if (now < validFrom) {
      return NextResponse.json({
        valid: false,
        error: 'Coupon is not yet valid'
      })
    }

    if (now > validUntil) {
      return NextResponse.json({
        valid: false,
        error: 'Coupon has expired'
      })
    }

    // Check usage limit
    if (coupon.usage_limit && coupon.used_count >= coupon.usage_limit) {
      return NextResponse.json({
        valid: false,
        error: 'Coupon usage limit exceeded'
      })
    }

    // Check minimum amount
    if (coupon.minimum_amount && amount < coupon.minimum_amount) {
      return NextResponse.json({
        valid: false,
        error: `Minimum order amount of ₹${coupon.minimum_amount} required`
      })
    }

    // Check applicability
    if (coupon.applicable_to !== 'all' && items) {
      const applicableIds = coupon.applicable_ids || []
      let isApplicable = false

      switch (coupon.applicable_to) {
        case 'category':
          isApplicable = items.some((item: any) => 
            applicableIds.includes(item.category_id)
          )
          break
        case 'product':
          isApplicable = items.some((item: any) => 
            applicableIds.includes(item.product_id)
          )
          break
        case 'vendor':
          isApplicable = items.some((item: any) => 
            applicableIds.includes(item.vendor_id)
          )
          break
      }

      if (!isApplicable) {
        return NextResponse.json({
          valid: false,
          error: 'Coupon is not applicable to selected items'
        })
      }
    }

    // Calculate discount
    let discountAmount = 0
    if (coupon.discount_type === 'percentage') {
      discountAmount = (amount * coupon.discount_value) / 100
      if (coupon.maximum_discount && discountAmount > coupon.maximum_discount) {
        discountAmount = coupon.maximum_discount
      }
    } else {
      discountAmount = coupon.discount_value
    }

    // Ensure discount doesn't exceed order amount
    discountAmount = Math.min(discountAmount, amount)

    return NextResponse.json({
      valid: true,
      coupon: {
        id: coupon.coupon_id,
        code: coupon.code,
        title: coupon.title,
        description: coupon.description,
        discount_type: coupon.discount_type,
        discount_value: coupon.discount_value,
        discount_amount: discountAmount,
        minimum_amount: coupon.minimum_amount,
        maximum_discount: coupon.maximum_discount
      }
    })
  } catch (error) {
    console.error('Error in POST /api/coupons/validate:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
