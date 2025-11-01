import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET() {
  try {
    console.log('📊 Fetching dashboard statistics...')

    // Fetch total vendors count
    const { count: totalVendors, error: vendorsError } = await supabase
      .from('vendors')
      .select('*', { count: 'exact', head: true })

    if (vendorsError) {
      console.error('❌ Error fetching vendors count:', vendorsError)
      console.error('Vendors error details:', JSON.stringify(vendorsError, null, 2))
    } else {
      console.log('✅ Vendors count:', totalVendors)
    }

    // Fetch total products count
    const { count: totalProducts, error: productsError } = await supabase
      .from('products')
      .select('*', { count: 'exact', head: true })

    if (productsError) {
      console.error('❌ Error fetching products count:', productsError)
      console.error('Products error details:', JSON.stringify(productsError, null, 2))
    } else {
      console.log('✅ Products count:', totalProducts)
    }

    // Fetch total categories count
    const { count: totalCategories, error: categoriesError } = await supabase
      .from('categories')
      .select('*', { count: 'exact', head: true })

    if (categoriesError) {
      console.error('❌ Error fetching categories count:', categoriesError)
      console.error('Categories error details:', JSON.stringify(categoriesError, null, 2))
    } else {
      console.log('✅ Categories count:', totalCategories)
    }

    // Fetch total app users count
    const { count: totalUsers, error: usersError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true })

    if (usersError) {
      console.error('❌ Error fetching users count:', usersError)
      console.error('Users error details:', JSON.stringify(usersError, null, 2))
    } else {
      console.log('✅ Users count:', totalUsers)
    }

    // Fetch rented products count (orders with confirmed/active status)
    // First, get all orders (regardless of status for now to see if there are any orders)
    const { data: allOrders, count: totalOrdersCount, error: allOrdersError } = await supabase
      .from('orders')
      .select('order_id, status', { count: 'exact' })

    if (allOrdersError) {
      console.error('❌ Error fetching all orders:', allOrdersError)
      console.error('Orders error details:', JSON.stringify(allOrdersError, null, 2))
    } else {
      console.log('✅ Total orders in database:', totalOrdersCount)
      console.log('Orders found:', allOrders?.length || 0)
    }

    // Now fetch rented products (active orders)
    const { data: rentedOrders, error: rentedError } = await supabase
      .from('orders')
      .select('order_id, status')
      .in('status', ['confirmed', 'delivered', 'active'])

    if (rentedError) {
      console.error('❌ Error fetching rented orders:', rentedError)
    } else {
      console.log('✅ Active rental orders:', rentedOrders?.length || 0)
    }

    // Count the total order items from active orders
    let rentedProductsCount = 0
    if (rentedOrders && rentedOrders.length > 0) {
      const orderIds = rentedOrders.map(order => order.order_id)
      const { count: rentedCount, error: rentedCountError } = await supabase
        .from('order_items')
        .select('*', { count: 'exact', head: true })
        .in('order_id', orderIds)

      if (rentedCountError) {
        console.error('❌ Error fetching rented products count:', rentedCountError)
      } else {
        rentedProductsCount = rentedCount || 0
        console.log('✅ Rented products count:', rentedProductsCount)
      }
    }

    const stats = {
      totalVendors: totalVendors || 0,
      totalProducts: totalProducts || 0,
      totalCategories: totalCategories || 0,
      totalUsers: totalUsers || 0,
      rentedProducts: rentedProductsCount,
    }

    console.log('📊 Final stats:', stats)

    // If all counts are 0 and there are errors, return the errors
    if (vendorsError || productsError || categoriesError || usersError) {
      return NextResponse.json({
        success: false,
        error: 'Database query errors detected',
        details: {
          vendorsError: vendorsError?.message,
          productsError: productsError?.message,
          categoriesError: categoriesError?.message,
          usersError: usersError?.message,
          hint: 'This might be due to Row Level Security (RLS) policies. Check Supabase dashboard for RLS settings.'
        },
        data: stats
      }, { status: 200 }) // Still return 200 but with error info
    }

    return NextResponse.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('💥 Dashboard stats error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch dashboard statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}

