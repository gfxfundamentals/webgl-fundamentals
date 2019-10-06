Title: How to use different drawArrays types in one program using WebGL?
Description:
TOC: qna

# Question:

I have an assignment with little context on how to actually implement what the professor is asking (I am also a novice at Javascript, but I know a ton about c and c++). The WebGL program must render 3 different types of drawArray calls: POINTS, TRIANGLE_FAN, and LINES. 

I have different arrays for each, respectively, and I know how to draw one type at a time, but I am unsure as to how to draw 3 different types. 

Should all the vectors be put into one giant array? I tried doing this method and the first TRIANGLE_FAN would draw correctly, but calling drawArrays again with the other two types, and setting the offset to be the 'first' index of a line, and then a 'point', gave me the errors:

    WebGL error INVALID_OPERATION in drawArrays(ONE, 36, 2)
    WebGL error INVALID_OPERATION in drawArrays(NONE, 40, 1)

Alternatively, using separate arrays for each type, and setting buffers for each, how do you go about drawArrays when there is more than one array set to 'gl' -> (getWebGLContext(canvas))? 

For reference, this is what the professor assigned:

    
        Write a WebGL program that displays a rotating pendulum.  The
        pendulum bob is free to rotate through 360 degrees about an anchor 
        point at the center of the canvas.  The pendulum has the following 
        three components.
 
        1)  The anchor point is a green square centered at the origin 
            (0,0) with point size = 5 pixels.

        2)  The bob is a blue hexagon of radius r = 0.1.  Render this with
            a triangle fan centered at the origin (along with a ModelView
            matrix that translates and rotates).

        3)  The bob is attached to the anchor point by a rigid red wire of
            length l = 0.8.

        Use global variables for the point size of the anchor, the radius
        of the bob, the length of the wire, and the angular velocity of 
        rotation in degrees per second.  Set the initial angular velocity
        to 45 and allow an interactive user to increase or decrease the
        value in multiples of 10 degrees per second with button presses.

# Answer

It's up to you. WebGL doesn't care as long as you specify things correctly. In your case if you put them the same buffer you need to specify offsets to each piece data.

The most common way would be to put the data for each draw call in its own buffers.

also the first argument to `drawArrays` is the primitive type (POINT, LINE, TRIANGLES, etc) not ONE or NONE has you've put in your question

You might want to check out some [tutorials on webgl](http://webglfundamental.org)

