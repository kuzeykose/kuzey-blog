import { cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'

const require = createRequire(import.meta.url)
const tessPkg = path.dirname(require.resolve('tesseract.js/package.json'))
const isolated = path.resolve(tessPkg, '..')
const dest = path.join(process.cwd(), 'vendor/tesseract-node/node_modules')

if (!existsSync(path.join(isolated, 'tesseract.js'))) {
  throw new Error(`Could not find isolated tesseract.js next to ${tessPkg}`)
}

rmSync(path.join(process.cwd(), 'vendor/tesseract-node'), { recursive: true, force: true })
mkdirSync(dest, { recursive: true })

for (const name of readdirSync(isolated)) {
  const from = path.join(isolated, name)
  const to = path.join(dest, name)
  if (name === 'tesseract.js-core') {
    mkdirSync(to, { recursive: true })
    for (const file of readdirSync(from)) {
      if (file !== 'README.md' && !file.endsWith('.wasm.js')) {
        cpSync(path.join(from, file), path.join(to, file), { dereference: true })
      }
    }
    continue
  }
  if (name === 'tesseract.js') {
    cpSync(from, to, {
      recursive: true,
      dereference: true,
      filter: (src) =>
        !src.includes(`${path.sep}docs${path.sep}`) &&
        !src.includes(`${path.sep}examples${path.sep}`) &&
        !src.includes(`${path.sep}scripts${path.sep}`) &&
        !src.includes(`${path.sep}dist${path.sep}`),
    })
    continue
  }
  cpSync(from, to, { recursive: true, dereference: true })
}

console.log(`vendored tesseract worker files -> ${dest}`)
