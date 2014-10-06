#!/usr/bin/env node
;(function () { // wrapper in case we're in module_context mode

"use strict";

var path    = require('path');
var fs      = require('fs');
var args    = require('minimist')(process.argv.slice(2));
var glob    = require('glob');
var cache   = new (require('inmemfilecache'));
var marked  = require('marked');
var Feed    = require('feed');
var Promise = require('Promise');
var sitemap = require('sitemap');
var utils   = require('./utils');

process.title = "build";

var executeP = Promise.denodeify(utils.execute);

/**
 * Replace %(id)s in strings with values in objects(s)
 *
 * Given a string like `"Hello %(name)s from $(user.country)s"`
 * and an object like `{name:"Joe",user:{country:"USA"}}` would
 * return `"Hello Joe from USA"`.
 *
 * @param {string} str string to do replacements in
 * @param {Object|Object[]} params one or more objects.
 * @returns {string} string with replaced parts
 */
var replaceParams = (function() {
  var replaceParamsRE = /%\(([^\)]+)\)s/g;

  return function(str, params) {
    if (!params.length) {
      params = [params];
    }

    return str.replace(replaceParamsRE, function(match, key) {
      var keys = key.split('.');
      for (var ii = 0; ii < params.length; ++ii) {
        var obj = params[ii];
        for (var jj = 0; jj < keys.length; ++jj) {
          var key = keys[jj];
          obj = obj[key];
          if (obj === undefined) {
            break;
          }
        }
        if (obj !== undefined) {
          return obj;
        }
      }
      console.error("unknown key: " + key);
      return "%(" + key + ")s";
    });
  };
}());


var Builder = function() {

  var g_articles = [];

  var readFile = function(fileName) {
    return cache.readFileSync(fileName, "utf-8");
  };

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
    var template = readFile(templatePath);
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
    content = replaceParams(content, opt_extra || {});
    content = content.replace(/__PERCENT__/g, '%');
    var html = marked(content);
    metaData['content'] = html;
    metaData['src_file_name'] = contentFileName;
    metaData['dst_file_name'] = outFileName;
    metaData['basedir'] = ""
    var output = replaceParams(template,  metaData);
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

  this.process = function() {
    applyTemplateToFiles("templates/lesson.template", "webgl/lessons/*.md")

    var toc = [];
    g_articles.forEach(function(article) {
      toc.push('<li><a href="' + article.dst_file_name + '">' + article.title + '</a></li>');
    });

    var promises = g_articles.map(function(article, ndx) {
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
    });

    Promise.all(promises).then(function() {
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

      articles.forEach(function(article) {
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
      applyTemplateToFile("templates/index.template", "index.md", "index.html", {
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

}());

