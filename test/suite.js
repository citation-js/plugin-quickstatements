/* eslint-env mocha */

import '../src/'

import assert from 'assert'
import { plugins } from '@citation-js/core'

const oldDate = global.Date
global.Date = class extends oldDate {
  constructor (...args) {
    if (args.length) {
      super(...args)
    } else {
      super('2019-09-28T17:31:16.055Z')
    }
  }
}

const apiTests = [
  {
    name: 'simple',
    /* eslint-disable no-tabs */
    output: `	CREATE

	LAST	P31	Q13442814	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	Len	"A general approach for retrosynthetic molecular core analysis"
	LAST	P50	Q58379284	P1932	"J. Jesús Naveja"	P1545	"1"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P50	Q18609784	P1932	"Jürgen Bajorath"	P1545	"3"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P50	Q43370888	P1932	"José L. Medina-Franco"	P1545	"4"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P356	"10.1186/s13321-019-0380-5"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P433	"1"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P478	"11"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P577	"2019-09-24"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P1433	Q6294930	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P1476	"A general approach for retrosynthetic molecular core analysis"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"
	LAST	P2093	"B. Angélica Pilón-Jiménez"	P496	"0000-0002-0305-3138"	P1545	"2"	S248	Q5188229	S813	"2019-09-28T17:31:16.055Z/18"

`,
    /* eslint-enable no-tabs */
    input: [require('./data.json')]
  }
]

describe('quickstatements', function () {
  describe('api', function () {
    for (let { name, input, output } of apiTests) {
      it(name, async function () {
        assert.deepStrictEqual(await plugins.output.format('quickstatements', input), output)
      })
    }
  })
})
