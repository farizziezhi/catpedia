import { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'
import { readFile } from 'node:fs/promises'

export default class BreedIdentifierController {
  private static tokenCache: { token: string; expires: number } | null = null

  private async getNyckelToken() {
    // Check if we have a valid cached token
    if (BreedIdentifierController.tokenCache && Date.now() < BreedIdentifierController.tokenCache.expires) {
      console.log('Using cached token')
      return BreedIdentifierController.tokenCache.token
    }
    const clientId = env.get('NYCKEL_CLIENT_ID')
    const clientSecret = env.get('NYCKEL_CLIENT_SECRET')
    
    console.log('Nyckel credentials:', { 
      clientId: clientId?.substring(0, 10) + '...', 
      clientSecret: clientSecret?.substring(0, 10) + '...',
      clientIdLength: clientId?.length,
      clientSecretLength: clientSecret?.length
    })
    
    if (!clientId || !clientSecret) {
      throw new Error('Nyckel credentials not configured')
    }

    const requestBody = `grant_type=client_credentials&client_id=${encodeURIComponent(clientId)}&client_secret=${encodeURIComponent(clientSecret)}`
    console.log('Request body length:', requestBody.length)
    
    console.log('Requesting token from Nyckel...')
    const response = await fetch('https://www.nyckel.com/connect/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: requestBody
    })

    console.log('Token response status:', response.status)
    
    if (!response.ok) {
      const errorText = await response.text()
      console.error('Token error:', errorText)
      throw new Error(`Failed to get Nyckel token: ${response.status} - ${errorText}`)
    }

    const data = await response.json() as { access_token?: string }
    console.log('Token response:', { hasAccessToken: !!data.access_token })
    
    // Cache token for 50 minutes (expires in 1 hour)
    if (data.access_token) {
      BreedIdentifierController.tokenCache = {
        token: data.access_token,
        expires: Date.now() + (50 * 60 * 1000) // 50 minutes
      }
    }
    
    return data.access_token
  }

  async identify({ request, response }: HttpContext) {
    try {
      console.log('Starting breed identification...')
      
      const image = request.file('image', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp']
      })

      if (!image) {
        console.log('No image file provided')
        return response.status(400).json({ error: 'No image file provided' })
      }

      console.log('Image received:', {
        name: image.clientName,
        size: image.size,
        type: image.type
      })

      // Get Nyckel access token
      console.log('Getting Nyckel token...')
      const accessToken = await this.getNyckelToken()
      console.log('Token obtained successfully')

      // Read image content
      const imageBuffer = await readFile(image.tmpPath!)
      console.log('Image buffer size:', imageBuffer.length)

      // Use the exact format from your example
      const formData = new FormData()
      const blob = new Blob([imageBuffer], { type: image.type || 'image/jpeg' })
      formData.append('data', blob, image.clientName || 'cat.jpg')

      console.log('Calling Nyckel API...')
      
      // Call Nyckel breed identifier API
      const nyckelResponse = await fetch('https://www.nyckel.com/v1/functions/cat-breed-identifier/invoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
        body: formData
      })

      console.log('Nyckel response status:', nyckelResponse.status)
      
      if (!nyckelResponse.ok) {
        const errorText = await nyckelResponse.text()
        console.error('Nyckel API error:', errorText)
        throw new Error(`Nyckel API error: ${nyckelResponse.status} - ${errorText}`)
      }

      const result = await nyckelResponse.json()
      console.log('Nyckel result:', result)
      
      return response.json(result)

    } catch (error) {
      console.error('Breed identification error:', error)
      return response.status(500).json({ 
        error: 'Failed to identify cat breed',
        message: error.message,
        details: error.stack
      })
    }
  }
}