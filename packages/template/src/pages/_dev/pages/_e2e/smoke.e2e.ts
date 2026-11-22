/** @reviewed null */
import { smokePage, test } from '@e2e'
import { page } from '../_page'

test('loads without browser errors', smokePage({ page }))
