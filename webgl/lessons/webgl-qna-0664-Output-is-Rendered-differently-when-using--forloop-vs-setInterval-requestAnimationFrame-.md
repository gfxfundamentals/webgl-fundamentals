Title: Output is Rendered differently when using( forloop vs setInterval,requestAnimationFrame)
Description:
TOC: qna

# Question:

I'm facing problem with ForLoop vs (setInterval,requestAnimationFrame)
The Code below simply draws random rectangle on canvas.<br/>
I'm avoiding to make this question large by Copy/pasting the whole code here, instead i'll post relevant code  with a Demo  <br/>
The issue is when i use <br/>1. For loop to draw 50 Rectangle i get All 50 Rectangle on screen as shown below, but instead of forloop <br/>2.if i use setInterval or requestAnimation(callback) i get Single rectangle.<br/> In second case Whenever a new Rectangle is drawn previously drawn rectangle is Clear so final o/p i get as single Rectangle but this is not happening if i use a forloop Why so?<br/>
I have tested my case with 

> ForLoop,setInterval and requestAnimationFrame

**using For loop:**
My Code Flow goes this way and a [Demo][1]:

    function main() {
     .....
      drawRects();
    }
    function drawRects() {
    for(var i=0;i<50;i++){
      setRectangle(gl, randomInt(100), randomInt(100),randomInt(100), randomInt(100));
      //draw Rectangle
      ....
    }}
    main();

and i get Output as:
[![Output using a For loop][2]][2]
    


**using requestAnimationFrame/ similary with  setInterval:**<br/>
My Code Flow goes this way and a [Demo][3]:

    function main() {
     .....
      render();
    }
    function render(){
  if(rectCount < 50){
   drawRects();
   rectCount++;
  }
  window.requestAnimationFrame(render);
 }
    function drawRects() {
      setRectangle(gl, randomInt(100), randomInt(100),randomInt(100), randomInt(100));
      //draw Rectangle
      ....
    }
    main();
[![Output using requestANimation][4]][4]


  [1]: http://codepen.io/anon/pen/jyzzNQ?editors=0010
  [2]: https://i.stack.imgur.com/1G49C.png
  [3]: http://codepen.io/anon/pen/XpEZqQ?editors=1010
  [4]: https://i.stack.imgur.com/eVFog.png

# Answer

This is because WebGL clears the canvas after it composites

If you don't want WebGL to clear the canvas after compositing you can pass in `preserveDrawingBuffer: true` when creating the context

    var gl = someCanvas.getContext("webgl", { preserveDrawingBuffer: true });

at the possible expense of some perf. 

Some other Q&As that have more details

https://stackoverflow.com/a/33331594/128511

https://stackoverflow.com/a/26790802/128511

