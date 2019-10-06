Title: How to get webglcontextrestored fired
Description:
TOC: qna

# Question:

I want to have a fairly large number of HTML `canvas` that I draw on using  WebGL. But if I draw more than 8 or 16 or a similar, client-dependent number, earlier ones disappear.

Based on the [WebGL wiki](https://www.khronos.org/webgl/wiki/HandlingContextLost) I thought that reacting on `webglcontextlost` and `webglcontextrestored` would fix this… but it does not seem to be the case.

I essentially tried this code:

      canvas.addEventListener('webglcontextlost', e => {
        e.preventDefault();
      });
      canvas.addEventListener('webglcontextrestored', e => {
        render();
      });
 
with [full fiddle](https://jsfiddle.net/o5967kb0/3/) available.

Do I have a coding error, or a conceptual error?


# Answer

You can:t have more than 8 or 16 WebGL canvas. That's just a limit browsers put because WebGL uses lots of resources.

The best your code would do is make one fail and another re-start but I suspect most browsers don't handle that case well.

You probably don't actually want multiple WebGL canvases if you can avoid it since they can't share resources. 

There are other solutions:

One is using a single canvas that doesn't scroll with the screen. Putting placeholder elements in your document and then looking where those elements are. If they are on the screen then draw a scene in the appropriate place in the canvas.

[A three.js example](https://threejs.org/examples/#webgl_multiple_elements). [A WebGL example](http://twgljs.org/examples/itemlist.html). Also [a S.O question that kind of talks about this and other solutions](https://stackoverflow.com/questions/33165068/how-can-we-have-display-of-same-objects-in-two-canvas-in-webgl)

Another might be [virtualizing the WebGL contexts](https://github.com/greggman/virtual-webgl) so there's really only one context. That's slower but the the various users of th canvas don't have to co-operate


