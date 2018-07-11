Title: WebGL Audio Reactive
Description: How to respond to music

Making something audio reactive is pretty simple. [Here's an open source site with lots audio reactive examples](https://www.vertexshaderart.com).

As for how to do it you basically use the [Web Audio API]() to stream the music and use its AnalyserNode to get audio data out.

<!-- begin snippet: js hide: false console: true babel: false -->

<!-- language: lang-js -->

    "use strict";
    const ctx = document.querySelector("canvas").getContext("2d");

    ctx.fillText("click to start", 100, 75);
    ctx.canvas.addEventListener('click', start);

    function start() {
      ctx.canvas.removeEventListener('click', start);
      // make a Web Audio Context
      const context = new AudioContext();
      const analyser = context.createAnalyser();

      // Make a buffer to receive the audio data
      const numPoints = analyser.frequencyBinCount;
      const audioDataArray = new Uint8Array(numPoints);

      function render() {
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

        // get the current audio data
        analyser.getByteFrequencyData(audioDataArray);

        const width = ctx.canvas.width;
        const height = ctx.canvas.height;
        const size = 5;

        // draw a point every size pixels
        for (let x = 0; x < width; x += size) {
          // compute the audio data for this point
          const ndx = x * numPoints / width | 0;
          // get the audio data and make it go from 0 to 1
          const audioValue = audioDataArray[ndx] / 255;
          // draw a rect size by size big
          const y = audioValue * height;
          ctx.fillRect(x, y, size, size);
        }
        requestAnimationFrame(render);
      }
      requestAnimationFrame(render);

      // Make a audio node
      const audio = new Audio();
      audio.loop = true;
      audio.autoplay = true;

      // this line is only needed if the music you are trying to play is on a
      // different server than the page trying to play it.
      // It asks the server for permission to use the music. If the server says "no"
      // then you will not be able to play the music
      // Note if you are using music from the same domain
      // **YOU MUST REMOVE THIS LINE** or your server must give permission.
      audio.crossOrigin = "anonymous";

      // call `handleCanplay` when it music can be played
      audio.addEventListener('canplay', handleCanplay);
      audio.src = "https://twgljs.org/examples/sounds/DOCTOR%20VOX%20-%20Level%20Up.mp3";
      audio.load();


      function handleCanplay() {
        // connect the audio element to the analyser node and the analyser node
        // to the main Web Audio context
        const source = context.createMediaElementSource(audio);
        source.connect(analyser);
        analyser.connect(context.destination);
      }
    }



<!-- language: lang-css -->

    canvas { border: 1px solid black; display: block; }

<!-- language: lang-html -->

    <canvas></canvas>

<!-- end snippet -->

Then it's just up to you to draw something creative.

note some troubles you'll likely run into.

1.  At this point in time (2017/1/3) neither Android Chrome nor iOS Safari support analysing streaming audio data. Instead you have to load the entire song. [Here'a a library that tries to abstract that a little](https://github.com/greggman/audiostreamsource.js)

2. <s>On Mobile</s> you can not automatically play audio. You must start the audio inside an input event based on user input like `'click'` or `'touchstart'`.

3.  As pointed out in the sample you can only analyse audio if the source is either from the same domain OR you ask for CORS permission and the server gives permission. AFAIK only Soundcloud gives permission and it's on a per song basis. It's up to the individual artist's song's settings whether or not audio analysis is allowed for a particular song.

    To try to explain this part

    The default is you have permission to access all data from the same domain but no permission from other domains.

    When you add

        audio.crossOrigin = "anonymous";

    That basically says "ask the server for permission for user 'anonymous'". The server can give permission or not. It's up to the server. This includes asking even the server on the same domain which means if you're going to request a song on the same domain you need to either (a) remove the line above or (b) configure your server to give CORS permission. Most servers by default do not give CORS permission so if you add that line, even if the server is the same domain, if it does not give CORS permission then trying to analyse the audio will fail.

---

music: [DOCTOR VOX - Level Up](http://youtu.be/eUX39M_0MJ8)
