
module.exports = function () { // wrapper in case we're in module_context mode

"use strict";

var args       = require('minimist')(process.argv.slice(2));
var cache      = new (require('inmemfilecache'));
var Feed       = require('feed');
var fs         = require('fs');
var glob       = require('glob');
var Handlebars = require('handlebars');
var marked     = require('marked');
var path       = require('path');
var Promise    = require('Promise');
var sitemap    = require('sitemap');
var utils      = require('./utils');

//process.title = "build";

var executeP = Promise.denodeify(utils.execute);

marked.setOptions({
  rawHtml: true,
  //pedantic: true,
});

function applyObject(src, dst) {
  Object.keys(src).forEach(function(key) {
    dst[key] = src[key];
  });
  return dst;
}

function mergeObjects() {
  var merged = {};
  Array.prototype.slice.call(arguments).forEach(function(src) {
    applyObject(src, merged);
  });
  return merged;
}

function readFile(fileName) {
  return cache.readFileSync(fileName, "utf-8");
}

function replaceParams(str, params) {
  var template = Handlebars.compile(str);
  if (Array.isArray(params)) {
    params = mergeObjects.apply(null, params.slice.reverse());
  }

  return template(params);
}

function TemplateManager() {
  var templates = {};

  this.apply = function(filename, params) {
    var template = templates[filename];
    if (!template) {
      var template = Handlebars.compile(readFile(filename));
      templates[filename] = template;
    }

    if (Array.isArray(params)) {
      params = mergeObjects.apply(null, params.slice.reverse());
    }

    return template(params);
  };
}

var templateManager = new TemplateManager();

Handlebars.registerHelper('include', function(filename, options) {
  return templateManager.apply(filename, options.data.root);
});

Handlebars.registerHelper('example', function(options) {

  options.hash.width  = options.hash.width || "400";
  options.hash.height = options.hash.height || "300";

  return templateManager.apply("build/templates/example.template", options.hash);
});

Handlebars.registerHelper('diagram', function(options) {

  options.hash.width  = options.hash.width || "400";
  options.hash.height = options.hash.height || "300";

  return templateManager.apply("build/templates/diagram.template", options.hash);
});

var Builder = function() {

  var g_articles = [];

  var writeFileIfChanged = function(fileName, content) {
    if (fs.existsSync(fileName)) {
      var old = readFile(fileName);
      if (content == old) {
        return;
      }
    }
    fs.writeFileSync(fileName, content);
    console.log("Wrote: " + fileName);
  };

  var extractHeader = (function() {
    var headerRE = /([A-Z0-9_-]+): (.*?)$/i;

    return function(content) {
      var metaData = { };
      var lines = content.split("\n");
      while (true) {
        var line = lines[0].trim();
        var m = headerRE.exec(line);
        if (!m) {
          break;
        }
        metaData[m[1].toLowerCase()] = m[2];
        lines.shift();
      }
      return {
        content: lines.join("\n"),
        headers: metaData,
      };
    };
  }());

  var loadMD = function(contentFileName) {
    var content = cache.readFileSync(contentFileName, "utf-8");
    return extractHeader(content);
  };

  var applyTemplateToFile = function(templatePath, contentFileName, outFileName, opt_extra) {
    console.log("processing: ", contentFileName);
    opt_extra = opt_extra || {};
    var data = loadMD(contentFileName);
    // Call prep's Content which parses the HTML. This helps us find missing tags
    // should probably call something else.
    //Convert(md_content)
    var metaData = data.headers;
    var content = data.content;
    //console.log(JSON.stringify(metaData, undefined, "  "));
    content = content.replace(/%\(/g, '__STRING_SUB__');
    content = content.replace(/%/g, '__PERCENT__');
    content = content.replace(/__STRING_SUB__/g, '%(');
    content = replaceParams(content, opt_extra);
    content = content.replace(/__PERCENT__/g, '%');
    var html = marked(content);
    metaData['content'] = html;
    metaData['src_file_name'] = contentFileName;
    metaData['dst_file_name'] = outFileName;
    metaData['basedir'] = "";
    metaData['url'] = "http://webglfundamentals.org/" + outFileName;
    metaData['screenshot'] = "http://webglfundamentals.org/webgl/lessons/resources/webglfundamentals.jpg";
    var basename = path.basename(contentFileName, ".md");
    [".jpg", ".png"].forEach(function(ext) {
      var filename = path.join("webgl", "lessons", "screenshots", basename + ext);
      if (fs.existsSync(filename)) {
        metaData['screenshot'] = "http://webglfundamentals.org/webgl/lessons/screenshots/" + basename + ext;
      }
    });

    var output = templateManager.apply(templatePath,  metaData);
    writeFileIfChanged(outFileName, output)
    g_articles.push(metaData);
  };

  var applyTemplateToFiles = function(templatePath, filesSpec) {
    var files = glob.sync(filesSpec);
    files.forEach(function(fileName) {
      var ext = path.extname(fileName);
      var baseName = fileName.substr(0, fileName.length - ext.length);
      var outFileName = baseName + ".html";
      applyTemplateToFile(templatePath, fileName, outFileName);
    });

  };

  this.process = function(filespec) {
    filespec = filespec || "*.md";
    applyTemplateToFiles("build/templates/lesson.template", "webgl/lessons/" + filespec)

    var toc = [];
    g_articles.forEach(function(article) {
      toc.push('<li><a href="' + article.dst_file_name + '">' + article.title + '</a></li>');
    });

    var tasks = g_articles.map(function(article, ndx) {
      return function() {
        return executeP('git', [
          'log',
          '--format="%ci"',
          '--name-only',
          '--diff-filter=A',
          article.src_file_name,
        ]).then(function(result) {
          var dateStr = result.stdout.split("\n")[0];
          article.date = new Date(Date.parse(dateStr));
        });
      };
    });

    tasks.reduce(function(cur, next){
        return cur.then(next);
    }, Promise.resolve()).then(function() {
      var articles = g_articles.filter(function(article) {
        return article.date != undefined;
      });
      articles = articles.sort(function(a, b) {
        return a.date > b.date ? -1 : (a.date < b.date ? 1 : 0);
      });

      var feed = new Feed({
        title:          'WebGL Fundamentals',
        description:    'Learn WebGL from the ground up. No magic',
        link:           'http://webglfundamentals.org/',
        image:          'http://webglfundamentals.org/webgl/lessons/resources/webglfundamentals.jpg',
        updated:        articles[0].date,
        author: {
          name:       'Greggman',
          link:       'http://games.greggman.com/',
        },
      });

      var sm = sitemap.createSitemap ({
        hostname: 'http://webglfundamentals.org',
        cacheTime: 600000,
      });

      articles.forEach(function(article, ndx) {
        feed.addItem({
          title:          article.title,
          link:           "http://webglfundamentals.org/" + article.dst_file_name,
          description:    "",
          author: [
            {
              name:       'Greggman',
              link:       'http://games.greggman.com/',
            },
          ],
          // contributor: [
          // ],
          date:           article.date,
          // image:          posts[key].image
        });
        sm.add({
          url: "http://webglfundamentals.org/" + article.dst_file_name,
          changefreq: 'monthly',
        });
      });
      try {
        writeFileIfChanged("atom.xml", feed.render('atom-1.0'));
        writeFileIfChanged("sitemap.xml", sm.toString());
      } catch (err) {
        return Promise.reject(err);
      }
      return Promise.resolve();
    }).then(function() {
      applyTemplateToFile("build/templates/index.template", "index.md", "index.html", {
        table_of_contents: "<ul>" + toc.join("\n") + "</ul>",
      });
      process.exit(0);  //
    }, function(err) {
      console.error("ERROR!:");
      console.error(err);
      if (err.stack) {
        console.error(err.stack);
      }
    });
  };

};

var b = new Builder();
b.process();
cache.clear();

};

