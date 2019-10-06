Title: an internal counter in webgl?
Description:
TOC: qna

# Question:

I am learning WebGL by doing a simple drawing: a horizontal line and a vertical line, alternatively every 10 frames  (i.e 10 frames display a horizontal line, then the next 10 frames display a vertical line). I got that going by keeping a counter in js code, then give the vertex shader proper the coords on every frame. Is there a way to let the WebGL program to  handle this counter, instead of js? Is it possible to pass 4 points (of the 2 lines) to the WebGL program once, and make it handle the counting with some kind of variable that persists through every main interation? 

I hope I can demonstrate better with the below code. The counter variable is what I am hoping for

    attribute vec3 coordinates;
    int counter = 0;
    void main(void) {
        counter = counter + 1;
        if (counter < 10){
            gl_Position = vec4(coordinates[0], coordinates[1], coordinates[2], 1.0);
        } else {
            gl_Position = vec4(coordinates[3], coordinates[4], coordinates[5], 1.0);
        }
        if (counter >= 20){
            counter = 0;
        }
    }

If that is not possible, please tell me how to handle this problem? Is passing the right vertices from js code the way to go?

Thank you very much for your attention. Any help would be appreciated.



# Answer

In WebGL1 there is no counter. You'd have to pass one in. You can do this by filling a buffer with an increasing number and pass that in as an attribute to your vertex shader.

In WebGL2 there is a built in counter, `gl_VertexID` as well as `gl_InstanceID`

Whether or not you should be using counters depends on your use case. The normal way to draw a lot of points is to pass the points in as data via attributes.

The normal way to draw consecutive points right next to each other is to pass in vertices that generate a triangle that covers the points you want rendered.

Using the counters, either your own in WebGL1 or the built in ones in WebGL2 is fairly uncommon.

GLSL shaders have no state between one iteration and the next so your counter example won't work.

If you're new to WebGL might I suggest [these articles](https://webglfundamentals.org)
