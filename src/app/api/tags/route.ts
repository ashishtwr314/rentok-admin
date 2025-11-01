import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '../../../lib/supabase'

// GET /api/tags - Fetch all tags
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '10')
    const search = searchParams.get('search') || ''
    const status = searchParams.get('status') || ''
    const sortBy = searchParams.get('sortBy') || 'sort_order'
    const activeOnly = searchParams.get('activeOnly') === 'true'

    let query = supabase
      .from('tags')
      .select('*')

    // Apply search filter
    if (search) {
      query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,slug.ilike.%${search}%`)
    }

    // Apply status filter
    if (status === 'active') {
      query = query.eq('is_active', true)
    } else if (status === 'inactive') {
      query = query.eq('is_active', false)
    }

    // Apply active only filter (for public API)
    if (activeOnly) {
      query = query.eq('is_active', true)
    }

    // Apply sorting
    switch (sortBy) {
      case 'name':
        query = query.order('name', { ascending: true })
        break
      case 'usage_count':
        query = query.order('usage_count', { ascending: false })
        break
      case 'created_at':
        query = query.order('created_at', { ascending: false })
        break
      case 'sort_order':
      default:
        query = query.order('sort_order', { ascending: true })
        break
    }

    // Apply pagination
    const from = (page - 1) * limit
    const to = from + limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) {
      console.error('Error fetching tags:', error)
      return NextResponse.json(
        { error: 'Failed to fetch tags' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      tags: data,
      pagination: {
        page,
        limit,
        total: count || 0,
        pages: Math.ceil((count || 0) / limit)
      }
    })
  } catch (error) {
    console.error('Error in GET /api/tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

// POST /api/tags - Create a new tag
export async function POST(request: NextRequest) {
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

    // Check if tag name already exists
    const { data: existingTag } = await supabase
      .from('tags')
      .select('tag_id')
      .eq('name', body.name.trim())
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

    // Check if slug already exists
    const { data: existingSlug } = await supabase
      .from('tags')
      .select('tag_id')
      .eq('slug', slug)
      .single()

    if (existingSlug) {
      return NextResponse.json(
        { error: 'A tag with this name already exists (slug conflict)' },
        { status: 409 }
      )
    }

    // Prepare tag data
    const tagData = {
      name: body.name.trim(),
      slug: slug,
      description: body.description?.trim() || null,
      image_url: body.image_url || null,
      color: body.color || '#9A2143',
      is_active: body.is_active !== undefined ? body.is_active : true,
      sort_order: body.sort_order || 0,
      usage_count: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('tags')
      .insert([tagData])
      .select()
      .single()

    if (error) {
      console.error('Error creating tag:', error)
      return NextResponse.json(
        { error: 'Failed to create tag' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      message: 'Tag created successfully',
      tag: data
    }, { status: 201 })
  } catch (error) {
    console.error('Error in POST /api/tags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
