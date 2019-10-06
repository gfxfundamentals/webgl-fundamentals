Title: Saving a Uint8Array array storing RGBA to a .png file
Description:
TOC: qna

# Question:

I am currently trying to save a screenshot of a ThreeJS in a specific area to file.

So far I have only tried to get the image to display into a new tab, I have got it to work with



    window.open(renderer.domElement.toDataURL("image/png"));

renderer is a THREE.WebGLRenderer object with preserveDrawingBuffer: true

But that uses the entire scene, so I have switched to:

     var gl = renderer.getContext();
  var pixels = new Uint8Array(width * height * 4);
  gl.readPixels(x, y, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);
  window.open("data:image/png;base64," + btoa(String.fromCharCode.apply(null, pixels)));

With doing that, nothing is rendered other then a grey outlined square

[![outlined grey square][1]][1]
  [1]: http://i.stack.imgur.com/Zk4tv.png



# Answer

If you want small part it, rather than calling `gl.readPixels` just use the source width and height arguments to `drawImage`

    var gl = renderer.getContext();

    var ctx = document.createElement('canvas').getContext("2d");

    ctx.canvas.width = width;
    ctx.canvas.height = height;

    ctx.drawImage(gl.canvas, 0, 0, width, height, 0, 0, width, height);
    
    window.open(ctx.canvas.toDataURL());

There are 3 versions of `drawImage` 

1.  `drawImage(image, dstX, dstY)`

2.  `drawImage(image, dstX, dstY, dstWidth, dstHeight)`

3.  `drawImage(image, srcX, srcY, srcWidth, srcHeight, dstX, dstY, dstWidth, dstHeight)`
