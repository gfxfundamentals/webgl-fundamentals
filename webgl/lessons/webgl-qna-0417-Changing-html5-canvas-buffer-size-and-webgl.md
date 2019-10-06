Title: Changing html5 canvas buffer size and webgl
Description:
TOC: qna

# Question:

Changing html5 canvas buffer size i.e. canvas.width and canvas.height seems to change the canvas display dimentions on ios 8 and ios 9 when using webgl, in desktop browsers seems to be ok:
https://jsfiddle.net/psqvur80/

    <html>
 <head>
    
 </head>
 <body>
 <div id="iv" style="width:400px;height:400px;"></div>
 <script type="text/javascript">
  var iv = document.getElementById('iv');
 
  var test = function(){
   this.canvas = document.createElement('canvas');
   this.canvas.style.width = '100%';
   this.canvas.style.height = '100%';
   this.canvas.width = 200;
   this.canvas.height = 200;
   this.canvas.style.borderColor = 'red';
   this.canvas.style.borderWidth = '2px';
   this.canvas.style.borderStyle = 'solid';
   iv.appendChild(this.canvas);
   this.initWebGL();
   
  }

  test.prototype.initWebGL = function() {
   // attempt to get a webgl context
   try {
    var gl = this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
   } catch (e) {
    return false;
   }
   
   
  };
  
  var testcase = new test();
  
  testcase.gl.viewport(0, 0, 200, 200);
  testcase.gl.clearColor(0, 0.5, 0, 1);
  testcase.gl.clear(testcase.gl.COLOR_BUFFER_BIT);
  
  setTimeout(function(){
   //console.log('resize');
   testcase.gl.viewport(0, 0, 100, 100);
   testcase.canvas.width = 100;
   testcase.canvas.height = 100;
   
   testcase.gl.clearColor(0, 0.5, 0, 1);
   testcase.gl.clear(testcase.gl.COLOR_BUFFER_BIT);
  }, 2000);
  
  
  
 </script>    
 </body>
</html> 

I tried viewport settings, but with no luck.
How can I keep the display dimentions while changing buffer size of the canvas ?

# Answer

sigh ... looks like a bug in iOS Safari. [Filed a bug](https://bugs.webkit.org/show_bug.cgi?id=152556)

I haven't found a direct workaround yet. One crappy workaround is to change the size of the container for a moment.

    iv.style.width = "401px";
    requestAnimationFrame(function() {
      iv.style.width = "400px";
    });

I think I haven't noticed this issue since I always make the canvas the same size as it's being displayed. 

Is there some reason your use case requires the canvas to be smaller? It's clearly a bug in Safari. Just asking if you can work around it
