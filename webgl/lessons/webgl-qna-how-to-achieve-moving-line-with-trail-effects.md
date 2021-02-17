Title: How to Achieve Moving Line with Trail Effects
Description: How to Achieve Moving Line with Trail Effects
TOC: How to Achieve Moving Line with Trail Effects

## Question:

What's the idea of drawing such lines in the following demo? Drawing a single line with trailing effects might be simple. But those lines are also turning their directions.

http://uber.github.io/deck.gl/#/examples/custom-layers/trip-routes

## Answer:

you can pass in UV coordinates for lines or generate one then use that to color the line. Pass in time to scroll something like

{{{example url="../webgl-qna-how-to-achieve-moving-line-with-trail-effects-example-1.html"}}}

Of course you can also use a texture instead of code for the colors


{{{example url="../webgl-qna-how-to-achieve-moving-line-with-trail-effects-example-2.html"}}}



<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="http://miaokaixiang.com">K.Miao</a>
    from
    <a data-href="https://stackoverflow.com/questions/44768471">here</a>
  </div>
</div>
