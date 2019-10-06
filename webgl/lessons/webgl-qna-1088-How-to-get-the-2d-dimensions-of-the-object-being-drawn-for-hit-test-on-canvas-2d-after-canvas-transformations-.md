Title: How to get the 2d dimensions of the object being drawn for hit test on canvas 2d after canvas transformations?
Description:
TOC: qna

# Question:

I draw simple shapes on 2d canvas, while applying transformations on shapes like so:

      const rect = ({ x, y, width, height }) => {
        ctx.fillStyle = 'black';
        ctx.fillRect(x, y, width, height);
      };
    
      const transform = ({ translate, rotate, scale }, f) => {
        // ctx is a 2d canvas context
        ctx.save();
    
        if (translate) {
          ctx.translate(translate[0], translate[1]);
        }
        if (rotate) {
          ctx.rotate(rotate);
        }
    
        if (scale) {
          ctx.scale(scale[0], scale[1]);
        }
    
        f(ctx);
    
        ctx.restore();
      };
      const draw = () => {
         transform({ translate: [10, 10] }, () => {
            rect({ x: 0, y: 0, width: 10, height: 10 });
         });
      };

Now I need to know the dimensions of this rectangle in the canvas space so that I can hit test against the mouse click position.

Earlier I asked this question https://stackoverflow.com/questions/57697719/how-to-get-the-2d-dimensions-of-the-object-being-drawn-for-hit-test-on-webgl-aft about webgl hit test detection. But the solution doesn't apply here because I don't have a transformation matrix.


One possible solution is, I draw the same object on a different canvas called a collision canvas, with a specific color related to object, later when I want to hit test against a position on canvas, I query the collision canvas color on that position and see if the color matches the object specific color, would that be a good idea?

I see best solution is to use `ctx.currentTransform` method. Per the object's dimensions are known, the transformed dimensions can be found by this function:

    function applyTransform(bounds, currentTransform) {
      bounds.x = ct.e + bounds.x * ct.a;
      bounds.y = ct.f + bounds.y * ct.d;
      bounds.width = bounds.width * ct.a;
      bounds.height = bounds.height * ct.d;
    }



# Answer

this really depends on what your question is. You wrote:

> How to get the 2d dimensions of the object being drawn

And you wrote

> for hit testing.

Which do you want. You want the 2d dimensions or you want hit testing? 

For the dimensions you'd need to know the size of your shape on your own before being transformed. Then you can get the current transform with [`ctx.currentTransform`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/currentTransform)

Unfortunately `currentTransform` is only supported on Chrome as of August 2019 so you need some kind of polyfill but if you search for ["currentTransform polyfill"](https://www.google.com/search?q=currentTransform+polyfill) there are several out there.

For hit testing you can use [`ctx.isPointInPath`](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D/isPointInPath)

You define a path. It does not have to be the same as the thing you're drawing though of course it make some sense if it is. Then you can call 

```
ctx.isPointInPath(pathToCheck, canvasRelativeX, canvasRelativeY);
```

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const ctx = document.querySelector('canvas').getContext('2d');

    const path = new Path2D();
    const points = [
     [10, 0],
     [20, 0],
     [20, 10],
     [30, 10],
     [30, 20],
     [20, 20],
     [20, 30],
     [10, 30],
     [10, 20],
     [0, 20],
     [0, 10],
     [10, 10],
    ];
    points.forEach(p => path.lineTo(...p));
    path.closePath();

    let mouseX;
    let mouseY;

    function render(time) {
      const t = time / 1000;
      ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
      ctx.translate(
          150 + Math.sin(t * 0.1) * 100,
           75 + Math.cos(t * 0.2) * 50);
      ctx.rotate(t * 0.3);
      ctx.scale(
           2 + Math.sin(t * 0.4) * 0.5,
           2 + Math.cos(t * 0.5) * 0.5);
           
      const inpath = ctx.isPointInPath(path, mouseX, mouseY);
      ctx.fillStyle = inpath ? 'red' : 'blue';
           
      ctx.fill(path);
      ctx.setTransform(1, 0, 0, 1, 0, 0);  // reset transform
      
      requestAnimationFrame(render);
    }
    requestAnimationFrame(render);

    ctx.canvas.addEventListener('mousemove', (e) => {
      mouseX = e.offsetX * ctx.canvas.width / ctx.canvas.clientWidth;
      mouseY = e.offsetY * ctx.canvas.height / ctx.canvas.clientHeight;
    });


<!-- language: lang-css -->

    canvas { border: 1px solid black; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->


