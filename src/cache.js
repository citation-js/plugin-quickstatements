import { logger, util } from '@citation-js/core'
import wdk from 'wikidata-sdk'

function getOrcid (author) {
  const orcid = author._orcid || author.ORCID || author._ORCID || author.orcid
  return orcid && orcid.replace(/^https?:\/\/orcid\.org\//, '')
}

const QUERY_BUILDERS = {
  issn: {
    value: '?value wdt:P236 ?key',
    key: items => items.map(item => item.ISSN)
  },
  orcid: {
    value: '?value wdt:P496 ?key',
    key: items => items.flatMap(item => (item.author || []).map(getOrcid))
  },
  language: {
    value: '?value wdt:P218 ?key',
    key: items => items.map(item => item.language)
  }
}

function unique (array) {
  return array.filter((value, index, array) => array.indexOf(value) === index)
}

function buildQuery (type, items) {
  const { key, value } = QUERY_BUILDERS[type]
  const keys = '"' + unique(key(items)).join('" "') + '"'
  return `{ VALUES ?key { ${keys} } . ${value} . BIND("${type}" AS ?cache) }`
}

export function fillCaches (csl) {
  // initialize caches
  const caches = {}
  for (const cache in QUERY_BUILDERS) {
    caches[cache] = {}
  }

  // fill caches
  const queries = Object.keys(QUERY_BUILDERS).map(type => buildQuery(type, csl)).join(' UNION ')
  const query = `SELECT ?key ?value ?cache WHERE { ${queries} }`

  try {
    const url = wdk.sparqlQuery(query)
    const response = JSON.parse(util.fetchFile(url))
    const results = wdk.simplify.sparqlResults(response)

    for (const { key, value, cache } of results) {
      caches[cache][key] = value
    }
  } catch (e) {
    logger.error(e)
  }

  return caches
}
