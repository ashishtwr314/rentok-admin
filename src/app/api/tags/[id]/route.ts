import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../../lib/supabase'

// GET /api/tags/[id] - Get a specific tag
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { data, error } = await supabase
      .from('tags')
      .select('*')
      .eq('tag_id', params.id)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        )
      }
      console.error('Error fetching tag:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({ tag: data })
  } catch (error) {
    console.error('Error in GET /api/tags/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// PUT /api/tags/[id] - Update a specific tag
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    
    // Validate required fields
    if (!body.name || !body.name.trim()) {
      return NextResponse.json(
        { error: 'Tag name is required' },
        { status: 400 }
      )
    }

    // Validate name length
    if (body.name.length < 2 || body.name.length > 100) {
      return NextResponse.json(
        { error: 'Tag name must be between 2 and 100 characters' },
        { status: 400 }
      )
    }

    // Validate color format
    if (body.color && !body.color.match(/^#[0-9A-Fa-f]{6}$/)) {
      return NextResponse.json(
        { error: 'Invalid color format. Use hex format like #9A2143' },
        { status: 400 }
      )
    }

    // Validate sort order
    if (body.sort_order && body.sort_order < 0) {
      return NextResponse.json(
        { error: 'Sort order cannot be negative' },
        { status: 400 }
      )
    }

    // Check if tag name already exists (excluding current tag)
    const { data: existingTag } = await supabase
      .from('tags')
      .select('tag_id')
      .eq('name', body.name.trim())
      .neq('tag_id', params.id)
      .single()

    if (existingTag) {
      return NextResponse.json(
        { error: 'Tag name already exists' },
        { status: 409 }
      )
    }

    // Generate slug from name
    const generateSlug = (name: string) => {
      return name
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .trim()
    }

    const slug = generateSlug(body.name)

    // Check if slug already exists (excluding current tag)
    const { data: existingSlug } = await supabase
      .from('tags')
      .select('tag_id')
      .eq('slug', slug)
      .neq('tag_id', params.id)
      .single()

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A tag with this name already exists (slug conflict)' },
        { status: 409 }
      )
    }

    // Prepare update data
    const updateData = {
      name: body.name.trim(),
      slug: slug,
      description: body.description?.trim() || null,
      image_url: body.image_url || null,
      color: body.color || '#9A2143',
      is_active: body.is_active !== undefined ? body.is_active : true,
      sort_order: body.sort_order || 0,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tags')
      .update(updateData)
      .eq('tag_id', params.id)
      .select()
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        return NextResponse.json(
          { error: 'Tag not found' },
          { status: 404 }
        )
      }
      console.error('Error updating tag:', error)
      return NextResponse.json(
        { error: 'Failed to update tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tag updated successfully',
      tag: data
    })
  } catch (error) {
    console.error('Error in PUT /api/tags/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// DELETE /api/tags/[id] - Delete a specific tag
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // Check if tag is being used by any products
    const { data: productsUsingTag, error: checkError } = await supabase
      .from('products')
      .select('product_id, title')
      .contains('tags', [params.id])
      .limit(1)

    if (checkError) {
      console.error('Error checking tag usage:', checkError)
      return NextResponse.json(
        { error: 'Failed to check tag usage' },
        { status: 500 }
      )
    }

    if (productsUsingTag && productsUsingTag.length > 0) {
      return NextResponse.json(
        { 
          error: 'Cannot delete tag. It is currently being used by products.',
          products: productsUsingTag
        },
        { status: 409 }
      )
    }

    const { error } = await supabase
      .from('tags')
      .delete()
      .eq('tag_id', params.id)

    if (error) {
      console.error('Error deleting tag:', error)
      return NextResponse.json(
        { error: 'Failed to delete tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tag deleted successfully'
    })
  } catch (error) {
    console.error('Error in DELETE /api/tags/[id]:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
