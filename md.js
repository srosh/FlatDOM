var markdownobj = require('markdown').markdown
var jml = require('./jsonml');
var markdown = {}

markdown.read = function (source,toDOM,toParent) {
	var res = jml.read(markdownobj.toHTMLTree(source),toDOM,toParent);
	res.shift();
	return res;
}

markdown.render = null;

module.exports = markdown;