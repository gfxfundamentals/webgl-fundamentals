Title: html2canvas captures everything except the content of an inner canvas
Description:
TOC: qna

# Question:

I've got a map rendered by means of `leaflet`. 

I need to make a screenshot of that map by using `html2canvas`.

To make use of `html2canvas`, I need to provide a DOM element to capture (`elementToCapture`) and an optional configuration (`html2canvasConfiguration`). 

    var html2canvasConfiguration = {
        useCORS: true,
        width: map._size.x,
        height: map._size.y,
        backgroundColor: null,
        logging: true,
        imageTimeout: 0
    };

    var elementToCapture = map._container.getElementsByClassName('leaflet-pane leaflet-map-pane')[0];
    html2canvas(elementToCapture, html2canvasConfiguration).then(function (canvas) {
        var link = document.createElement('a');
        link.download = 'test.png';
        link.href = canvas.toDataURL();
        link.click();
        link.remove();
    })

I extract an element by the `leaflet-pane leaflet-map-pane` class, which basically represents the whole map including controls (zoom in/out buttons, scale, etc), custom markers, tooltips, overlays, popups.

The entire DOM looks like

    <div class="leaflet-pane leaflet-map-pane">
        <div class="leaflet-pane leaflet-tile-pane">
            <div class="leaflet-gl-layer mapboxgl-map">
                <div class="mapboxgl-canvas-container">
                    <canvas class="mapboxgl-canvas leaflet-image-layer leaflet-zoom-animated"></canvas>
                </div>
                <div class="mapboxgl-control-container"></div>
            </div>
        </div>
        <div class="leaflet-pane leaflet-shadow-pane"></div>
        <div class="leaflet-pane leaflet-overlay-pane"></div>
        <div class="leaflet-pane leaflet-marker-pane"></div>
        <div class="leaflet-pane leaflet-tooltip-pane"></div>
        <div class="leaflet-pane leaflet-popup-pane"></div>
    <div class="leaflet-control-container"></div>

The problem I've faced is the `leaflet-pane leaflet-tile-pane` element (particularly the content of the inner `canvas`) doesn't get captured by `html2canvas`. To put it simply, I see everything *on* the map, but I don't see the map *itself*.

[![enter image description here][1]][1]

[![enter image description here][2]][2]

**UPDATE 1:** 

The version I am currently using is `1.0.0-rc.1` (the latest one).

**UPDATE 2:**

The nature of the canvas is `webgl`. Might it be the issue? According to [this][3], they do support `webgl` canvases.

**UPDATE 3:**

I tried to obtain the canvas programmatically and call `toDataURL` on it. It resulted in an empty screenshot, even with the `preserveDrawingBuffer` hack.

**UPDATE 4:**

Oddly enough, it doesn't capture only certain canvases. I've created a `2d` canvas (by adding `preferCanvas` to map configuration) and it got shown.

  [1]: https://i.stack.imgur.com/tCjbG.png
  [2]: https://i.stack.imgur.com/1AvFH.png
  [3]: https://github.com/niklasvh/html2canvas/issues/1420

# Answer

Try this, add this to the top of your page, before any other scripts

```
<script>
HTMLCanvasElement.prototype.getContext = function(origFn) {
  return function(type, attribs) {
    attribs = attribs || {};
    attribs.preserveDrawingBuffer = true;
    return origFn.call(this, type, attribs);
  };
}(HTMLCanvasElement.prototype.getContext);
</script>
```

Does it help?
