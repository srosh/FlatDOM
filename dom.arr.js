// domarr.js

var getIndex = function () {
	if (this.sDOM && this.sDOM.isDOM) return this.sDOM.indexOf(this);
	else return -1;
}
var getParent = function () {
	if (this.sParent) return this.sParent.index;
	else if (this.tempParentIndex !== undefined) return this.tempParentIndex;
	else return -1;
}
var setParent = function (index) {
	if (this.sDOM && index < this.sDOM.length) { //length?
		this.sParent = this.sDOM[index];
	} else if (!this.sDOM) {
		this.tempParentIndex = index;
	}
}
var syncDOM = function (cb) {
	dom = this.sDOM;
	this.leaveDOM();
	if (cb) cb(this);
	this.joinDOM(dom);
}
var leaveDOM = function () {
	dom = this.sDOM;
	// remove form dom index
	// tags index
	var tagIndices = dom.tags[this.name]
		,tagIndex = tagIndices.indexOf(this);
	if (tagIndex>-1) delete tagIndices[tagIndex];
	// id index
	if (this.attrs['id']) { delete dom.ids[this.attrs['id']]; } 

	// class index
	if (this.attrs['class']) {
		var classNames = this.attrs['class'].split(' ');
		while (classNames.length>0) {
			var className = classNames.shift();
			if (className) {
				var classIndices = dom.classes[className]
					,classIndex = classIndices.indexOf(this);
				if (classIndex>-1) delete classIndices[classIndex];
			}
		}
	}

	for (key in this.attrs) {
		if (key!='class' && key!='id') {
			var attrIndices = dom.attributes[key]
				,attrIndex = attrIndices.indexOf(this);
			if (attrIndex>-1) delete attrIndices[attrIndex];
		}
	}
	this.sDOM = null;
}
var joinDOM = function (dom) {
	if (dom.isDOM) {
		this.sDOM = dom;
		if (this.tempParentIndex !== undefined) {
			this.parent = this.tempParentIndex;
			delete this.tempParentIndex;
		}
		// building tags index
		if (!dom.tags[this.name]) dom.tags[this.name] = [this];
		else dom.tags[this.name].push(this);  

		// building id index
		if (this.attrs['id']) { dom.ids[this.attrs['id']] = this; } 

		// building class index
		if (this.attrs['class']) {
			var classNames = this.attrs['class'].split(' ');
			while (classNames.length>0) {
				var className = classNames.shift();
				if (className) {
					if (!dom.classes[className]) dom.classes[className] = [this];
					else dom.classes[className].push(this);
				}
			}
		}

		for (key in this.attrs) {
			if (key!='class' && key!='id') {
				if (!dom.attributes[key]) dom.attributes[key] = [this];
				else dom.attributes[key].push(this);
			}
		}
	} else throw {no:10,desc:'you can only add tags to a DOM Array'};
}
var duplicate = function (acb) {
	var dup = maketag([],this.name,{},this.parent);
	if (this.text) dup.text = this.text;
	if (this.textAfter) dup.textAfter = this.textAfter;
	if (this.closed !== undefined) dup.closed = this.closed;
	if (acb) acb(this.attrs,dup.attrs);
	else {
		for (var key in this.attrs) {
			dup.attrs[key] = this.attrs[key];
		}
	}
	return dup;
}

var maketag = function (tag,name,attrs,parent,text,textAfter) {
	if (!(tag instanceof Array)) throw {no:1,desc:'tag must be an instanceof Array'};
	tag.isTag = true;
	tag.sDOM = tag.sDOM || null;
	Object.defineProperty(tag, 'index',  {get: getIndex,set: undefined});
	Object.defineProperty(tag, 'parent', {get: getParent,set: setParent});
	tag.joinDOM = joinDOM;
	tag.syncDOM = syncDOM; // use when changing attributes/tagname to reindex dom
	tag.leaveDOM = leaveDOM;
	tag.duplicate = duplicate;
	if (name !== undefined && name !== null) tag.name = name;
	if (attrs !== undefined && attrs !== null) tag.attrs = attrs;
	if (parent !== undefined && parent !== null) tag.parent = parent;
	if (text !== undefined && text !== null) tag.text = text;
	if (textAfter !== undefined && textAfter !== null) tag.textAfter = textAfter;
	return tag;
}


