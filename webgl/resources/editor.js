
function getQuery(s) {
  var query = {};
  s = s === undefined ? window.location.search : s;
  s = s.substring(1);
  s.split('&').forEach(function(pair) {
      var parts = pair.split('=').map(decodeURIComponent);
      query[parts[0]] = parts[1];
  });
  return query;
}

function getHTML(url, callback) {
  var req = new XMLHttpRequest();
  req.open("GET", url, true);
  req.addEventListener('load', function() {
    var success = req.status == 200 || req.status == 0;
    callback(success ? null : 'could not load: ' + url, req.responseText);
  });
  req.addEventListener('timeout', function() {
    callback("timeout get: " + url);
  });
  req.addEventListener('error', function() {
    callback("error getting: " + url);
  });
  req.send("");
}

function fixSourceLinks(url, source) {
  var srcRE = /src="/g;
  var linkRE = /href="/g
  var imageSrcRE = /image\.src = "/g;
  var loadImagesRE = /loadImages(\s*)\((\s*)\[([^]*?)\](\s*),/g;
  var loadImageRE = /(loadImageAndCreateTextureInfo)\(('|")/g;
  var quoteRE = /"(.*?)"/g;

  var u = new URL(window.location.origin + url);
  var prefix = u.origin + dirname(u.pathname);
  source = source.replace(srcRE, 'src="' + prefix);
  source = source.replace(linkRE, 'href="' + prefix);
  source = source.replace(imageSrcRE, 'image.src = "' + prefix);
  source = source.replace(loadImageRE, '$1($2' + prefix);
  source = source.replace(loadImagesRE, function(match, p1, p2, p3, p4) {
      p3 = p3.replace(quoteRE, '"' + prefix + '$1"');
      return `loadImages${p1}(${p2}[${p3}]${p4},`;
  });

  return source;
}

var g = {
  html: '',
};

var htmlParts = {
  js: {
    language: 'javascript',
  },
  css: {
    language: 'css',
  },
  html: {
    language: 'html',
  }
};

function forEachHTMLPart(fn) {
  Object.keys(htmlParts).forEach(function(name, ndx) {
    var info = htmlParts[name];
    fn(info, ndx, name);
  });
}


function getHTMLPart(re, obj, tag) {
  var part = '';
  obj.html = obj.html.replace(re, function(p0, p1) {
    part = p1;
    return tag;
  });
  return part.replace(/\s*/, '');
}

function parseHTML(url, html) {
  html = fixSourceLinks(url, html);

  html = html.replace(/<div class="description">[^]*?<\/div>/, '');

  var styleRE = /<style>([^]*?)<\/style>/i;
  var bodyRE = /<body>([^]*?)<\/body>/i;
  var inlineScriptRE = /<script>([^]*?)<\/script>/i;
  var externalScriptRE = /<script\s*src\s*=\s*"(.*?)"\s*>\s*<\/script>/ig;
  var dataScriptRE = /<script (.*?)>([^]*?)<\/script>/ig;
  var hasCanvasInCSSRE = /canvas/;
  var hasCanvasStyleInHTMLRE = /<canvas[^>]+?style[^>]+?>/;
  var cssLinkRE = /<link ([^>]+?)>/;
  var isCSSLinkRE = /type="text\/css"|rel="stylesheet"/;
  var hrefRE = /href="([^"]+)"/;

  var obj = { html: html };
  htmlParts.css.source = getHTMLPart(styleRE, obj, '<style>\n${css}</style>');
  htmlParts.html.source = getHTMLPart(bodyRE, obj, '<body>${html}</body>');
  htmlParts.js.source = getHTMLPart(inlineScriptRE, obj, '<script>${js}</script>');
  html = obj.html;

  var scripts = ''
  html = html.replace(externalScriptRE, function(p0, p1) {
    scripts += '\n<script src="' + p1 + '"></script>';
    return '';
  });

  var dataScripts = '';
  htm = html.replace(dataScriptRE, function(p1, p1, p2) {
    dataScripts += '\n<script ' + p1 + '>' + p2 + '</script>';
    return '';
  });

  htmlParts.html.source += dataScripts;
  htmlParts.html.source += scripts + '\n';

  // add style section if there is non
  if (html.indexOf("${css}") < 0) {
    html = html.replace("</head>", "<style>\n${css}</style>\n</head>");
  }

  // add css if there is none
  if (!hasCanvasInCSSRE.test(htmlParts.css.source) && !hasCanvasStyleInHTMLRE.test(htmlParts.html.source)) {
    htmlParts.css.source = `body {
  margin: 0;
}
canvas {
  width: 100vw;
  height: 100vh;
  display: block;
}
` + htmlParts.css.source;
  }

  var links = '';
  html = html.replace(cssLinkRE, function(p0, p1) {
    if (isCSSLinkRE.test(p1)) {
      var m = hrefRE.exec(p1);
      if (m) {
        links += `@import url("${m[1]}");\n`;
      }
      return '';
    } else {
      return p0;
    }
  });

  htmlParts.css.source = links + htmlParts.css.source;

  g.html = html;
}

function cantGetHTML(e) {
  console.log(e);
  console.log("TODO: don't run editor if can't get HTML");
}

function main() {
  var query = getQuery();
  getHTML(query.url, function(err, html) {
    if (err) {
      console.log(err);
      return;
    }
    parseHTML(query.url, html);
    setupEditor(query.url);
  });
}


var blobUrl;
function getSourceBlob(options) {
  options = options || {};
  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
  }
  var source = g.html;
  source = source.replace('${html}', htmlParts.html.editor.getValue());
  source = source.replace('${css}', htmlParts.css.editor.getValue());
  source = source.replace('${js}', htmlParts.js.editor.getValue());
  source = source.replace('<head>', '<head>\n<script match="false">webglLessonSettings = ' + JSON.stringify(options) + ";</script>");

  var scriptNdx = source.indexOf('<script>');
  g.numLinesBeforeScript = (source.substring(0, scriptNdx).match(/\n/g) || []).length;

  var blob = new Blob([source], {type: 'text/html'});
  blobUrl = URL.createObjectURL(blob);
  return blobUrl;
}

