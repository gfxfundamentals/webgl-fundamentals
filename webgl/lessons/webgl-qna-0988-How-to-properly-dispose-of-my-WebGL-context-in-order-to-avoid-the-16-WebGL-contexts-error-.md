Title: How to properly dispose of my WebGL context in order to avoid the 16 WebGL contexts error?
Description:
TOC: qna

# Question:

This is a follow up question to this one: [Exceeded 16 live WebGL contexts for this principal, losing the least recently used one](https://stackoverflow.com/q/33800600/2715716).

In that question, it was found that this error happens when you refresh a webGL tab more than 16 times (or collect 16+ contexts across multiple tabs).

However it is not clear how to dispose a WebGL context so that the browser can free up one of the 16 slots for another WebGL context to be able to go there?

# Answer

If that's still happening it's a browser bug and you should file a bug. Refreshing a webpage should free all resources. There is no official way to dispose of a WebGL context just like there's no official way to dispose an `Image` or a `<video>` or pretty much anything else in JavaScript.

See: https://stackoverflow.com/questions/37072303/how-to-free-and-garbage-collect-a-webgl-context

Note the WebGL Conformance Tests create thousands of contexts

https://www.khronos.org/registry/webgl/sdk/tests/webgl-conformance-tests.html

On top of all the contexts created in the 1000s of tests there's a few tests specifically about lots of contexts including [this one](https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-creation-and-destruction.html?webglVersion=1&quiet=0&quick=1), [this one](https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-eviction-with-garbage-collection.html?webglVersion=1&quiet=0&quick=1), [this one](https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-release-upon-reload.html?webglVersion=1&quiet=0&quick=1), and [this one](https://www.khronos.org/registry/webgl/sdk/tests/conformance/context/context-release-with-workers.html?webglVersion=1&quiet=0&quick=1)


So whatever issue you're seeing you probably need to post a repo.
