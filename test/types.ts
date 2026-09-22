import { plugins } from '@citation-js/core'
import '..'

const b = plugins.output.format('quickstatements', [])

type Expect<T extends true> = T
type IsString<T> = T extends string ? true : false

// @ts-ignore
type Tests = [
  Expect<IsString<typeof b>>
]
