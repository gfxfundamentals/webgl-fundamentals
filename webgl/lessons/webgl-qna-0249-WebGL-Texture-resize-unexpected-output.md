Title: WebGL Texture resize unexpected output
Description:
TOC: qna

# Question:

When using textures in WebGL, sometimes I need to make them larger than they were originally.  When I do that, it causes the textures to appear differently, especially on lighter backgrounds.

I have the following image (256 x 256):

![original image][1]


When rendered in WebGL, it is slightly larger than the original image.  Here is how the image appears on two different backgrounds:

![enter image description here][2] ![image on light background][3]

As you can see, the image appears correctly on the dark background, but when on the light background, has a white outline.  

My setup code:

    gl.clearColor(0x22 / 0xFF, 0x22 / 0xFF, 0x22 / 0xFF, 1); // set background color
    gl.enable(gl.BLEND); // enable transparency
    gl.disable(gl.DEPTH_TEST); // disable depth test (causes problems with alpha if enabled)
    gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA); //set up blending
    gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT); //clear the gl canvas
    gl.viewport(0, 0, canvas.width, canvas.height); //set the viewport

And this is the code called every time a texture is loaded:

    function handleTextureLoaded(image, texture) {
      gl.bindTexture(gl.TEXTURE_2D, texture);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);
      gl.generateMipmap(gl.TEXTURE_2D);
      gl.bindTexture(gl.TEXTURE_2D, null);
      loadCount++;
    }

What is causing the outline to appear, and how do I fix it?

**NOTE:** When I put the original image on these same two backgrounds, this problem does not occur, even when I resize the image.

I tried disabling the alpha on the WebGL context (as told by @zfedoran):

    gl = canvas.getContext('webgl', {antialias: false, alpha: false }) 
      || canvas.getContext('experimental-webgl', {antialias: false, alpha: false });

And a small blank border now appears around the image, like this (enlarged):

![enter image description here][4]


  [1]: http://i.stack.imgur.com/yPy4h.png
  [2]: http://i.stack.imgur.com/4ancU.png
  [3]: http://i.stack.imgur.com/xwvpi.png
  [4]: http://i.stack.imgur.com/eKG4X.png

# Answer

On top of the canvas's alpha as mentioned by @zfedoran how do you make the original image?

I believe the issue is as follows

Let's say you have an anti-aliased edge like this. What color is this pixel?

![enter image description here][1]


Assume the main color, the color of the pixels in the bottom right, was 1,0,0 (pure red).  Ideally the pixel pointed to by the arrow would be (1,0,0,0.5). In other words, pure red with an alpha of 0.5. But, depending how on the image was created to generate that anti-aliased pixel it might have been blended with the purely transparent pixels next to it so it no longer pure red. Those purely transparent pixels are likely (0,0,0,0) which is transparent **black**. 

Even if your drawing program handles this correctly, GL likely does not. When you draw an image with texture filtering on (`gl.LINEAR` etc) GL is going to average the pixels near each other, some of those pixels are transparent **black**. Blending black with red gives dark red. Hence you get a dark border.

