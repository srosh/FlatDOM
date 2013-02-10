var markdownobj = require('markdown').markdown
var jml = require('./jsonml');
var markdown = {}

markdown.read = function (source) {
	var dom = jml.read(markdownobj.toHTMLTree(source));
	dom.shift();
	return dom;
}

markdown.render = null;

module.exports = markdown;