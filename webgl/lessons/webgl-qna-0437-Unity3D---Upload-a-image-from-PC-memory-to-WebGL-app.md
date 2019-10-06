Title: Unity3D - Upload a image from PC memory to WebGL app
Description:
TOC: qna

# Question:

I need user to upload his(her) avatar picture from PC to game

How can I create a file dialog and upload a image to WebGL game?

# Answer

Today is your lucky day :P  I took up your challenge. Here's how you do it.

First off the instructions on [how to interface JavaScript with Unity are here](http://docs.unity3d.com/Manual/webgl-interactingwithbrowserscripting.html).

Reading that I made this file which I put in `Assets/Plugins/WebGL/GetImage.jslib` like the docs said

    var getImage = {
        getImageFromBrowser: function(objectNamePtr, funcNamePtr) {
          // Because unity is currently bad at JavaScript we can't use standard
          // JavaScript idioms like closures so we have to use global variables :(
          window.becauseUnitysBadWithJavacript_getImageFromBrowser =
              window.becauseUnitysBadWithJavacript_getImageFromBrowser || {
             busy: false,
             initialized: false,
             rootDisplayStyle: null,  // style to make root element visible
             root_: null,             // root element of form
             ctx_: null,              // canvas for getting image data;
          };
          var g = window.becauseUnitysBadWithJavacript_getImageFromBrowser;
          if (g.busy) {
              // Don't let multiple requests come in
              return;
          }
          g.busy = true;
    
          var objectName = Pointer_stringify(objectNamePtr);
          var funcName = Pointer_stringify(funcNamePtr);
    
          if (!g.initialized) {
              g.initialized = true;
              g.ctx = window.document.createElement("canvas").getContext("2d");
    
              // Append a form to the page (more self contained than editing the HTML?)
              g.root = window.document.createElement("div");
              g.root.innerHTML = [
                '<style>                                                    ',
                '.getimage {                                                ',
                '    position: absolute;                                    ',
                '    left: 0;                                               ',
                '    top: 0;                                                ',
                '    width: 100%;                                           ',
                '    height: 100%;                                          ',
                '    display: -webkit-flex;                                 ',
                '    display: flex;                                         ',
                '    -webkit-flex-flow: column;                             ',
                '    flex-flow: column;                                     ',
                '    -webkit-justify-content: center;                       ',
                '    -webkit-align-content: center;                         ',
                '    -webkit-align-items: center;                           ',
                '                                                           ',
                '    justify-content: center;                               ',
                '    align-content: center;                                 ',
                '    align-items: center;                                   ',
                '                                                           ',
                '    z-index: 2;                                            ',
                '    color: white;                                          ',
                '    background-color: rgba(0,0,0,0.8);                     ',
                '    font: sans-serif;                                      ',
                '    font-size: x-large;                                    ',
                '}                                                          ',
                '.getimage a,                                               ',
                '.getimage label {                                          ',
                '   font-size: x-large;                                     ',
                '   background-color: #666;                                 ',
                '   border-radius: 0.5em;                                   ',
                '   border: 1px solid black;                                ',
                '   padding: 0.5em;                                         ',
                '   margin: 0.25em;                                         ',
                '   outline: none;                                          ',
                '   display: inline-block;                                  ',
                '}                                                          ',
                '.getimage input {                                          ',
                '    display: none;                                         ',
                '}                                                          ',
                '</style>                                                   ',
                '<div class="getimage">                                     ',
                '    <div>                                                  ',
                '      <label for="photo">click to choose an image</label>  ',
                '      <input id="photo" type="file" accept="image/*"/><br/>',
                '      <a>cancel</a>                                        ',
                '    </div>                                                 ',
                '</div>                                                     ',
              ].join('\n');
              var input = g.root.querySelector("input");
              input.addEventListener('change', getPic);
    
              // prevent clicking in input or label from canceling
              input.addEventListener('click', preventOtherClicks);
              var label = g.root.querySelector("label");
              label.addEventListener('click', preventOtherClicks);
    
              // clicking cancel or outside cancels
              var cancel = g.root.querySelector("a");  // there's only one
              cancel.addEventListener('click', handleCancel);
              var getImage = g.root.querySelector(".getimage");
              getImage.addEventListener('click', handleCancel);
    
              // remember the original style
              g.rootDisplayStyle = g.root.style.display;
    
              window.document.body.appendChild(g.root);
          }
    
          // make it visible
          g.root.style.display = g.rootDisplayStyle;
    
          function preventOtherClicks(evt) {
              evt.stopPropagation();
          }
    
          function getPic(evt) {
              evt.stopPropagation();
              var fileInput = evt.target.files;
              if (!fileInput || !fileInput.length) {
                  return sendError("no image selected");
              }
    
              var picURL = window.URL.createObjectURL(fileInput[0]);
              var img = new window.Image();
              img.addEventListener('load', handleImageLoad);
              img.addEventListener('error', handleImageError);
              img.src = picURL;
          }
    
          function handleCancel(evt) {
              evt.stopPropagation();
              evt.preventDefault();
              sendError("cancelled");
          }
    
          function handleImageError(evt) {
              sendError("Could not get image");
          }
    
          function handleImageLoad(evt) {
              var img = evt.target;
              window.URL.revokeObjectURL(img.src);
              // We probably don't want the fullsize image. It might be 3000x2000 pixels or something too big
              g.ctx.canvas.width  = 256;
              g.ctx.canvas.height = 256;
              g.ctx.drawImage(img, 0, 0, g.ctx.canvas.width, g.ctx.canvas.height);
    
              var dataUrl = g.ctx.canvas.toDataURL();
    
              // free the canvas memory (could probably be zero)
              g.ctx.canvas.width  = 1;
              g.ctx.canvas.height = 1;
    
              sendResult(dataUrl);
              g.busy = false;
          }
    
          function sendError(msg) {
              sendResult("error: " + msg);
          }
    
          function hide() {
              g.root.style.display = "none";
          }
    
          function sendResult(result) {
              hide();
              g.busy = false;
              SendMessage(objectName, funcName, result);
          }
        },
    };
    
    mergeInto(LibraryManager.library, getImage);

The code follows [this example of how to get an image from a user in HTML5](http://www.syntaxxx.com/accessing-user-device-photos-with-the-html5-camera-api/).

Basically it makes a small form that covers the entire browser window. It has an `<input>` element that only accepts an image. It appends that do the body of the document and will use it again if you ask for another image. (see `g.initialized` and `g.root`)

Similarly there's an attempt that you can only call it once at a time. (see `g.busy`)

Once the user chooses an image the image is then drawn into a smaller canvas because I'm just guessing that you don't really want a 3000x2000 pixel image or whatever giant size the user's photo is.

You may want to adjust the code that sizes the canvas and draws the image. The current code always resizes the image to 256x256

              g.ctx.canvas.width  = 256;
              g.ctx.canvas.height = 256;
              g.ctx.drawImage(img, 0, 0, g.ctx.canvas.width, g.ctx.canvas.height);

For example you might want to set the canvas size to be the same aspect ratio as the original image but still some smaller size. Or, if you want the original size then set the size to `img.width` and `img.height`.

In any case, after the image is drawn into the canvas we call `canvas.toDataURL` which returns a PNG encoded into a string dataURL. It then calls a named method on a named GameObject using Unity's `SendMessage` function and passes the dataURL.

To interface that code with Unity I made this file `Assets/GetImage.cs`

    using UnityEngine;
    using System.Collections;
    using System.Runtime.InteropServices;
    
    public class GetImage {
    
        #if UNITY_WEBGL
    
            [DllImport("__Internal")]
            private static extern void getImageFromBrowser(string objectName, string callbackFuncName);
    
        #endif
    
        static public void GetImageFromUserAsync(string objectName, string callbackFuncName)
        {
            #if UNITY_WEBGL
    
                getImageFromBrowser(objectName, callbackFuncName);
    
            #else
    
                Debug.LogError("Not implemented in this platform");
    
            #endif
        }
    }

The way this code works use you call `GetImage.GetImageFromBrowserAsync`. You pass it the name of a `GameObject` and the name of a method to call. The name of the GameObject **MUST BE UNIQUE** (well, if it's not unique Unity will attempt to call the method on every object with the same name)

The method will be called with a string. If that string starts with `data:image/png;base64,` then the user chose an image. We convert that back to binary PNG data and then call `Texture2D.LoadImage`

If the string does not start with `data:image/png;base64,` then it's an error. Maybe the user picked cancel?

Note: The code doesn't handle all errors currently.

To use it I made a Cube GameObject, added a material, then I added a new script `Assets/ClickAndGetImage.cs`

    using UnityEngine;
    using System;
    using System.Collections;
    
    public class ClickAndGetImage : MonoBehaviour {
    
        void OnMouseOver()
        {
            if(Input.GetMouseButtonDown(0))
            {
                // NOTE: gameObject.name MUST BE UNIQUE!!!!
                GetImage.GetImageFromUserAsync(gameObject.name, "ReceiveImage");
            }
        }
    
        static string s_dataUrlPrefix = "data:image/png;base64,";
        public void ReceiveImage(string dataUrl)
        {
            if (dataUrl.StartsWith(s_dataUrlPrefix))
            {
                byte[] pngData = System.Convert.FromBase64String(dataUrl.Substring(s_dataUrlPrefix.Length));
    
                // Create a new Texture (or use some old one?)
                Texture2D tex = new Texture2D(1, 1); // does the size matter?
                if (tex.LoadImage(pngData))
                {
                    Renderer renderer = GetComponent<Renderer>();
    
                    renderer.material.mainTexture = tex;
                }
                else
                {
                    Debug.LogError("could not decode image");
                }
            }
            else
            {
                Debug.LogError("Error getting image:" + dataUrl);
            }
        }
    }

![example](https://github.com/greggman/getuserimage-unity-webgl/raw/master/example.gif)

[You can see it live here](http://greggman.github.io/getuserimage-unity-webgl/webgl/). 

[The code is on github](https://github.com/greggman/getuserimage-unity-webgl). 

And [here's a .unitypackage](https://github.com/greggman/getuserimage-unity-webgl/releases/download/v0.0.2/GetImageFromUser.unitypackage).

