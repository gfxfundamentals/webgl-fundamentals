Title: Is there a way to pass data(buffer Data) to gpu in parallel using async function?
Description:
TOC: qna

# Question:

I am trying to pass data from cpu to gpu in parallel wrapping setTimeout function with gl.BufferData() command. Let's say I call **setTimeout(()=>gl.BufferData(i),1)** 4 times, will the commands transfer data in **parallel or one by one**. Ideally I am trying to speedup data transfers from cpu to gpu. 

I came to know that webgl calls cannot be timed with cpu timers.

```
 createBuffers(4);

 for(let i=0; i< 4; i++){
   setTimeout(function(){
   bufferIndex = i;
   copyDataToBuffer(bufferIndex,attributeIndex)//Can this be done in parallel
   },1);
   attributeIndex++;
 }
             
 for(let i=0; i< 4; i++){
   renderBuffer(i);            
 }
```

# Answer

They will transfer it one by one.

From [the spec](https://www.khronos.org/registry/OpenGL/specs/es/2.0/es_full_spec_2.0.pdf) page 4

> Commands are always processed in the order in which they are received

I also think you might have a mistaken view of how JavaScript and setTimeout work. Except for [workers](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Using_web_workers) JavaScript never runs in parallel.

It works like this

```
for (;;) {
   sleep-Until-events
   while(listOfEvents.length) {
      const event = listOfEvents.shift();
      callEventHandlersForEvent(event);
   }
}
```

That's it. Events get added to the listOfEvents when you call setTimeout or rather, behind the scenes a timer is created, when the time ends, your callback is added to the list of events to run. Other events include requestAnimationFrame, mousedown, keydown, XHR complete, image loaded etc,

All they do is add to the `listOfEvents` and those events are called serially. JavaScript does not run in parallel. 

Other things not in JavaScript do run in parallel like downloading files, decoding images, etc but when they finally get to JavaScript all that happens is an event is added to the list of events and those events are processed serially.

So, effectively calling setTimeout 4 times with a timeout of 0 just adds 4 functions to the list of events. Then, one at a time, each one is called.  Putting a timeout > 0 just means there is delay before the callback is added to the list of events.

