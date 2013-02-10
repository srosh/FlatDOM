var domarr = require('./dom.arr.js');

var html   = require('./html.js')
var emmet  = require('./emmet.js');
var jsonml = require('./jsonml.js');
var md     = require('./md.js');

exports.html = html;
exports.emmet = emmet;
exports.jsonml = jsonml;
exports.md = md;


exports.select = require('./dom.select.js');

exports.read    = {
	html   : function () {},
	emmet  : emmet.read,
	jsonml : jsonml.read,
	md     : md.read
}
exports.render  = {
	html   : html.render,
	jsonml : jsonml.render
}