[Here you can see the issue](http://jsfiddle.net/greggman/vtub4wg7/)

<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    "use strict";

    function main() {
      var planeVertices = [
           -1, -1,
            1, -1,
           -1,  1,
            1,  1,
        ];
          
      var texcoords = [
         0, 1,
         1, 1,
         0, 0,
         1, 0,
      ];
        
      var indices = [
         0, 1, 2,
         2, 1, 3,
      ];
        

      var canvas = document.getElementById("c");
      var gl = canvas.getContext("webgl", {alpha:false});

      var programs = {}
      programs.normalProgram = twgl.createProgramFromScripts(
          gl, ["2d-vertex-shader", "2d-fragment-shader"], ["a_position", "a_texcoord"]);
      programs.preMultiplyAlphaProgram = twgl.createProgramFromScripts(
          gl, ["2d-vertex-shader", "pre-2d-fragment-shader"], ["a_position", "a_texcoord"]);
        
      var positionLoc = 0;  // assigned in createProgramsFromScripts
      var texcoordLoc = 1;  // assigned in createProgramsFromScripts

      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(planeVertices),
          gl.STATIC_DRAW);
      gl.enableVertexAttribArray(positionLoc);
      gl.vertexAttribPointer(positionLoc, 2, gl.FLOAT, false, 0, 0);
        
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
      gl.bufferData(
          gl.ARRAY_BUFFER,
          new Float32Array(texcoords),
          gl.STATIC_DRAW);
      gl.enableVertexAttribArray(texcoordLoc);
      gl.vertexAttribPointer(texcoordLoc, 2, gl.FLOAT, false, 0, 0);
        
      var buffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
      gl.bufferData(
          gl.ELEMENT_ARRAY_BUFFER,
          new Uint16Array(indices),
          gl.STATIC_DRAW);    

      var img = new Image();
      img.onload = createTextures;
      img.src = document.getElementById("i").text;
        
      function createTexture() {
        var tex = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, tex);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, img);
        gl.generateMipmap(gl.TEXTURE_2D); // assuming power-of-2 
        return tex;
      }
     
      var textures = {};    
      function createTextures() {
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, false);
        textures.unpremultipliedAlphaTexture = createTexture();
        gl.pixelStorei(gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
        textures.premultipliedAlphaTexture = createTexture();
        document.body.appendChild(document.createElement("hr"));
        insert("original image");
        document.body.appendChild(img);
        render();
      }
        
      function insert(text) {
        var pre = document.createElement("pre");
        pre.appendChild(document.createTextNode(text));
        document.body.appendChild(pre);
      };
        
      function grabImage(prg, blend, texName) {
         document.body.appendChild(document.createElement("hr"));
         insert(
           "gl.useProgram(" + prg + ")\n" +
           "gl.blendFunc(gl." + blend.src + ", gl." + blend.dst + ")\n" +
           "gl.bindTexture(gl.TEXTURE2D, " + texName + ")");
         var img = new Image();
         img.src = gl.canvas.toDataURL();
         document.body.appendChild(img);
      };
      
      function render() { 
          gl.enable(gl.BLEND);
          
          Object.keys(programs).forEach(function(p, pndx) {
              gl.useProgram(programs[p]);
              
              [
                  { src: "SRC_ALPHA", dst: "ONE_MINUS_SRC_ALPHA" },
                  { src: "ONE", dst: "ONE_MINUS_SRC_ALPHA" },
              ].forEach(function(b, bndx) {
                   gl.blendFunc(gl[b.src], gl[b.dst]);
               
                   Object.keys(textures).forEach(function(texName, tndx) {
                      gl.bindTexture(gl.TEXTURE_2D, textures[texName]);
                      gl.clearColor(0x3D/0xFF, 0x87/0xFF, 0xEA/0xFF, 1);
                      gl.clear(gl.COLOR_BUFFER_BIT);
                      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
                      grabImage(p, b, texName);
                  });
              });
          });
       }
    }

    main();

<!-- language: lang-css -->

    canvas {
        border: 1px solid black;
        display: none;
    }
    img {
        background-color: #3D87EA;
        border: 1px solid black;
        width: 256px;
        height: 256px;
    }

