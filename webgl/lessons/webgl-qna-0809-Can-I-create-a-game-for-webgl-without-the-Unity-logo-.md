Title: Can I create a game for webgl without the Unity logo?
Description:
TOC: qna

# Question:


Can I create a game for webgl without the Unity logo when I download and without title "Unity webGL"?
 . [example][1]


  [1]: http://webassembly.org/demo/Tanks/

# Answer

[According to the docs you need a Pro license to remove the splash screen](https://docs.unity3d.com/Manual/class-PlayerSettingsSplashScreen.html). (the logo in the middle of the screen)

As for the frame around the game that's easy to change, just [change the HTML as documented here](https://docs.unity3d.com/Manual/webgl-templates.html). You can choose either one of the defaults or create your own template.

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

[Here's an example that provides a custom logo](https://github.com/greggman/better-unity-webgl-template). The part that's not removable without a Pro license is the "Made with Unity" that appears just before the game starts.

