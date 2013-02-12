var domarr = require('./dom.arr.js');
var DOM = require('./dom');


var read = function (source,toDOM,toParent) //add target
{
	var res = toDOM || domarr.makeDOM([]);
	var openbranch = 0;
	var multi = '';
	var temp = '';
	var brackets = '';
	var targetText = 0; // tag
	var parent = (toParent===undefined ? res.openTags.pop() : toParent);
	var current = domarr.makeTag([],'',{},parent);

	var flush = function(pos)
	{
		var resolve$ = function (from,nstr) {
			return from.duplicate(function(af,at){
				for (key in af) {
					var val = af[key];
					var dollars = val.match(/[\$]+/);
					if (dollars) for (var j = 0; j < dollars.length; j++) {
						var pad = '';
						for (var k=0; k< dollars[j].length - nstr.length ; k++) {pad += '0';}
						val = val.replace(dollars[j],pad+nstr);
					}
					at[key] = val;
				}
			});
		}
		var children = null;
		if (current.children) {
			children = current.children;
			delete current.children;
		}
		if (multi.length>0) {
			var m = parseInt(multi);
			if(!isNaN(m)) {
				for (var i = 0; i < m; i++) {
					var nstr = (i+1).toString();
					if (current.name.length>0) {
						res.push(resolve$(current,nstr));
					} else if (children) {
						var childnodes = domarr.makeDOM([]);
						for (var j = 0; j < children.length; j++) {
							var newTag = resolve$(children[j],nstr);
							childnodes.push(newTag);
						}
						res.append(childnodes); //.each(function(tag){tag.closed=true;})
					}
					if (source.length > pos && source[pos]=='>') {
						res.append(read(source.substring(pos+1)));
					}
					var lastParentTag=res.last;
					while (lastParentTag && lastParentTag.index > parent) {
						lastParentTag.closed=true;
						lastParentTag = lastParentTag.sParent;
					}
				}
			}
		} else if (current.name.length>0){
			res.push(current);
		} else if (children) {
			res.append(children);
			if (current.closed) {
				var lastParentTag=res.last;
				while (lastParentTag && lastParentTag.index > parent) {
					lastParentTag.closed=true;
					lastParentTag = lastParentTag.sParent;
				}
			}
		}
		targetText = 0;
		multi = '';
		brackets = '';
		parent = res.openTags.pop();
		current = domarr.makeTag([],'',{},parent); //console.log (current.parent,res.openTags);
	}
	var addChar = function(ch) // can move () here
	{
		switch (targetText) {
			case 0: //tag
			current.name += ch;
			break;
			case 1: //class
			if (!current.attrs['class']) current.attrs['class']='';
			current.attrs['class'] +=ch;
			break;
			case 2: //id
			if (!current.attrs['id']) current.attrs['id']='';
			current.attrs['id'] +=ch;
			break;
			case 3: //args
			brackets += ch;
			break;
			case 4: //multi
			multi += ch;
			break;
			case 5: //text
			if (current.text) current.text+=ch;
			else current.text = ch;
			default:
		}
	}
	var readbrackets = function ()
	{
		var key = '';
		var val = true;
		var openquote = false;
		var slashed = false;
		var valactive = false;
		var keyactive = true;
		for (var i = 0; i < brackets.length; i++) {
			var b = brackets[i];
			if (!openquote && b==' ' && key.length > 0 && keyactive) {
				current.attrs[key] = true;
				keyactive = false;
			} else if (b=='"' && !slashed) {
				openquote = !openquote;
				valactive = openquote;
			} else if (valactive) {
				current.attrs[key] += b;
			} else if (!openquote && b=='=') {
				valactive = true;
				keyactive = false;
				current.attrs[key] = '';
			} else if (b!=' ') {
				if (!keyactive) {
					key = '';
					keyactive = true; valactive = false;
				}
				key += b;
			}
			if (b=='\\') slashed = !slashed;
			else slashed = false;
		}
		if (key.length > 0 && keyactive) {
			current.attrs[key] = true;
		}
	}
	var charIsSlashed = false;
	// parentesies
	for (var i=0; i<source.length ; i++)
	{
		var currentChar = source[i];
		if (currentChar=='(' && !charIsSlashed) {
			openbranch ++;
			if (openbranch>1) {
				temp += '(';
			}
		} else if (currentChar==')' && !charIsSlashed) {
			openbranch --;
			if (openbranch == 0) {
				current.children = read(temp);
				temp = ''; //clear temp
			} else if (openbranch == -1) {
				//bad string
			} else if (openbranch>0) {
				temp += ')';
			}
		} else if (openbranch > 0) temp += currentChar ;
		else {
			if (charIsSlashed) {
				addChar(currentChar);
				charIsSlashed=false;
			} else if (currentChar=='\\') {
				charIsSlashed=true;
			} else if (currentChar==']' && targetText==3) { 
				targetText = 0;
				readbrackets();
				brackets = '';
			} else if (targetText == 3) {
				addChar(currentChar);
			} else if (currentChar=='}' && targetText==5) {
				targetText = 0;
			} else if (currentChar=='{' && targetText<3) {
				targetText = 5;
			} else if (currentChar=='[' && targetText<3) {
				targetText = 3;
			} else if (currentChar == '+' && targetText<3) {
				current.closed = true;
				flush(i);
			} else if (currentChar == '^' && targetText<3) {
				if (current.name) {
					current.closed = true;
					flush(i);
				} else {
					res[current.parent].closed = true;
					parent = res.openTags.pop();
					current.parent = parent;
				}
			} else if (currentChar == '>' && targetText<3) {
				if (multi.length>0) {
					flush(i);
					return res;
				} else flush(i);
			} else if (currentChar == '.' && targetText<3) {
				targetText = 1;
				if (current.attrs['class']) addChar(' ');
			} else if (currentChar == '#' && targetText<3) {
				targetText = 2;
			} else if (currentChar == '*' && targetText<3) {
				targetText = 4;
			} else {
				addChar(currentChar);
			}
		}
	}
	flush(source.length);
	return res;
}

function Emmet () {
	DOM.apply(this,arguments);
}
require('util').inherits(Emmet,DOM);

Emmet.prototype.read = function(source,toParent) {
	read(source,this.dom,toParent);
}

Emmet.read = read;

Emmet.render = function (dom) { return null; }

// Emmet.expand = function (abbrText,abbrsObj) {
// 	var ret = abbrText;
// 	for (var key in abbrsObj) {
// 		var reg = new RegExp(key+'(?=[>+\]\[\^\.#{}]|$)','g')
// 		ret = ret.replace(reg,abbrsObj[key]);
// 	}
// 	return ret;
// }
Emmet.html5 = function () {
	return '!DOCTYPE[html]+html';
}
Emmet.cssLink = function (uri) {
	return 'link[rel="stylesheet" type="text/css" href="'+uri+'"]^';
}
Emmet.jsLink = function (uri) {
	return 'script[src="'+uri+'"]^';
}
Emmet.text = function (text) {
	return '{'+text.replace(/[{}()\[\]\\]/g,'\\'+'$&')+'}';
}
Emmet.script = function (text) {
	return 'script[type="text/javascript"]'+Emmet.text(text)+'^';
}
Emmet.join = function (arr) {
	return arr.join('+');
}

module.exports = Emmet;