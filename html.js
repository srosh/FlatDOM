var domarr = require('./dom.arr');
var DOM = require('./dom');

var render = function (dom,notab)
{
	var res = '';
	var tail = [];
	var special={'!--':'-->'};
	var singletons=['!DOCTYPE','area','base','br','col','command','embed','hr','img','input','link','meta','param','source'];
	var urlAttrs=['src','href'];
	var quotedAttr = function (attr) {
		var val = tag.sttrs[attr];
		if (val.indexOf('"')) {
			if (urlAttrs.indexOf(attr)>-1) return val.replace(/\"/g,'%22');
			else return val.replace(/\"/g,'&quot;');
		} else return val;
	}
	var pad = function (plus) {
		var temp='';
		plus = plus || 0;
		if (!notab && res.length && res[res.length-1]=='>') {
			temp += '\n';
			while (temp.length<tail.length+plus) temp+='\t';
		}
		return temp;
	}
	var handleTag = function (tag) {
		if (res.length &&  res[res.length-1]=='>') res+=pad(1);
		res += '<' + tag.name ;
		for (var arg in tag.attrs){
			if (typeof(tag.attrs[arg])=='boolean' && tag.attrs[arg]) res += ' ' + arg;
			else res += ' ' + arg + '="' + tag.attrs[arg] + '"';
		}
		if (singletons.indexOf(tag.name)>-1) {
			res += '>';
			if (tag.textAfter) {
				res += tag.textAfter;
			}
		} else if (special[tag.name]) {
			var after ='';
			if (tag.text) res += tag.text;
			if (tag.textAfter) after = tag.textAfter;
			res += special[tag.name] + after;
		} else {
			res += '>';
			var after ='';
			if (tag.text) {
				res += tag.text;
				if (tag.textAfter) after = tag.textAfter;
			}
			tail.unshift([ tag.name ,after,tag.parent]);
		}
	}
	// var lparent = dom.name.parent;
	for( var i=0;i<dom.length;i++){
		var line = dom[i];
		var cparent = line.parent;
		// if(tail.length > 0 && lparent >= cparent){}
		while (tail.length > 0 && tail[0][2] >= cparent) {
			var tailShift= tail.shift();
			var toClose = tailShift.shift()
				,textAfter = tailShift.shift();
			if (res.substr(-(toClose.length+2))=='<'+toClose+'>') res += '</' + toClose + '>' + textAfter;
			else res += pad(1) + '</' + toClose + '>' + textAfter;
		}
		handleTag(line);
		// lparent = cparent;
	}
	while (tail.length > 0) {
		var tailShift= tail.shift();
		var toClose = tailShift.shift()
			,textAfter = tailShift.shift();
		res += pad(1) + '</' + toClose + '>' + textAfter;
	}
	return res;
}

var read = function (chunk,dom,options) {
	var intersect = function (a1, a2) { //a1,a2 are sorted
		var i1=0, i2=0, res = [];
		while( i1 < a1.length && i2 < a2.length ) {
			if (a1[i1] < a2[i2] ){ i1++; }
			else if (a1[i1] > a2[i2] ){ i2++; }
			else {
				res.push(a1[i1]); i1++; i2++;
			}
		}
		return res;
	}
	// consts
	var commentOpen = '!--', commentClose = '--';
	var ignoreInside=['script','style'];
	var singletons=['!doctype','area','base','br','col','command','embed','hr','img','input','link','meta','param','source'];
	var openChar='<', closeChar='>',qChar='\'',dqChar='"',sChar='\\',xChar = '!' , eqChar = '=' , closeTagChar = '/';
	var whiteSpace=/\s/;
	var forceAttrsToLower = ['id','class','src','href'];
	// end consts
	// options.working = true;
	var getLastParent = function() {
		if (options.lastParent > -1) return dom[options.lastParent];
		else return null;
	}
	getLastParent = getLastParent.bind(options);
	var getLastChild = function() {
		if (options.lastChild > -1) return dom[options.lastChild];
		else return null;
	}
	getLastChild = getLastChild.bind(options);
	var revertFromIgnore = function() { //assume ignore=true;
		if (options.comment) return false;
		var lastTag = dom.last;
		if (lastTag) {
			if (options.lastChild != options.lastParent) {
				if (lastTag.textAfter) lastTag.textAfter += options.ignoredText;
				else lastTag.textAfter = options.ignoredText; 
			} else {
				if (lastTag.text) lastTag.text += options.ignoredText;
				else lastTag.text = options.ignoredText; 
			}
			
			options.ignoredText = '';
			options.mode = 0;
			options.onTag = false;
			options.tag = lastTag;
			return true;
		} // no last child
		return false;
	}
	revertFromIgnore = revertFromIgnore.bind(options);
	var isEndOfComment = function() { 
		return (options.tag.text) && (options.tag.text.length >= commentClose.length ? (options.tag.text.substr(-commentClose.length) == commentClose) : false);
	}
	isEndOfComment = isEndOfComment.bind(options);



	for (var i = 0; i < chunk.length; i++) {
		var currentChar=chunk[i];
		var takeChar=true;
		if (!options.comment && options.ignore && options.onTag) {
			options.ignoredText += currentChar;
		};

		switch (currentChar) {
			case openChar: {
				if (!options.onTag && !options.comment) { // && !(options.openQuote || options.openDoubleQuote)) {
					options.tag = domarr.makeTag([],'',{},options.lastParent);
					options.onTag = true;
					options.mode = 1;
					takeChar = false;
				}
			} break;
			case closeChar: {
				if (options.onTag) { // && !(options.openQuote || options.openDoubleQuote)) {
					if (options.comment) {
						if (isEndOfComment()) {
							//close comment and push tag
							dom.push(options.tag);
							options.lastChild = options.tag.index;
							options.lastParent = options.tag.parent;
							options.tag.closed = true;
							options.tag.text = options.tag.text.substr(0,options.tag.text.length - commentClose.length);
							options.onTag = false;
							options.closerTag = false;
							takeChar = false;
							options.mode = 0;
							options.lastAttr ='';
							options.comment = false;
							options.openQuote = false; options.openDoubleQuote = false;
						}
					} else {
						if (options.ignore) {
							// console.log(options.tag.name,dom.last.name,dom.last.sParent.name);
							if (options.closerTag && ignoreInside.indexOf(options.tag.name) > -1 && (dom.last.name == options.tag.name || dom.last.sParent.name == options.tag.name)) {
								//close ignore tag and not push
								if (!dom.last.closed && dom.last.name == options.tag.name) {
									options.tag = dom.last;
								} else if (dom.last.closed && dom.last.sParent.name == options.tag.name) {
									options.tag = dom.last.sParent;
								}
								options.tag.closed = true;
								options.lastParent = options.tag.parent;
								options.lastChild = options.tag.index;
								options.ignore = false;
								options.ignoredText = '';
								options.onTag = false;
								takeChar = false;
							} else revertFromIgnore();
							//console.log(options.closerTag , ignoreInside.indexOf(options.tag.name) > -1 ,dom.last.name == options.tag.name , dom.last.parent.name == options.tag.name);
						} else {
							//normal tags: push, check if ignore tag
							if (options.closerTag) {
								var openTags = dom.openTags;
								var checkedTags = [];
								var found = false;
								while (openTags.length>1 && !found) {
									var index = openTags.pop();
									if (dom[index].name == options.tag.name) {
										found = true;
										options.tag = dom[index];
										while (checkedTags.length >0) checkedTags.pop().closed = true;
									} else checkedTags.push(dom[index]);
								}
								if (found) {
									options.lastChild = options.tag.index;
									options.lastParent = options.tag.parent;
									options.tag.closed = true;
								} //else error
								options.onTag = false; 
								// if content are to be treated as text
								options.closerTag = false;
								takeChar = false;
								// set options.mode back to text
								options.mode = 0;
								options.lastAttr ='';
								options.openQuote = false; options.openDoubleQuote = false;
							} else {
								dom.push(options.tag);
								var myIndex = options.tag.index;
								if (options.lastChar==closeTagChar || singletons.indexOf(options.tag.name)>-1) options.tag.closed = true;
								else options.lastParent = myIndex;
								options.lastChild = myIndex;
								options.onTag = false; 
								// if content are to be treated as text
								options.ignore = ignoreInside.indexOf(options.tag.name) == -1 ? false : true; 
								// reset closer options.tag
								options.closerTag = false;
								takeChar = false;
								if (options.mode==2 && options.lastAttr.length > 0) {
									if (forceAttrsToLower.indexOf(options.lastAttr.toLowerCase())>-1) options.lastAttr = options.lastAttr.toLowerCase();
									options.tag.attrs[options.lastAttr] = true;
								}
								// set options.mode back to text
								options.mode = 0;
								options.lastAttr ='';
								options.openQuote = false; options.openDoubleQuote = false;
							}
						}
					}
				} 
				//console.log(options.onTag,options.tag.name, options.ignore , options.comment , isEndOfComment());
			} break;
			case closeTagChar: {
				if (options.onTag && !options.comment &&  !(options.openQuote || options.openDoubleQuote)) { // removed !options.ignore
					if(options.lastChar==openChar) options.closerTag = true;
					takeChar = false;
				};
			} break;
			case eqChar: {
				if (options.onTag && !options.comment && !(options.openQuote || options.openDoubleQuote)) { // removed !options.ignore
					if (options.mode == 2) options.mode = 3; //else error


					if (forceAttrsToLower.indexOf(options.lastAttr.toLowerCase())>-1) options.lastAttr = options.lastAttr.toLowerCase();
					options.tag.attrs[options.lastAttr] = '';

					takeChar = false;
				}
			} break;
			case qChar: {
				if ((options.onTag || options.ignore) && !options.comment) {
					options.openQuote = options.openDoubleQuote ? options.openQuote : (options.slashed ? options.openQuote : !options.openQuote);
					takeChar = options.ignore || options.openDoubleQuote;
				}
			} break;
			case dqChar: {
				if ((options.onTag || options.ignore) && !options.comment) {
					options.openDoubleQuote = options.openQuote ? options.openDoubleQuote : (options.slashed ? options.openDoubleQuote : !options.openDoubleQuote);
					takeChar = options.ignore || options.openQuote;
				}
			} break;
			default: {} break;
		}
		//if (!options.onTag) options.mode = 0;
		if (options.comment) {
			if (options.tag.text) options.tag.text += currentChar;
			else options.tag.text = currentChar;
		} else {
			switch (options.mode) {
					case 0: {
						if (takeChar) {
							var target = options.lastChild > -1 ? dom[options.lastChild] : options.tag ;
							if (options.lastChild == options.lastParent) {
								if (target.text) target.text += currentChar; //inside
								else target.text=currentChar;
							} else if (options.lastParent < options.lastChild) {
								if (target.textAfter) target.textAfter += currentChar; //after
								else target.textAfter=currentChar;
							}
							//if (!options.ignore) lastResolved = i;
						}
					} break; //text
					case 1: {
						if (!whiteSpace.test(currentChar) && takeChar) {
							options.tag.name += currentChar.toLowerCase();
							if (options.tag.name == commentOpen) {options.comment = true; options.mode = 0;} //options.mode not ness
						} else if (options.tag.name.length > 0) {
							options.mode=2;
						}
					} break; //tagname
					case 2: {
						if (!whiteSpace.test(currentChar) && takeChar) {
							if (options.tag.attrs[options.lastAttr]) options.lastAttr = '';
							options.lastAttr += currentChar;
						} else {
							if (options.lastAttr.length > 0) {
								if (forceAttrsToLower.indexOf(options.lastAttr.toLowerCase())>-1) options.lastAttr = options.lastAttr.toLowerCase();
								options.tag.attrs[options.lastAttr] = true;
							}
						}
					} break; //attrname
					case 3: {
						if ((!whiteSpace.test(currentChar) || options.openQuote || options.openDoubleQuote) && takeChar) {
							options.tag.attrs[options.lastAttr] += currentChar;
						} else if (options.tag.attrs[options.lastAttr].length>0){
							options.lastAttr = '';
							options.mode = 2;
						}
					} break; //attrval
				}
			}
		if(options.openQuote || options.openDoubleQuote){
			if (currentChar==sChar) options.slashed=!options.slashed;
			else options.slashed = false;
		} else options.slashed = false;
		if (!whiteSpace.test(currentChar)) options.lastChar = currentChar;
		if (options.comment) options.lastTwoChars = (options.lastTwoChars + currentChar).substr(-2);
		else options.lastTwoChars = '';
		//if (options.mode >0 && !options.onTag) options.mode = 0; // track if there's an err
	};
}


function HTML () {
	DOM.apply(this,arguments);
}
require('util').inherits(HTML,DOM);

HTML.prototype.read = function(source,toParent) {
	read(source,this.dom,toParent);
	return this;
}
HTML.prototype.render = function() {
	return render(this.dom);
}

HTML.read = read;
HTML.render = render;



module.exports = HTML;