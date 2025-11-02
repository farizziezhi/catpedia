import { HttpContext } from '@adonisjs/core/http'

export default class BreedIdentifierSimpleController {
  async identify({ request, response }: HttpContext) {
    try {
      console.log('Starting simple breed identification...')
      
      const image = request.file('image', {
        size: '5mb',
        extnames: ['jpg', 'jpeg', 'png', 'webp']
      })

      if (!image) {
        return response.status(400).json({ error: 'No image file provided' })
      }

      console.log('Image received:', {
        name: image.clientName,
        size: image.size,
        type: image.type
      })

      // Use the static token from your example
      const staticToken = 'eyJhbGciOiJSUzI1NiIsInR5cCI6ImF0K2p3dCJ9.eyJpc3MiOiJodHRwczovL3d3dy5ueWNrZWwuY29tIiwibmJmIjoxNzYyMDU3NDE3LCJpYXQiOjE3NjIwNTc0MTcsImV4cCI6MTc2MjA2MTAxNywic2NvcGUiOlsiYXBpIl0sImNsaWVudF9pZCI6IjlhbWZsa3BoeTZkeDE3Z201YzQxNmo0amw0cmMxd2o1IiwianRpIjoiRUMxQjlFMzkyMzlBNzI4OTM5OUUwRTMyOUYxMjc0QTUifQ.u9C2jBSntlgRYLTdKsHa_skurs0S8c1cU5ndm9ojnpWAWgzuvJd-z2nEjoa5WFAl_KT8NRTu-KcsyeVZvRROOMlnqdVIOI4eM1XjXfZfeoXory6hJYXcgnCpzEK7Za-1Juq313aXYeH2YJlaUJ61IB0UySZy8tjjyECs5or-1kSBeeYOLjvilx6HGJcfNyf4PXWYZzxrJIrdrLVPUVWr-5gzvbflk7_Oyg3s0asvMEkAqfRFr8cI0DQA6VyF-fc9nw8muravTkL2Y5wLQRHt7gMMtBUlMF87yPa6PXVlCYzaJR_n29kvPnn07ybtjZD1PLkZXyAmn4n_qK-_8iYt9g'

      // Read image as buffer
      const imageBuffer = await image.buffer()
      console.log('Image buffer size:', imageBuffer.length)

      // Create form data exactly like the example
      const formData = new FormData()
      const blob = new Blob([imageBuffer], { type: image.type || 'image/jpeg' })
      formData.append('data', blob, image.clientName || 'cat.jpg')

      console.log('Calling Nyckel API with static token...')
      
      // Call Nyckel breed identifier API
      const nyckelResponse = await fetch('https://www.nyckel.com/v1/functions/cat-breed-identifier/invoke', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${staticToken}`,
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
        message: error.message
      })
    }
  }
}