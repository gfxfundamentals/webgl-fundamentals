Title: The fastest way to draw many circles
Description: The fastest way to draw many circles
TOC: The fastest way to draw many circles

## Question:

I'm currently drawing thousands of circles, instancing a [circle geometry](https://threejs.org/docs/#api/en/geometries/CircleBufferGeometry) (many triangles).

[![enter image description here][1]][1]

alternatively, I could simply instance a quad (2 triangles), but cut out a circle in the fragment shader, using a distance function and `discard`.

[![enter image description here][2]][2]

which approach would be faster? -- is drawing many triangles more expensive than the calculations done in the fragment shader?




  [1]: https://i.stack.imgur.com/CZhOa.png
  [2]: https://i.stack.imgur.com/BG4p5.png

## Answer:

The fastest way might depend on the GPU and lots of other factors like how you're drawing the circles, 2D, 3D, are you blending them, are you using the z-buffer, etc... but in general, less triangles is faster than more, and less pixels is faster than more. So...., all we can really do is try.

First lets just draw textured quads with no blending. First off I always seem to get inconsistent perf from WebGL but in my tests on my GPU I get 20k-30k quads at 60fps in this 300x150 canvas using instancing

{{{example url="../webgl-qna-the-fastest-way-to-draw-many-circles-example-1.html"}}}

And I get the same perf at 60fps using repeated to geometry instead of instancing. That's surprising to me because 7-8yrs ago when I tested repeated geometry was 20-30% faster. Whether that's because of having a better GPU now or a better driver or what I have no idea.

{{{example url="../webgl-qna-the-fastest-way-to-draw-many-circles-example-2.html"}}}

Next thing would be textures or computing a circle in the fragment shader.

{{{example url="../webgl-qna-the-fastest-way-to-draw-many-circles-example-3.html"}}}

I get no measureable difference. Trying your circle function


{{{example url="../webgl-qna-the-fastest-way-to-draw-many-circles-example-4.html"}}}

I again get no measurable difference. Note: like I said above I get wildly inconsistent results in WebGL. When I ran the first test I got 28k at 60fps. When I ran the second I got 23k. I was surprised since I expected the 2nd to be faster so I ran the first again and only got 23k. The last one I got 29k and was again surprise but then I went back and did the previous and got 29k. Basically that means testing timing in WebGL is nearly impossible. There are so many moving parts given everything is multi-process that getting constant results seems impossible.


Could try discard

{{{example url="../webgl-qna-the-fastest-way-to-draw-many-circles-example-5.html"}}}

Given the inconsistent timing I can't be sure but my impression is discard is slower. IIRC discard is slow because without discard the GPU knows even before it executes the fragment shader that it's going to update the z-buffer where as with discard it doesn't know until after the shader executes and that that difference means certain things can't be optimized as well.

I'm going to stop there because there's just too many combinations of things to try.

We could try blending on. Blending is also generally slower though since it has to blend (read the background) but is it slower than discard? I don't know. 

Do you have the depth test on? If so then draw order will be important.

Yet another thing to test is using non-quads like hexgons or octogons as that would run less pixels through the fragment shader. I suspect you might need to make the circles bigger to see that but if we have a 100x100 pixel quad that's 10k pixels. If we have perfect circle geometry that's about pi*r^2 or ~7853 or 21% less pixels. A Hexagon would be ~8740 pixels or 11% less. An octogon somewhere in between. Drawing 11% to 21% less pixels is usually a win but of course course for hexagon you'd be drawing 3x more triangles, for an octogon 4x more. You'd basically have to test all these cases.

That points out another issue in that I believe you'd get different relative results with larger circles on a larger canvas since there'd be more pixels per circle so for any given number of circles drawn more % of time would be spent drawing pixels and less calculating vertices and/or less time restarting the GPU to draw the next circle.

## Update

Testing on Chrome vs Firefox I got 60k-66k in all cases in Chrome on the same machine. No idea why the difference is so vast given that WebGL itself is doing almost nothing. All 4 tests only have a single draw call per frame. But whatever, at least as of 2019-10 Chrome as more than twice as fast for this particular case than Firefox

One idea is I have a dual GPU laptop. When you create the context you can tell WebGL what you're targeting by passing in the `powerPreference` context creation attribute as in in

    const gl = document.createContext('webgl', {
      powerPreference: 'high-performance',
    });

The options are 'default', 'low-power', 'high-performance'. 'default' means "let the browser decide" but ultimately all of them mean "let the browser decide". In any case setting that above didn't change anything in firefox for me.


<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 4.0 by
    <a data-href="http://www.github.com">kindoflike</a>
    from
    <a data-href="https://stackoverflow.com/questions/58354135">here</a>
  </div>
</div>
