Title: Chrome - debug WebGL crashing ("Rats! WebGL hit a snag.")
Description:
TOC: qna

# Question:

Our company recently upgraded our PC's to Windows 10, and ever since then we've constantly been getting the "Rats! WebGL hit a snag." message when browsing our website. We might normally brush this off as an internal network/pc issue, but this error only occurs on our own website. Browsing other websites does not cause this error. We're therefore concerned that some of our users out there might be experiencing this as well.

We don't use WebGL to my knowledge, and `document.querySelectorAll('canvas')` doesn't find any elements.

Is it possible to debug this to find the cause of the crash?

**Update**

It is a third party script that's trying to use WebGL, but it's pretty innocent and shouldn't be a problem. Now the question is, how can I determine why the following code causes a crash on our website?

    let canvas = document.createElement('canvas');
    canvas.getContext('webgl');

# Answer

Add 

    HTMLCanvasElement.prototype.getContext = (function(origFn) {
      return function(...args) {
        debugger;
        return origFn.call(this, ...args);
      };
    }(HTMLCanvasElement.prototype.getContext));

To the top of your page then open the debugger and see where it breaks?
