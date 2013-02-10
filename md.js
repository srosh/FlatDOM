var markdownobj = require('markdown').markdown
var jml = require('./jsonml');
var markdown = {}

markdown.read = function (source) {
	return jml.read(markdownobj.toHTMLTree(source));
}

markdown.render = null;

module.exports = markdown;