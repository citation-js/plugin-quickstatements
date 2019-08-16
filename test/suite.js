/* eslint-env mocha */

import '../src/'

import assert from 'assert'
import { plugins } from '@citation-js/core'

const apiTests = [
  {
    name: 'simple',
    input: 'https://example.com/api/000-abc-999',
    output: [{
      URL: 'https://example.com/view/000-abc-999',
      abstract: '"Lorem ipsum dolor sit amet" is a great example of a well-known sample text, in use for at least two millenia.',
      author: [
        { family: 'Caesar', given: 'Julius' },
        { family: 'Homerus' }
      ],
      issued: { 'date-parts': [[2000, 10, 10]] },
      title: 'Sample Text Through the Ages',
      type: 'book'
    }]
  }
]

describe('quickstatements', function () {
  describe('api', function () {
    for (let { name, input, output } of apiTests) {
      it(name, async function () {
        assert.deepStrictEqual(await plugins.input.chainAsync(input, { generateGraph: false }), output)
      })
    }
  })
})