var getLastTag = function () {
	return (!this.isEmpty ? this[this.length-1] : null);
}
var getFirstTag = function () {
	return (!this.isEmpty ? this[0] : null);	
}
var isEmpty = function () {
	return this.length == 0; 
}
var availableParentIndices = function () {
	var available = [];
	var tag = this.last
	while (tag) {
		if (!tag.closed) available.unshift(tag.index);
		tag = (tag.sParent ? tag.sParent : null);
	}
	available.unshift(-1);
	return available; // ascending list of parent indices
}

var firstChild = function (parentIndex) {
	var parent = this[parentIndex];
	var next = parent.next;
	if (!next || (next.index - parent.index == 1)) return null;
	else {
		return this[parentIndex+1];
	}
}
var lastChild  = function (parentIndex) {
	var parent = this[parentIndex];
	var next = parent.next;
	if (!next || (next.index - parent.index == 1)) return null;
	else {
		return this[next.index-1];
	}
}

var append = function (dom,toParent) {
	if (dom.isDOM) {
		var lastIndex = (toParent===undefined ? this.openTags.pop() : toParent);
		var closedTags = [];
		while (dom.length > 0) {
			var tag = dom.shift();
			if (lastIndex > -1 && tag.parent == -1) tag.parent = lastIndex;
			if (tag.closed) {
				closedTags.push(tag);
				tag.closed = false;
			}
			//console.log(tag.parent,lastIndex,tag.tempParentIndex);
			this.push(tag);
		}
		while (closedTags.length > 0) {
			var tag = closedTags.pop();
			tag.closed = true;
		}
	}
}
var push = function (tag) {
	if (tag.isTag) {
		tag.joinDOM(this);
		if (tag.sParent && tag.sParent.isDOM) tag.sParent.push(tag);
		else {
			if (!this.isEmpty) {
				var openTags = this.openTags;
				var parentIndexInOpenTags = openTags.indexOf(tag.parent);
				var parent = tag.parent;
				if (parentIndexInOpenTags>-1) {
					if (parentIndexInOpenTags<openTags.length-1) {
						tag.prev = this[openTags[parentIndexInOpenTags + 1]];
						tag.prev.next = tag;
					} else if (openTags.length == 1) {
						tag.prev = this.first;
						tag.prev.next = tag;
					}
				} else {
					this.tree('html',-1);
					console.log(tag.parent,tag.name,tag.attrs);
					throw {no:13,desc:'parent not available',obj:tag};
				}
			}
			return this.__proto__.push.call(this,tag);
			// return this.__proto__.push(tag);
		}
	} else throw {no:3,desc:'you can only push tags to DOM, try maketag'}
}
var unshift = function (tag) {
	if (tag.isTag) {
		tag.joinDOM(this);
		var child = this.first;
		//var temp = dom.__proto__.unshift(tag);
		var temp = this.__proto__.unshift.call(this,tag);
		while (child) {
			child.sParent = tag;
			child = (child.next ? child.next : null);
		}
		return temp;
	} else throw {no:3,desc:'you can only unshift tags to DOM, try maketag'}
}
var shift = function () {
	var tag = this.__proto__.shift.call(this);
	tag.leaveDOM();
	return tag;
}
var pop = function () {
	var tag = this.__proto__.pop.call(this);
	tag.leaveDOM();
	return tag;
}

var map = function (key,cb) {
	var res = [];
	if (!this[key]) return res;
	if (this[key] instanceof Array) {
		for (var i=0;i<this[key].length;i++) {
			res.push(cb(this[key][i]));
		}	
	} else {
		res.push(cb(this[key]));
	}
	return res;
}
var tagIndex = function(tag){return tag.index;}
var indices = function (key) {
	if (this[key]) {
		return this.map(key,tagIndex);
	} else {
		return [];
	}
}
var sel = require('./dom.select.js').sel;
var select = function (selectors) {
	return sel(this,selectors);
}

var each = function (cb) {
	if (cb) {
		for (var i = 0; i < this.length; i++) {
			cb(this[i]);
		}
	}
	return this;
}

var sortFunc = function(a,b) {
	if (a.parent == b.parent) return 0;
	else if (a.parent < b.parent) {
		if (a.index <= b.parent) return -1;
		else return 1;
	} else {
		if (a.parent >= b.index) return 1;
		else return -1;
	}
}

