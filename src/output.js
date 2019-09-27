let {format} = require('@citation-js/date')

const props = {
  Len: 'title',

  P304: 'page',
  P356: 'DOI',
  P433: 'issue',
  P478: 'volume',
  P698: 'PMID',
  P932: 'PMCID',
  P1476: 'title',
  P577: 'issued'
}

function serialize (prop, value) {
  switch (prop) {
    case 'page':
      return value.replace('--', '-')
    case 'issued':
      return format(value)

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
        if (item.author) {
          for (var auCounter = 0; auCounter < item.author.length; auCounter++) {
            var author = item.author[auCounter];
            var name = "";
            if (author.given) name = name + author.given + ' ';
            if (author.family) name = name + author.family + ' ';
            if (name.trim().length > 0) {
              output = output + '\tLAST\tP2093\t\"' + name.trim() +
                '\"\tP1545\t\"' + (auCounter+1) + '\"\t\n';
            }
          }
        }
      }
    }
    return output
  }
}
