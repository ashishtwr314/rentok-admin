import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/tags/test - Test tags table and create sample data
export async function GET(request: NextRequest) {
  try {
    // Test if tags table exists by trying to select from it
    const { data, error } = await supabase
      .from('tags')
      .select('count')
      .limit(1)

    if (error) {
      return NextResponse.json({
        success: false,
        error: 'Tags table does not exist or has issues',
        details: error.message,
        suggestion: 'Please run the migration: migrations/create-tags-table.sql'
      }, { status: 500 })
    }

    // Get actual count
    const { count, error: countError } = await supabase
      .from('tags')
      .select('*', { count: 'exact', head: true })

    if (countError) {
      return NextResponse.json({
        success: false,
        error: 'Error counting tags',
        details: countError.message
      }, { status: 500 })
    }

    // If no tags exist, create some sample data
    if (count === 0) {
      const sampleTags = [
        {
          name: 'New Arrival',
          description: 'Recently added products',
          color: '#4CAF50',
          sort_order: 1,
          is_active: true
        },
        {
          name: 'Popular',
          description: 'Most popular items',
          color: '#FF9800',
          sort_order: 2,
          is_active: true
        },
        {
          name: 'Trending',
          description: 'Currently trending products',
          color: '#E91E63',
          sort_order: 3,
          is_active: true
        },
        {
          name: 'Limited Edition',
          description: 'Limited quantity available',
          color: '#9C27B0',
          sort_order: 4,
          is_active: true
        },
        {
          name: 'Premium',
          description: 'High-quality premium items',
          color: '#FFD700',
          sort_order: 5,
          is_active: true
        }
      ]

      const { data: insertedData, error: insertError } = await supabase
        .from('tags')
        .insert(sampleTags)
        .select()

      if (insertError) {
        return NextResponse.json({
          success: false,
          error: 'Error creating sample tags',
          details: insertError.message
        }, { status: 500 })
      }

      return NextResponse.json({
        success: true,
        message: 'Tags table exists and sample data created',
        tagsCount: insertedData?.length || 0,
        sampleTags: insertedData
      })
    }

    return NextResponse.json({
      success: true,
      message: 'Tags table exists',
      tagsCount: count,
      note: 'Table already has data'
    })

  } catch (error) {
    console.error('Error in GET /api/tags/test:', error)
    return NextResponse.json({
      success: false,
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