// last.parent || last
var makedom = function (dom) {
	if (!(dom instanceof Array)) throw {no:2,desc:'DOM must be an instanceof Array'};
	dom.isDOM = true;
	dom.tags = dom.tags || {};
	dom.tags.map = map; dom.tags.indices = indices;
	dom.classes = dom.classes || {};
	dom.classes.map = map; dom.classes.indices = indices;
	dom.ids = dom.ids || {};
	dom.ids.map = map; dom.ids.indices = indices;
	dom.attributes = dom.attributes || {};
	dom.attributes.map = map; dom.attributes.indices = indices;
	dom.select = select;
	dom.each = each;
	dom.append = append;
	dom.tree = tree;
	Object.defineProperty(dom, 'isEmpty',  {get: isEmpty,set: undefined});
	Object.defineProperty(dom, 'last',  {get: getLastTag,set: undefined});
	Object.defineProperty(dom, 'first',  {get: getFirstTag,set: undefined});
	Object.defineProperty(dom, 'openTags',  {get: availableParentIndices,set: undefined});
	dom.push = push.bind(dom);
	dom.pop = pop;
	dom.firstChild = firstChild;
	dom.lastChild = lastChild;
	dom.unshift = unshift.bind(dom);
	dom.shift = shift;
	dom.log = function () {
		var tmp = '';
		for (var i = 0; i < this.length; i++) {
			tmp+= this[i].name + this[i].index +' : ';
		}
		console.log (tmp);
	}
	return dom;
}

var expand = function(indices,dom,level) {
	var res = [];
	level = (level === undefined) ? -1 : level;
	for (var i = 0; i < indices.length; i++) {
		var node = [];
		if (node.indexOf(dom[indices[i]])==-1) {
			node.push(dom[indices[i]]);
			var parentLevels = [[indices[i],1]];
			for (var j = indices[i]+1; j < dom.length && dom[j].parent >= indices[i] && (level!=0); j++) {
				if (level==-1 && node.indexOf(dom[j])==-1) node.push(dom[j]);
				else if (level > 0 && parentLevels.length > 0) {
					for (var k = parentLevels.length -1; k >= 0 ; k--) {
						if (dom[j].parent == parentLevels[k][0]) {
							if (node.indexOf(dom[j])==-1) {
								node.push(dom[j]);
								if (parentLevels[k][1]<level) parentLevels.push([j,parentLevels[k][1]+1]);
							}
							break;
						} else if (dom[j].parent < parentLevels[k][0]) {
							parentLevels.pop();
						}
					}
				}
			}
		}
		res.push(node);
	}
	return res;
}

var tree = function (selectors,depth) {
	if (!selectors) return ;
	depth = (depth === undefined) ? 0 : depth ;

	var expanded = expand (this.select(selectors),this,depth);
	var res = '';
	var attrs = function (obj) {
		var res = '';
		for (var key in obj) {
			if (obj[key]!==true) {
				res +=  ' '+key+' = "'+obj[key]+'" ';
			} else res += ' '+key+' ';
		}
		return res;
	}
	var pad = function (howmany,what) {
		var temp = '';
		for (var i = 0; i < howmany; i++) {
			temp += what;
		};
		return temp;
	}
	var itemno = 1;
	while (expanded.length >0) {
		var expnddItem = expanded.shift();
		var level = 0;
		var lparent = false;
		while (expnddItem.length >0) {
			var cur = expnddItem.shift();
			if (lparent===false) {
				lparent = [];
				res += '@';
			} else if (lparent.length>0 && lparent[0] > cur.parent) {
				while (lparent.length>0 && lparent[0] > cur.parent) {
					lparent.shift();
					level--;
				}
				res += pad(level,'    |')+'\n' + pad(level-1,'    |')+'    @';
			} else if (lparent.length>0 && lparent[0] == cur.parent) {
				res += pad(level,'    |')+'\n' + pad(level-1,'    |')+'    @';
			} else if (lparent.length==0 || lparent[0] < cur.parent) {
				level++;
				res += pad(level,'    |')+'\n' + pad(level-1,'    |')+'    @';
				lparent.unshift(cur.parent);
			}	

			res += '_' + itemno +'_/'+cur.name +' '+cur.index+':'+cur.parent+' '+ attrs(cur.attrs)+'\n';
			itemno++
		}
		while (lparent.length>0) {
			lparent.shift();
			//res += '\n';
		}
	}
	console.log(res);
	//return res;
}

exports.makeDOM = makedom;
exports.makeTag = maketag;