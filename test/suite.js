/* eslint-env mocha */

import '../src/'

import assert from 'assert'
import { plugins } from '@citation-js/core'

const apiTests = [
  {
    name: 'simple',
    output: '\tCREATE\n\n\tLAST\tP31\tQ13442814\n',
    input: [{ publisher: 'Springer Nature',
  issue: '1',
  license:
   [ { URL: 'http://creativecommons.org/licenses/by/4.0',
       start: [Object],
       'delay-in-days': 0,
       'content-version': 'unspecified' } ],
  DOI: '10.1186/s13326-015-0005-5',
  type: 'article-journal',
  title:
   'eNanoMapper: harnessing ontologies to enable data integration for nanomaterial risk assessment',
  prefix: '10.1186',
  volume: '6',
  author:
   [ { given: 'Janna',
       family: 'Hastings',
       sequence: 'first',
       affiliation: [] },
     { given: 'Nina',
       family: 'Jeliazkova',
       sequence: 'additional',
       affiliation: [] },
     { given: 'Gareth',
       family: 'Owen',
       sequence: 'additional',
       affiliation: [] },
     { given: 'Georgia',
       family: 'Tsiliki',
       sequence: 'additional',
       affiliation: [] },
     { given: 'Cristian R',
       family: 'Munteanu',
       sequence: 'additional',
       affiliation: [] },
     { given: 'Christoph',
       family: 'Steinbeck',
       sequence: 'additional',
       affiliation: [] },
     { given: 'Egon',
       family: 'Willighagen',
       sequence: 'additional',
       affiliation: [] } ],
  'published-online': { 'date-parts': [ [Array] ] },
  'container-title': 'Journal of Biomedical Semantics',
  'original-title': [],
  language: 'en',
  'journal-issue': { 'published-print': { 'date-parts': [Array] }, issue: '1' },
  'alternative-id': [ '5' ],
  URL: 'http://dx.doi.org/10.1186/s13326-015-0005-5',
  ISSN: [ '2041-1480' ],
  'container-title-short': 'J Biomed Semant',
  'article-number': '10',
  
}
]
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
