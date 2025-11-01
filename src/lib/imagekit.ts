import { 
  upload, 
  ImageKitInvalidRequestError,
  ImageKitAbortError,
  ImageKitUploadNetworkError,
  ImageKitServerError 
} from '@imagekit/next'

// For server-side operations, we need the Node.js SDK
// The Next.js SDK is primarily for client-side operations
// We'll use fetch for server-side authentication
export const imagekitServerConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  privateKey: process.env.IMAGEKIT_PRIVATE_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
}

// Client-side ImageKit configuration
export const imagekitClientConfig = {
  publicKey: process.env.NEXT_PUBLIC_IMAGEKIT_PUBLIC_KEY!,
  urlEndpoint: process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT!,
}

// Helper function to upload file to ImageKit using official SDK
export const uploadToImageKit = async (
  file: File,
  folder: string = 'products',
  fileName?: string,
  onProgress?: (progress: { loaded: number; total: number }) => void
): Promise<string> => {
  try {
    // Generate unique filename if not provided
    const fileExt = file.name.split('.').pop()
    const uniqueFileName = fileName || `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`

    console.log('🚀 Starting ImageKit upload...')
    console.log('File:', file.name, 'Size:', file.size)
    console.log('Folder:', folder)
    console.log('Filename:', uniqueFileName)
    console.log('Public Key:', imagekitClientConfig.publicKey?.substring(0, 20) + '...')
    console.log('URL Endpoint:', imagekitClientConfig.urlEndpoint)

    // Get authentication parameters first
    console.log('🔐 Getting authentication parameters...')
    const authResponse = await fetch('/api/imagekit/auth')
    if (!authResponse.ok) {
      console.error('❌ Auth API failed:', authResponse.status, authResponse.statusText)
      throw new Error('Failed to get authentication parameters')
    }
    
    const authData = await authResponse.json()
    console.log('✅ Got auth data:', {
      token: authData.token?.substring(0, 10) + '...',
      expire: authData.expire,
      signature: authData.signature?.substring(0, 10) + '...'
    })

    // Upload using official ImageKit SDK with explicit auth parameters
    const uploadResponse = await upload({
      file,
      fileName: uniqueFileName,
      folder,
      publicKey: imagekitClientConfig.publicKey,
      urlEndpoint: imagekitClientConfig.urlEndpoint,
      // Pass authentication parameters directly
      token: authData.token,
      signature: authData.signature,
      expire: authData.expire,
      onProgress
    })

    console.log('✅ Upload successful:', uploadResponse.url)

    return uploadResponse.url

  } catch (error) {
    // Handle specific ImageKit errors
    if (error instanceof ImageKitInvalidRequestError) {
      console.error('Invalid request:', error.message)
      throw new Error(`Invalid upload request: ${error.message}`)
    } else if (error instanceof ImageKitAbortError) {
      console.error('Upload aborted:', error.message)
      throw new Error('Upload was aborted')
    } else if (error instanceof ImageKitUploadNetworkError) {
      console.error('Network error:', error.message)
      throw new Error('Network error during upload. Please check your connection.')
    } else if (error instanceof ImageKitServerError) {
      console.error('Server error:', error.message)
      throw new Error('Server error during upload. Please try again.')
    } else {
      console.error('Error uploading to ImageKit:', error)
      throw error
    }
  }
}

// Helper function to delete file from ImageKit
export const deleteFromImageKit = async (fileId: string): Promise<void> => {
  try {
    const response = await fetch('/api/imagekit/delete', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ fileId }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`ImageKit delete failed: ${errorData.message || 'Unknown error'}`)
    }
  } catch (error) {
    console.error('Error deleting from ImageKit:', error)
    throw error
  }
}

// Helper function to extract file ID from ImageKit URL
export const extractFileIdFromUrl = (url: string): string | null => {
  try {
    // ImageKit URLs typically have the file ID in the path
    // Example: https://ik.imagekit.io/your-id/folder/filename.jpg?updatedAt=timestamp
    const urlParts = url.split('/')
    const fileNameWithQuery = urlParts[urlParts.length - 1]
    const fileName = fileNameWithQuery.split('?')[0]
    return fileName
  } catch (error) {
    console.error('Error extracting file ID from URL:', error)
    return null
  }
}

// Helper function to generate optimized ImageKit URL
export const getOptimizedImageUrl = (
  url: string,
  transformations?: {
    width?: number
    height?: number
    quality?: number
    format?: 'auto' | 'webp' | 'jpg' | 'png'
  }
): string => {
  if (!url.includes('imagekit.io')) {
    return url // Return original URL if not an ImageKit URL
  }

  const params = new URLSearchParams()
  
  if (transformations) {
    if (transformations.width) params.append('tr', `w-${transformations.width}`)
    if (transformations.height) params.append('tr', `h-${transformations.height}`)
    if (transformations.quality) params.append('tr', `q-${transformations.quality}`)
    if (transformations.format) params.append('tr', `f-${transformations.format}`)
  }

  const queryString = params.toString()
  return queryString ? `${url}?${queryString}` : url
}