function dirname(path) {
  var ndx = path.lastIndexOf("/");
  return path.substring(0, ndx + 1);
}

function resize() {
  forEachHTMLPart(function(info) {
    info.editor.layout();
  });
}

function setupEditor() {

  forEachHTMLPart(function(info, ndx, name) {
    info.parent = document.querySelector(".panes>." + name);
    info.editor = runEditor(info.parent, info.source, info.language);
    info.button = document.querySelector(".button-" + name);
    info.button.addEventListener('click', function() {
      toggleSourcePane(info.button);
      run();
    });
  });

  g.fullscreen = document.querySelector(".button-fullscreen");
  g.fullscreen.addEventListener('click', toggleFullscreen);

  g.run = document.querySelector(".button-run");
  g.run.addEventListener('click', run);

  g.iframe = document.querySelector(".result>iframe");
  g.other = document.querySelector(".panes .other");

  g.result = document.querySelector(".panes .result");
  g.resultButton = document.querySelector(".button-result");
  g.resultButton.addEventListener('click', function() {
     toggleResultPane();
     run();
  });
  g.result.style.display = "none";
  toggleResultPane();

  if (window.innerWidth > 1200) {
    toggleSourcePane(htmlParts.js.button);
  }

  window.addEventListener('resize', resize);

  showOtherIfAllPanesOff();
  document.querySelector(".other .loading").style.display = "none";

  resize();
  run({glDebug: false});
}

function toggleFullscreen() {
  try {
    toggleIFrameFullscreen(window.document);
    resize();
    run();
  } catch (e) {
    console.error(e);
  }
}

function run(options) {
  g.setPosition = false;
  var url = getSourceBlob(options);
  g.iframe.src = url;
}

function addClass(elem, className) {
  var parts = elem.className.split(" ");
  if (parts.indexOf(className) < 0) {
    elem.className = elem.className + " " + className;
  }
}

function removeClass(elem, className) {
  var parts = elem.className.split(" ");
  var numParts = parts.length;
  for(;;) {
    var ndx = parts.indexOf(className);
    if (ndx < 0) {
      break;
    }
    parts.splice(ndx, 1);
  }
  if (parts.length !== numParts) {
    elem.className = parts.join(" ");
    return true;
  }
  return false;
}

function toggleClass(elem, className) {
  if (removeClass(elem, className)) {
    return false;
  } else {
    addClass(elem, className);
    return true;
  }
}

function toggleIFrameFullscreen(childDocument) {
  var iframes = window.parent.document.querySelectorAll("iframe");
  [].forEach.call(iframes, function(iframe) {
    if (iframe.contentDocument === childDocument) {
      toggleClass(iframe, "fullscreen");
    }
  });
  window.parent.document.body.style.overflow =
      toggleClass(childDocument.body, "fullscreen") ? "hidden" : "";
}


function addRemoveClass(elem, className, add) {
  if (add) {
    addClass(elem, className);
  } else {
    removeClass(elem, className);
  }
}

function toggleSourcePane(pressedButton) {
  forEachHTMLPart(function(info) {
    var pressed = pressedButton === info.button;
    if (pressed && !info.showing) {
      addClass(info.button, "show");
      info.parent.style.display = "block";
      info.showing = true;
    } else {
      removeClass(info.button, "show");
      info.parent.style.display = "none";
      info.showing = false;
    }
  });
  showOtherIfAllPanesOff();
  resize();
}

function showingResultPane() {
  return g.result.style.display !== "none";
}
function toggleResultPane() {
  var showing = showingResultPane();
  g.result.style.display = showing ? "none" : "block";
  addRemoveClass(g.resultButton, "show", !showing);
  showOtherIfAllPanesOff();
  resize();
}

function showOtherIfAllPanesOff() {
  var paneOn = showingResultPane();
  forEachHTMLPart(function(info) {
    paneOn = paneOn || info.showing;
  });
  g.other.style.display = paneOn ? "none" : "block";
}

function getActualLineNumberAndMoveTo(lineNo, colNo) {
  var actualLineNo = lineNo - g.numLinesBeforeScript;
  if (!g.setPosition) {
    // Only set the first position
    g.setPosition = true;
    htmlParts.js.editor.setPosition({
      lineNumber: actualLineNo,
      column: colNo,
    });
    htmlParts.js.editor.revealLineInCenterIfOutsideViewport(actualLineNo);
    htmlParts.js.editor.focus();
  }
  return actualLineNo;
}

function runEditor(parent, source, language) {
  return monaco.editor.create(parent, {
    value: source,
    language: language,
    //lineNumbers: false,
    theme: 'vs-dark',
    disableTranslate3d: true,
 //   model: null,
    scrollBeyondLastLine: false,
  });
}

function start() {
  var query = getQuery();
  var parentQuery = getQuery(window.parent.location.search);
  var isSmallish = window.navigator.userAgent.match(/Android|iPhone|iPod|Windows Phone/i);
  var isEdge = window.navigator.userAgent.match(/Edge/i);
  if (isEdge || isSmallish || parentQuery.editor === 'false') {
    var url = query.url;
    window.location.href = url;
  } else {
    require.config({ paths: { 'vs': '/monaco-editor/min/vs' }});
    require(['vs/editor/editor.main'], main);
  }
}

start();




