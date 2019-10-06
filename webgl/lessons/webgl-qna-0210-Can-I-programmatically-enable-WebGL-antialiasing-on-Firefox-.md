Title: Can I programmatically enable WebGL antialiasing on Firefox?
Description:
TOC: qna

# Question:

For example, on a page [like this one][1], in Safari 7 it's antialiased, but in Firefox 29 (OS X 10.9) it's not.

Firefox [does seem to have the capability to antialias][2].  If I set the about:config setting "webgl.msaa-force" to "true", then it is antialiased.

Is there any way to make Firefox antialias for my particular webpage, without relying on the user to mess with their about:config?

I'm using three.js, and it has an "antialias" flag, but it seems to only make a difference on Safari, not Firefox.


  [1]: http://www.zygotebody.com
  [2]: https://bugzilla.mozilla.org/show_bug.cgi?id=615976

# Answer

The short answer is "no".

It's up the browser whether or not to support anti aliasing. Many drivers crash with antialiasing under certain conditions so browsers often disable antialiasing on those machines.

Note that the `antialias` flag is `true` by default. In other words the default for WebGL is to antialias though it's still up to the browser. Specifically setting `antialias` to `true` could at most act as a hint (hey, I really want antialiasing please) but I know of no browsers that use it as a hint. They generally turn antialiasing on if they can.

On the other hand, setting `antialias` to `false` does specifically mean "do NOT antialias".

You can try to do anti-aliasing yourself. For example you can render at a higher resolution and using CSS to display the canvas smaller in which case the browser will most likely bilinear interpolation when compositing your WebGL into the page. You could also render to a texture and then apply some kind of anti-aliasing filter to it when rendering it to the canvas.
