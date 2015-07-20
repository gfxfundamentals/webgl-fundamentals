<!-- Licensed under a BSD license. See license.html for license -->
(function($){
$(document).ready(function($){
  var m = /webgl\/lessons\/(.*?)\//.exec(window.location.pathname);
  var lang = "en";
  if (m) {
    lang = m[1];
  }
  $('#language').val(lang);
  $('#language').on('change', function() {
    var lastSlash = window.location.pathname.lastIndexOf("/");
    var theRest = window.location.pathname.substr(lastSlash);
    var lang = this.value;
    var path = "/webgl/lessons";
    lang = lang === "en" ? "" : ("/" + lang);
    if (theRest.length < 2) { // it's probably at the root
      theRest = "/index.html";
    } else if (theRest === "/index.html") {
      if (lang === "") {
        path = "";
      }
    }
    window.location.href = path + lang + theRest + window.location.search + window.location.hash;
  });
});
}(jQuery));

