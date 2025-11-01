import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// GET: Fetch all orders or orders filtered by vendor_id
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendor_id')

    let query = supabase
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
      .order('created_at', { ascending: false })

    // If vendor_id is provided, filter orders by products that belong to that vendor
    if (vendorId) {
      // This is a bit complex - we need to filter orders that have at least one order_item
      // with a product belonging to the vendor
      query = query.filter('order_items.products.vendor_id', 'eq', vendorId)
    }

    const { data, error } = await query

    if (error) {
      console.error('Error fetching orders:', error)
      return NextResponse.json(
        { error: 'Failed to fetch orders', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders: data || [] }, { status: 200 })
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

// POST: Create a new order (for future use)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const { error } = await supabase
      .from('orders')
      .insert([body])

    if (error) {
      console.error('Error creating order:', error)
      return NextResponse.json(
        { error: 'Failed to create order', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { message: 'Order created successfully' },
      { status: 201 }
    )
  } catch (error) {
    console.error('Unexpected error:', error)
    return NextResponse.json(
      { error: 'An unexpected error occurred' },
      { status: 500 }
    )
  }
}

