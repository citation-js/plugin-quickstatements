import { format as formatDate } from '@citation-js/date'
import { format as formatName } from '@citation-js/name'
import { util } from '@citation-js/core'
import wdk from 'wikidata-sdk'

const caches = {
  issn (items) {
    const issns = items
      .map(item => item.ISSN)
      .filter((value, index, array) => array.indexOf(value) === index)
      .join('" "')

    return `VALUES ?key { "${issns}" } . ?value wdt:P236 ?key .`
  }
}

const props = {
  Len: 'title',

  P304: 'page',
  P356: 'DOI',
  P433: 'issue',
  P478: 'volume',
  P577: 'issued',
  P698: 'PMID',
  P932: 'PMCID',
  P1433: 'ISSN',
  P1476: 'title',
  P2093: 'author'
}

function serialize (prop, value) {
  switch (prop) {
    case 'page':
      return `"${value.replace('--', '-')}"`
    case 'issued':
      return `"${formatDate(value)}"`
    case 'author':
      return value.map((author, index) => {
        const name = formatName(author)
        return name ? `"${name}"\tP1545\t"${index + 1}"` : undefined
      })
    case 'ISSN':
      return caches.issn[value]

    default: return `"${value}"`
  }
}

export default {
  quickstatements (csl) {
    // fill caches
    const queries = Object.keys(caches)
      .map(cache => {
        const makeQuery = caches[cache]
        caches[cache] = {}
        return `{ ${makeQuery(csl)} BIND("${cache}" AS ?cache) }`
      })
      .join(' UNION ')
    let query = `SELECT ?key ?value ?cache WHERE { ${queries} }`

    try {
      const url = wdk.sparqlQuery(query)
      const response = JSON.parse(util.fetchFile(url))
      const results = wdk.simplify.sparqlResults(response)

      for (let { key, value, cache } of results) {
        caches[cache][key] = value
      }
    } catch (e) {
      console.error(e)
    }

    // generate output
    let output = ''
    for (const item of csl) {
      if (item.type === 'article-journal') {
        output = output + '\tCREATE\n\n\tLAST\tP31\tQ13442814\n';

        for (const wd in props) {
          const prop = props[wd]
          const value = item[prop]

          if (value == null) continue

          const serializedValue = serialize(prop, value)

          if (serializedValue == null) continue

          output += []
            .concat(serializedValue)
            .map(value => `\tLAST\t${wd}\t${value}\n`)
            .join('')
        }
      }
    }
    return output
  }
}
