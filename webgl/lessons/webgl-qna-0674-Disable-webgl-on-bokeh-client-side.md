Title: Disable webgl on bokeh client side
Description:
TOC: qna

# Question:

I generate html files that are used as offline report with bokeh. The report contains some plots with line glyphs. With chrome webgl works fine and the plot zomming etc. runs smooth.

But with internet explorer the plots only work with webgl disabled. (The bug is filed [here][1]) So I want to disable webgl on the client side (so that chrome users still have a smooth user experience it should be enabled for chrome users). Disabling webgl is just a workaround until the bug will be fixed. 

**Is it possible to disable webgl for a whole document or in general on the client side with javascript? How would you do it?**

I am using bokeh 0.12.4 


  [1]: https://github.com/bokeh/bokeh/issues/5117

# Answer

I'm not exactly sure what you're asking. I guess you have a library that uses WebGL and you can't tell it not directly.

In that case you could do something like

    HTMLCanvasElement.prototype.getContext = (function(origFn) {
      return function(type) {
        if (type === "webgl" || type === "experimental-webgl") {
          return null;
        }
        origFn.apply(this, arguments);
      };
    }(HTMLCanvasElement.prototype.getContext));

