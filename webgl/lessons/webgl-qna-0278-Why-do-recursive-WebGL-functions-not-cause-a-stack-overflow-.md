Title: Why do recursive WebGL functions not cause a stack overflow?
Description:
TOC: qna

# Question:

This is my first question on StackOverflow, so forgive any breaches in protocol.

I'm learning WebGL in a computer graphics class in college.  While learning to make a square rotate on the screen, my classmates and I noticed the following code in the render function:

    function render() 
    { 
     gl.clear(gl.COLOR_BUFFER_BIT); 
     theta += 0.1; 
     gl.uniform1f(thetaLoc, theta); 
     gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4); 
     render(); 
    }

What we don't understand, and our professor was not able to give us an adequate answer, is why this code does not cause a stack overflow since it calls itself recursively.  We ran the code, and it doesn't cause any problems, but we don't understand why.

We weren't able to find an answer to this in our textbook or online.  If anyone can explain it, I'll pass it on to my classmates.  Thanks in advance.

# Answer

That does cause a stack overflow. When I run it I get

    Uncaught RangeError: Maximum call stack size exceeded 

I think you probably saw code like this

    function render() {
       ...
       requestAnimationFrame(render);
    }
    render();

In that case it's not recursive. The render function is requesting an animation frame and then exiting. Then the browser renders the next frame it calls `render` again.

