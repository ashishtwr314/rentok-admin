import { DataProvider } from 'react-admin'
import { supabase } from './supabase'

// Mock data for development
const mockData: Record<string, any[]> = {
  users: [
    { id: 1, name: 'John Doe', phone: '+919876543210', email: 'john@example.com', created_at: '2024-01-15' },
    { id: 2, name: 'Jane Smith', phone: '+919876543211', email: 'jane@example.com', created_at: '2024-01-16' },
    { id: 3, name: 'Bob Johnson', phone: '+919876543212', email: 'bob@example.com', created_at: '2024-01-17' },
  ],
  properties: [
    { id: 1, title: '2BHK Apartment', location: 'Mumbai', price: 25000, description: 'Spacious apartment in prime location', created_at: '2024-01-15' },
    { id: 2, title: '3BHK Villa', location: 'Pune', price: 45000, description: 'Luxury villa with garden', created_at: '2024-01-16' },
    { id: 3, title: '1BHK Studio', location: 'Bangalore', price: 15000, description: 'Modern studio apartment', created_at: '2024-01-17' },
  ],
  bookings: [
    { id: 1, property_id: 1, user_id: 1, start_date: '2024-02-01', end_date: '2024-02-28', status: 'confirmed', created_at: '2024-01-20' },
    { id: 2, property_id: 2, user_id: 2, start_date: '2024-03-01', end_date: '2024-03-31', status: 'pending', created_at: '2024-01-21' },
    { id: 3, property_id: 3, user_id: 3, start_date: '2024-04-01', end_date: '2024-04-30', status: 'confirmed', created_at: '2024-01-22' },
  ],
  products: [
    {
      product_id: '1',
      category_id: 'cat1',
      vendor_id: 'vendor1',
      title: 'Designer Wedding Lehenga',
      description: 'Beautiful red and gold designer lehenga perfect for weddings',
      price_per_day: 2500,
      original_price: 3000,
      discount_percentage: 17,
      rating: 4.8,
      review_count: 45,
      available_sizes: ['S', 'M', 'L', 'XL'],
      tags: ['wedding', 'lehenga', 'designer', 'red'],
      images: ['/api/placeholder/300/400', '/api/placeholder/300/401'],
      stock_quantity: 3,
      is_featured: true,
      is_active: true,
      created_by_admin: false,
      created_at: '2024-01-15',
      updated_at: '2024-01-15',
      category_name: 'Wedding Wear',
      vendor_name: 'Bridal Collections'
    },
    {
      product_id: '2',
      category_id: 'cat2',
      vendor_id: 'vendor2',
      title: 'Men\'s Formal Suit',
      description: 'Premium black formal suit for business meetings and events',
      price_per_day: 800,
      original_price: 1000,
      discount_percentage: 20,
      rating: 4.5,
      review_count: 32,
      available_sizes: ['M', 'L', 'XL', 'XXL'],
      tags: ['formal', 'suit', 'business', 'black'],
      images: ['/api/placeholder/300/402'],
      stock_quantity: 5,
      is_featured: false,
      is_active: true,
      created_by_admin: false,
      created_at: '2024-01-16',
      updated_at: '2024-01-16',
      category_name: 'Formal Wear',
      vendor_name: 'Gentleman\'s Choice'
    },
    {
      product_id: '3',
      category_id: 'cat3',
      vendor_id: null,
      title: 'Party Dress Collection',
      description: 'Trendy party dress available in multiple colors',
      price_per_day: 600,
      original_price: null,
      discount_percentage: 0,
      rating: 4.2,
      review_count: 18,
      available_sizes: ['XS', 'S', 'M', 'L'],
      tags: ['party', 'dress', 'trendy', 'colorful'],
      images: ['/api/placeholder/300/403', '/api/placeholder/300/404', '/api/placeholder/300/405'],
      stock_quantity: 8,
      is_featured: true,
      is_active: true,
      created_by_admin: true,
      created_at: '2024-01-17',
      updated_at: '2024-01-17',
      category_name: 'Party Wear',
      vendor_name: null
    }
  ],
  categories: [
    { category_id: 'cat1', name: 'Wedding Wear', is_active: true },
    { category_id: 'cat2', name: 'Formal Wear', is_active: true },
    { category_id: 'cat3', name: 'Party Wear', is_active: true }
  ],
  vendors: [
    { vendor_id: 'vendor1', name: 'Bridal Collections', is_active: true },
    { vendor_id: 'vendor2', name: 'Gentleman\'s Choice', is_active: true }
  ]
}

