Title: Bad zooming with pixi.js / WebGL
Description:
TOC: qna

# Question:

If you put some text on a *pixi.js* / WebGL canvas, and zoom on it, here is what happens : http://jsbin.com/qeqoneselelo/1/. 

![enter image description here][1]

The result is **bad** : blurred / pixelized like if we were zooming on a bitmap.

Instead I would like to be able to zoom on this text, as if it was vector graphics (text actually is !), ie no blur at all, like here for example (you can zoom infinitely many times, no blur !) : http://s419743653.onlinehome.fr/things/test2.htm

**How to do a proper zooming on text with pixi.js ?** (or, if impossible with pixi.js, with another WebGL canvas javascript toolkit ?)


---

*Here is the code I used (available only on http://jsbin.com/qeqoneselelo/1/)* :

    var text = new PIXI.Text("Hello World", {font:"50px Arial", fill:"black"});
    var scrollArea = new PIXI.DisplayObjectContainer();
    scrollArea.scale.x = 10;
    scrollArea.scale.y = 10;
    scrollArea.addChild(text);      
    stage.addChild(scrollArea);


  [1]: http://i.stack.imgur.com/QGgtm.jpg

# Answer

As far as I know there is no way. 

That's the whole point of pixi.js. It gets its speed by using bitmap sprites. The consequence of which you get the effect you see when you scale but you get super speed.

If you want smooth text you don't need pixi.js. Just you use the canvas API. Of course you'll give up some of the speed and other features of pixi.js but you'll get smooth text.

If you want to keep using pixi.js, one solution is to use LODs.  Make multiple sprites with progressively larger text on them and as you zoom in use a progressively larger sprite with higher res text but with its individual scale so it keeps the same size. Unfortunately because font sizes are slightly unpredictable getting the sprites to transition flawlessly might require some trial and error.
    var texts = [];
    for (var ii = 0; ii < 15; ++ii) {
      
      var text = new PIXI.Text("Hello World", {font: (ii * 10) +"px Arial", fill:"black"});
      text.scale.x = 1 / (1 + ii);
      text.scale.y = 1 / (1 + ii);
      texts.push(text);
    }

    ...

      text = undefined;
      function animate() {
          var t = Date.now() * 0.001;
          var scale = 1 + 14 * (Math.sin(t) * 0.5 + 0.5);
          if (text) {
              scrollArea.removeChild(text);
          }
          text = texts[Math.floor(scale)];
          scrollArea.addChild(text);
          scrollArea.scale.x = scale;
          scrollArea.scale.y = scale;
          renderer.render(stage);        
          requestAnimFrame(animate);
      }

Here's an example

<!-- begin snippet: js hide: true -->

<!-- language: lang-js -->

      var stage = new PIXI.Stage(0xFFFFFF);
        var renderer = PIXI.autoDetectRenderer(800, 600);
        document.body.appendChild(renderer.view);
        var texts = [];
        for (var ii = 0; ii < 15; ++ii) {
          
          var text = new PIXI.Text("Hello World", {font: (ii * 10) +"px Arial", fill:"black"});
          text.scale.x = 1 / (1 + ii);
          text.scale.y = 1 / (1 + ii);
          texts.push(text);
        }
          
          var scrollArea = new PIXI.DisplayObjectContainer();
          
          scrollArea.interactive = true;
          scrollArea.buttonMode = true;
          
          
         // scrollArea.addChild(text);      
          stage.addChild(scrollArea);
          
          
          scrollArea.mousedown = function(data) {
            data.originalEvent.preventDefault();
            this.data = data;
            this.dragging = true;
          }
          
          scrollArea.mouseup = scrollArea.mouseupoutside = function(data) {
            this.dragging = false;
            this.data = null;
          }
          
          scrollArea.mousemove = function(data) {
            if (this.dragging) {
              var newPos = this.data.getLocalPosition(this.parent);
              this.position.x = newPos.x;
              this.position.y = newPos.y;
            }
          }
          
          text = undefined;
          function animate() {
              var t = Date.now() * 0.001;
              var scale = 1 + 14 * (Math.sin(t) * 0.5 + 0.5);
              if (text) {
                  scrollArea.removeChild(text);
              }
              text = texts[Math.floor(scale)];
              scrollArea.addChild(text);
              scrollArea.scale.x = scale;
              scrollArea.scale.y = scale;
              renderer.render(stage);        
              requestAnimFrame(animate);
          }
          
          animate();

<!-- language: lang-html -->

    <script src="//cdnjs.cloudflare.com/ajax/libs/pixi.js/1.6.1/pixi.js"></script>


<!-- end snippet -->
