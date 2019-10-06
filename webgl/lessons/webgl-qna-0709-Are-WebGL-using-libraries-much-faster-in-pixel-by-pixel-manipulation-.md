Title: Are WebGL using libraries much faster in pixel by pixel manipulation?
Description:
TOC: qna

# Question:

#Hello Internet!#
Playing around with code to make maybe cool but useless things is my hobby.

But as I do it more and more I want to make more complex things, and I think that **2d canvas context** just isn't enough anymore.
******

So that leads me to
##This question:##
**Is using some of the WebGL 2d libraries such as Pixi.js make pixel by pixel manipulation faster?**

I know it might seem like a silly question and the answer might be obvious but it isn't for me.

I know that I would get huge frame improvement if trying to make a game, but let me try to give you an example of what I'm planning to create:

**Here's a snippet of one of my silly "projects"** 

The code is total spaghetti, I didn't bother to make it tidy, but you can run it on full screen, and you might get an idea of what I'm planning to create.
<!-- begin snippet: js hide: true console: true babel: false -->

<!-- language: lang-js -->

    var width = 800;
    var height = 400;
    var canvas = document.getElementById("canv");
    canvas.width = width;
    canvas.height = height;
    var ctx = canvas.getContext("2d");

    ctx.fillStyle = "#000000";
    ctx.fillRect(0, 0, width, height);

    var imageData = ctx.getImageData(0, 0, width, height);
    var data = imageData.data;

    var input = "Math.tan((y - height/2) / (x - width/2))*(180/Math.PI)";
    var calc;

    function inputChanged(inp) {
      var x, y, i;
      try {
        eval("calc = function(x, y, i){ return " + inp.value + " }");
        inp.style.cssText = "border: 2px solid green";
        document.getElementById("errorLog").innerHTML = "";
        draw();
      } catch (e) {
        inp.style.cssText = "border: 2px solid red";
        document.getElementById("errorLog").innerHTML = e;
      }
    }

    function przyklad(str) {
      var polecenieElement = document.getElementById("polecenie");
      polecenieElement.value = str;
      inputChanged(polecenieElement);
    }

    function draw() {
      for (var index = 0; index < data.length; index += 4) {
        var i = index / 4;
        var y = Math.floor(i / width);
        var x = i - y * width;
        var equation = calc(x, y, i);
        var clr = hsl2rgb(equation, 100, 50);
        data[index] = clr.r;
        data[index + 1] = clr.g;
        data[index + 2] = clr.b;
        data[index + 3] = 255;
      }

      ctx.putImageData(imageData, 0, 0);
    }

    function getColor(number) {
      var n = number % 510;
      return n > 255 ? (255 - (n - 255)) : n;
    }

    function hsl2rgb(h, s, l) {
      h = h % 360;
      var m1, m2, hue;
      var r, g, b
      s /= 100;
      l /= 100;
      if (s == 0)
        r = g = b = (l * 255);
      else {
        if (l <= 0.5)
          m2 = l * (s + 1);
        else
          m2 = l + s - l * s;
        m1 = l * 2 - m2;
        hue = h / 360;
        r = HueToRgb(m1, m2, hue + 1 / 3);
        g = HueToRgb(m1, m2, hue);
        b = HueToRgb(m1, m2, hue - 1 / 3);
      }
      return {
        r: r,
        g: g,
        b: b
      };
    }

    function HueToRgb(m1, m2, hue) {
      var v;
      if (hue < 0)
        hue += 1;
      else if (hue > 1)
        hue -= 1;
      if (6 * hue < 1)
        v = m1 + (m2 - m1) * hue * 6;
      else if (2 * hue < 1)
        v = m2;
      else if (3 * hue < 2)
        v = m1 + (m2 - m1) * (2 / 3 - hue) * 6;
      else
        v = m1;
      return 255 * v;
    }

<!-- language: lang-css -->

    #canv {
      border: 1px solid black;
    }

    #polecenie {
      width: 400;
    }

    .przyklad {
      background-color: #ddd;
      margin-top: 5px;
      border: 1px solid black;
      width: 400;
    }

    .przyklad:hover {
      background-color: #888;
    }

<!-- language: lang-html -->

    <body onload="inputChanged(document.getElementById('polecenie'));">
      <canvas id="canv"></canvas><br><br>
      <b>AVAILABLE VARIABLES: </b><br>
      <b>x, y</b> - X, Y coordinates of current pixel.<br>
      <b>i</b> - index of current pixel.<br>
      <b>width, height</b> - canvas width & height;<br><br> Rotation of hsl color in point (x,y) = <input id="polecenie" type="text" value="Math.tan((y - height/2) / (x - width/2))*(180/Math.PI)" oninput="inputChanged(this);"></input>
      <br><br><b id="errorLog" style="color: red;"></b><br> Cool examples:
      <div class="przyklad" onclick="przyklad(this.innerText);">Math.atan2((y - height/2),(x - width/2))*(180/Math.PI)</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">Math.tan((y - height/2) / (x - width/2))*(180/Math.PI)</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">Math.asin((y - height/2) / (x - width/2))*(180/Math.PI)</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">x * y</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">(width*height)/x*y;</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">Math.random()*360</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">Math.sqrt((x - width/2)*(x - width/2) + (y - height/2)*(y-height/2)) > 150 ? 100: Math.sqrt((x - width/2)*(x - width/2) + (y - height/2)*(y-height/2));</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">((height*width) / (x+y)) + x%50</div>
      <div class="przyklad" onclick="przyklad(this.innerText);">Math.random()*30+((x
        < width/2.3 && y <=height/1.86) ? ((((y-6) % 35 < 18 && x % 45 < 20)&&(((y-6) % 35> 5 && x % 45 > 5))) ? i%3 == 0 ? 0 : (i%2 == 0 ? 240 : 120) : (i%3 == 200 ? 0 : (y%2 == 0 ? 240 : 280))) : (y % (height/6.5)
          < (height/(13)) ? i%3==0 ? 0 : (i%2==0 ? 240 : 0) : i%3==0 ? 0 : (x%2==0 ? 120 : 240)))</div>
    </body>

<!-- end snippet -->

##So...?##
**Is it worth** to use some sort of library for this kind of applications?

Is the fps gain going to be worth spending the time learning API?

##Also as a side question:##
**Could someone** recommend me something (some book, or a site) where I could learn how to make my code nice and clean?
****
Thank you!

# Answer

It really depends on what you mean by Pixel by Pixel manipulation.

I would say pixi.js itself would do nothing for pixel by pixel manipulation. That's not its point. On the other hand, using WebGL to do pixel by pixel manipulation should be faster in those cases where what you're trying to matches what [webgl can do](https://webglfundamentals.org/webgl/lessons/webgl-how-it-works.html)

As for your *silly projects* those looks like the kinds of things that are done on https://glslsandbox.com and https://shadertoy.com
