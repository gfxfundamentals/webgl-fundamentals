Title: Sandbox WebGL Plugin
Description:
TOC: qna

# Question:

I am doing some work with Pipeline Pilot and noticed that all of the built in HTML components that do things, like collapsible panels, tabs, or anything else that presumably has some javascript that I can't access causes my otherwise working WebGL component to break on load. 

Is there a way to "sandbox" or otherwise isolate a WebGL component for it's own protection? Weird question, and not the best way to look at it, but I can't change any of the code inside of the WebGL component, and I can't change any of the internal Pipeline Pilot code, so I need an inelegant solution of any kind.

# Answer

What @David said, using an iframe would probably do what you want. In that vain you can detect if you're in an iframe with

    var isInIFrame = function() {
      return window != window.top;
    };

I use that the change my CSS depending on if I'm in an iframe or not

    var updateCSSIfInIFrame = function() {
      if (isInIFrame()) {
        document.body.className = "iframe";
      }
    };

Then I can use CSS to change formatting. eg:


    /* only applies if in an iframe assuming the function above was called. */
    body.iframe {
      width: 100%;
      height: 100%;
      margin: 0px;
      padding: 0px;
      overflow: hidden;
    }
    
    .iframe>canvas {
      width: 100%;
      height: 100%;
    }


