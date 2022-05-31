import { format as formatDate } from '@citation-js/date'
import { format as formatName } from '@citation-js/name'
import { fillCaches } from './cache.js'

const props = {
  P50: 'author',
  P212: 'ISBN',
  P304: 'page',
  P356: 'DOI',
  P407: 'language',
  P433: 'issue',
  P478: 'volume',
  P577: 'issued',
  P496: 'ORCID',
  P698: 'PMID',
  P856: 'URL',
  P932: 'PMCID',
  P1104: 'number-of-pages',
  P1433: 'ISSN',
  P1476: 'title',
  P2093: 'author'
}

// the below mappings should follow the following Wikidata SPARQL query:
//
// SELECT * WHERE{
//   ?s wdt:P2888 ?o .
//   FILTER(STRSTARTS(STR(?o), "https://citationstyles.org/ontology/type/"))
// }
//
// Except when noted otherwise
const types = {
  article: 'Q191067',
  'article-journal': 'Q13442814',
  'article-magazine': 'Q30070590',
  'article-newspaper': 'Q5707594',
  bill: 'Q686822',

  // Exception: each book edition has a unique ISBN; otherwise use Q571 (book)
  book: 'Q3331189',

  broadcast: 'Q11578774',
  chapter: 'Q1980247',
  // classic
  collection: 'Q9388534',
  dataset: 'Q1172284',
  // document
  entry: 'Q10389811',
  'entry-dictionary': 'Q1580166',
  'entry-encyclopedia': 'Q13433827',
  event: 'Q1656682',
  figure: 'Q30070753',

  // Q4502142 (visual artwork) does not include non-artwork graphics (in theory)
  graphic: 'Q4502142',

  hearing: 'Q545861',
  interview: 'Q178651',
  legal_case: 'Q2334719',
  legislation: 'Q49371',
  manuscript: 'Q87167',
  map: 'Q4006',
  motion_picture: 'Q11424',
  musical_score: 'Q187947',

  // pamphlet: unsure whether exact match
  pamphlet: 'Q190399',

  'paper-conference': 'Q23927052',
  patent: 'Q253623',
  performance: 'Q35140',
  periodical: 'Q1002697',

  // Q628523 (message) also includes prophecies, protests, animal scent marks
  personal_communication: 'Q628523',

  post: 'Q7216866',
  'post-weblog': 'Q17928402',
  regulation: 'Q428148',
  report: 'Q10870555',
  review: 'Q265158',
  'review-book': 'Q637866',
  software: 'Q7397',
  song: 'Q7366',
  speech: 'Q861911',
  standard: 'Q317623',
  thesis: 'Q1266946',
  treaty: 'Q131569',
  webpage: 'Q36774'
}

function formatDateForWikidata (dateStr) {
  const isoDate = formatDate(dateStr)
  switch (isoDate.length) {
    case 4:
      return '+' + isoDate + '-01-01T00:00:00Z/9'
    case 7:
      return '+' + isoDate + '-01T00:00:00Z/10'
    case 10:
      return '+' + isoDate + 'T00:00:00Z/11'

    default: return '+' + dateStr
  }
}

function serialize (prop, value, wd, cslType, caches) {
  switch (prop) {
    case 'page':
      return `"${value.replace('--', '-')}"`
    case 'issued':
      return `${formatDateForWikidata(value)}`
    case 'author':
      if (wd === 'P50') {
        return value.map((author, index) => {
          if (author.ORCID) {
            const orcid = author.ORCID.replace(/^https?:\/\/orcid\.org\//, '')
            const authorQID = caches.orcid[orcid]
            if (authorQID) {
              const name = formatName(author)
              return name ? `${authorQID}\tP1932\t"${name}"\tP1545\t"${index + 1}"` : `${authorQID}\tP1545\t"${index + 1}"`
            }
          }

          return undefined
        }).filter(Boolean)
      } else {
        return value.map((author, index) => {
          if (author.ORCID) {
            const orcid = author.ORCID.replace(/^https?:\/\/orcid\.org\//, '')
            const authorQID = caches.orcid[orcid]
            if (authorQID) {
              return undefined
            } else {
              const name = formatName(author)
              return name ? `"${name}"\tP496\t"${orcid}"\tP1545\t"${index + 1}"` : undefined
            }
          } else {
            const name = formatName(author)
            return name ? `"${name}"\tP1545\t"${index + 1}"` : undefined
          }
        }).filter(Boolean)
      }
    case 'ISSN':
      return caches.issn[value]
    case 'DOI':
      return `"${value.toUpperCase()}"`
    case 'ISBN':
      return cslType === 'chapter' ? undefined : `"${value}"`
    case 'URL':
      return cslType === 'article-journal' || cslType === 'chapter' ? undefined : `"${value}"`
    case 'language':
      return caches.language[value]
    case 'number-of-pages':
      return value
    case 'title':
      return `en:"${value.replace(/\s+/g, ' ')}"`

    default: return `"${value}"`
  }
}

export default {
  quickstatements (csl) {
    const caches = fillCaches(csl)

    // generate output
    let output = ''
    for (const item of csl) {
      let prov = ''
      if (item.source) {
        if (item.source === 'PubMed') {
          prov = prov + '\tS248\tQ180686'
        } else if (item.source === 'Crossref') {
          prov = prov + '\tS248\tQ5188229'
        }
        if (item.accessed) {
          prov = prov + '\tS813\t' + formatDateForWikidata(item.accessed)
        } else {
          prov = prov + '\tS813\t+' + new Date().toISOString().substring(0, 10) + 'T00:00:00Z/11'
        }
        if (item._graph && item._graph[0] && item._graph[0].type === '@pubmed/pmcid' && item.PMCID) {
          prov = prov + '\tS932\t"' + item.PMCID + '"'
        }
      }
      if (types[item.type]) {
        const wdType = types[item.type]
        output = output + '\tCREATE\n\n\tLAST\tP31\t' + wdType + prov + '\n'
        output = output + '\tLAST\tLen\t"' + item.title + '"\n'

        for (const wd in props) {
          const prop = props[wd]
          const value = item[prop]

          if (value == null) continue

          const serializedValue = serialize(prop, value, wd, item.type, caches)

          if (serializedValue == null) continue

          output += []
            .concat(serializedValue)
            .map(value => `\tLAST\t${wd}\t${value}${prov}\n`)
            .join('')
        }
        output = output + '\n'
      }
    }
    return output
  }
}
