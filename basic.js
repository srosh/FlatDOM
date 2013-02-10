var addChild = function (arr,child,parent,toend,cutoff)
{
	arr = arr === undefined ? [] : arr;
	toend = toend === undefined ? false : toend;
	parent = parent === undefined ? arr.length - 1 : parent ;
	var res = arr.slice(0,parent+1);
	var rest = arr.slice(parent+1);
	if (toend){
		while (rest.length>0 && rest[0].parent>=parent) {
			var target = rest.shift();
			res.push(target);
		}
	}
	var offset = res.length;
	if (cutoff) cutoff(offset);
	for (var c in child) {
		var target=[];
		for (var key in child[c]) target[key] = child[c][key];
		if (target.parent==-1) target.parent = parent; 
		else target.parent += offset;
		res.push(target);
	}
	for (var c in rest) {
		var target=[];
		for (var key in rest[c]) target[key] = child[c][key];
		target.parent += target.parent > parent ? child.length : 0;
		res.push(target);
	}
	return res;
}

var emmet = function (stremmet,parent)
{
	var res = [];
	var openbranch = 0;
	var multi = '';
	var temp = '';
	var brackets = '';
	var targetText = 0; // tag
	parent = parent === undefined ? -1 : parent;
	var current = []; //['',{},parent];
	current.name = '';
	current.attrs = {};
	current.parent = parent;
	var flush = function(pos)
	{
		var resolve$ = function (from,nstr) {
			var newTag = []; //[from[0],{},from[2]];
			newTag.attrs = {};
			for (var key in from) { if(key!='attrs') newTag[key] = from[key]; }
			for (var key in from.attrs) {
				var val = from.attrs[key];
				var dollars = val.match(/[\$]+/);
				if (dollars) for (var j = 0; j < dollars.length; j++) {
					var pad = '';
					for (var k=0; k< dollars[j].length - nstr.length ; k++) {pad += '0';}
					val = val.replace(dollars[j],pad+nstr);
				}
				newTag.attrs[key] = val;
			}
			return newTag;
		}
		var children = null;
		if (current.children) {
			children = current.children;
			delete current.children;
		};
		if (multi.length>0) {
			var m = parseInt(multi);
			if(!isNaN(m)) {
				for (var i = 0; i < m; i++) {
					var nstr = (i+1).toString();
					if (current.name.length>0) res.push(resolve$(current,nstr));
					else if (children) {
						var childnodes = [];
						for (var j = 0; j < children.length; j++) {
							childnodes.push(resolve$(children[j],nstr));
						};
						res = addChild(res,childnodes,parent,true)
					}
					if (stremmet.length > pos && stremmet[pos]=='>') res = addChild(res,emmet(stremmet.substring(pos+1)));
				}
			}
		} else if (current.name.length>0){
			res.push(current);
		} else if (children) res = addChild(res,children,parent,true);
		targetText = 0;
		multi = '';
		brackets = '';
		current = [] //'',{},parent];
		current.name = '';
		current.attrs = {};
		current.parent = parent;
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
			default:
		}
	}
	var readbrackets = function ()
	{
		var key = '';
		var val = '';
		var openquote = false;
		var slashed = false;
		var valactive = false;
		for (var i = 0; i < brackets.length; i++) {
			var b = brackets[i];
			if (!openquote && b==' ' && key.length > 0) {
				current.attrs[key] = val;
				key='';
				val='';
				valactive = false;
			} else if (b=='"' && !slashed) {
				openquote = !openquote;
			} else if (valactive) {
				val += b;
			} else if (!openquote && b=='=') {
				valactive = true;
			} else {
				key += b;
			}
			if (b=='\\') slashed = !slashed;
			else slashed = false;
		}
		if (key.length > 0) {
			current.attrs[key] = val;
			key='';
			val='';
			valactive = false;
		}
	}

	// parentesies
	for (var i=0; i<stremmet.length ; i++)
	{
		var cc = stremmet[i];
		if (cc=='(') {
			openbranch ++;
			if (openbranch>1) {
				temp += '(';
			}
		} else if (cc==')') {
			openbranch --;
			if (openbranch == 0) {
				//res = addChild(res,emmet(temp),parent,true); // res.concat(emmet(temp,parent));
				current.children = emmet(temp);
				temp = ''; //clear temp
			} else if (openbranch == -1) {
				//bad string
			} else if (openbranch>0) {
				temp += ')';
			}
		} else if (openbranch > 0) temp += cc ;
		else {
			
			if (cc==']') { 
				targetText = 0;
				readbrackets();
				brackets = '';
			} else if (targetText == 3) {
				addChar(cc);
			} else if (cc=='[') {
				targetText = 3;
			} else if (cc == '+') {
				flush(i);
			} else if (cc == '>') {
				if (multi.length>0) {
					flush(i);
					return res;
				}
				flush(i);
				parent=res.length-1;
				current.parent=parent;
			} else if (cc == '.') {
				targetText = 1;
				if (current.attrs['class']) addChar(' ');
			} else if (cc == '#') {
				targetText = 2;
			} else if (cc == '*') {
				targetText = 4;
			} else {
				addChar(cc);
			}
		}
	}
	flush(stremmet.length);
	return res;
}

