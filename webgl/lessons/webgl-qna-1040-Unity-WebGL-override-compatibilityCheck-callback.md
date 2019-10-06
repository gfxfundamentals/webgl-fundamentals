Title: Unity WebGL override compatibilityCheck callback
Description:
TOC: qna

# Question:

I am currently working on a Unity WebGL project, which only supports `WebGL 2.0`.
The project does not work with `WebGL 1.0`.

Now I want to realize that if a browser does not support `WebGL 2.0`, an image will be displayed instead of the WebGL context.

For the `UnityLoader.instantiate()` function there is a callback function if WebGL is not supported. Unfortunately my code is not called in this function.

  UnityLoader.instantiate("unityContainer", "Build/Build.json", {
   compatibilityCheck: function(unityInstance, onsuccess, onerror) {
    if (!UnityLoader.SystemInfo.hasWebGL) {
     unityInstance.popup("Your browser does not support WebGL", [{text: "OK", callback: onerror}]);
     document.getElementById("unityContainer").style.display = "none";
     document.getElementById("fallbackHeader").style.display = "block";
    }

Thanks in Advance!
Best regards,
Laurence Trippen 

# Answer

You can just try it

    const supportsWebGL2 = !!document.createElement('canvas').getContext('webgl2');

So maybe [change your WebGL template](https://docs.unity3d.com/Manual/webgl-templates.html) to something like

```
const supportsWebGL2 = !!document.createElement('canvas').getContext('webgl2');
if (!supportsWebGL2) {
   // do something to display message
} else {
   UnityLoader.instantiate("unityContainer", "Build/Build.json", {
        compatibilityCheck: function(unityInstance, onsuccess, onerror) {
            if (!UnityLoader.SystemInfo.hasWebGL) {
                unityInstance.popup("Your browser does not support WebGL", [{text: "OK", callback: onerror}]);
                document.getElementById("unityContainer").style.display = "none";
                document.getElementById("fallbackHeader").style.display = "block";
            }

   ...
```
