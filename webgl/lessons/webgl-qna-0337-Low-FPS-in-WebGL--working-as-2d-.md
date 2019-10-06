Title: Low FPS in WebGL (working as 2d)
Description:
TOC: qna

# Question:

<br/>
I have script<br/>
https://drive.google.com/file/d/0B4Cqle1HMxo8LXl6YktuMF9EVWc/view?usp=sharing<br/>
It's working as WebGL 2D<br/>
When it draws 50 images (texture) -- FPS 60, but when it draws 150 and more -- FPS 20-30<br/>
Why?<br/>
How can I solve this problem with WebGL?<br/>
**UPD**<br/>
**[jsFiddle][1]**<br/><br/>
html<br/>

    <canvas id="spirit_canvas"></canvas>
    <div id="fps" style="position:absolute;top:0;left:0;background:rgba(0,0,0,0.1);color:#111;padding:1px 2px;font-size:10px;font-family:sans-serif;z-index:5"></div>
    

js<br/>

    function WebGL2d(id)
    {
     this._el = document.getElementById(id);
     this._gl = null;
    
     this._vertexShader = null;
     this._fragmentShader = null;
     this._program = null;
    
     this._p = {
      positionLocation: null,
      translationLocation: null,
      resolutionLocation: null,
      colorLocation: null,
      texCoordLocation: null,
      v_t: null
     };
    
     this._vertexShaderSrc = "\
      attribute vec2 a_position;\n\
      uniform vec2 u_resolution;\n\
      uniform vec2 u_translation;\n\
      attribute vec2 a_texCoord;\n\
      varying vec2 v_texCoord;\n\
      void main() {\n\
       vec2 position = a_position + u_translation;\n\
       vec2 zeroToOne = position / u_resolution;\n\
       vec2 zeroToTwo = zeroToOne * 2.0;\n\
       vec2 clipSpace = zeroToTwo - 1.0;\n\
       gl_Position = vec4(clipSpace * vec2(1, -1), 0, 1);\n\
       gl_PointSize = 2.;\n\
       v_texCoord = a_texCoord;\n\
      }\n\
     ";
    
     this._fragmentShaderSrc = "\
      precision mediump float;\n\
      uniform vec4 u_color;\n\
      uniform sampler2D u_image;\n\
      varying vec2 v_texCoord;\n\
      uniform int v_t;\n\
      void main() {\n\
       gl_FragColor = u_color;\n\
       if (v_t == 1) {\n\
        gl_FragColor = texture2D(u_image, v_texCoord);\n\
       }\n\
      }\n\
     ";
    
     this._canvas2d = null;
     this._canvas2dCache = null;
     this._canvasPathBuffer = [];
     this._isPointInPath = false;
    
     this.txtr = {};
    
     this._vertexBuffer = null;
     this._indexBuffer = null;
     this._uvBuffer = null;
     this._colorBuffer = null;
    
     // -------------------
    
     this.fillStyle = '#000';
     this.strokeStyle = '#000';
     this.lineWidth = 1;
    
     //----|||
    
     this._init();
    }
    
    WebGL2d.prototype = {
    
     _getCanvas: function(w,h)
     {
      var canvas = document.createElement("canvas");
      canvas.width = w;
      canvas.height = h;
      return canvas.getContext("2d");
     },
    
     _hexToRgbArray: function (hex) {
      var shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      hex = hex.replace(shorthandRegex, function (m, r, g, b) {
       return r + r + g + g + b + b;
      });
    
      var result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? [
       parseInt(result[1], 16),
       parseInt(result[2], 16),
       parseInt(result[3], 16),
       1
      ] : [0,0,0,1];
     },
    
     _rgbToArray: function(rgba) {
      var result = /(?:rgb|rgba)\((\d+),\s?(\d+),\s?(\d+)(?:,\s?(\d+|\d.\d+))?\)/g.exec(rgba);
      if(result) {
       return result.slice(1).filter(isFinite).map(parseFloat);
      } else {
       return [0,0,0,1];
      }
     },
    
     _context: function () {
      var names = ["webgl","experimental-webgl"];
      var context = null;
      for (var ii = 0; ii < names.length; ++ii) {
       try {
        context = this._el.getContext(names[ii], {/*alpha: true, premultipliedAlpha: true, antialiasing: true*/});
       } catch (e) {
       }
    
       if (context) {
        break;
       }
      }
    
      if (context === null) {
       console.error('WebGL2d don\'t init');
       return;
      }
    
      this._gl = context;
    
      console.log('--');
     },
    
     _loadShader: function (src, type) {
      var shader = this._gl.createShader(type);
      this._gl.shaderSource(shader, src);
      this._gl.compileShader(shader);
      var compiled = this._gl.getShaderParameter(shader, this._gl.COMPILE_STATUS);
    
      if (!compiled) {
       lastError = this._gl.getShaderInfoLog(shader);
       console.error("*** Error compiling shader '" + shader + "':" + lastError);
       this._gl.deleteShader(shader);
       return null;
      }
    
      return shader;
     },
    
     _loadProgram: function (shaders) {
      var program = this._gl.createProgram();
      for (var i = 0; i < shaders.length; ++i) {
       this._gl.attachShader(program, shaders[i]);
      }
    
      this._gl.linkProgram(program);
    
      var linked = this._gl.getProgramParameter(program, this._gl.LINK_STATUS);
      if (!linked) {
       lastError = this._gl.getProgramInfoLog(program);
       log.error("Error in program linking:" + lastError);
    
       this._gl.deleteProgram(program);
       return null;
      }
      return program;
     },
    
     _init: function () {
      this._context();
      this._canvas2d = this._getCanvas(this._el.width,this._el.height);
    
      //this._gl.disable(this._gl.DEPTH_TEST);
      this._gl.enable(this._gl.BLEND);
      this._gl.blendFunc(this._gl.SRC_ALPHA, this._gl.ONE_MINUS_SRC_ALPHA);
    
      //this._gl.pixelStorei(this._gl.UNPACK_PREMULTIPLY_ALPHA_WEBGL, true);
      //this._gl.clearDepth (0.0);
      //this._gl.clearColor(0, 0, 0, 1.0);
      //this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
      //this._gl.clear(this._gl.COLOR_BUFFER_BITT);
    
      this._vertexShader = this._loadShader(this._vertexShaderSrc, this._gl.VERTEX_SHADER);
      this._fragmentShader = this._loadShader(this._fragmentShaderSrc, this._gl.FRAGMENT_SHADER);
      this._program = this._loadProgram([this._vertexShader, this._fragmentShader]);
      this._gl.useProgram(this._program);
    
      this._p.positionLocation = this._gl.getAttribLocation(this._program, "a_position");
      this._p.translationLocation = this._gl.getAttribLocation(this._program, "u_translation");
      this._p.resolutionLocation = this._gl.getUniformLocation(this._program, "u_resolution");
      this._p.colorLocation = this._gl.getUniformLocation(this._program, "u_color");
    
      // texture
      this._p.texCoordLocation = this._gl.getAttribLocation(this._program, "a_texCoord");
      this._p.v_t = this._gl.getUniformLocation(this._program, "v_t");
      this._gl.uniform2f(this._p.resolutionLocation, this._el.width, this._el.height);
    
    
      this._initBuff();
     },
    
     _initBuff: function()
     {
      this._vertexBuffer = this._gl.createBuffer();
      this._indexBuffer = this._gl.createBuffer();
      this._uvBuffer = this._gl.createBuffer();
      this._colorBuffer = this._gl.createBuffer();
     },
    
     _drawArrTriangle: function(num)
     {
      this._gl.drawArrays(this._gl.TRIANGLE_STRIP, 0,num);
     },
    
     // ==========
    
     _setColor: function (color)
     {
      this._gl.uniform1i(this._p.v_t, 0);
    
      if (!(color instanceof Array)) {
    
       if (color.indexOf('r') === 0 || color.indexOf('R') === 0) {
        color = this._rgbToArray(color);
       } else {
        color = this._hexToRgbArray(color);
       }
      }
    
      color[0] = Math.round(color[0] / 255 * 100)/100;
      color[1] = Math.round(color[1] / 255 * 100)/100;
      color[2] = Math.round(color[2] / 255 * 100)/100;
    
      this._gl.uniform4f(this._p.colorLocation, color[0], color[1], color[2], color[3]);
     },
    
     _buff: function (arr)
     {
      this._gl.enableVertexAttribArray(this._p.positionLocation);
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._vertexBuffer);
      this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array(arr), this._gl.DYNAMIC_DRAW);
      this._gl.vertexAttribPointer(this._p.positionLocation, 2, this._gl.FLOAT, false, 0, 0);
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
     },
    
     _buffTexture: function(image)
     {
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, this._uvBuffer);
      this._gl.bufferData(this._gl.ARRAY_BUFFER, new Float32Array([
       0.0,  0.0,
       1.0,  0.0,
       0.0,  1.0,
       0.0,  1.0,
       1.0,  0.0,
       1.0,  1.0]), this._gl.STATIC_DRAW);
    
      this._gl.enableVertexAttribArray(this._p.texCoordLocation);
      this._gl.vertexAttribPointer(this._p.texCoordLocation, 2, this._gl.FLOAT, false, 0, 0);
      this._gl.bindBuffer(this._gl.ARRAY_BUFFER, null);
      if (!(image.src in this.txtr)) {
       this.txtr[image.src] = this._gl.createTexture();
    
       this._gl.bindTexture(this._gl.TEXTURE_2D, this.txtr[image.src]);
    
       // Set the parameters so we can render any size image.
       this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_S, this._gl.CLAMP_TO_EDGE);
       this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_WRAP_T, this._gl.CLAMP_TO_EDGE);
       this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MIN_FILTER, this._gl.LINEAR);
       this._gl.texParameteri(this._gl.TEXTURE_2D, this._gl.TEXTURE_MAG_FILTER, this._gl.LINEAR);
    
       this._gl.texImage2D(this._gl.TEXTURE_2D, 0, this._gl.RGBA, this._gl.RGBA, this._gl.UNSIGNED_BYTE, image);
      } else {
       this._gl.bindTexture(this._gl.TEXTURE_2D, this.txtr[image.src]);
      }
    
     },
    
     //--------------------------------------------
    
     fillRect: function(x,y,w,h,color,image)
     {
      var translation = [0, 0];
      translation[0] = x;
      translation[1] = y;
    
      var x2 = x + w;
      var y2 = h + y;
    
      this._buff(
       [
        x,y,
        x2,y,
        x,y2,
    
        x,y2,
        x2,y,
        x2,y2
       ]
      );
    
      if (!image) {
       if (color) {
        this._setColor(color);
       } else {
        this._setColor(this.fillStyle);
       }
      }
    
      this._drawArrTriangle(6);
     },
    
     strokeRect: function(x, y, w, h)
     {
      this.fillRect(
       x,
       y,
       w,
       this.lineWidth,
       this.strokeStyle
      );
    
      this.fillRect(
       (x + w - this.lineWidth),
       y,
       this.lineWidth,
       h,
       this.strokeStyle
      );
    
      this.fillRect(
       x,
       (y + h - this.lineWidth),
       w,
       this.lineWidth,
       this.strokeStyle
      );
    
      this.fillRect(
       x,
       y,
       this.lineWidth,
       h,
       this.strokeStyle
      );
    
     },
    
     clearRect: function(x, y, w, h)
     {
      //this._gl.clearDepth (1.0);
      this._gl.clearColor(0, 0, 0, 1.0);
      //this._gl.clear(this._gl.COLOR_BUFFER_BIT | this._gl.DEPTH_BUFFER_BIT);
      //this._gl.clear(this._gl.COLOR_BUFFER_BIT);
     },
    
     beginPath: function(isPointInPath)
     {
      if (isPointInPath == true) {
       this._isPointInPath = true;
       this._canvas2d.beginPath();
      } else {
       this._isPointInPath = false;
       this._canvasPathBuffer = [];
      }
     },
    
     moveTo: function(x,y)
     {
      if (this._isPointInPath == true) {
       this._canvas2d.moveTo(x,y);
      } else {
       this._canvasPathBuffer.push([x,y]);
      }
     },
    
     lineTo: function(x,y)
     {
      if (this._isPointInPath == true) {
       this._canvas2d.lineTo(x,y);
      } else {
       this._canvasPathBuffer.push([x,y]);
      }
     },
    
     fill: function()
     {
    
      if (this._canvasPathBuffer.length == 4) {
    
       this._buff(
        [
         this._canvasPathBuffer[0][0], this._canvasPathBuffer[0][2],
         this._canvasPathBuffer[1][0], this._canvasPathBuffer[1][3],
         this._canvasPathBuffer[2][0], this._canvasPathBuffer[2][4],
    
         this._canvasPathBuffer[2][0], this._canvasPathBuffer[2][5],
         this._canvasPathBuffer[3][0], this._canvasPathBuffer[3][6],
         this._canvasPathBuffer[0][0], this._canvasPathBuffer[0][7]
        ]
       );
    
       this._setColor(this.fillStyle);
    
       this._drawArrTriangle(6);
      }
    
     },
    
     closePath: function()
     {
      if (this._isPointInPath == true) {
       this._canvas2d.closePath();
      }
     },
    
     isPointInPath: function(x,y)
     {
      return this._canvas2d.isPointInPath(x,y);
     },
    
     text: function (text,x,y,size,color,fontStyle,fontFamily,borderColor)
     {
      return false;
     },
    
     fillText: function(text,x,y,maxWidth)
     {
      return false;
     },
    
     drawImage: function(img,x,y, w, h)
     {
      this._gl.uniform1i(this._p.v_t, 1);
      this._buffTexture(img);
      this.fillRect(x,y,w,h,false,true);
     }
    
    };
    
    function microtime()
    {
     return new Date().getTime();
    }
    
    function round(s,exp) {
     exp = exp || 0;
     return Math.round(s * Math.pow(10,exp)) / Math.pow(10,exp);
    }
    
    
    window.requestAnimFrame = (function(){
     return  window.requestAnimationFrame       ||
      window.webkitRequestAnimationFrame ||
      window.mozRequestAnimationFrame    ||
      window.oRequestAnimationFrame      ||
      window.msRequestAnimationFrame     ||
      function(callback, element){
       window.setTimeout(callback, 1000 / 60);
      };
    })();
    
    
    var canvas;
    var image;
    var fpsLastCalledTime;
    
    var height = 400;
    var width = 700;
    
    function main() {
     var $el = $('#spirit_canvas');
    
     $('body').css('width',(width + 'px'));
     $el.css({'width':(width + 'px'),'height':(height + 'px')}).attr('width',width).attr('height',height);
    
     canvas = new WebGL2d('spirit_canvas');
    
     image = new Image();
     image.src = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABoAAAAlCAYAAABcZvm2AAAAGXRFWHRTb2Z0d2FyZQBBZG9iZSBJbWFnZVJlYWR5ccllPAAAAWNJREFUeNrsV8sNwjAMbUqBBWACxB2pQ8AKcGALTsAJuDEFB1gBhuDAuWICmICPQh01pXWdJqEFcaglRGRbfonjPLuMc+5QwhjLGEJfZusjxZOL9akZKye9G98vPMfvsAx4qBfKwfzBL9s6uUHpI6U/u7+BKGkNb/H6umtk7MczF0HyfKS4zo/k/4AgTV8DOizrqX8oECgC+MGa8lGJp9sJDiAB8nyqYoglvJOPbP97IqoATGxWVZeXJlMQwYHA3piF8wJIblOVNBBxe3TPMLoHIKtxrbS7AAbBrA4Y5NaPAXf8LjN6wKZ0RaZOnlAFZnuXInVR4FTE6eYp0olPhhshtXsAwY3PquoAJNkIY33U7HTs7hYBwV24ItUKqDwgKF3VzAZ6k8HF+B1BMF8xRJbeJoqMXHZAAQ1kwoluURCdzepEugGEImBrIADB7I4lyfbJLlw92FKE6b5hVd+ktv4vAQYASMWxvlAAvcsAAAAASUVORK5CYII=";
     image.onload = function() {
      play();
     }
    }
    
    function play()
    {
     //this.time = microtime();
    
     canvas.clearRect();
     draw();
     drawFps();
    
     requestAnimFrame(play.bind(window));
    }
    
    drawFps = function()
    {
     var fps;
    
     if(!fpsLastCalledTime) {
      fpsLastCalledTime = microtime();
      fps = 0;
     } else {
      fps = round(1000/(microtime() - fpsLastCalledTime));
      fpsLastCalledTime = microtime();
     }
     $('#fps').html('fps: ' + fps);
    
    };
    
    function draw()
    {
     canvas.fillRect(0,0,width,height,'#eee');
    
     var __x = 0;
     var __y = 0;
     var __h = 37;
     var __w = 26;
    
     var x, y, h, w;
    
     for(var i = 0; i < 200; ++i) {
    
      if (i % 26 == 0) {
       __y = __y + __h;
       __x = 0;
      } else {
       __x = __x + __w;
       //__y = __y;
      }
    
      h = __h;
      w = __w;
      x = __x;
      y = __y;
    
      //canvas.fillRect(x,y, w, h,'#050');
    
      canvas.drawImage(image,x,y, w, h);
    
     }
    }
    
    
    main();


  [1]: http://jsfiddle.net/xo7metc8/1/
  [2]: http://jsfiddle.net/xo7metc8/1/ "jsFiddle"
  [3]: http://jsfiddle.net/xo7metc8/1/ "jsFiddle"
  [4]: http://jsfiddle.net/xo7metc8/1/ "jsFiddle"
  [5]: http://jsfiddle.net/xo7metc8/1/ "jsFiddle"
  [6]: http://jsfiddle.net/xo7metc8/1/ "jsFiddle"
  [7]: http://jsfiddle.net/xo7metc8/1/ "jsFiddle"

# Answer

In general you only want to call `gl.bufferData` and `gl.texImage2d` at init time. AFAICT you're calling them for every draw call.


