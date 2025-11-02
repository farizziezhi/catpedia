import { HttpContext } from '@adonisjs/core/http'
import env from '#start/env'

export default class CatsController {
  private getHeaders() {
    const headers: Record<string, string> = {}
    const apiKey = env.get('CAT_API_KEY')
    if (apiKey) {
      headers['x-api-key'] = apiKey
    }
    return headers
  }

  async breeds({ response }: HttpContext) {
    try {
      const apiResponse = await fetch('https://api.thecatapi.com/v1/breeds', {
        headers: this.getHeaders()
      })
      const breeds = await apiResponse.json()
      return response.json(breeds)
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch cat breeds' })
    }
  }

  async images({ request, response }: HttpContext) {
    try {
      const breedId = request.input('breed_id')
      const limit = request.input('limit', 10)
      
      let url = `https://api.thecatapi.com/v1/images/search?limit=${limit}`
      if (breedId) {
        url += `&breed_ids=${breedId}`
      }
      
      const apiResponse = await fetch(url, {
        headers: this.getHeaders()
      })
      const images = await apiResponse.json()
      return response.json(images)
    } catch (error) {
      return response.status(500).json({ error: 'Failed to fetch cat images' })
    }
  }
}