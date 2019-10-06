Title: Registration of backend webgl failed for tensorflowjs
Description:
TOC: qna

# Question:

As suggested in tensorflowjs github, I post the question here. I am getting below error, in simplest example possible with tensorflow. 

**Error:**  
[![enter image description here][1]][1]

**Code:**  A simple html snippet with just tfjs loading. 
```
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="X-UA-Compatible" content="ie=edge">
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.15.3/dist/tf.min.js"></script>
    <title>Testing Tfjs</title>
</head>
<body>
    <h2>Testing Tfjs</h2>    
</body>
</html>
```

Browser: Chrome Version 72.0.3626.119  
OS: Win 10, GPU: GT 740M, version 397.44.  
Chrome gpu show says : (because I disabled hw acceleration to avoid chrome blacking out at times)
```
WebGL: Software only, hardware acceleration unavailable, 
WebGL2: Software only, hardware acceleration unavailable
```


I have tried setting backend explicitly as cpu but it did not help. I have seen other posts in github talking about this error, but in vain.

  [1]: https://i.stack.imgur.com/3Bh63.png

# Answer

So since you posted your about:gpu result showing that you're only getting software rendering only for WebGL that suggests tensorflow.js is passing in the `failIfMajorPerformanceCaveat` context creation flag to WebGL which will almost certainly fail under software rendering

We can check by overriding `getContext` and print out the creation flags


<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-html -->

    <script>
    HTMLCanvasElement.prototype.getContext = function(type, parameters) {
     console.log(JSON.stringify(parameters, null, 2));
     return null;
    };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.15.3/dist/tf.min.js"></script>

<!-- end snippet -->

So running that I see these results

```
{
  "alpha": false,
  "antialias": false,
  "premultipliedAlpha": false,
  "preserveDrawingBuffer": false,
  "depth": false,
  "stencil": false,
  "failIfMajorPerformanceCaveat": true    <====-------
}
```
So that's why it prints that warning.

That said it's just a **warning**. tensorflow.js still runs. Notice (a) it says 2 warnings, not 2 errors. (b) they are displayed in yellow, not red.

[![warnings not errors][1]][1]

using `console.warn` vs `console.error` you can see the difference

[![warning vs error][2]][2]

tensorflow.js runs just fine AFAICT. Here's an example. I've hacked `getContext` so it always fails so tensorflow.js can't get a WebGL context. It prints the 2 warnings but it also runs just fine. Scroll to the bottom of the messages and you'll see it ran the example tensorflow code's results.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    const d = tf.tensor2d([[1.0, 2.0], [3.0, 4.0]]);
    const d_squared = d.square();
    d_squared.print();

<!-- language: lang-html -->

    <script>
    HTMLCanvasElement.prototype.getContext = function() {
     return null;
    };
    </script>
    <script src="https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@0.15.3/dist/tf.min.js"></script>

<!-- end snippet -->


  [1]: https://i.stack.imgur.com/q1dFz.png
  [2]: https://i.stack.imgur.com/Pqok0.png
