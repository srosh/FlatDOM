FlatDOM
===
## What is it
This is a module for manipulating HTML/XML DOM using server-side JavaScript (Node.js). 

## Motivation
A simple representation of DOM objects (as a flat array) makes it much easier to view and manipulate data. The motivation behind this project is to provide an easy and fast way to find elements within DOM and make it easy to import/export different representations of the DOM data.

## Usage
    var fdom = require('flatdom');
    var htmldom = new fdom.html()
        ,mddom = new fdom.md()
        ,jsonmldom = new fdom.jasonml()
        ,emmetdom = new fdom.emmet();
multiple parsers can share the same DOM array, for example:

    var emmetdom = new fdom.emmet();
        ,htmldom = new fdom.html(emmetdom);
        
in this case both `emmetdom` and `htmldom` have access to the same DOM array. whatever either of them parse will be appended to this DOM. also when a renderer is used (i.e. `htmldom.render()`) the same shared DOM tree is rendered. this is particularly useful for generating an HTML page from multiple sources like markdown, emmet and plain HTML snippets.

each dom object is basically a handler for underlying DOM array. all dom objects are extended from `fdom.dom` and they should at the very least override the `.read(source)` method. `.readFile(filename)` and `.read(source)` are to be used for parsing and `.render()` and `.writeFile(filename)` are used to invoke the renderer. 

following the last example with `emmetdom` and `htmldom` sharing the same DOM:

    emmetdom.read('div.container>p#top{hello}');
    htmldata = htmldom.render();

renders the HTML representation (`'<div class="container"><p id="top">hello</p></div>'`) into `htmldata`.

## Selection
`fdom.dom.select(selectors)' is shared between all handlers but the returned object is 
