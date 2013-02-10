var domarr = require('./dom.arr.js');

var html   = require('./html.js')
var emmet  = require('./emmet.js');
var jsonml = require('./jsonml.js');
var md     = require('./md.js');


var select = require('./dom.select.js');

exports.read    = {
	html   : function () {},
	emmet  : emmet.read,
	jsonml : jsonml.read,
	md     : md.read
}
exports.render  = {
	html   : function (dom) {},
	emmet  : emmet.render,
	jsonml : jsonml.render
}