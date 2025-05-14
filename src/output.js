import { format as formatDate } from '@citation-js/date'
import { format as formatName } from '@citation-js/name'
import { fillCaches, getOrcid } from './cache.js'

const WIKIDATA_PROPS = {
  Lmul: 'title',
  P50: 'author',
  P212: 'ISBN',
  P304: 'page',
  P348: 'version',
  P356: 'DOI',
  P393: 'edition',
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
  P1813: 'title-short',
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
  document: 'Q386724',
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

function formatTitle (title) {
  return {
    html: title.replace(/<(?!\/?(i|sub|sup)).+?>/g, '').replace(/\s+/g, ' '),
    text: title.replace(/<.+?>/g, '').replace(/\s+/g, ' ')
  }
}

function serializeValue (property, value, item, caches) {
  switch (property) {
    case 'P304': // page
      return `"${value.replace('--', '-')}"`
    case 'P577': // issued
      return formatDateForWikidata(value)
    case 'P50': // author
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
    case 'P2093': // author
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
    case 'P1433': // ISSN
      return caches.issn[value]
    case 'P356': // DOI
      return `"${value.toUpperCase()}"`
    case 'P212': // ISBN
      return item.type === 'chapter' ? undefined : `"${value}"`
    case 'P856': // URL
      return item.type === 'article-journal' || item.type === 'chapter' ? undefined : `"${value}"`
    case 'P407': // language
      return caches.language[value]
    case 'P1104': // number-of-pages
      return value
    case 'P1476': // title
    case 'P1813': // title-short
    {
      const title = formatTitle(value)
      const language = caches.languageWiki[item.language] || 'en'
      const command = `${language}:"${title.text}"`
      return title.text === title.html ? command : [[command, 'P6833', `${language}:"${title.html}"`]]
    }
    case 'Lmul': // title
      return `"${formatTitle(value).text}"`

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
      const cslType = item.type in CSL_TYPES ? item.type : 'document'

      const entry = {
        id: item.custom && item.custom.QID,
        commands: [
          ['P31', CSL_TYPES[cslType]]
        ],
        provenance: getProvenance(item)
      }

      for (const wikidataProp in WIKIDATA_PROPS) {
        const cslProp = WIKIDATA_PROPS[wikidataProp]
        const cslValue = item[cslProp]
        if (cslValue == null || cslValue === '') { continue }

        const wikidataValue = serializeValue(wikidataProp, cslValue, item, caches)
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
