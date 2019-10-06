Title: What's the state of OffscreenCanvas's support for 2d context?
Description:
TOC: qna

# Question:

I'm new to web development, so this might be a dumb question. Please let me know if it's already answered:)

According to [MDN web docs' page][1] for `OffscreenCanvas`, currently, the API only supports WebGL context only. (Maybe it just means the worker support for `OffscreenCanvas`' 2d context is not implemented, but we can still use it on the main thread?)

> Note: This API is currently implemented for WebGL1 and WebGL2 contexts
> only. See [bug 801176][2] for Canvas 2D API support from workers.

But when I read [the HTML Specs][3] for `OffscreenCanvas`, the 2d context is supported. 

>enum OffscreenRenderingContextType { "2d", "webgl" };

I suspect the second one is only a proposal for what `OffscreenCanvas` should support, and the first is what is actually supported. Is my understanding correct? If so, how could I know whether a specific browser supports the 2d context for `OffscreenCanvas`, like Chromium?

What makes me even more confused is people called the regular `canvas` an `offscreenCanvas`, and get a 2d context from it ([example1][4], [example2][5]). But I think in this case, they are just referring a regular canvas which is not attached to DOM, other than the `OffscreenCanvas` I like to research on.


  [1]: https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas
  [2]: https://bugzilla.mozilla.org/show_bug.cgi?id=801176
  [3]: https://html.spec.whatwg.org/multipage/canvas.html#the-offscreencanvas-interface
  [4]: https://books.google.com/books?id=kc4iT8lfEQYC&pg=PA272&lpg=PA272&dq=OffscreenCanvas%202d&source=bl&ots=x330XDrbpK&sig=2a60djcKjoX4kpMoFL1hYbwvkgg&hl=en&sa=X&ved=0ahUKEwjY7IyF6PjWAhVlImMKHWdWDwU4ChDoAQgsMAE#v=onepage&q=OffscreenCanvas%202d&f=false
  [5]: https://stackoverflow.com/questions/43369748/how-to-render-offscreen-canvas-properly

# Answer

# Update

It looks like `OffscreenCanvas` will ship in Chrome 69 or Chrome 70 with support for both 2D and WebGL. As for Images, you can use `fetch` and `ImageBitmap` inside a worker to download images.

You can see [how to use `OffscreenCanvas` on MDN](https://developer.mozilla.org/en-US/docs/Web/API/OffscreenCanvas).


# Previous answer

> What's the state of OffscreenCanvas's support for 2d context?

The state is first off that OffscreenCanvas support has not shipped in Firefox or Chrome by default as of 2018/04/30 in Chrome 66 nor Firefox 59. It's not currently turned on in Chrome Canary 68 either nor Firefox nightly and therefore unlikely to be enabled in the next few months.

[My own tests](http://twgljs.org/examples/offscreencanvas.html) show that if you enable experimental support WebGL works in Chrome but not Firefox and neither supports 2D contexts what-so-ever. 2D contexts are more problematic since the spec has to change. For example `ctx.drawImage(someImage, ...)` makes no sense for an `OffscreenCanvas` since an `OffscreenCanvas` is really meant to be used in a worker but there are no `Images` in workers since those are DOM objects. WebGL partly gets around this issue because there are ways to update textures to WebGL that don't involve Images.

The entire question is really one of speculation. If you want to know when Firefox or Chrome or Safari or Edge is going to ship `OffscreenCanvas` and with 2d support the best you can do is dig through their bug trackers. I believe the spec may change as if you search the net you can find there are still discussions on how OffscreenCanvas should work and cover cases like WebVR and others that it doesn't currently cover well.
