Title: Optimizing simple PixiJS stage
Description:
TOC: qna

# Question:

I'm totally new to Pixi, WebGL, Canvas... and actually I'm not making a game but a React webapp

 
What I want to build:

- Draw an image (A4 document scan, generally jpeg/png from 100k to 1m)
- On top of each word of the image, draw an interactive rectangle which can be hovered/clicked
- Thanks to deep learning/OCR, I already have the size of the image and the relative positions of the document words
- Documents can have from 0 to 3000 words
- Ability to zoom

[![enter image description here][1]][1]

 
 

I tried first with regular CSS, but clearly found out that using position absolute was not performant to position thousands of rectangles on the document: performance was not good on scroll for example.

I tried using PixiJS to draw the rectangles on top of the image. The result is better, but I still see some performance problems on my old computer, particularly when the image is zoomed (it affects scroll so it's not really related to JS code I guess)

------------------------

Here is the result: [https://dhatim-poc-mlhafeauav.now.sh/][2]

The solution I used for the above document of:

- An html img tag
- A transparent canvas sitting on top of the image, on which I draw the rectangles (Graphics, drawRect)

-------------------

Can someone tell me how to optimize this for older computers?
How can I audit the performance of this solution properly?
Is there an easy way to simulate an old computer on my dev env? particularly regarding GPU instead of CPU throttling?


--------------------- 


I tried to follow some recommendations found here: [https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas][3]

- I use a background image instead of drawing the image to the canvas (not sure it has a large impact because there is no "game loop")
- I use Math.floor for the position of the words (the PixiJS roundPixels option)
- I also tried with a small canvas and a scale transform: [https://build-ybbdwoumva.now.sh/][4]

 ----------

Are there other recommendations you could give to have better performances?

Particularly:

- should I use Sprite or Graphics for the rectangles?
- should I use canvas or WebGL?
- how can I measure my performance optimizations? I currently feel I'm totally blind and not even sure that what I do produce a better result without concrete numbers
 


Thanks


  [1]: https://i.stack.imgur.com/P8j6d.png
  [2]: https://dhatim-poc-mlhafeauav.now.sh/
  [3]: https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Optimizing_canvas
  [4]: https://build-ybbdwoumva.now.sh/

# Answer

What if you put all your rectancle elements in a parent element and set the style.transform scale on that element. Then you only have to update a single eleement to zoom. 

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const parent = document.querySelector(".areas>div");
    const pair = document.querySelector(".viewer>div");

    const imgWidth = 600;
    const imgHeight = 849;
    const numAreas = 1000;
    for (let i = 0; i < numAreas; ++i) {
      const x = rand(imgWidth - 10);
      const y = rand(imgHeight - 10);
      const w = rand(5, imgWidth - x);
      const h = rand(5, imgHeight - y);
      
      const area = document.createElement("div");
      area.className = "area";
      area.style.left = px(x);
      area.style.top = px(y);
      area.style.width = px(w);
      area.style.height = px(h);
      parent.appendChild(area);
    }

    document.querySelector("#zoom").addEventListener('input', (e) => {
      const s = e.target.value / 100;
      const transform = `scale(${s},${s})`;
      pair.style.transform = transform;
    });

    function rand(min, max) {
      if (max === undefined) {
        max = min;
        min = 0;
      }
      return Math.random() * (max - min) + min | 0;
    }

    function px(v) {
      return `${v}px`;
    }


<!-- language: lang-css -->

    html { box-sizing: border-box; }
    *, *:before, *:after { box-sizing: inherit; }
    .viewer {
      position: relative;  /* so children are relative to this */
    }
    .area { 
      border: 1px solid red;
    }
    .area:hover {
      border: 1px solid yellow;
    }
    .areas {
      position: absolute;
      left: 0;
      top: 0;
      z-index: 2;
      /* to match image */
      width: 600px;
      height 849px;
    }
    .areas>div {
      position: relative;  /* so children are relative to this */
      width: 100%;
      height: 100%;
    }
    .areas>div>div {
      position: absolute;
    }
    .ui {
      position: absolute;
      left: 1em;
      top: 1em;
      background: rgba(0,0,0,.8);
      color: white;
      padding: .5em;
      z-index: 3;
    }
    .ui>input {
      width: 100%;
    }

<!-- language: lang-html -->

    <div class="viewer">
      <div>
        <img src="https://i.imgur.com/TSiyiJv.jpg">
        <div class="areas">
          <div>
          </div>
        </div>
      </div>
    </div>
    <div class="ui">
     <label for="zoom">zoom</label>
     <input type="range" min="1" max="500" value="100" id="zoom">
    </div>

<!-- end snippet -->

I didn't bother to clean it up or set scrollbars etc but it seems to work
