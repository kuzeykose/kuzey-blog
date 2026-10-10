import { cpSync, existsSync, mkdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const tessPkg = path.dirname(require.resolve('tesseract.js/package.json'))
const isolated = path.resolve(tessPkg, '..')
const dest = path.join(process.cwd(), 'vendor/tesseract-node/node_modules')

if (!existsSync(path.join(isolated, 'tesseract.js'))) {
  throw new Error(`Could not find isolated tesseract.js next to ${tessPkg}`)
}

rmSync(dest, { recursive: true, force: true })
mkdirSync(path.dirname(dest), { recursive: true })
cpSync(isolated, dest, { recursive: true, dereference: true })
console.log(`vendored tesseract worker files -> ${dest}`)
