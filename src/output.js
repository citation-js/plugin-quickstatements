const props = {
  Len: 'title',

  P304: 'page',
  P356: 'DOI',
  P433: 'issue',
  P478: 'volume',
  P698: 'PMID',
  P932: 'PMCID',
  P1476: 'title'
}

function serialize (prop, value) {
  switch (prop) {
    case 'page':
      return value.replace('--', '-')

    default: return value
  }
}

export default {
  quickstatements (csl) {
    var output = ""
    for(var i = 0; i < csl.length; i++) {
      var item = csl[i];
      if (item.type == "article-journal") {
        output = output + '\tCREATE\n\n\tLAST\tP31\tQ13442814\n';

        for (const wd in props) {
          const prop = props[wd]
          const value = item[prop]

          if (value == null) continue

          const serializedValue = serialize(prop, value)

          if (serializedValue == null) continue

          output += `\tLAST\t${wd}\t"${serializedValue}"\n`
        }
      }
    }
    return output
  }
}
