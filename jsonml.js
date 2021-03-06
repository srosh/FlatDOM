var domarr = require('./dom.arr');
var DOM = require('./dom');

function el(arr,dom,parent) {
	if (arr instanceof Array) {
		var tag = domarr.makeTag([],arr.shift(),{},parent);
		parent = dom.push(tag)-1;
		while (arr.length>0) {
			var next = arr.shift();
			if (next instanceof Array) {
				el(next,dom,parent);
			} else if (typeof next == 'string') {
				if (dom.last==tag) tag.text = next;
				else dom.last.textAfter = next;
			} else {
				tag.syncDOM(function(target){target.attrs = next;});
			}
		}
	} else throw new Error('not a valid JSONML array')
}

var read = function (source,toDOM,toParent) {
	if (typeof source == 'string') {
		source = JSON.parse(source);
	}
	var res = toDOM || domarr.makeDOM([]);
	var parent = (toParent===undefined ? res.openTags.pop() : toParent);
	el(source,res,parent);
	return res;
}

var render = function (dom) {
	var res = [],element=[],parent=res,grandparents={'-1':parent};
	for (var i = 0; i < dom.length; i++) {
		element = [];
		var tag = dom[i];
		parent=grandparents[tag.parent];
		element.push(tag.name);
		if(Object.keys(tag.attrs).length>0) element.push(tag.attrs);
		if(tag.text) element.push(tag.text)
		parent.push(element);
		grandparents[tag.index] = element;
		if(tag.textAfter) parent.push(tag.textAfter);
	};
	return res.length>1 ? res : res[0];
}



function JSONML () {
	DOM.apply(this,arguments);
}
require('util').inherits(JSONML,DOM);

JSONML.prototype.read = function(source,toParent) {
	read(source,this.dom,toParent);
	return this;
}
JSONML.prototype.render = function() {
	return render(this.dom);
}

JSONML.read = read;
JSONML.render = render;
module.exports = JSONML;