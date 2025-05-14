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
	LAST	Lmul	"A general approach for retrosynthetic molecular core analysis"
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
	LAST	Lmul	"Biological pathway abstractions"
	LAST	P212	"9789464733617"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P356	"10.26481/DIS.20240116AW"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P856	"http://dx.doi.org/10.26481/dis.20240116aw"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P1476	en:"Biological pathway abstractions"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P2093	"Andra Sachinder Waagmeester"	P1545	"1"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
`,
    /* eslint-enable no-tabs */
    input: require('./thesis.json')
  },
  {
    name: 'HTML in title',
    /* eslint-disable no-tabs */
    output: `	CREATE
	LAST	P31	Q13442814	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	Lmul	"Mapping wing morphs of Tetrix subulata using citizen science data: Flightless groundhoppers are more prevalent in grasslands near water"
	LAST	P50	Q45907528	P1545	"1"	P1932	"Lars G. Willighagen"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P50	Q41047563	P1545	"2"	P1932	"Eelke Jongejans"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P356	"10.1111/ICAD.12730"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P407	Q1860	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P577	+2024-03-02T00:00:00Z/11	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P1433	Q15760625	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
	LAST	P1476	en:"Mapping wing morphs of Tetrix subulata using citizen science data: Flightless groundhoppers are more prevalent in grasslands near water"	P6833	en:"Mapping wing morphs of <i>Tetrix subulata</i> using citizen science data: Flightless groundhoppers are more prevalent in grasslands near water"	S248	Q5188229	S813	+2019-09-28T00:00:00Z/11
`,
    /* eslint-enable no-tabs */
    input: require('./html.json')
  },
  {
    name: 'Japanese title',
    /* eslint-disable no-tabs */
    output: `	CREATE
	LAST	P31	Q3331189
	LAST	Lmul	"70歳のウィキペディアン"
	LAST	P212	"9784907126612"
	LAST	P407	Q5287
	LAST	P577	+2023-11-03T00:00:00Z/11
	LAST	P856	"https://books.google.com/books/about/70%E6%AD%B3%E3%81%AE%E3%82%A6%E3%82%A3%E3%82%AD%E3%83%9A%E3%83%87%E3%82%A3%E3%82%A2%E3%83%B3.html?hl=&id=aD9V0AEACAAJ"
	LAST	P1476	ja:"70歳のウィキペディアン"
	LAST	P2093	"門倉百合子"	P1545	"1"
`,
    /* eslint-enable no-tabs */
    input: require('./japanese.json')
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
