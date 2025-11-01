import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { userId } = body

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'User ID is required' },
        { status: 400 }
      )
    }

    console.log('📊 Fetching vendor statistics for user:', userId)

    // First, get the admin user data
    const { data: adminData, error: adminError } = await supabase
      .from('admins')
      .select('id, email, type')
      .eq('id', userId)
      .eq('type', 'vendor')
      .single()

    if (adminError || !adminData) {
      console.error('❌ Error fetching admin data:', adminError)
      return NextResponse.json(
        { success: false, error: 'Vendor admin not found' },
        { status: 404 }
      )
    }

    console.log('✅ Found admin user:', adminData.email)

    // Now get the vendor record by matching email
    const { data: vendorData, error: vendorError } = await supabase
      .from('vendors')
      .select('vendor_id')
      .eq('email', adminData.email)
      .single()

    if (vendorError || !vendorData) {
      console.error('❌ Error fetching vendor data:', vendorError)
      return NextResponse.json(
        { success: false, error: 'Vendor profile not found' },
        { status: 404 }
      )
    }

    const vendorId = vendorData.vendor_id
    console.log('✅ Found vendor_id:', vendorId)

    // Fetch total products for this vendor
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)

    if (productsError) {
      console.error('❌ Error fetching products count:', productsError)
    } else {
      console.log('✅ Products count:', totalProducts)
    }

    // Fetch active products (is_active = true)
    const { count: activeProducts, error: activeProductsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('vendor_id', vendorId)
      .eq('is_active', true)

    if (activeProductsError) {
      console.error('❌ Error fetching active products:', activeProductsError)
    } else {
      console.log('✅ Active products count:', activeProducts)
    }

    // Fetch all orders containing vendor's products
    const { data: vendorProducts, error: vendorProductsError } = await supabase
      .from('products')
      .select('product_id')
      .eq('vendor_id', vendorId)

    let totalOrders = 0
    let activeRentals = 0

    if (vendorProducts && vendorProducts.length > 0) {
      const productIds = vendorProducts.map(p => p.product_id)

      // Get order items for vendor's products
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('order_id')
        .in('product_id', productIds)

      if (!orderItemsError && orderItems) {
        // Get unique order IDs
        const uniqueOrderIds = [...new Set(orderItems.map(item => item.order_id))]
        totalOrders = uniqueOrderIds.length
        console.log('✅ Total orders:', totalOrders)

        // Get active rentals (orders with status: confirmed, delivered, active)
        const { data: activeOrders, error: activeOrdersError } = await supabase
          .from('orders')
          .select('order_id')
          .in('order_id', uniqueOrderIds)
          .in('status', ['confirmed', 'delivered', 'active'])

        if (!activeOrdersError && activeOrders) {
          activeRentals = activeOrders.length
          console.log('✅ Active rentals:', activeRentals)
        }
      }
    }

    // Fetch total revenue from vendor_earnings table
    const { data: earnings, error: earningsError } = await supabase
      .from('vendor_earnings')
      .select('net_amount')
      .eq('vendor_id', vendorId)

    let totalRevenue = 0
    if (!earningsError && earnings) {
      totalRevenue = earnings.reduce((sum, earning) => sum + Number(earning.net_amount), 0)
      console.log('✅ Total revenue:', totalRevenue)
    } else if (earningsError) {
      console.error('❌ Error fetching earnings:', earningsError)
    }

    // Calculate this month's revenue
    const currentMonth = new Date().toISOString().slice(0, 7) // YYYY-MM
    const { data: monthEarnings, error: monthEarningsError } = await supabase
      .from('vendor_earnings')
      .select('net_amount, created_at')
      .eq('vendor_id', vendorId)
      .gte('created_at', `${currentMonth}-01`)

    let monthlyRevenue = 0
    if (!monthEarningsError && monthEarnings) {
      monthlyRevenue = monthEarnings.reduce((sum, earning) => sum + Number(earning.net_amount), 0)
      console.log('✅ Monthly revenue:', monthlyRevenue)
    }

    const stats = {
      totalProducts: totalProducts || 0,
      activeProducts: activeProducts || 0,
      totalOrders: totalOrders,
      activeRentals: activeRentals,
      totalRevenue: totalRevenue,
      monthlyRevenue: monthlyRevenue,
    }

    console.log('📊 Final vendor stats:', stats)

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('💥 Vendor stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch vendor statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

