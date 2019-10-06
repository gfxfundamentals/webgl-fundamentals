Title: WebGL draw rect & image to one shader
Description:
TOC: qna

# Question:

Just trying to do some basic webgl where i have two "game objects". A simple sprite, and a rect. Basically what i want to do is draw the sprite image, and then draw a rectangle with a specified color.

Both objects have a `pos` vector, and a width an height. The sprite has an image object, and the rect has a colour object with rgb values of 0 to 1.


Sorry for all the code, but here's my draw method:

    draw: function () {
      this.resize();
      var delta = this.getDeltaTime();
      
      gl.viewport(0, 0, gl.canvas.clientWidth, gl.canvas.clientHeight);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

      var shaderProgram = this.shader.shaderProgram;

      var matrixLocation = gl.getUniformLocation(shaderProgram, "uMatrix");
      
      for (var i = 0; i < this.objects.length; i++) {
        var planePositionBuffer = gl.createBuffer();
        mat3.identity(this.mvMatrix);
        gl.bindBuffer(gl.ARRAY_BUFFER, planePositionBuffer);
        var object = this.objects[i];

        var x1 = object.pos.x;
        var y1 = object.pos.y;
        var x2 = object.pos.x + object.width;
        var y2 = object.pos.y + object.height;

        var vertices = [
          x1, y1,
          x2, y1,
          x1, y2,
          x1, y2,
          x2, y1,
          x2, y2
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        gl.vertexAttribPointer(shaderProgram.vertexPositionAttribute, 2, gl.FLOAT, false, 0, 0);

        var textureBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, textureBuffer);
        
        var textureCoords;
        if (object.image) {
          var dw = (object.width / object.image.image.width);
          var dh = 1.0 - (object.height / object.image.image.height);
          textureCoords = [
            0.0, 1.0,
            dw, 1.0,
            0.0, dh,
            0.0, dh,
            dw, 1.0,
            dw, dh
          ];

          gl.activeTexture(gl.TEXTURE0);
          gl.bindTexture(gl.TEXTURE_2D, this.objects[i].image);
          gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(textureCoords), gl.STATIC_DRAW);
          gl.vertexAttribPointer(shaderProgram.textureCoordAttribute, 2, gl.FLOAT, false, 0, 0);
        }
        

        mat3.multiply(this.mvMatrix, this.mvMatrix, [
          2 / gl.canvas.clientWidth, 0, 0,
          0, -2 / gl.canvas.clientHeight, 0,
          -1, 1, 1
        ]);

        gl.uniformMatrix3fv(matrixLocation, false, this.mvMatrix);

        gl.uniform1i(shaderProgram.samplerUniform, 0);

        var colorLocation = gl.getUniformLocation(shaderProgram, "uColor");
        if (object.color) {
          var color = object.color;
          gl.uniform4f(colorLocation, color.r, color.g, color.b, 1);
        }
        else {
          gl.uniform4f(colorLocation, 1.0, 1.0, 1.0, 1);
        }

        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 6);
      }
      
      requestAnimationFrame(this.draw.bind(this));
    }

Basically what I am doing is getting the positional coordinates together for where to draw the image/rect.

Then i check if the object has an image. If it does, calculate the texture coordinates based on its sprite width against the image dimensions. And bind the texture.

Then below, i set the uniform color to white if the object has no color. If the object does have a color, it sets the uniform from that.

Now given that in my list the image sprite is first, the rect is second, the bindTexture is called against the image first. This sticks around for the draw call. OpenGL is a state machine, so the image draws first, stays bound and then gets drawn again for the rect coordinates. It just uses the green colour i have saved in the rect.

So my main question here would be: **Is there a proper way to clear this?** or is there a way to draw colour against vertices only in some cases, and a texture in another?

Here's my shaders:

    <script id="shader-fs" type="x-shader/x-fragment">
      precision mediump float;

      varying vec2 vTextureCoord;
      uniform sampler2D uSampler;
      uniform vec4 uColor;

      void main(void) {
        gl_FragColor = texture2D(uSampler, vec2(vTextureCoord.s, vTextureCoord.t)) * uColor;
      }
    </script>

    <script id="shader-vs" type="x-shader/x-vertex">
      attribute vec2 aVertexPosition;
      attribute vec2 aTextureCoord;
      
      uniform mat3 uMatrix;
      varying vec2 vTextureCoord;

      void main() {
        gl_Position = vec4((uMatrix * vec3(aVertexPosition, 1)).xy, 0, 1);
        vTextureCoord = aTextureCoord;
      }
    </script>

Pretty simple. Uses the uniform matrix to have screen coordinates in my code over clip coordinates.

# Answer

The typical way to draw with a texture or a color using a single shader is to set the one you're not using to white and multiply or black and add. I prefer white and multiply which is what you already have.

So, when you want to draw with just a texture

    var whiteColor = [1, 1, 1, 1];

    gl.bindTexture(gl.TEXTURE_2D, textureWithImageInIt);
    gl.uniform4fv(uColorLocation, whiteColor);

When you want to draw with just a color bind a 1x1 pixel white texture

at init time

    var white1PixelTexture = gl.createTexture();
    gl.bindTexture(gl.TEXTURE_2D, white1PixelTexture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, 1, 1, 0, gl.RGBA, gl.UNSIGNED_BYTE,
                  new Uint8Array([255,255,255,255]));

at draw time

    gl.bindTexture(gl.TEXTURE_2D, white1PixelTexture);
    gl.uniform4fv(uColorLocation, someColor);  

This works because `white = 1` and `1 * something = something` so `texture * 1 = texture`, `1 * color = color`;

It also lets you tint the texture for simple effects. Set the color to say redish `[1, 0.4, 0.4, 1]` and you'll get a red version of your texture. Adjust the alpha over time `[1, 0, 0, lerpColorOverTime]` and you can fade out your textures.


