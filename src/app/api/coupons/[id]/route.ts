import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/coupons/[id] - Get a specific coupon
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('coupons')
      .select('*')
      .eq('coupon_id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching coupon:', error)
      return NextResponse.json(
        { error: 'Failed to fetch coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({ coupon: data })
  } catch (error) {
    console.error('Error in GET /api/coupons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/coupons/[id] - Update a specific coupon
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate required fields
    const requiredFields = ['code', 'title', 'discount_type', 'discount_value', 'valid_from', 'valid_until']
    for (const field of requiredFields) {
      if (!body[field]) {
        return NextResponse.json(
          { error: `${field} is required` },
          { status: 400 }
        )
      }
    }

    // Validate discount type
    if (!['percentage', 'fixed'].includes(body.discount_type)) {
      return NextResponse.json(
        { error: 'discount_type must be either "percentage" or "fixed"' },
        { status: 400 }
      )
    }

    // Validate discount value
    if (body.discount_value <= 0) {
      return NextResponse.json(
        { error: 'discount_value must be greater than 0' },
        { status: 400 }
      )
    }

    // Validate percentage discount
    if (body.discount_type === 'percentage' && body.discount_value > 100) {
      return NextResponse.json(
        { error: 'Percentage discount cannot exceed 100%' },
        { status: 400 }
      )
    }

    // Validate dates
    const validFrom = new Date(body.valid_from)
    const validUntil = new Date(body.valid_until)
    
    if (validFrom >= validUntil) {
      return NextResponse.json(
        { error: 'valid_until must be after valid_from' },
        { status: 400 }
      )
    }

    // Check if coupon code already exists (excluding current coupon)
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('coupon_id')
      .eq('code', body.code)
      .neq('coupon_id', params.id)
      .single()

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      )
    }

    // Prepare update data
    const updateData = {
      code: body.code.toUpperCase(),
      title: body.title,
      description: body.description || null,
      discount_type: body.discount_type,
      discount_value: parseFloat(body.discount_value),
      minimum_amount: body.minimum_amount ? parseFloat(body.minimum_amount) : null,
      maximum_discount: body.maximum_discount ? parseFloat(body.maximum_discount) : null,
      usage_limit: body.usage_limit ? parseInt(body.usage_limit) : null,
      valid_from: validFrom.toISOString(),
      valid_until: validUntil.toISOString(),
      is_active: body.is_active !== undefined ? body.is_active : true,
      applicable_to: body.applicable_to || 'all',
      applicable_ids: body.applicable_ids || null,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('coupons')
      .update(updateData)
      .eq('coupon_id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Coupon not found' },
          { status: 404 }
        )
      }
      console.error('Error updating coupon:', error)
      return NextResponse.json(
        { error: 'Failed to update coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Coupon updated successfully',
      coupon: data
    })
  } catch (error) {
    console.error('Error in PUT /api/coupons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/coupons/[id] - Delete a specific coupon
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { error } = await supabase
      .from('coupons')
      .delete()
      .eq('coupon_id', params.id)

    if (error) {
      console.error('Error deleting coupon:', error)
      return NextResponse.json(
        { error: 'Failed to delete coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Coupon deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/coupons/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
