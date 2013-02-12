var dom   = require('./dom.js')
var html   = require('./html.js')
var emmet  = require('./emmet.js');
var jsonml = require('./jsonml.js');
var md     = require('./md.js');



module.exports.dom = dom;
module.exports.html = html;
module.exports.emmet = emmet;
module.exports.jsonml = jsonml;
module.exports.md = md;


module.exports.select = require('./dom.select.js');

// module.exports.read    = {
// 	html   : function () {},
// 	emmet  : emmet.read,
// 	jsonml : jsonml.read,
// 	md     : md.read
// }
// module.exports.render  = {
// 	html   : html.render,
// 	jsonml : jsonml.render
// }


