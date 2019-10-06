Title: How to render large scale images from canvas composition
Description:
TOC: qna

# Question:

I'm thinking of using three.js for my art project. What I want to do is to write some code that generates some graphics and then save it in high resolution. When I say high resolution I mean something like 7000 x 7000 px or more, because I would like to print it. 

So far I have been doning something like that with Flash and vvvv but I would like to know if this is possible and if there are some examples available in three.js.

You can see some of my stuff here: https://www.behance.net/onoxo

# Answer

WebGL generally has a size limit. Modern GPUs that size limit might be 8192x8192 (256meg) or even 16384x16384 (one gig) but in other areas of the browser (like the space required for the screenshot) you're likely to run out of memory.

You can get round this by rendering portions of the larger image as separate pieces and then stitching them together in some other program like photoshop or the gIMP.

In Three.js you'd do that something like this. Assuming you take one of the samples

    function makeScreenshots() {
      var desiredWidth = 7000;
      var desiredHeight = 7000;
      var stepX = 1000;
      var stepY = 1000;
      for (var y = 0; y < desiredHeight; y += stepY) {
        for (var x = 0; x < desiredWidth; x += stepX) {
          camera.setViewOffset( desiredWidth, desiredHeight, x, y, stepX, stepY );
          renderer.render( scene, camera );
          var screenshotDataURL = renderer.domElement.toDataURL();
          saveScreenshot( "screenshot" + x + "-" + y + ".png", screenshotDataURL );
        }
      }
    }

Note: you'd have to provide the function `saveScreenshot` and most likely have a tiny node.js or python server running to use to save the screenshots but with this technique you can generally generate almost any resolution image you want.

See: https://greggman.github.io/dekapng/
