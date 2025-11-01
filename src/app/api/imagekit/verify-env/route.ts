import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  try {
    const publicKey = process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY
    const privateKey = process.env.IMAGEKIT_PRIVATE_KEY
    const urlEndpoint = process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT

    console.log('🔍 Environment Variable Verification:')
    console.log('NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY:', publicKey ? `${publicKey.substring(0, 20)}...` : 'MISSING')
    console.log('IMAGEKIT_PRIVATE_KEY:', privateKey ? `${privateKey.substring(0, 20)}...` : 'MISSING')
    console.log('NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT:', urlEndpoint || 'MISSING')

    // Check if keys look correct (ImageKit keys have specific patterns)
    const publicKeyValid = publicKey && publicKey.startsWith('public_')
    const privateKeyValid = privateKey && privateKey.startsWith('private_')
    const urlEndpointValid = urlEndpoint && urlEndpoint.includes('imagekit.io')

    console.log('Key validation:')
    console.log('- Public key format:', publicKeyValid ? '✅ Valid' : '❌ Invalid (should start with "public_")')
    console.log('- Private key format:', privateKeyValid ? '✅ Valid' : '❌ Invalid (should start with "private_")')
    console.log('- URL endpoint format:', urlEndpointValid ? '✅ Valid' : '❌ Invalid (should contain "imagekit.io")')

    return NextResponse.json({
      success: true,
      environment: {
        hasPublicKey: !!publicKey,
        hasPrivateKey: !!privateKey,
        hasUrlEndpoint: !!urlEndpoint,
        publicKeyFormat: publicKeyValid,
        privateKeyFormat: privateKeyValid,
        urlEndpointFormat: urlEndpointValid,
        publicKeyPreview: publicKey ? `${publicKey.substring(0, 20)}...` : null,
        privateKeyPreview: privateKey ? `${privateKey.substring(0, 20)}...` : null,
        urlEndpoint: urlEndpoint
      },
      allValid: publicKeyValid && privateKeyValid && urlEndpointValid
    })

  } catch (error) {
    console.error('❌ Environment verification error:', error)
    return NextResponse.json({
      success: false,
      error: 'Environment verification failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

