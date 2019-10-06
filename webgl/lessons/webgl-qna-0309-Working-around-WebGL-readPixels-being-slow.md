Title: Working around WebGL readPixels being slow
Description:
TOC: qna

# Question:

I'm trying to use WebGL to speed up computations in a simulation of a small quantum circuit, like what the [Quantum Computing Playground does](https://github.com/gwroblew/Quantum-Computing-Playground/blob/c91de9d7e17b9991d0b455ff5186c049563b13c4/js/simulator.js#L1003). The problem I'm running into is that `readPixels` takes ~10ms, but I want to call it several times per frame while animating in order to get information out of gpu-land and into javascript-land.

As an example, here's my exact use case. The following circuit animation was created by computing things about the state between each column of gates, in order to show the inline-with-the-wire probability-of-being-on graphing:

![Circuit animation](http://i.imgur.com/gf8UnEQ.gif)

The way I'm computing those things now, I'd need to call readPixels eight times for the above circuit (once after each column of gates). This is *waaaaay* too slow at the moment, easily taking 50ms when I profile it (bleh).

What are some tricks for speeding up readPixels in this kind of use case?

- Are there configuration options that significantly affect the speed of readPixels? (e.g. the pixel format, the size, not having a depth buffer)
- Should I try to make the `readPixel` calls all happen at once, after all the render calls have been made (maybe allows some pipelining)?
- Should I try to aggregate all the textures I'm reading into a single megatexture and sort things out after a single big read?
- Should I be using a different method to get the information back out of the textures?
- Should I be avoiding getting the information out at all, and doing all the layout and rendering gpu-side (urgh...)?

# Answer

I don't know enough about your use case but just guessing, Why do you need to readPixels at all? 

First, you don't need to draw text or your the static parts of your diagram in WebGL. Put another canvas or svg or img over the WebGL canvas, set the css so they overlap. Let the browser composite them. Then you don't have to do it.

Second, let's assume you have a texture that has your computed results in it. Can't you just then make some geometry that matches the places in your diagram that needs to have colors and use texture coords to look up the results from the correct places in the results texture? Then you don't need to call readPixels at all. That shader can use a ramp texture lookup or any other technique to convert the results to other colors to shade the animated parts of your diagram.

If you want to draw numbers based on the result you can use [a technique like this](http://blog.tojicode.com/2012/07/sprite-tile-maps-on-gpu.html) so you'd make a shader at references the result shader to look at a result value and then indexes glyphs from another texture based on that.

Am I making any sense? 

