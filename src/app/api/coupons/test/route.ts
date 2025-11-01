import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/coupons/test - Test coupon table and create sample data
export async function GET(request: NextRequest) {
  try {
    // Test if coupons table exists by trying to select from it
    const { data, error } = await supabase
      .from('coupons')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Coupons table does not exist or has issues',
        details: error.message,
        suggestion: 'Please run the migration: migrations/create-coupons-table.sql'
      }, { status: 500 })
    }

    // Get actual count
    const { count, error: countError } = await supabase
      .from('coupons')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({
        success: false,
        error: 'Error counting coupons',
        details: countError.message
      }, { status: 500 })
    }

    // If no coupons exist, create some sample data
    if (count === 0) {
      const sampleCoupons = [
        {
          code: 'WELCOME20',
          title: 'Welcome Discount',
          description: '20% off for new customers',
          discount_type: 'percentage',
          discount_value: 20,
          minimum_amount: 500,
          maximum_discount: 1000,
          usage_limit: 100,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(), // 30 days from now
          is_active: true,
          applicable_to: 'all',
          applicable_ids: null,
          used_count: 0
        },
        {
          code: 'SAVE50',
          title: 'Fixed Amount Discount',
          description: '₹50 off on orders above ₹1000',
          discount_type: 'fixed',
          discount_value: 50,
          minimum_amount: 1000,
          maximum_discount: null,
          usage_limit: 50,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days from now
          is_active: true,
          applicable_to: 'all',
          applicable_ids: null,
          used_count: 5
        }
      ]

      const { data: insertedData, error: insertError } = await supabase
        .from('coupons')
        .insert(sampleCoupons)
        .select()

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: 'Error creating sample coupons',
          details: insertError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Coupons table exists and sample data created',
        couponsCount: insertedData?.length || 0,
        sampleCoupons: insertedData
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Coupons table exists',
      couponsCount: count,
      note: 'Table already has data'
    })

  } catch (error) {
    console.error('Error in GET /api/coupons/test:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