export const dataProvider: DataProvider = {
  getList: async (resource, params) => {
    // Development mode - use mock data
    if (process.env.NODE_ENV === 'development') {
      const { page, perPage } = params.pagination || { page: 1, perPage: 10 }
      const data = mockData[resource] || []
      
      const from = (page - 1) * perPage
      const to = from + perPage
      
      return {
        data: data.slice(from, to),
        total: data.length,
      }
    }
    
    // Production mode - use Supabase
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 }
    const { field, order } = params.sort || { field: 'created_at', order: 'DESC' }
    
    let query = supabase
      .from(resource)
      .select('*', { count: 'exact' })
    
    if (field) {
      query = query.order(field, { ascending: order === 'ASC' })
    }
    
    if (params.filter) {
      Object.keys(params.filter).forEach(key => {
        query = query.eq(key, params.filter[key])
      })
    }
    
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return {
      data: data || [],
      total: count || 0,
    }
  },

  getOne: async (resource, params) => {
    // Handle different primary key names for different tables
    let primaryKey = 'id'
    if (resource === 'vendors') primaryKey = 'vendor_id'
    if (resource === 'products') primaryKey = 'product_id'
    if (resource === 'categories') primaryKey = 'category_id'
    if (resource === 'orders') primaryKey = 'order_id'
    if (resource === 'profiles') primaryKey = 'user_id'
    
    const { data, error } = await supabase
      .from(resource)
      .select('*')
      .eq(primaryKey, params.id)
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data }
  },

  getMany: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .select('*')
      .in('id', params.ids)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data: data || [] }
  },

  getManyReference: async (resource, params) => {
    const { page, perPage } = params.pagination || { page: 1, perPage: 10 }
    const { field, order } = params.sort || { field: 'created_at', order: 'DESC' }
    
    let query = supabase
      .from(resource)
      .select('*', { count: 'exact' })
      .eq(params.target, params.id)
    
    if (field) {
      query = query.order(field, { ascending: order === 'ASC' })
    }
    
    const from = (page - 1) * perPage
    const to = from + perPage - 1
    
    const { data, error, count } = await query.range(from, to)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return {
      data: data || [],
      total: count || 0,
    }
  },

  create: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .insert(params.data)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data }
  },

  update: async (resource, params) => {
    // Handle different primary key names for different tables
    let primaryKey = 'id'
    if (resource === 'vendors') primaryKey = 'vendor_id'
    if (resource === 'products') primaryKey = 'product_id'
    if (resource === 'categories') primaryKey = 'category_id'
    if (resource === 'orders') primaryKey = 'order_id'
    if (resource === 'profiles') primaryKey = 'user_id'
    
    const { data, error } = await supabase
      .from(resource)
      .update(params.data)
      .eq(primaryKey, params.id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data }
  },

  updateMany: async (resource, params) => {
    const { data, error } = await supabase
      .from(resource)
      .update(params.data)
      .in('id', params.ids)
      .select()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data: params.ids }
  },

  delete: async (resource, params) => {
    // Handle different primary key names for different tables
    let primaryKey = 'id'
    if (resource === 'vendors') primaryKey = 'vendor_id'
    if (resource === 'products') primaryKey = 'product_id'
    if (resource === 'categories') primaryKey = 'category_id'
    if (resource === 'orders') primaryKey = 'order_id'
    if (resource === 'profiles') primaryKey = 'user_id'
    
    const { data, error } = await supabase
      .from(resource)
      .delete()
      .eq(primaryKey, params.id)
      .select()
      .single()
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data }
  },

  deleteMany: async (resource, params) => {
    const { error } = await supabase
      .from(resource)
      .delete()
      .in('id', params.ids)
    
    if (error) {
      throw new Error(error.message)
    }
    
    return { data: params.ids }
  },
}
