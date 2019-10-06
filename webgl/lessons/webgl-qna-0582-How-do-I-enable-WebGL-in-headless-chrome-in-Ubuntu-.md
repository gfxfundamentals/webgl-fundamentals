Title: How do I enable WebGL in headless chrome in Ubuntu?
Description:
TOC: qna

# Question:

How do I enable webgl or install webgl in headless chrome in Ubuntu 14? I tried installing libosmesa6, but that did not help.

Can someone please point me in the right direction?

I want to use webgl to work with headless chrome and selenium tests? I am using nightwatch to run the tests.

# Answer

This worked for me to get chrome to use osmesa

    sudo apt-get install libosmesa
    sudo ln -s /usr/lib/x86_64-linux-gnu/libOSMesa.so.6 /opt/google/chrome/libosmesa.so
    google-chrome --no-first-run --user-data-dir=~/chrome-stuff --use-gl=osmesa

Warning: When running with osmesa the entire page is rendered with osmesa making it pretty slow. So, if there are tests you have that can run without WebGL you probably want to run them without osmesa.

Also note that chrome itself uses osmesa to headless test but it uses a specific version. At the time of this answer it was version 9.0.3. It also makes a few changes listed [here](https://cs.chromium.org/chromium/src/third_party/mesa/README.chromium)

Otherwise to run headless in general I found this

https://gist.github.com/addyosmani/5336747
