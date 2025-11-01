'use client'

import React from 'react'
import { ImageKitProvider as IKProvider } from '@imagekit/next'
import { imagekitClientConfig } from '../lib/imagekit'

interface ImageKitProviderProps {
  children: React.ReactNode
}

export const ImageKitProvider: React.FC<ImageKitProviderProps> = ({ children }) => {
  return (
    <IKProvider
      urlEndpoint={imagekitClientConfig.urlEndpoint}
      publicKey={imagekitClientConfig.publicKey}
    >
      {children}
    </IKProvider>
  )
}
