/** @reviewed null */
import { smokePage, test } from '@e2e'

test('loads without browser errors', smokePage({ suffix: 'markdown' }))
