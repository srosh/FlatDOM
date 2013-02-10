var domarr = require('./dom.arr.js');
var util = require('util');

var Tag    = function (){}
var DOM    = function (){
	// switch from 
	//   if
	this.arr = domarr.makeDOM([])
}

var html   = function (){}
var emmet  = require('./emmet.js');
var jsonml = function (){}


var select = require('./dom.select.js');
exports.makeTag = domarr.makeTag;
exports.makeDOM = domarr.makeDOM;
exports.read    = {
	html   : function () {},
	emmet  : emmet.read,
	jsonml : function () {}
}
exports.render  = {
	html   : function (dom) {},
	emmet  : emmet.render,
	jsonml : function (dom) {}
}