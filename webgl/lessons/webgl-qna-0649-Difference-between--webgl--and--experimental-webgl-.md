Title: Difference between "webgl" and "experimental-webgl"
Description:
TOC: qna

# Question:

Some sites say that you should initialize webgl the following way:

    var gl = c.getContext("webgl") || c.getContext("experimental-webgl");
    
    if (!gl)
        alert("This browser doesn't support WebGL!");

What's the difference between `webgl` and `experimental-webgl`? The only description I could find was on MDN:

> getContext(in DOMString contextId) RenderingContext Returns a drawing context on the canvas, or null if the context ID is not supported. A drawing context lets you draw on the canvas. Calling getContext with "2d" returns a CanvasRenderingContext2D object, whereas calling it with "experimental-webgl" (or "webgl") returns a WebGLRenderingContext object. This context is only available on browsers that implement WebGL.

However this makes the 2 seem like they're the same. Is there a difference?

# Answer

TL;DR: "experimental-webgl" = beta, it was used by browsers before WebGL 1.0 shipped to try to indicate *this is not final*. When WebGL 1.0 shipped and a browser [passed all the conformance tests](https://www.khronos.org/registry/webgl/sdk/tests/webgl-conformance-tests.html) then that browser would start accepting "webgl" and "experimental-webgl" would be just be a synonym and deprecated.

Long version:

Browser vendors used to prefix things that were not standardized yet or complete. The hope was developers would try things out. When the standard finalized the prefix would be removed and everyone would use the unprefixed version only. The prefix "experimental-" is left over from that era. Browser vendors figured out prefixes were a bad idea because 1000s of websites would use the prefix in production sites and then the browsers could not remove the prefix without breaking thousands of websites.

Browser vendors have generally agreed not to do this anymore. Instead they put new features behind flags, ask developers to test, when the browser vendors and standards committees are reasonably sure everything is good and stable they allow the new feature to run without the flag. WebGL2 was done this new way so there is no "experimental-webgl2", just browser flags.

The only browser that still needs "experimental-webgl" is Edge. It uses that only because Edge still does not implement the entire WebGL spec. For all other browsers "experimental-webgl" is exactly the same as "webgl" and it's just leftover from that old era

Personally I no longer use "experimental-webgl" at all. That means my code won't work in Edge until they are actually standards compliant. IMO They need the pressure of websites not working to get them to spend resources fixing their broken implementation as it's been broken for years now.
