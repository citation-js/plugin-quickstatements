import { format as formatDate } from '@citation-js/date'
import { format as formatName } from '@citation-js/name'
import { util } from '@citation-js/core'
import wdk from 'wikidata-sdk'

const props = {
  Len: 'title',

  P304: 'page',
  P356: 'DOI',
  P433: 'issue',
  P478: 'volume',
  P577: 'issued',
  P698: 'PMID',
  P932: 'PMCID',
  P1476: 'title',
  P2093: 'author'
}

function serialize (prop, value) {
  switch (prop) {
    case 'page':
      return value.replace('--', '-')
    case 'issued':
      return formatDate(value)
    case 'author':
      return value.map((author, index) => {
        const name = formatName(author)
        return name ? `${name}"\tP1545\t"${index + 1}` : undefined
      })

    default: return value
  }
}

export default {
  quickstatements (csl) {
    let output = ''
    for (const item of csl) {
      var prov = "";
      if (item.source === 'PubMed') {
        prov = prov + "\tS248\tQ180686"
        if (item.accessed) {
            prov = prov + `\tS813\t"` + formatDate(item.accessed) + `T00:00:00Z/9"`
        }
        if (item._graph && item._graph[0] && item._graph[0].type === "@pubmed/pmcid" && item._graph[0].data) {
            prov = prov + `\tS932\t"` + item._graph[0].data + `"`
        }
      }
      if (item.type === 'article-journal') {
        output = output + '\tCREATE\n\n\tLAST\tP31\tQ13442814' + prov + '\n';

        for (const wd in props) {
          const prop = props[wd]
          const value = item[prop]

          if (value == null) continue

          const serializedValue = serialize(prop, value)

          if (serializedValue == null) continue

          output += []
            .concat(serializedValue)
            .map(value => `\tLAST\t${wd}\t"${value}"${prov}\n`)
            .join('')

        }

        // fetch the Wikidata QID for the journal
        if (item.ISSN) {
          var query = "SELECT ?journal WHERE { ?journal wdt:P236 \"" + item.ISSN + "\"} limit 10"
          var url = wdk.sparqlQuery(query)

          try {
            var response = util.fetchFile(url)
            const results = JSON.parse(response)
            const simpleResults = wdk.simplify.sparqlResults(results)

            if (simpleResults[0] && simpleResults[0].journal)
              output = output + "\tLAST\tP1433\t" + simpleResults[0].journal + prov + "\n"
          } catch (e) {
            console.error(e)
            console.error(e.body.toString())
          }
        }
      }
    }
    return output
  }
}
