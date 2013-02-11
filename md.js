var markdownobj = require('markdown').markdown
var jsonml = require('./jsonml');
var markdown = {}

markdown.read = function (source,toDOM,toParent) {
	var res = jsonml.read(markdownobj.toHTMLTree(source),toDOM,toParent);
	res.shift();
	return res;
}

markdown.render = null;

module.exports = markdown;