var render = function (arr)
{
	var res = '';
	var tail = [];
	var special={'!--':'-->'};
	var singletons=['!doctype','area','base','br','col','command','embed','hr','img','input','link','meta','param','source'];
	var urlAttrs=['src','href'];
	var quotedAttr = function (attr) {
		var val = tag.sttrs[attr];
		if (val.indexOf('"')) {
			if (urlAttrs.indexOf(attr)>-1) return val.replace(/\"/g,'%22');
			else return val.replace(/\"/g,'&quot;');
		} else return val;
	}
	var handleTag = function (tag) {
		res += '<' + tag.name ;
		for (var arg in tag.attrs){
			if (typeof(tag.attrs[arg])=='boolean' && tag.attrs[arg]) res += ' ' + arg;
			else res += ' ' + arg + '="' + tag.attrs[arg] + '"';
		}
		if (singletons.indexOf(tag.name)>-1) {
			res += ' />';
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
			tail.unshift(['</' + tag.name + '>'+after,tag.parent]);
		}
	}
	// var lparent = arr.name.parent;
	for( var i=0;i<arr.length;i++){
		var line = arr[i];
		var cparent = line.parent;
		// if(tail.length > 0 && lparent >= cparent){}
		while (tail.length > 0 && tail[0][1] >= cparent) res += tail.shift().shift();
		handleTag(line);
		// lparent = cparent;
	}
	while (tail.length > 0) res += tail.shift().shift();
	return res;
}

var domobj = function (flatdom)
{
	var res = {'flat':flatdom,'classes':{},'ids':{},'tags':{}};
	for (var i = 0; i < flatdom.length; i++) {
		var line=flatdom[i];
		var tag =line.name;
		var id = line.attrs['id']===undefined ? null : line.attrs['id'];
		var classes = line.attrs['class']===undefined ? [] : line.attrs['class'].split(' ');
		if (tag){
			if (res.tags[tag]) res.tags[tag].push(i);
			else res.tags[tag] = [i];
			if (id) res.ids[id]=i;
			while (classes.length>0){
				className = classes.pop();
				if (res.classes[className]) res.classes[className].push(i);
				else res.classes[className] = [i];
			}
		}
	}
	return res;
}

var select = require('./dom.select.js').sel;

var handle = function(dom,mobj){
	var flat = dom.flat;
	var sel = mobj.sel ? mobj.sel : (mobj.target ? select(dom,mobj.target) : []);
	if(!mobj || sel.length == 0) return dom;
	switch (mobj.type) {
		case 'add':
		var nodes = null;
		if(mobj.emmet) nodes = emmet(mobj.emmet);
		else if(mobj.flat) nodes = mobj.flat ;
		if(nodes) {
			for (var i = 0; i < sel.length; i++) {
				var offset = i*nodes.length;
				flat = addChild(flat,nodes,sel[i]+offset,true);
			}
			return domobj(flat);
		}
		break;
		case 'set':
		if(mobj.attr) {
			for (var i = 0; i < sel.length; i++) {
				for (var key in mobj.attr) {
					flat[sel[i]][1][key] = mobj.attr[key];
				}
			}
		}
		if(mobj.text) {
			for (var i = 0; i < sel.length; i++) {
				flat[sel[i]].text = mobj.text;
			}
		}
		break;
	}
	if(mobj.rebuild) return domobj(flat);
	else {
		dom.flat = flat;
		return dom;
	}
}

var domObject = function () {
	var len=arguments.length;
}

domObject.prototype.type = "Basic.Dom";


//exports.sampleemmet='html>(head>link[rel]+(b>link.boo$[href]*1)+script)+(body>(div.out.gooz[a=1 b=" l "]>(div#in>img[src="boo.jpg"]+qq.boo#soo.too[ad="\\"\\"\\b"])+(div.another$$*3+(div.another$$$$*5>img#t$$*2+br*3)+div.another+(p.o+p.b)))+p#text)';
//exports.samplehtml=[['html',{},-1],['head',{},0],['body',{},0],['div',{class:'.out'},2],['div',{id:'#in'},3],['$plain',{text:'yoyo'},2]];
exports.hand=handle;
exports.zen=emmet;
exports.select=select;
exports.dom=domobj;
exports.rndr=render;
exports.addchild=addChild;