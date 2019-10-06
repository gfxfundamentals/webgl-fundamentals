Title: Difference between requestAnimationFrame and requestAnimFrame
Description:
TOC: qna

# Question:

There seems to be a little documentation on this but i'm wondering what the difference is between the two? They seem to be the same (?) in `Pixi`



# Answer

`requestAnimFrame` is a JavaScript [polyfill](http://en.wikipedia.org/wiki/Polyfill) to implement `requestAnimationFrame` for browsers that don't yet support `requestAnimationFrame` or for browsers that still prefix it.

See http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/ for one of the first implementations of `requestAnimFrame`.
