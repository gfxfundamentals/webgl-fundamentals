(function() {  // eslint-disable-line strict
'use strict';  // eslint-disable-line strict

function dirname(path) {
  const ndx = path.lastIndexOf('/');
  return path.substring(0, ndx + 1);
}

function getPrefix(url) {
  const u = new URL(url, window.location.href);
  const prefix = u.origin + dirname(u.pathname);
  return prefix;
}

function fixSourceLinks(url, source) {
  const srcRE = /(src=)"(.*?)"/g;
  const linkRE = /(href=)"(.*?)"/g;
  const imageSrcRE = /((?:image|img)\.src = )"(.*?)"/g;
  const loadImageRE = /(loadImageAndCreateTextureInfo)\(('|")(.*?)('|")/g;
  const loadImagesRE = /loadImages(\s*)\((\s*)\[([^]*?)\](\s*),/g;
  const loadGLTFRE = /(loadGLTF\(')(.*?)(')/g;
  const urlPropRE = /(url:\s*)('|")(.*?)('|")/g;
  const quoteRE = /"(.*?)"/g;
  const workerRE = /(new\s+Worker\s*\(\s*)('|")(.*?)('|")/g;
  const importScriptsRE = /(importScripts\s*\(\s*)('|")(.*?)('|")/g;
  const prefix = getPrefix(url);

  function addPrefix(url) {
    return url.indexOf('://') < 0 && url[0] !== '?' ? (prefix + url) : url;
  }
  function makeLinkFQed(match, p1, url) {
    return p1 + '"' + addPrefix(url) + '"';
  }
  function makeLinkFQedQuote(match, p1, url, p2) {
    return `${p1}${addPrefix(url)}${p2}`;
  }
  function makeLinkFDedQuotes(match, fn, q1, url, q2) {
    return fn + q1 + addPrefix(url) + q2;
  }
  source = source.replace(srcRE, makeLinkFQed);
  source = source.replace(linkRE, makeLinkFQed);
  source = source.replace(imageSrcRE, makeLinkFQed);
  source = source.replace(urlPropRE, makeLinkFDedQuotes);
  source = source.replace(workerRE, makeLinkFDedQuotes);
  source = source.replace(importScriptsRE, makeLinkFDedQuotes);
  source = source.replace(loadImageRE, function(match, fn, q1, url, q2) {
    return fn + '(' + q1 + addPrefix(url) + q2;
  });
  source = source.replace(loadImagesRE, function(match, p1, p2, p3, p4) {
      p3 = p3.replace(quoteRE, function(match, p1) {
          return '"' + addPrefix(p1) + '"';
      });
      return `loadImages${p1}(${p2}[${p3}]${p4},`;
  });
  source = source.replace(loadGLTFRE, makeLinkFQedQuote);

  return source;
}

function extraHTMLParsing(html, htmlParts) {
  const hasCanvasInCSSRE = /canvas/;
  const hasCanvasStyleInHTMLRE = /<canvas[^>]+?style[^>]+?>/;

  // add css if there is none
  if (!hasCanvasInCSSRE.test(htmlParts.css.sources[0].source) && !hasCanvasStyleInHTMLRE.test(htmlParts.html.sources[0].source)) {
    htmlParts.css.sources[0].source = `body {
  margin: 0;
}
canvas {
  width: 100vw;
  height: 100vh;
  display: block;
}
` + htmlParts.css.sources[0].source;
  }

  return html;
}

function fixJSForCodeSite(js) {
  if (/requestCORS/.test(js)) {
    return js;
  }

  let found = false;
  js = js.replace(/^( +)(img|image)(\.src = )(.*?);.*?$/mg, function(match, indent, variable, code, url) {
    found = true;
    return `${indent}requestCORSIfNotSameOrigin(${variable}, ${url})
${indent}${variable}${code}${url};`;
  });
  if (found) {
    js += `

// This is needed if the images are not on the same domain
// NOTE: The server providing the images must give CORS permissions
// in order to be able to use the image with WebGL. Most sites
// do NOT give permission.
// See: http://webglfundamentals.org/webgl/lessons/webgl-cors-permission.html
function requestCORSIfNotSameOrigin(img, url) {
  if ((new URL(url)).origin !== window.location.origin) {
    img.crossOrigin = "";
  }
}
`;
  }
  return js;
}

window.lessonEditorSettings = {
  extraHTMLParsing,
  fixSourceLinks,
  fixJSForCodeSite,
  runOnResize: true,
  lessonSettings: {
    glDebug: true,
  },
  tags: ['webgl', 'webglfundamentals.org'],
  name: 'WebGLFundamentals',
  icon: '/webgl/lessons/resources/webglfundamentals-icon-256.png',
};

}());