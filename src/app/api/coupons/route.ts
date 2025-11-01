import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// GET /api/coupons - Fetch all coupons
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const type = searchParams.get('type') || ''

    let query = supabase
      .from('coupons')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply search filter
    if (search) {
      query = query.or(`code.ilike.%${search}%,title.ilike.%${search}%,description.ilike.%${search}%`)
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    } else if (status === 'expired') {
      query = query.lt('valid_until', new Date().toISOString())
    }

    // Apply type filter
    if (type) {
      query = query.eq('discount_type', type)
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching coupons:', error)
      return NextResponse.json(
        { error: 'Failed to fetch coupons' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      coupons: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/coupons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/coupons - Create a new coupon
export async function POST(request: NextRequest) {
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

    // Check if coupon code already exists
    const { data: existingCoupon } = await supabase
      .from('coupons')
      .select('coupon_id')
      .eq('code', body.code)
      .single()

    if (existingCoupon) {
      return NextResponse.json(
        { error: 'Coupon code already exists' },
        { status: 409 }
      )
    }

    // Prepare coupon data
    const couponData = {
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
      used_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('coupons')
      .insert([couponData])
      .select()
      .single()

    if (error) {
      console.error('Error creating coupon:', error)
      return NextResponse.json(
        { error: 'Failed to create coupon' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Coupon created successfully',
      coupon: data
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/coupons:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
