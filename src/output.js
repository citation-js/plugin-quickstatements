import { decode as decodeHtmlEntities } from 'html-entities'
import { util } from '@citation-js/core'
import { format as formatDate } from '@citation-js/date'
import { format as formatName } from '@citation-js/name'
import { fillCaches, getOrcid } from './cache.js'

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

const PATTERN_P6833_HTML = /<([buap]|scp|span|sc|strong)(?: .+?)?>([^<>]*?)<\/\1>|<\/?mml:[a-z][a-z0-9]+>|<br ?\/?>/gi
const PATTERN_P6833_HTML_2 = /<(em|italic)(?: .+?)?>([^<>]*?)<\/\1>/
const PATTERN_PLAIN_TEXT = /<([ibuap]|sup|sub|scp|span|sc|strong)(?: .+?)?>([^<>]*?)<\/\1>|<\/?mml:[a-z][a-z0-9]+>|<br ?\/?>/gi

function formatP6833Html (value) {
  let oldValue

  do {
    oldValue = value
    value = oldValue.replace(PATTERN_P6833_HTML, '$2').replace(PATTERN_P6833_HTML_2, '<$1>$2</$1>')
  } while (value !== oldValue)

  return value
}

function stripHtml (value) {
  let oldValue

  do {
    oldValue = value
    value = oldValue.replace(PATTERN_PLAIN_TEXT, '$2')
  } while (value !== oldValue)

  return value
}

function formatTitle (title) {
  if (title.match(/&([a-z0-9]+|#[0-9]{1,6}|#x[0-9a-fA-F]{1,6});/ig) && !title.match(/[<>]/)) {
    title = decodeHtmlEntities(title)
  }

  return {
    html: formatP6833Html(title),
    text: decodeHtmlEntities(stripHtml(title))
  }
}

function truncateTitle (title, limit) {
  if (title.length <= limit) {
    return title
  }

  let truncated = title.slice(0, limit - 1)
  if (title[limit - 1] !== ' ') {
    truncated = truncated.replace(/\s\S+$/, '')
  }

  return truncated + '…'
}

function convertString (value) {
  return value == null || value === '' ? null : `"${value}"`
}

function convertTitle (value) {
  if (value == null || value === '') {
    return null
  }

  const title = formatTitle(value)
  const language = this._caches.languageWiki[this.language] || 'und'
  const command = `${language}:"${title.text}"`
  return title.text === title.html ? command : [[command, 'P6833', `${language}:"${title.html}"`]]
}

const mappings = [
  {
    source: 'title',
    target: 'Lmul',
    convert (value) {
      if (value == null || value === '') {
        return null
      }

      return convertString(truncateTitle(formatTitle(value).text, 250))
    }
  },
  {
    source: 'author',
    target: ['P50', 'P2093'],
    convert (authors) {
      if (authors == null) {
        return null
      }

      const mapped = []
      const unmapped = []

      for (let index = 0; index < authors.length; index++) {
        const author = authors[index]
        const authorOrcid = getOrcid(author)
        const authorQid = this._caches.orcid[authorOrcid]
        const name = formatName(author)

        if (authorQid) {
          const parts = [authorQid, 'P1545', convertString(index + 1)]
          if (name) {
            parts.push('P1932', convertString(name))
          }
          mapped.push(parts)
        } else if (name) {
          const parts = [convertString(name), 'P1545', convertString(index + 1)]
          if (authorOrcid) {
            parts.push('P496', convertString(authorOrcid))
          }
          unmapped.push(parts)
        }
      }

      return [mapped.length ? mapped : null, unmapped.length ? unmapped : null]
    }
  },
  { source: 'ISBN', target: 'P212', when: { source: { type (type) { return type !== 'chapter' } } } },
  { source: 'page', target: 'P304', convert (value) { return value == null || value === '' ? null : convertString(value.replace('--', '-')) } },
  { source: 'version', target: 'P348', when: { source: { type: ['book', 'software', 'dataset'] } } },
  { source: 'edition', target: 'P393' },
  { source: 'DOI', target: 'P356', convert (value) { return value == null || value === '' ? null : convertString(value.toUpperCase()) } },
  { source: 'language', target: 'P407', convert (value) { return this._caches.language[value] } },
  { source: 'issue', target: 'P433' },
  { source: 'volume', target: 'P478' },
  { source: 'issued', target: 'P577', convert (value) { return value == null ? null : formatDateForWikidata(value) } },
  { source: 'PMID', target: 'P698' },
  { source: 'URL', target: 'P856', when: { source: { type (type) { return type !== 'article-journal' && type !== 'chapter' } } } },
  { source: 'PMCID', target: 'P932' },
  { source: 'number-of-pages', target: 'P1104', convert (value) { return value } },
  { source: 'ISSN', target: 'P1433', convert (value) { return this._caches.issn[value] } },
  { source: 'title', target: 'P1476', convert: convertTitle },
  { source: 'title-short', target: 'P1813', convert: convertTitle },
  {
    source: 'version',
    target: 'P9767',
    when: {
      source: {
        type (type) { return type !== 'book' && type !== 'software' && type !== 'dataset' },
        edition: false
      }
    }
  }
]

for (const mapping of mappings) {
  const toTarget = mapping.convert ?? convertString
  mapping.convert = { toTarget }
}

const converter = new util.Translator(mappings)

function getProvenance (item) {
  const provenance = []

  if (item.source === 'PubMed') {
    provenance.push(['S248', 'Q180686'])
  } else if (item.source === 'Crossref') {
    provenance.push(['S248', 'Q5188229'])
  }

  if (provenance.length) {
    if (item._graph && item._graph[0] && item._graph[0].type === '@pubmed/pmcid' && item.PMCID) {
      provenance.push(['S932', convertString(item.PMCID)])
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

      const converted = converter.convertToTarget({ ...item, _caches: caches })
      for (const wikidataProp in converted) {
        const wikidataValue = converted[wikidataProp]
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
