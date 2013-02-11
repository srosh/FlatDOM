var markdownobj = require('markdown').markdown
var JSONML = require('./jsonml');
var DOM = require('./dom');

var read = function (source,toDOM,toParent) {
	var res = JSONML.read(MarkDownobj.toHTMLTree(source));
	res.shift();
	if (toDOM) {
		//var parent = (toParent===undefined ? toDOM.openTags.pop() : toParent);
		toDOM.append(res,toParent);
		return toDOM;
	}
	return res;
}

function MarkDown () {
	DOM.apply(this,arguments);
}
require('util').inherits(MarkDown,DOM);

MarkDown.prototype.read = function(source,toParent) {
	read(source,this.dom,toParent);
}

MarkDown.read = read;

module.exports = MarkDown;