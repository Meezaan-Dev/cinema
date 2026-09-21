import { describe, expect, it } from 'vitest'

import { parseCsv } from './parseCsv'

describe('parseCsv', () => {
  it('parses headers and quoted fields with commas', () => {
    const rows = parseCsv(`Name,Tags
Film One,"a, b"`)

    expect(rows).toEqual([{ Name: 'Film One', Tags: 'a, b' }])
  })

  it('parses multiline quoted fields', () => {
    const rows = parseCsv(`Review
"line one
line two"`)

    expect(rows[0].Review).toBe('line one\nline two')
  })

  it('strips UTF-8 BOM', () => {
    const rows = parseCsv('\uFEFFName\nTitle')
    expect(rows[0].Name).toBe('Title')
  })
})