<!-- language: lang-html -->

    <script src="https://twgljs.org/dist/3.x/twgl.min.js"></script>
    <!-- vertex shader -->
    <script id="2d-vertex-shader" type="x-shader/x-vertex">
    attribute vec4 a_position;
    attribute vec2 a_texcoord;

    varying vec2 v_texcoord;
        
    void main() {
       gl_Position = a_position;
       v_texcoord = a_texcoord;
    }
    </script>
    <!-- fragment shaders -->
    <script id="2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
        
    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    void main() {
        gl_FragColor = texture2D(u_texture, v_texcoord);
    }
    </script>
    <script id="pre-2d-fragment-shader" type="x-shader/x-fragment">
    precision mediump float;
        
    varying vec2 v_texcoord;

    uniform sampler2D u_texture;
    void main() {
        vec4 textureColor = texture2D(u_texture, v_texcoord);
        gl_FragColor = vec4(textureColor.rgb * textureColor.a, textureColor.a);
    }
    </script>
    <canvas id="c" width="32" height="32"></canvas>
    <script type="not-js" id="i">data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAA7dpVFh0WE1MOmNvbS5hZG9iZS54bXAAAAAAADw/eHBhY2tldCBiZWdpbj0i77u/IiBpZD0iVzVNME1wQ2VoaUh6cmVTek5UY3prYzlkIj8+IDx4OnhtcG1ldGEgeG1sbnM6eD0iYWRvYmU6bnM6bWV0YS8iIHg6eG1wdGs9IkFkb2JlIFhNUCBDb3JlIDUuMy1jMDExIDY2LjE0NTY2MSwgMjAxMi8wMi8wNi0xNDo1NjoyNyAgICAgICAgIj4gPHJkZjpSREYgeG1sbnM6cmRmPSJodHRwOi8vd3d3LnczLm9yZy8xOTk5LzAyLzIyLXJkZi1zeW50YXgtbnMjIj4gPHJkZjpEZXNjcmlwdGlvbiByZGY6YWJvdXQ9IiIgeG1sbnM6eG1wUmlnaHRzPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvcmlnaHRzLyIgeG1sbnM6eG1wTU09Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC9tbS8iIHhtbG5zOnN0UmVmPSJodHRwOi8vbnMuYWRvYmUuY29tL3hhcC8xLjAvc1R5cGUvUmVzb3VyY2VSZWYjIiB4bWxuczp4bXA9Imh0dHA6Ly9ucy5hZG9iZS5jb20veGFwLzEuMC8iIHhtcFJpZ2h0czpNYXJrZWQ9IkZhbHNlIiB4bXBNTTpPcmlnaW5hbERvY3VtZW50SUQ9InhtcC5kaWQ6RjgxNENDMDEzQjNGNjgxMTgyMkFCRTQ0RTFGNjIxOTciIHhtcE1NOkRvY3VtZW50SUQ9InhtcC5kaWQ6Q0VDQTU5RDNGNjBEMTFFMjhFRUVEMkI5NkRDNTM4RDYiIHhtcE1NOkluc3RhbmNlSUQ9InhtcC5paWQ6Q0VDQTU5RDJGNjBEMTFFMjhFRUVEMkI5NkRDNTM4RDYiIHhtcDpDcmVhdG9yVG9vbD0iQWRvYmUgUGhvdG9zaG9wIENTNiAoTWFjaW50b3NoKSI+IDx4bXBNTTpEZXJpdmVkRnJvbSBzdFJlZjppbnN0YW5jZUlEPSJ4bXAuaWlkOkRGODJCQjcxQkIyNDY4MTE4MjJBRkMwRDVCNTc4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</script>

<!-- end snippet -->

There's a few solutions

1.  Make sure transparent area actually has color in. 

    In other words, if all the pixels in the top left of the image above are **RED** with 0 alpha then when the pixels get filtered they'll be blending (1,0,0,0) transparent red instead of (0,0,0,0) transparent black. Unfortunately there's no easy way to do this in most drawing programs.  

    There's [a plugin for Photoshop that lets you do it called SuperPNG](http://www.fnordware.com/superpng/)  It lets you create a 4th channel for the alpha instead of using photoshop's transparency. That lets you set the alpha separate from the image. 

    In your case you'd end up with an image with layers like this

    ![enter image description here][2]

    Now there are no bad colors to blend with.

2.  Switch to pre-multiplied alpha

    In this case before calling `gl.texImage2D` to upload the image call

        gl.pixelStorei(UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);

    before calling `gl.texImage2D`. That tells WebGL to multiply the colors by their alpha when the image is loaded. You then use blending with

        gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);

3.  Turn off filtering in GL

        gl.texParameter(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
        gl.texParameter(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

    Assuming your source image doesn't have any bad colors this means GL won't making new bad colors as it filters but of course it also means if you scale or rotate the image you'll get aliasing.

4.  Create your own mips

    Most apps use `gl.genereateMipmap` to generate mips but you can generate them yourself offline and upload them yourself. That's not a perfect solution either but it does let you use `gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR_MIPMAP_NEAREST);

Combinations of the above


  [1]: http://i.stack.imgur.com/UOhqr.png
  [2]: http://i.stack.imgur.com/NkfNL.png
