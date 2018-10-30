(function($) {
$.fn.toc = function(options) {
  var self = this;
  var opts = $.extend({}, jQuery.fn.toc.defaults, options);

  var container = $(opts.container);
  var headings = $(opts.selectors, container);
  var headingOffsets = [];
  var activeClassName = opts.prefix+'-active';

  var scrollTo = function(e) {
    if (opts.smoothScrolling) {
      e.preventDefault();
      var elScrollTo = $(e.target).attr('href');
      var $el = $(elScrollTo);

      $('body,html').animate({ scrollTop: $el.offset().top }, 400, 'swing', function() {
        location.hash = elScrollTo;
      });
    }
    $('li', self).removeClass(activeClassName);
    $(e.target).parent().addClass(activeClassName);
  };

  //highlight on scroll
  var timeout;
  var highlightOnScroll = function(e) {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(function() {
      var top = $(window).scrollTop(),
        highlighted;
      for (var i = 0, c = headingOffsets.length; i < c; i++) {
        if (headingOffsets[i] >= top) {
          $('li', self).removeClass(activeClassName);
          highlighted = $('li:eq('+(i-1)+')', self).addClass(activeClassName);
          opts.onHighlight(highlighted);
          break;
        }
      }
    }, 50);
  };
  if (opts.highlightOnScroll) {
    $(window).bind('scroll', highlightOnScroll);
    highlightOnScroll();
  }

  return this.each(function() {
    //build TOC
    var el = $(this);
    var ul = $('<ul/>');
    headings.each(function(i, heading) {
      var $h = $(heading);
      headingOffsets.push($h.offset().top - opts.highlightOffset);

      //add anchor
      if (opts.addAnchor !== false) {
        var anchor = $('<span/>').attr('id', opts.anchorName(i, heading, opts.prefix)).insertBefore($h);
      }

      //build TOC item
      var a = $('<a/>')
        .html(opts.headerText(i, heading, $h))
        .attr('href', opts.anchorName(i, heading, opts.prefix, '#'));

      if (opts.goOnClick !== false) {
          a.bind('click', function(e) {
            scrollTo(e);
            el.trigger('selected', $(this).attr('href'));
          });
      }

      var li = $('<li/>')
        .addClass(opts.itemClass(i, heading, $h, opts.prefix))
        .append(a);

      ul.append(li);
    });
    el.html(ul);
  });
};


var indexOpts = {
  container: '.dropdown-menu ',
  selectors: 'li,ul',
  smoothScrolling: true,
  goOnClick: false,
  prefix: 'toc',
  onHighlight: function() {},
  highlightOnScroll: false,
  highlightOffset: 100,
  addAnchor: false,
  anchorName: function(i, heading, prefix) {
    return $(heading).find("a").attr('href');
  },
  headerText: function(i, heading, $heading) {
    return $heading.attr("id") || $heading.text();
  },
  itemClass: function(i, heading, $heading, prefix) {
    return prefix + '-' + $heading[0].tagName.toLowerCase();
  }
};

var normalOpts = {
  container: 'body',
  selectors: 'h1,h2,h3,h4',
  smoothScrolling: true,
  prefix: 'toc',
  onHighlight: function() {},
  highlightOnScroll: true,
  highlightOffset: 100,
  anchorName: function(i, heading, prefix, mark) {
    return (mark || '') + ($( heading ).attr( "id" ) || ( prefix + i ));
  },
  headerText: function(i, heading, $heading) {
    return $heading.text()
                  .replace(/\</g, '&lt;')
                  .replace(/\(/g, '<span class="toc-params"> (')
                  .replace(/\)/g, ')</span>');
    //return $heading.attr("id") || $heading.text();
  },
  itemClass: function(i, heading, $heading, prefix) {
    return prefix + '-' + $heading[0].tagName.toLowerCase();
  }
};

function isIndex() {
  var path = window.location.pathname
  return path.indexOf("index.html") >= 0 ||
         path.substr(-1) === "/";
}

var opts = isIndex() ? indexOpts : normalOpts
jQuery.fn.toc.defaults = opts;

})(jQuery);


