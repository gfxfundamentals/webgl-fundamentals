<!-- Licensed under a BSD license. See license.html for license -->
(function($){
$(document).ready(function($){
  // are there more languages for this article?
  var pathname = window.location.pathname;
  var lastSlash = pathname.lastIndexOf("/");
  var filename = pathname.substr(lastSlash + 1);

  Object.keys(window.langDB.langs).forEach(function(lang) {
      $("#language")
          .append($("<option></option>")
              .attr("value", lang)
              .text(window.langDB.langs[lang].language));
  });

  var m = /webgl\/lessons\/(.*?)\//.exec(window.location.pathname);
  var lang = "en";
  if (m) {
    lang = m[1];
  }

  $('#language').val(lang);
  $('#language').on('change', function() {
    var lang = this.value;
    var path = "/webgl/lessons";
    var article = window.langDB.articles[filename];
    if (!article || !article[lang]) {
      filename = "index.html";
    }
    if (filename === "index.html") {
      if (lang === "en") {
        path = "";
      }
    }
    lang = lang === "en" ? "" : ("/" + lang);
    var url = path + lang + "/" + filename + window.location.search + window.location.hash;
    window.location.href = url;
  });
});
}(jQuery));

