import { format as formatDate } from '@citation-js/date'
import { format as formatName } from '@citation-js/name'
import { fillCaches, getOrcid } from './cache.js'

const WIKIDATA_PROPS = {
  Len: 'title',
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
const CSL_TYPES = {
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

function formatDateForWikidata (date) {
  const isoDate = typeof date === 'string' ? date : formatDate(date)
  switch (isoDate.length) {
    case 4:
      return '+' + isoDate + '-01-01T00:00:00Z/9'
    case 7:
      return '+' + isoDate + '-01T00:00:00Z/10'
    case 10:
      return '+' + isoDate + 'T00:00:00Z/11'

    default: return '+' + date
  }
}

function serializeValue (prop, value, wd, cslType, caches) {
  switch (prop) {
    case 'page':
      return `"${value.replace('--', '-')}"`
    case 'issued':
      return `${formatDateForWikidata(value)}`
    case 'author':
      if (wd === 'P50') {
        return value.map((author, index) => {
          const authorOrcid = getOrcid(author)
          const authorQid = caches.orcid[authorOrcid]
          if (!authorOrcid || !authorQid) {
            return undefined
          }

          const parts = [authorQid, 'P1545', `"${index + 1}"`]
          const name = formatName(author)
          if (name) {
            parts.push('P1932', `"${name}"`)
          }
          return parts
        }).filter(Boolean)
      } else {
        return value.map((author, index) => {
          const authorOrcid = getOrcid(author)
          const authorQid = caches.orcid[authorOrcid]
          const name = formatName(author)
          if (!name || (authorOrcid && authorQid)) {
            return undefined
          }

          const parts = [`"${name}"`, 'P1545', `"${index + 1}"`]
          if (authorOrcid) {
            parts.push('P496', `"${authorOrcid}"`)
          }
          return parts
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
    case 'title': {
      const collapsed = value.replace(/\s+/g, ' ')
      return wd[0] === 'P' ? `en:"${collapsed}"` : `"${collapsed}"`
    }

    default: return `"${value}"`
  }
}

function getProvenance (item) {
  const provenance = []

  if (item.source === 'PubMed') {
    provenance.push(['S248', 'Q180686'])
  } else if (item.source === 'Crossref') {
    provenance.push(['S248', 'Q5188229'])
  }

  if (provenance.length) {
    if (item._graph && item._graph[0] && item._graph[0].type === '@pubmed/pmcid' && item.PMCID) {
      provenance.push(['S932', `"${item.PMCID}"`])
    }

    if (item.accessed) {
      provenance.push(['S813', formatDateForWikidata(item.accessed)])
    } else {
      provenance.push(['S813', formatDateForWikidata((new Date()).toISOString().substring(0, 10))])
    }
  }

  return provenance
}

function addProvenance (command, provenance) {
  if (command[0][0] === 'P') {
    return [...command, ...provenance]
  } else {
    return command
  }
}

function serializeEntry (entry) {
  const prefix = entry.id || 'LAST'
  const provenance = entry.provenance.slice().flat()
  const commands = entry.commands.map(command => ['', prefix, ...addProvenance(command, provenance)].join('\t'))

  if (!entry.id) {
    commands.unshift('\tCREATE')
  }

  return commands.join('\n') + '\n'
}

export default {
  quickstatements (csl) {
    const caches = fillCaches(csl)
    const entries = []

    for (const item of csl) {
      if (!CSL_TYPES[item.type]) { continue }

      const entry = {
        id: item.custom && item.custom.QID,
        commands: [
          ['P31', CSL_TYPES[item.type]]
        ],
        provenance: getProvenance(item)
      }

      for (const wikidataProp in WIKIDATA_PROPS) {
        const cslProp = WIKIDATA_PROPS[wikidataProp]
        const cslValue = item[cslProp]
        if (cslValue == null) { continue }

        const wikidataValue = serializeValue(cslProp, cslValue, wikidataProp, item.type, caches)
        if (wikidataValue == null) { continue }

        entry.commands.push(...[]
          .concat(wikidataValue)
          .map(wikidataValue => [wikidataProp, ...[].concat(wikidataValue)])
        )
      }

      entries.push(entry)
    }

    return entries.map(serializeEntry).join('\n\n')
  }
}
