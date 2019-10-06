Title: Can we access WebGL through Virtual machine
Description:
TOC: qna

# Question:

AFAIK, WebGL require graphics card and VM doesn't have one. So is there any way we can open a webpage having 3D content using Virtual machine.

I want a virtual machine with a Chrome browser and want to use that VM to see WebGL samples, as I don't have direct internet access in my workstation.

Hope I phrased my question correctly.

# Answer

Chrome will run with software based OSMesa. Unfortunately you'd have to build OSMesa for your OS then run Chrome with `--use-gl=osmesa`. The [Chromium source](http://dev.chromium.org/Home) has a target for OSMesa which is/was used to be able to run various tests on VMs in the cloud.
