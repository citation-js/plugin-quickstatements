export default {
  quickstatements (csl) {
    var output = ""
    console.log("foo")
    for(var i = 0; i < csl.length; i++) {
      var item = csl[i];
      output = output + '\tCREATE\n\n\tLAST\tP31\tQ13442814\n';
    }
    return output
  }
}
