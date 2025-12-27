import { NextRequest, NextResponse } from 'next/server'
import ImageKit from 'imagekit'

export async function GET() {
  try {
    console.log('🔍 ImageKit Debug API called')

    // Check environment variables
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

    console.log('Environment Variables:')
    console.log('- Public Key:', publicKey?.substring(0, 20) + '...')
    console.log('- Private Key exists:', !!privateKey)
    console.log('- Private Key length:', privateKey?.length)
    console.log('- URL Endpoint:', urlEndpoint)

    if (!publicKey || !privateKey || !urlEndpoint) {
      return NextResponse.json({
        success: false,
        error: 'Missing environment variables',
        details: {
          hasPublicKey: !!publicKey,
          hasPrivateKey: !!privateKey,
          hasUrlEndpoint: !!urlEndpoint
        }
      }, { status: 400 })
    }

    // Try to initialize ImageKit
    console.log('🔧 Initializing ImageKit...')
    const imagekit = new ImageKit({
      publicKey,
      privateKey,
      urlEndpoint,
    })

    console.log('✅ ImageKit initialized successfully')

    // Try to generate upload authentication parameters using Node.js SDK
    console.log('🔐 Generating upload authentication parameters...')
    const authParams = imagekit.getAuthenticationParameters()

    console.log('✅ Authentication parameters generated:')
    console.log('- Token:', authParams.token?.substring(0, 20) + '...')
    console.log('- Signature:', authParams.signature?.substring(0, 20) + '...')
    console.log('- Expire:', authParams.expire)
    console.log('- Token length:', authParams.token?.length)
    console.log('- Signature length:', authParams.signature?.length)

    // Test if we can make a simple API call to ImageKit
    console.log('🌐 Testing ImageKit API connection...')
    try {
      // Try to list files (this will test if our credentials work)
      const listResult = await imagekit.listFiles({
        limit: 1
      })
      console.log('✅ ImageKit API connection successful, files found:', listResult.length)
    } catch (apiError) {
      console.error('❌ ImageKit API connection failed:', apiError)
      return NextResponse.json({
        success: false,
        error: 'ImageKit API connection failed',
        details: apiError instanceof Error ? apiError.message : 'Unknown API error',
        authParams: {
          token: authParams.token?.substring(0, 20) + '...',
          signature: authParams.signature?.substring(0, 20) + '...',
          expire: authParams.expire,
          tokenLength: authParams.token?.length,
          signatureLength: authParams.signature?.length
        }
      }, { status: 500 })
    }

    return NextResponse.json({
      success: true,
      message: 'ImageKit debug successful',
      environment: {
        publicKey: publicKey?.substring(0, 20) + '...',
        hasPrivateKey: !!privateKey,
        privateKeyLength: privateKey?.length,
        urlEndpoint
      },
      authParams: {
        token: authParams.token?.substring(0, 20) + '...',
        signature: authParams.signature?.substring(0, 20) + '...',
        expire: authParams.expire,
        tokenLength: authParams.token?.length,
        signatureLength: authParams.signature?.length
      }
    })

  } catch (error) {
    console.error('❌ ImageKit debug error:', error)
    return NextResponse.json({
      success: false,
      error: 'ImageKit debug failed',
      details: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined
    }, { status: 500 })
  }
}
