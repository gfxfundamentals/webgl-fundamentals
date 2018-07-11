Title: WebGL Animated Background
Description: How to have an animated background

People often ask how to make an animated background with WebGL.
It's basically an HTML/CSS issue. You need to make a fullscreen
canvas and set it to fill the screen and set to be the background.

```css
#background {
  position: fixed;  /* this makes the element not move with the page */
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: -2;     /* put it behind everything else */
  display: block;
}
```

And some example html

```
<canvas id="background"></canvas>
<h1>This page has an animated background</h1>

<p>Lorem ipsum dolor sit amet, consectetur adipiscing elit.  Vestibulum
blandit nunc molestie elit rhoncus, commodo egestas augue suscipit.
Vestibulum nisi lacus, vehicula id tincidunt ac, viverra at ex.  Ut
blandit mattis sodales.  Quisque laoreet, nunc vitae ultrices aliquet,
lectus nunc sagittis justo, at molestie magna tellus sit amet odio.
Quisque bibendum lectus erat, at tristique nulla condimentum eu.  Quisque
vel velit vel purus scelerisque pretium.  Donec ut faucibus arcu.  Ut vel
dolor et mauris interdum porttitor eget eu magna.  Donec quis dui sit amet
tellus luctus faucibus.  Maecenas finibus tortor vel feugiat pharetra.
Duis ultrices metus erat, et semper nisl rutrum ac.  Integer porta, ipsum
vel porttitor tempor, elit justo volutpat orci, ac scelerisque tortor
nulla non ante.  Proin ut urna lectus.  Suspendisse ultrices eu nunc non
egestas.  Integer ultricies sollicitudin ipsum vel elementum.</p>

<p>Nulla varius, sem id aliquam eleifend, felis metus pulvinar justo, nec
pellentesque leo nibh sit amet ligula.  In sapien justo, porttitor sit
amet porta ac, mollis volutpat urna.  Aenean ut magna nunc.  Maecenas
placerat finibus luctus.  Aliquam at massa purus.  Quisque elementum nunc
velit, ac lacinia justo ultricies at.  Sed nec massa lacus.  Nam ultrices
blandit tellus, in malesuada ipsum lobortis id.  Quisque et metus ac
libero congue ullamcorper at porttitor nunc.  Suspendisse non felis vel
odio faucibus tempus.  Vivamus luctus, augue eget accumsan euismod, orci
libero suscipit nunc, sed blandit felis mauris id sem.  Aliquam erat
volutpat.  Nulla sit amet pellentesque enim.  Pellentesque porttitor
imperdiet libero vel dictum.  Duis vehicula ante ornare, posuere tellus
at, ullamcorper diam.  Suspendisse non turpis lectus.</p>
```

Otherwise pretty much any animated sample on this site should work. Let's
grab the sample from [the webgl animation article](webgl-animation.html).
The only thing we need to change is above we used `background` as the id
of the canvas.

```
-var canvas = document.getElementById("c");
+var canvas = document.getElementById("background");
```

and here's that.

{{{example url="../webgl-animated-background.html" }}}

I made the text large and limited its width to try to force enough content
that you can scroll the page. This was important to show that the background
is `fixed`. It doesn't scroll with the rest of the page.

You can also use an iframe for your background. That has the advanage that
you don't need to integrate the WebGL animation with anything else going on
with the content of the page.

```
<iframe id="background" src="https://webglfundamentals.org/webgl/webgl-animated-background-only.html"></iframe>
```

We need to remove the border from the iframe

```
#background {
  position: fixed;  /* this makes the element not move with the page */
  left: 0;
  top: 0;
  width: 100vw;
  height: 100vh;
  z-index: -2;     /* put it behind everything else */
  border: none;
  display: block;
}
```





