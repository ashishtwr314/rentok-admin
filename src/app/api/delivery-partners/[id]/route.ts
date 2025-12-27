import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@supabase/supabase-js'
import bcrypt from 'bcryptjs'

// Validate environment variables
if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
  console.error('❌ Missing NEXT_PUBLIC_SUPABASE_URL')
}
if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY')
}

// Create a Supabase client with service role for admin operations
const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)

interface RouteParams {
  params: {
    id: string
  }
}

// PATCH: Update delivery partner (including email and password in auth)
export async function PATCH(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params
    const body = await request.json()
    const { password, oldEmail, ...partnerUpdateData } = body
    const email = body.email // Keep email for auth updates

    console.log('📝 Updating delivery partner:', id)
    console.log('   Email:', email)
    console.log('   Old Email:', oldEmail)
    console.log('   Email change:', oldEmail !== email ? 'Yes' : 'No')
    console.log('   Password change:', password ? 'Yes' : 'No')
    console.log('   Partner data to update:', partnerUpdateData)

    // Update delivery_partners table (includes email in partnerUpdateData)
    const { error: partnerError } = await supabaseAdmin
      .from('delivery_partners')
      .update(partnerUpdateData)
      .eq('delivery_partner_id', id)

    if (partnerError) {
      console.error('❌ Error updating delivery partner table:', partnerError)
      throw partnerError
    }
    
    console.log('✅ Delivery partner table updated')

    // Get the admin record to find auth_user_id
    const { data: adminData, error: adminFetchError } = await supabaseAdmin
      .from('admins')
      .select('auth_user_id, admin_id')
      .eq('email', oldEmail || email)
      .eq('type', 'delivery_partner')
      .single()

    if (adminFetchError) {
      console.error('Error fetching admin record:', adminFetchError)
    }

    // Update email in admins table if changed
    if (email && oldEmail && email !== oldEmail) {
      console.log('📧 Updating email in admins table...')
      const { error: emailUpdateError } = await supabaseAdmin
        .from('admins')
        .update({ email })
        .eq('email', oldEmail)
        .eq('type', 'delivery_partner')

      if (emailUpdateError) {
        console.error('Error updating admin email:', emailUpdateError)
        throw new Error('Failed to update login email')
      }

      // Update email in Supabase Auth if auth_user_id exists
      if (adminData?.auth_user_id) {
        console.log('🔐 Updating email in Supabase Auth...')
        const { error: authEmailError } = await supabaseAdmin.auth.admin.updateUserById(
          adminData.auth_user_id,
          { email }
        )

        if (authEmailError) {
          console.error('❌ Error updating auth user email:', authEmailError)
          throw new Error('Failed to update authentication email')
        } else {
          console.log('✅ Auth email updated successfully')
        }
      }
    }

    // Update password if provided
    if (password) {
      console.log('🔑 Updating password...')
      const hashedPassword = await bcrypt.hash(password, 12)
      
      // Update in admins table
      const { error: passwordError } = await supabaseAdmin
        .from('admins')
        .update({ password: hashedPassword })
        .eq('email', email || oldEmail)
        .eq('type', 'delivery_partner')

      if (passwordError) {
        console.error('Error updating admin password:', passwordError)
        throw new Error('Failed to update password')
      }

      // Update password in Supabase Auth if auth_user_id exists
      if (adminData?.auth_user_id) {
        console.log('🔐 Updating password in Supabase Auth...')
        const { error: authPasswordError } = await supabaseAdmin.auth.admin.updateUserById(
          adminData.auth_user_id,
          { password }
        )

        if (authPasswordError) {
          console.error('❌ Error updating auth user password:', authPasswordError)
          throw new Error('Failed to update authentication password')
        } else {
          console.log('✅ Auth password updated successfully')
        }
      }
    }

    console.log('✅ Delivery partner updated successfully')
    return NextResponse.json(
      { message: 'Delivery partner updated successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Unexpected error updating delivery partner')
    console.error('   Error message:', error?.message)
    console.error('   Error code:', error?.code)
    console.error('   Full error:', error)
    
    // Return detailed error for debugging
    return NextResponse.json(
      { 
        error: error?.message || 'An unexpected error occurred',
        details: error?.code || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

// DELETE: Delete delivery partner (from all tables including auth)
export async function DELETE(
  request: NextRequest,
  { params }: RouteParams
) {
  try {
    const { id } = params

    console.log('🗑️  Deleting delivery partner:', id)

    // First, get the delivery partner email to find admin record
    const { data: partnerData, error: fetchError } = await supabaseAdmin
      .from('delivery_partners')
      .select('email')
      .eq('delivery_partner_id', id)
      .single()

    if (fetchError) {
      console.error('❌ Error fetching delivery partner:', fetchError)
      throw new Error('Delivery partner not found')
    }

    console.log('   Partner email:', partnerData.email)

    // Get the admin record to find auth_user_id
    const { data: adminData, error: adminFetchError } = await supabaseAdmin
      .from('admins')
      .select('auth_user_id, admin_id')
      .eq('email', partnerData.email)
      .eq('type', 'delivery_partner')
      .single()

    if (adminFetchError) {
      console.log('⚠️  Admin record not found (will continue with deletion)')
    }

    // Delete from auth.users if auth_user_id exists
    if (adminData?.auth_user_id) {
      console.log('🔐 Deleting from Supabase Auth...')
      try {
        const { error: authDeleteError } = await supabaseAdmin.auth.admin.deleteUser(
          adminData.auth_user_id
        )

        if (authDeleteError) {
          console.error('❌ Error deleting auth user:', authDeleteError)
          // Don't throw - continue with other deletions
        } else {
          console.log('✅ Auth user deleted')
        }
      } catch (authError) {
        console.error('❌ Exception deleting auth user:', authError)
        // Don't throw - continue with other deletions
      }
    }

    // Delete from admins table
    console.log('📋 Deleting from admins table...')
    const { error: adminDeleteError } = await supabaseAdmin
      .from('admins')
      .delete()
      .eq('email', partnerData.email)
      .eq('type', 'delivery_partner')

    if (adminDeleteError) {
      console.error('❌ Error deleting from admins:', adminDeleteError)
      // Don't throw - continue with delivery_partners deletion
    } else {
      console.log('✅ Admin record deleted')
    }

    // Delete from delivery_partners table
    console.log('🚚 Deleting from delivery_partners table...')
    const { error: partnerDeleteError } = await supabaseAdmin
      .from('delivery_partners')
      .delete()
      .eq('delivery_partner_id', id)

    if (partnerDeleteError) {
      console.error('❌ Error deleting delivery partner:', partnerDeleteError)
      throw partnerDeleteError
    }

    console.log('✅ Delivery partner deleted successfully from all tables')
    return NextResponse.json(
      { message: 'Delivery partner deleted successfully' },
      { status: 200 }
    )
  } catch (error: any) {
    console.error('❌ Unexpected error deleting delivery partner')
    console.error('   Error message:', error?.message)
    console.error('   Error code:', error?.code)
    console.error('   Full error:', error)
    
    return NextResponse.json(
      { 
        error: error?.message || 'An unexpected error occurred',
        details: error?.code || 'Unknown error',
        stack: process.env.NODE_ENV === 'development' ? error?.stack : undefined
      },
      { status: 500 }
    )
  }
}

