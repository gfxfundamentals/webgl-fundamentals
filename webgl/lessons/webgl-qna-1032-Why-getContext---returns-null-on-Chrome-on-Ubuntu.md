Title: Why getContext() returns null on Chrome on Ubuntu
Description:
TOC: qna

# Question:

Why getContext() returns null when called on existing canvas Element,
but works fine when createElement('canvas').getContext()?

Chrome 72.0.3626.121 on Ubuntu 18.04

see chrome console:
[![enter image description here][1]][1]

  [1]: https://i.stack.imgur.com/HJTnl.png

# Answer

It's not special to Ubuntu. You can only get one type of context from a particular canvas. Once you get a context for that canvas (a) you can't get any other type of context for that same canvas and (b) if you ask for the same type context on that canvas you'll get the same context you got the first time, not a new one

```
const canvas = document.createElement('canvas');
const ctx = canvas.getContext('2d');  // returns a Canvas2DRenderingContext
const gl = canvas.getContext('webgl');  // returns null because this canvas
                                        // already has a 2D context
```

The same is true the other way

```
const canvas = document.createElement('canvas');
const gl = canvas.getContext('webgl');  // returns a WebGLRenderingContext
const ctx = canvas.getContext('2d');    // returns null because this canvas
                                        // already has a WebGL context
```

About the it returning the same context

```
const canvas = document.createElement('canvas');
const ctx1 = canvas.getContext('2d');  // returns a Canvas2DRenderingContext
const ctx2 = canvas.getContext('2d');  // returns the same Canvas2DRenderingContext

console.log(ctx1 === ctx2);  // true
ctx1.foo = "bar";
console.log(ctx2.foo);  // "bar" because it's the same object
``` 

Each context belongs to a specific canvas. A different canvas will get a different context

```
const canvas1 = document.createElement('canvas');
const canvas2 = document.createElement('canvas');
const ctx1 = canvas1.getContext('2d');  // returns a Canvas2DRenderingContext
const ctx2 = canvas2.getContext('2d');  // returns a different Canvas2DRenderingContext

console.log(ctx1 === ctx2);  // false
```
