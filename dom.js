var domarr = require('./dom.arr.js');
var fs = require('fs');
function DOM (arrDOM,parentHead) {
	if (arrDOM) {
		if (arrDOM instanceof DOM) this.dom = arrDOM.dom;
		else this.dom = arrDOM;
		var open = this.dom.openTags;
		if (parentHead && open.indexOf(parentHead)) {
			var index;
			while (index = open.pop() && parentHead<index) {
				this.dom[index].closed = true;
			}
		}
	} else {
		this.dom = DOM.newDOM();
	}
}

DOM.prototype = {
	readFile: function (fn,toParent) {
		return this.read(fs.readFileSync(fn,'utf-8'),toParent);
	},
	read   : function (source,toParent) {
		if (source instanceof DOM ) {
			this.dom.append(source.dom,toParent);
		} else if (source.isDOM) {
			this.dom.append(source,toParent);
		} else if (typeof source == 'string') {
			var last = this.dom.last;
			if (last) {
				if (toParent && last.index>toParent) {
					var target = this.dom.lastChild(toParent);
					if (target) target.textAfter = (target.textAfter ? target.textAfter+source : source);
					else this.dom[toParent].text = (this.dom[toParent].text ? this.dom[toParent].text+source : source);
				} else {
					last.text = (last.text ? last.text+source : source);
				}
			}
		}
		return this; // ready to chain;
	},
	render : function () {
		return this.dom;
	},
	writeFile: function (fn) {
		fs.writeFileSync(fn,this.render());
		return this;
	}
}

DOM.newDOM = function () {
	return domarr.makeDOM([]);
}

module.exports = DOM;