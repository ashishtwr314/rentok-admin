import { NextRequest, NextResponse } from 'next/server'
import { getUploadAuthParams } from '@imagekit/next'

export async function GET() {
  try {
    console.log('Testing ImageKit authentication...')
    console.log('Public Key:', process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + '...')
    console.log('URL Endpoint:', process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT)
    console.log('Private Key exists:', !!process.env.IMAGEKIT_PRIVATE_KEY)

    // Test authentication by generating upload auth parameters using Next.js SDK
    const uploadAuthParams = getUploadAuthParams({
      publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
      privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
    })

    console.log('Upload authentication successful!')
    console.log('Upload auth params:', uploadAuthParams)

    return NextResponse.json({
      success: true,
      message: 'ImageKit upload authentication successful',
      authParams: uploadAuthParams,
      config: {
        publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + '...',
        urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
        hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY
      }
    })
  } catch (error) {
    console.error('ImageKit auth test error:', error)
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to authenticate with ImageKit',
        details: error instanceof Error ? error.message : 'Unknown error',
        config: {
          publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY?.substring(0, 10) + '...',
          urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT,
          hasPrivateKey: !!process.env.IMAGEKIT_PRIVATE_KEY
        }
      },
      { status: 500 }
    )
  }
}
