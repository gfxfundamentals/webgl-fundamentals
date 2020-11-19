// Licensed under a BSD license. See license.html for license
/* eslint-disable strict */
/* global settings, contributors */
(function($){

function getQueryParams() {
  return Object.fromEntries(new URLSearchParams(window.location.search).entries());
}

//
function replaceParams(str, subs) {
  return str.replace(/\${(\w+)}/g, function(m, key) {
    return subs[key];
  });
}

function showContributors() {
  // contribTemplate: 'Thank you 
  // <a href="${html_url}">
  // <img src="${avatar_url}">${login}<a/>
  //  for <a href="https://github.com/${owner}/${repo}/commits?author=${login}">${contributions} contributions</a>',
  try {
    const subs = {...settings, ...contributors[Math.random() * contributors.length | 0]};
    const template = settings.contribTemplate;
    const html = replaceParams(template, subs);
    const parent = document.querySelector('#forkongithub>div');
    const div = document.createElement('div');
    div.className = 'contributors';
    div.innerHTML = html;
    parent.appendChild(div);
  } catch (e) {
    console.error(e);
  }
}
showContributors();

$(document).ready(function($) {
  var linkImgs = function(bigHref) {
    return function() {
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
       return $('<pre class="prettyprint showlinemods">' + this.innerHTML + '</pre>');
     });
  if (window.prettyPrint) {
    window.prettyPrint();
  }

  var params = getQueryParams();
  if (params.doubleSpace || params.doublespace) {
    document.body.className = document.body.className + " doubleSpace";
  }

  $(".language").on('change', function() {
    window.location.href = this.value;
  });

});
}(jQuery));

