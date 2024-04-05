import yaml, { dump } from 'js-yaml'
import {
  readFileSync,
  writeFileSync,
  rmSync,
  existsSync,
  mkdirSync,
  appendFileSync,
} from 'node:fs'
import { resolve, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { Book, Member } from './type.js'
import { Entity, reverseIndex, index, IndexPath } from './parseIndex.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const books = yaml.load(
  readFileSync(resolve(__dirname, '../../index.yml')).toString()
) as Book[]
function readMember(file: string) {
  return yaml.load(
    readFileSync(resolve(__dirname, `../../${file}`)).toString()
  ) as Member[]
}

// 20 + 余 + 余乾 + 余坤 + 別巻乾 + 別巻坤
const BOOK2KAN: Record<number, number[]> = {
  1: [1, 2, 3, 4, 5].map((i) => i - 1),
  2: [6, 7, 8, 9].map((i) => i - 1),
  3: [10, 11, 12, 13, 14].map((i) => i - 1),
  4: [15, 16, 17, 18].map((i) => i - 1),
  5: [19, 20, 21, 22].map((i) => i - 1),
  6: [23, 24, 25].map((i) => i - 1),
}
function kan2Book(kan: number): number {
  for (const book of [1, 2, 3, 4, 5, 6]) {
    if (BOOK2KAN[book].includes(kan)) {
      return book
    }
  }
  throw 'Invalid kan!'
}

type Path = [number, number] // kan, position index
const Positions: Record<string, Path[]> = {}
books.forEach((book, idx1) => {
  book.positions.forEach((pos, idx2) => {
    const name = pos.name2 || pos.name
    if (!Positions[name]) {
      Positions[name] = []
    }
    Positions[name].push([idx1, idx2])
  })
})

function searchByName(name: string, kan: number): Path[] | null {
  const candidates = Positions[name]
  if (!candidates) {
    return null
  }
  return candidates.filter((c) => c[0] === kan)
}

// console.log(searchByName('小納戸頭取', 24))
function reverseSearch(path: Path): IndexPath[] {
  const [kan, posIndx] = path
  const position = books[kan].positions[posIndx]
  const members = readMember(position.groups[0].members)
  const page = members[0]?.page || -1

  return [page, page - 1]
    .flatMap((p) => {
      const key = `${kan2Book(kan)}:${p}`
      return reverseIndex[key]
    })
    .filter(Boolean)
}

function addIndexPath() {
  books.forEach((book, kan) => {
    book.positions.forEach((p, posIndx) => {
      const match: string[] = []
      const candidates = reverseSearch([kan, posIndx]).map((i) => {
        const [kana, x, y] = i
        const entity = index[kana][x]
        let text = `${kana}-${entity.name}`
        if (y !== undefined) {
          text = text + `-${entity.children![y].name}`
        }
        if (
          text.includes(p.name || 'not-exist') ||
          text.includes(p.name2 || 'not-exist')||
          text.includes(p.name3 || 'not-exist')
        ) {
          match.push(text)
        }
        return text
      })
      if (match.length > 0) {
        p.indexPath = match.join('|')
      } else if (candidates.length) {
        p.indexPath = 'not found:' + candidates.join('|')
      }
    })
  })
  writeFileSync(
    resolve(__dirname, '../../index.yml'),
    '# yaml-language-server: $schema=tools/schema/books.json\n' + dump(books)
  )
}

addIndexPath()
