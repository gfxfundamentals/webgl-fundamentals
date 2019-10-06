Title: "WebGL missing" error for cordova application (three.js)
Description:
TOC: qna

# Question:

I tried to create a cordova application which uses three.js. It worked fine in certain mobiles but in some mobiles (lenovo..) it displays WebGL missing error.
I checked the get.webgl.org and it works fine (running cube displayed).
It is not able to get the webgl canvas context.

    var myCanvas = document.createElement('canvas');
    var webGl = myCanvas.getContext('webgl');
    var webG1 = myCanvas.getContext('experimental-webgl');

webGl and webG1 is null.

The device is using latest android system webview 56.0.2924.87

Any help would be appreciated.

# Answer

WebGL is not supported on all devices in cordova because cordova by default relies on the device's built in browser and many older devices' built in browsers don't support WebGL

You can try using projects like [crosswalk](https://crosswalk-project.org/) that uses it's own custom browser so they can support all the features and not rely on the device's built in browser. [There's still some devices WebGL might not work on though](https://crosswalk-project.org/documentation/about/faq.html#Canvas-and-WebGL-support)
