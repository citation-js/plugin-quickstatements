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
      super('2019-09-28T00:00:00Z')
    }
  }
}

const apiTests = [
  {
    name: 'simple',
    /* eslint-disable no-tabs */
    output: `	CREATE
	LAST	P31	Q13442814	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	Len	"A general approach for retrosynthetic molecular core analysis"
	LAST	P50	Q58379284	P1545	"1"	P1932	"J. Jesús Naveja"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P50	Q89667036	P1545	"2"	P1932	"B. Angélica Pilón-Jiménez"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P50	Q18609784	P1545	"3"	P1932	"Jürgen Bajorath"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P50	Q43370888	P1545	"4"	P1932	"José L. Medina-Franco"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P356	"10.1186/S13321-019-0380-5"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P407	Q1860	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P433	"1"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P478	"11"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P577	+2019-09-24T00:00:00Z/11	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P1433	Q6294930	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P1476	en:"A general approach for retrosynthetic molecular core analysis"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
`,
    /* eslint-enable no-tabs */
    input: require('./data.json')
  },
  {
    name: 'invalid type (thesis/dissertation)',
    /* eslint-disable no-tabs */
    output: `	CREATE
	LAST	P31	Q386724	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	Len	"Biological pathway abstractions"
	LAST	P212	"9789464733617"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P356	"10.26481/DIS.20240116AW"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P856	"http://dx.doi.org/10.26481/dis.20240116aw"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P1476	en:"Biological pathway abstractions"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P2093	"Andra Sachinder Waagmeester"	P1545	"1"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
`,
    /* eslint-enable no-tabs */
    input: require('./thesis.json')
  }
]

describe('quickstatements', function () {
  describe('api', function () {
    for (const { name, input, output } of apiTests) {
      it(name, async function () {
        assert.deepStrictEqual(await plugins.output.format('quickstatements', input), output)
      })
    }
  })
})
