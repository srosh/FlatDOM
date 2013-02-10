var select = function (dom,selectors,selection)
{
	var empty = [];
	var intersect = function (a1, a2) //a1,a2 are sorted
	{
		var i1=0, i2=0, res = [];
		while( i1 < a1.length && i2 < a2.length )
		{
			if (a1[i1] < a2[i2] ){ i1++; }
			else if (a1[i1] > a2[i2] ){ i2++; }
			else {
				res.push(a1[i1]); i1++; i2++;
			}
		}
		return res;
	}
	var decompose = function (str)
	{
		var temp = ['','','',''];
		var target = 0;
		for (var i = 0; i < str.length; i++) {
			if (str[i]=='#') target = 2;
			else if (str[i]==':') target = 3;
			else if (str[i]=='.') {target = 1; temp[1] += temp[1].length>0 ? ' ' : '';}
			else temp[target] += str[i];
		}
		return {'tag':temp[0],'classes':temp[1].split(' '),'id':temp[2],'pseudo':temp[3]};
	}
	var expand = function (sel,directChildren)
	{
		var res = [];
		directChildren = directChildren || false;
		var acceptable = function (par,cur){
			return (directChildren ? par==cur : par>=cur);
		}
		for (var i = 0; i < sel.length; i++) {
			if (res.indexOf(sel[i])==-1) {
				for (var j = sel[i]+1; j < dom.length && dom[j].parent>=sel[i]; j++) {
					if(res.indexOf(j) ==-1 && acceptable(dom[j].parent, sel[i])) res.push(j);
				}
			}
		}
		return res;
	}
	var pseudo = function (pse) {
		var tests = [/^eq\(([0-9]+)\)$/,'first-child','last-child'];
		if (pse) {
			for (var i = 0; i < tests.length; i++) {
				var answer = (typeof(tests[i]) == 'string') ? pse == tests[i] : pse.match(tests[i]);
				if (answer) {
					return {'test':i,'match':answer};
				}
			}
		}
		return {'test':-1};
	}

	if (selection === undefined) {
		selection =[];
		for (var i = 0; i < dom.length; i++) {
			selection.push(i);
		}
	} else {
		if (selectors && selectors[0] == '>') {
			selection = expand(selection,true);
			selectors.shift();
		} else if (selectors && selectors[0] == '*') {
			if (selection.length < dom.length) selection = expand(selection);
			selectors.shift();
		} else selection = expand(selection);
	}
	if (selectors === undefined || selectors.length == 0) return selection; //not array?
	if ('string' == typeof(selectors)) {
		if(selectors.indexOf(',')>-1){
			//merge(select(part[0]),select(rest))
		}else{
			selectors = selectors.replace('>',' > ');
			selectors = selectors.replace('*',' * ');
			selectors = selectors.split(/[\s]+/);
			if (selectors.length > 0 && selectors[0].length==0) selectors.shift();
			if (selectors.length > 0 && selectors[selectors.length-1].length==0) selectors.pop();
		}
	}
	//selectors=selectors.split(' ');
	var selector = decompose(selectors.shift());
	if (selector.tag) {
		if (!dom.tags[selector.tag]) return empty;
		else selection = intersect(selection,dom.tags.indices(selector.tag));
	} console.log(selection);
	if (selector.id) {
		if (!dom.ids[selector.id]) return empty;
		else selection = intersect(selection,dom.ids.indices(selector.id));
	} console.log(selection,dom.ids.indices(selector.id),selector.id);
	while (selector.classes.length>0 && selector.classes[0]) {
		var className = selector.classes.shift();
		if (!dom.classes[className]) return empty;
		else selection = intersect(selection,dom.classes.indices(className));
	}
	if (selector.pseudo) {
		var pse = selector.pseudo;
		if (parseInt(pse).toString()==pse) { //index
			var index = parseInt(pse);
			if (index < selection.length) { selection = [selection[index]] };
		} else {
			var test = pseudo(pse);
			switch (test.test) {
				case -1: break;
				case 0: selection = [selection[parseInt(test.match[1])]];
				break;
				case 1:
				case 2: 
				{
					var tempSelection = [];
					for (var s in selection) {
						if ((test.test==1 && !dom[selection[s]].prev) || (test.test==2 && !dom[selection[s]].next)) tempSelection.push(selection[s]);
					}
					selection = tempSelection;
				}
				break;
			}
		}
	}
	if (selectors.length>0) return select(dom,selectors,selection);
	else return selection;
}


module.exports = select;