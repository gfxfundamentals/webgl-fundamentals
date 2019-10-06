Title: Sometimes Code Not Showing In Autocomplete List For Visual Studio Code, Solution?
Description:
TOC: qna

# Question:

In Visual Studio Code, I was making a simple WebGL app and found that sometimes the methods of my gl object would not appear in the autocomplete list like so: 

![pic1 - gl methods not displayed][1]


When it is supposed to appear like this:

![pic2 - all gl methods are displayed][2]

I found that if I used document.getElementById(myCanvas) the autocomplete would not display gl methods like in pic1. However, if I used document.createElement('canvas') instead, the autocomplete would display all the methods from the gl object as seen in the second picture.

So does anyone know how to resolve the issue of not being see all my methods when not using document.createElement? As I'd very much like not being constrained by it.

note: this issue is not only limited to the webgl canvas, but also occurs when using the 2d canvas


  [1]: https://i.stack.imgur.com/4q12G.png
  [2]: https://i.stack.imgur.com/00f2s.png

# Answer

Visual studio code has no way to know what kind of element `document.getElementById` is going to return. You can tell it the type of a variable though by adding a jsdoc style @type comment just before the line that declares the variable.

```
  /** @type {HTMLCanvasElement} */
  const canvas = document.getElementById("canvas");
  const gl = canvas.getContext("webgl");  
```

Now it should complete

[![enter image description here][1]][1]


note the two asterisks at the beginning of the comment are important.

```
/** @type {TheType} */    // good!
/* @type {TheType} */     // bad!
```

Also if you don't want to the it that `canvas` is an `HTMLCanvasElement` you can instead tell it that `gl` is a `WebGLRenderingContext`

```
  /** @type {WebGLRenderingContext} */
  const gl = canvas.getContext("webgl");  
```

  [1]: https://i.stack.imgur.com/x6FUv.png
