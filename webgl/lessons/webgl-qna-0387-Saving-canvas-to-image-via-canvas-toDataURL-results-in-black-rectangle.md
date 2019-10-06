Title: Saving canvas to image via canvas.toDataURL results in black rectangle
Description:
TOC: qna

# Question:

Im using Pixi.js and trying to save a frame of the animation to an image. canvas.toDataUrl should work, but all i get is a black rectangle. See live example [here][1]


  [1]: http://anatoliyg.github.io/toaster/


the code I use to extract the image data and set the image is:


       var canvas = $('canvas')[0];
            var context = canvas.getContext('2d');
    
       $('button').click(function() {
    
        var data = renderer.view.toDataURL("image/png", 1);
        //tried var data = canvas.toDataURL();
        $('img').attr('src', data);
       })
    


# Answer

I know this has been answered at least 5 other times on SO but ...

What Kaiido mentioned will work but the real issue is that canvas, when used with WebGL, by default has 2 buffers. The buffer you are drawing to and the buffer being displayed. 

When you start drawing into a WebGL canvas, as soon as you exit the current event, for example your requestAnimationFrame callback, the canvas is marked for swapping those 2 buffers. When the browser re-draws the page it does the swap. The buffer that you were drawing to is swapped with the one that was being displayed. You're now drawing to other buffer. That buffer is cleared.  

The reason it's cleared instead of just left alone is that whether the browser actually swaps buffers or does something is up to the browser. For example if antialiasing is on (which is the default) then it doesn't actually do a swap. It does a "resolve". It converts the highres buffer you just drew to a normal res anti-aliased copy into the display buffer. 

So, to make it more consistent, regardless of which way the browser does the default it just always clears whatever buffer you're about to draw to. Otherwise you'd have no idea if it had 1 frame old data or 2 frame old data.

Setting `preserveDrawingBuffer: true` tells the browser "always copy, never swap. In this case it doesn't have to clear the drawing buffer because what's in the drawing buffer is always known. No swapping.

What is the point of all that? The point is, if you want to call `toDataURL` or `gl.readPixels` you need to call it IN THE SAME EVENT.

So for example your code could work something like this

    var capture = false;

    $('button').click(function() {
       capture = true;
    });

    function render() {

      renderer.render(...);

      if (capture) {
        capture = false;
        var data = renderer.view.toDataURL("image/png", 1);
        $('img').attr('src', data);
      }

      requestAnimationFrame(render);
    }
    requestAnimationFrame(render); 

In that case because you call `toDataURL` in the same javascript event as you rendered to it you'll get the correct results always regardless of wither or not `preserveDrawingBuffer` is true or false.

If you're writing app that is not constantly rendering you could also do something like

    $('button').click(function() {
       // render right now
       renderer.render(...);

       // capture immediately
       var data = renderer.view.toDataURL("image/png", 1);
       $('img').attr('src', data);
    });

The reason `preserveDrawingBuffer` is false by default is because swapping is faster than copying so this allows the browser to go as fast as possible.


Also see [this answer for one other detail](https://stackoverflow.com/a/26790802/128511)
