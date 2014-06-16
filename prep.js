#!/usr/bin/env node

var htmlparser = require("htmlparser2");
var mout = require("mout");
var fs = require("fs");

var MyHTMLParser = function(options) {
  options = options || {};
  var g_marker = "---paragraph---";
  var g_markerRE = /---paragraph---/g;
  var g_backtickRE = /`(.*?)`/g;
  var g_depth = 0
  var g_text = []
  var g_tags = []
  var g_depthPrefix = ""

  var parser = new htmlparser.Parser({
      onopentag: function(tag, attrs) {
        g_depthPrefix = g_depthPrefix + "  ";
        if (options.debug) {
          console.log(g_depthPrefix + "<" + tag);
        }
        g_tags.push(tag);
        g_text.push("<");
        g_text.push(tag);
        Object.keys(attrs).forEach(function(key) {
          var value = attrs[key];
          if (key == "href") {
            if (mout.string.endsWith(value, ".html") && value.indexOf("/") < 0) {
              value = "/game/" + value.substring(0, value.length - 5) + "/";
            } else {
              value = "/downloads/examples/webgl/lessons/" + value;
            }
          } else if (key == "class") {
            value = value.replace("webgl_", "gman_");
          } else if (key == "src") {
            value = "/downloads/examples/webgl/lessons/" + value;
          }
          g_text.push(" " + key + '="' + value + '"');
        });
        g_text.push(">");
      },
      ontext: function(data) {
        if (g_tags.length == 0 || g_tags[g_tags.length] == "p") {
          if (data.length > 1) {
            data = data.replace(/\n\n/g, g_marker);
            data = data.replace(/\n/g, " ");
            data = data.replace(g_markerRE, "\n\n");
          }
        } else if (data == "\n") {
          return;
        }
        data = data.replace(/</g, "&lt;")
        data = data.replace(/>/g, "&gt;")
        data = data.replace(g_backtickRE, "<code>$1</code>");
        g_text.push(data);
      },
      onclosetag: function(tag) {
        if (options.debug) {
          console.log(g_depthPrefix + tag + ">");
        }
        if (g_tags.pop() != tag) {
          throw "bad closing tag: " + tag;
        }
        g_text.push("</");
        g_text.push(tag);
        g_text.push(">");
        g_depthPrefix = g_depthPrefix.substr(2);
      },
      onopentagend:            function() { console.log("onopentagend:           ", arguments); },
      omselftagclosing:        function() { console.log("omselftagclosing:       ", arguments); },
      onattribname:            function() { console.log("onattribname:           ", arguments); },
      onattribend:             function() { console.log("onattribend:            ", arguments); },
      onattributedata:         function() { console.log("onattributedata:        ", arguments); },
      ondeclaration:           function() { console.log("ondeclaration:          ", arguments); },
      onprocessinginstruction: function() { console.log("onprocessinginstruction:", arguments); },
      oncomment:               function() { console.log("oncomment:              ", arguments); },
      oncdata:                 function() { console.log("oncdata:                ", arguments); },

      onattribute:             function() { console.log("onattribute:             ", arguments); },
      oncdatastart:            function() { console.log("oncdatastart:            ", arguments); },
      oncdataend:              function() { console.log("oncdataend:              ", arguments); },
      onprocessinginstruction: function() { console.log("onprocessinginstruction: ", arguments); },
      oncomment:               function() { console.log("oncomment:               ", arguments); },
      oncommentend:            function() { console.log("oncommentend:            ", arguments); },
      onopentagname:           function() { console.log("onopentagname:           ", arguments); },
      onerror:                 function() { console.log("onerror:                 ", arguments); },
      onend:                   function() { console.log("onend:                   ", arguments); },

  }, {strict: true});

  this.feed = function(data) {
    parser.write(data);
    parser.end();
  };

  this.data = function() {
    return g_text.join("");
  };
};

var convert = function(data, options) {
  var parser = new MyHTMLParser(options);
  parser.feed(data);
  return parser.data();
};

var main = function(argv) {
  var data = fs.readFileSync(argv[2], "utf-8");
  data = data.substring(data.indexOf("\n") + 1);  // removes title
  data = data.substring(data.indexOf("\n") + 1);  // removes blank line after title
  data = convert(data, {debug: true});
  console.log(data);
};

if (!module.parent) {
  process.title = 'prep';
  main(process.argv.slice(), function(err, code) {
    if (err) throw err;
    return process.exit(code || 0);
  });
} else {
  module.exports = convert;
}
