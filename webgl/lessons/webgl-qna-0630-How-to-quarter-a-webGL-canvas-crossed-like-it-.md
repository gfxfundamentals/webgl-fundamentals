Title: How to quarter a webGL canvas crossed like it?
Description:
TOC: qna

# Question:

I'm newbie of the WebGL.

I can make canvas and I can draw the cube on the canvas.
[![enter image description here][1]][1]


This is example of drawing cube and tetrahedron on one canvas.
Expend this way, I want to make it like under image. 
My first idea is to divide one canvas, and Second idea is make four canvas.
What is the better way?
[![enter image description here][2]][2]

  [1]: https://i.stack.imgur.com/ujozJ.png
  [2]: https://i.stack.imgur.com/vx2aN.png

# Answer

You can divide the canvas using the scissor and viewport commands


    // turn on the scissor test
    gl.enable(gl.SCISSOR_TEST);

    var width = gl.canvas.width;
    var height = gl.canvas.height;

    for (var y = 0; y < 2; ++y) {
      for (var x = 0; x < 2; ++x) {
         
         // set both the scissor (which clips pixels)
         // and the viewport (which sets the clip space -> pixel space conversion);
         gl.scissor(x * width / 2, y * height / 2, width / 2, height / 2);
         gl.viewport(x * width / 2, y * height / 2, width / 2, height / 2); 

         ...
         draw your scene here
         ...
      }
    }


