Title: How to write a web-based music visualizer
Description: How to write a web-based music visualizer
TOC: How to write a web-based music visualizer

## Question:

I'm trying to find the best approach to build a music visualizer to run in a browser over the web. Unity is an option, but I'll need to build a custom audio import/analysis plugin to get the end user's sound output. Quartz does what I need but only runs on Mac/Safari. WebGL seems not ready. Raphael is mainly 2D, and there's still the issue of getting the user's sound... any ideas? Has anyone done this before?

## Answer:

Making something audio reactive is pretty simple. [Here's an open source site with lots audio reactive examples](https://www.vertexshaderart.com).

As for how to do it you basically use the [Web Audio API]() to stream the music and use its AnalyserNode to get audio data out.

{{{example url="../webgl-qna-how-to-write-a-web-based-music-visualizer-example-1.html"}}}

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

<div class="so">
  <div>The question and quoted portions thereof are 
    CC BY-SA 3.0 by
    <a data-href="https://stackoverflow.com/users/372919">nico</a>
    from
    <a data-href="https://stackoverflow.com/questions/3091291">here</a>
  </div>
</div>
