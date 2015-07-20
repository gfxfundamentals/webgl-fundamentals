<!-- Licensed under a BSD license. See license.html for license -->
(function($){
var log = function(msg) {
  return;
  if (window.dump) {
    dump(msg + "\n");
  }
  if (window.console && window.console.log) {
    console.log(msg);
  }
};

$(document).ready(function($){
  var g_imgs = { };
  var linkImgs = function(bigHref) {
    return function() {
      var src = this.src;
      var a = document.createElement('a');
      a.href = bigHref;
      a.title = this.alt;
      a.className = this.className;
      a.setAttribute('align', this.align);
      this.setAttribute('align', '');
      this.className = '';
      this.style.border = "0px";
      return a;
    };
  };
  var linkSmallImgs = function(ext) {
    return function() {
      var src = this.src;
      return linkImgs(src.substr(0, src.length - 7) + ext);
    };
  };
  var linkBigImgs = function() {
    var src = $(this).attr("big");
    return linkImgs(src);
  };
  $('img[big$=".jpg"]').wrap(linkBigImgs);
  $('img[src$="-sm.jpg"]').wrap(linkSmallImgs(".jpg"));
  $('img[src$="-sm.gif"]').wrap(linkSmallImgs(".gif"));
  $('img[src$="-sm.png"]').wrap(linkSmallImgs(".png"));
  $('pre>code')
     .unwrap()
     .replaceWith(function() {
       return $('<pre class="prettyprint showlinemods">' + this.innerHTML + '</pre>')
     });
  prettyPrint();
  var m = /webgl\/lessons\/(.*?)\//.exec(window.location.pathname);
  var lang = "en";
  if (m) {
    lang = m[1];
  }
  $('#language').val(lang);
  $('#language').on('change', function() {
    var lang = this.value;
    lang = lang === "en" ? "" : ("/" + lang);
    var lastSlash = window.location.pathname.lastIndexOf("/");
    var theRest = window.location.pathname.substr(lastSlash);
    window.location.href = "/webgl/lessons" + lang + theRest + window.location.search + window.location.hash;
  });
});
}(jQuery));

