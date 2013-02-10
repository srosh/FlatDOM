var domarr = require('./dom.arr')
	,jsonml = {};

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
				tag.attrs = next;
			}
		}
	} else throw new Error('not a valid jsonml array')
}

jsonml.read = function (source) {
	if (typeof source == 'string') {
		source = JSON.parse(source);
	}

	var res = domarr.makeDOM([]);
	el(source,res,-1);
	return res;
}

jsonml.render = function (dom) {
	
}

module.exports = jsonml;