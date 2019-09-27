export default {
  quickstatements (csl) {
    var output = ""
    for(var i = 0; i < csl.length; i++) {
      var item = csl[i];
      if (item.type == "article-journal") {
        output = output + '\tCREATE\n\n\tLAST\tP31\tQ13442814\n';
        if (item.DOI) output = output + '\tLAST\tP356\t\"' + item.DOI + '\"\n';
        if (item.title) {
          output = output + '\tLAST\tP1476\t\"' + item.title + '\"\n';
          output = output + '\tLAST\tLen\t\"' + item.title + '\"\n';
        }
        if (item.PMID) output = output + '\tLAST\tP698\t\"' + item.PMID + '\"\n';
        if (item.PMCID) output = output + '\tLAST\tP932\t\"' + item.PMCID + '\"\n';
      }
    }
    return output
  }
}
