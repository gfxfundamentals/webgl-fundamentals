Title: WebGL текст - Canvas 2D
Description: Как отобразить текст, используя canvas 2D, который связан с WebGL
TOC: WebGL текст - Canvas 2D


Эта статья продолжает [статью об отрисовке текста в WebGL](webgl-text-html.html).
Если вы её ещё не читали, предлагаю начать с неё.

Вместо использования элементов HTML для вывода текста мы также можем использовать
отдельный canvas с 2D-контекстом. Без профилирования остаётся только гадать,
будет ли этот подход быстрее по сравнению с DOM. Но уж точно он менее гибок.
Стили CSS становятся недоступными. Но нет и элементов HTML, которые нужно
создать и отслеживать.

По аналогии с другими примерами мы сделаем контейнер, но на этот раз
мы поместим в него 2 элемента canvas.

    <div class="container">
      <canvas id="canvas"></canvas>
      <canvas id="text"></canvas>
    </div>

Далее настроим CSS, чтобы один canvas накладывался на другой.

    .container {
        position: relative;
    }

    #text {
        position: absolute;
        left: 0px;
        top: 0px;
        z-index: 10;
    }

При инициализации получим ссылку на canvas с текстом и создадим контекст 2D.

    // получаем ссылку на canvas с текстом
    var textCanvas = document.querySelector("#text");

    // создаём контекст 2D
    var ctx = textCanvas.getContext("2d");

При отрисовке каждого фрейма нам нужно очищать canvas 2D, как и в случае с WebGL.

    function drawScene() {
        ...

        // очищаем canvas 2D
        ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);

Затем просто вызываем функцию `fillText` для отрисовки текста.

        ctx.fillText(someMsg, pixelX, pixelY);

И вот пример.

{{{example url="../webgl-text-html-canvas2d.html" }}}

Почему текст стал меньше? Потому что это размер по умолчанию для Canvas 2D.
Если вам нужен другой размер, [взгляните на Canvas 2D API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API/Tutorial/Drawing_text).

Выгодным преимуществом Canvas 2D является простота отрисовки различных
объектов. Например, можно нарисовать линию.

    // отображаем стрелку и текст

    // сохраняем все настройки canvas
    ctx.save();

    // перемещаем начало координат canvas, чтобы 0, 0 находился
    // в верхнем правом углу фронтальной части буквы F
    ctx.translate(pixelX, pixelY);

    // рисуем стрелку
    ctx.beginPath();
    ctx.moveTo(10, 5);
    ctx.lineTo(0, 0);
    ctx.lineTo(5, 10);
    ctx.moveTo(0, 0);
    ctx.lineTo(15, 15);
    ctx.stroke();

    // отображаем текст
    ctx.fillText(someMessage, 20, 20);

    // возвращаем предыдущие настройки canvas
    ctx.restore();

Здесь мы используем преимущество Canvas 2D под названием
[стек матриц](webgl-2d-matrix-stack.html), поэтому нам не нужна дополнительная
математика при отрисовке стрелки. Мы просто делаем вид, что отрисовываем в
начале координат, а перенос заботится о смещении этого начала координат
в угол нашей буквы F.

{{{example url="../webgl-text-html-canvas2d-arrows.html" }}}

Думаю, мы покрыли использование Canvas 2D. [Загляните в Canvas 2D
API](https://developer.mozilla.org/en-US/docs/Web/API/CanvasRenderingContext2D),
там вы можете почерпнуть вдохновение. [В следующий раз мы отобразим текст
прямо в WebGL](webgl-text-texture.html).
