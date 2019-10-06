Title: How do I fill white space on screen web gl unity?
Description:
TOC: qna

# Question:

**whitespace image**

![whitespace image][1]

**hardcoded image**

![hardcoded image][2]


  [1]: https://i.stack.imgur.com/P63qp.png
  [2]: https://i.stack.imgur.com/thn57.png

so this game we are making i want the game screen to fill up the white space (i think this is called making it the **native resolution**?).

the coder says "the container is just hardcoded to a certain size" and he doesn't know how to make it fill up the screen pefectly consistently for all computers for example if computers have different resolutions.

the game is being made in unity and the guy said its in web gl.

sorry and thank you, new to this site.

# Answer

You need to make your own template by [changing the HTML as documented here](https://docs.unity3d.com/Manual/webgl-templates.html). You can choose either one of the defaults or create your own template.

According to those docs you create folder in `Assets` called `WebGLTemplates` and inside that create a new folder for your template like `BetterTemplate`. Inside that put an `index.html` file and any other images, css, JavaScript files you want included with your game.

The index.html could look something like this

<!-- language: lang-html -->

    <!DOCTYPE html>
    <html lang="en-us">
    
      <head>
        <meta charset="utf-8">
        <title>%UNITY_WEB_NAME%</title>
        <style>
          body { margin: 0; }
          #gameContainer { width: 100vw; height: 100vh; }
          canvas { width: 100%; height: 100%; }
        </style>
        <script src="Build/UnityLoader.js"></script>
        <script>
        var gameInstance = UnityLoader.instantiate("gameContainer", "Build/dist.json");
        </script>
      </head>
    
      <body>
        <div id="gameContainer"></div>
      </body>
    
    </html>

Then you pick Edit->Project Settings->Player from the menus and under the WebGL tab choose your template

<img src="https://i.stack.imgur.com/r5Jns.png" width="358">

[Here's an example that fills the window](https://github.com/greggman/better-unity-webgl-template). 
