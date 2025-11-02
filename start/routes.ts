/*
|--------------------------------------------------------------------------
| Routes file
|--------------------------------------------------------------------------
|
| The routes file is used for defining the HTTP routes.
|
*/

import router from '@adonisjs/core/services/router'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
const CatsController = () => import('#controllers/cats_controller')
const BreedIdentifierController = () => import('#controllers/breed_identifier_controller')
const BreedIdentifierSimpleController = () => import('#controllers/breed_identifier_simple_controller')

router.get('/', async ({ response }) => {
  const html = await readFile(join(process.cwd(), 'public', 'index.html'), 'utf-8')
  response.type('text/html')
  return html
})

router.get('/api/breeds', [CatsController, 'breeds'])
router.get('/api/images', [CatsController, 'images'])
router.post('/api/identify-breed', [BreedIdentifierController, 'identify'])
