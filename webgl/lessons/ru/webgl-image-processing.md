Title: Обработка изображений в WebGL
Description: Обработка изображений в WebGL
TOC: Обработка изображений в WebGL


Обработка изображений в WebGL? Легко! Насколько легко? Читаем ниже.

<!--more-->

Это продолжение [Основ WebGL](webgl-fundamentals.html). Если вы её ещё не читали - предлагаю [ознакомиться сначала с ней](webgl-fundamentals.html).

Для отображения изображений в WebGL нам нужно использовать текстуры. При чтении текстуры WebGL ожидает текстурные координаты, по аналогии с тем, как он ожидает координаты пространства отсечения вместо пикселей. Текстурные координаты занимают диапазон от 0.0 до 1.0, независимо от размеров текстуры.

Так как мы отрисовываем один прямоугольник (ну, вообще 2 треугольника), нам нужно указать WebGL, за какой фрагмент текстуры отвечает каждая точка прямоугольника. Мы передадим эту информацию из вершинного шейдера фрагментному шейдеру, используя специальную varying-переменную. Она называется varying, потому что она варьируется. WebGL интерполирует переданные нами значения в вершинный шейдер, когда будет отрисовывать каждый пиксель во фрагментном шейдере.

Мы используем вершинный шейдер [из окончания предыдущей статьи](webgl-fundamentals.html), плюс добавим атрибут для передачи текстурных координат, которые в дальнейшем попадут во фрагментный шейдер.

    attribute vec2 a_texCoord;
    ...
    varying vec2 v_texCoord;

    void main() {
       ...
       // Передаём texCoord фрагментному шейдеру.
       // Видеокарта интерполирует это значение между точками.
       v_texCoord = a_texCoord;
    }

Далее говорим фрагментному шейдеру, чтобы он брал цвета из текстуры.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // наша текстура
    uniform sampler2D u_image;

    // texCoords, переданные из вершинного шейдера
    varying vec2 v_texCoord;

    void main() {
       // получение цвета из текстуры
       gl_FragColor = texture2D(u_image, v_texCoord);
    }
    </script>

Заключительным шагом будет загрузка изображения, создание текстуры и копирование изображения в текстуру. Из-за того, что браузер грузит изображения асинхронно, нам нужно немного изменить наш код, чтобы дожидаться загрузки текстуры. Как только текстура загрузится, мы отрисуем её.

    function main() {
      var image = new Image();
      image.src = "http://someimage/on/our/server";  // ДОЛЖНА НАХОДИТЬСЯ НА ТОМ ЖЕ ДОМЕНЕ!!!
      image.onload = function() {
        render(image);
      }
    }

    function render(image) {
      ...
      // наш код из предыдущего примера
      ...
      // ссылка на атрибут, куда пойдут координаты текстуры
      var texCoordLocation = gl.getAttribLocation(program, "a_texCoord");

      // указываем координаты текстуры для прямоугольника
      var texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([
          0.0,  0.0,
          1.0,  0.0,
          0.0,  1.0,
          0.0,  1.0,
          1.0,  0.0,
          1.0,  1.0]), gl.STATIC_DRAW);
      gl.enableVertexAttribArray(texCoordLocation);
      gl.vertexAttribPointer(texCoordLocation, 2, gl.FLOAT, false, 0, 0);

      // создаём текстуру
      var texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, texture);

      // задаём параметры, чтобы можно было отрисовать изображение любого размера
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);

      // загружаем изображение в текстуру
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, image);
      ...
    }

И пример отображения картинки в WebGL. ВНИМАНИЕ: если вы запускаете этот пример на
локальном компьютере, вам понадобится какой-нибудь веб-сервер, чтобы загружать изображения.
[Узнайте, как его можно установить за пару минут](webgl-setup-and-installation.html).

{{{example url="../webgl-2d-image.html" }}}

Пока довольно банально, нужно что-то сделать с этим изображением.
Как насчёт поменять местами красный и синий?

    ...
    gl_FragColor = texture2D(u_image, v_texCoord).bgra;
    ...

Теперь красный и синий цвет поменялись местами.

{{{example url="../webgl-2d-image-red2blue.html" }}}

А что если нам нужна обработка изображений, где мы принимаем в расчёт другие пиксели? Так как в WebGL идёт обращение к текстуре через текстурные координаты, которые от 0.0 до 1.0, мы можем вычислить, сколько занимает 1 пиксель через несложную математику <code>onePixel = 1.0 / textureSize</code>.

Вот пример фрагментного шейдера, который берёт среднее значение каждого пикселя текстуры и его левого и правого соседа:

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // наша текстура
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;

    // texCoords передаются из вершинного шейдера
    varying vec2 v_texCoord;

    void main() {
       // рассчитываем один пиксель в текстурных координатах
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;

       // среднее между средним, правым и левым пикселем
       gl_FragColor = (
           texture2D(u_image, v_texCoord) +
           texture2D(u_image, v_texCoord + vec2(onePixel.x, 0.0)) +
           texture2D(u_image, v_texCoord + vec2(-onePixel.x, 0.0))) / 3.0;
    }
    </script>

Ещё нам нужно передать размер текстуры из JavaScript.

    ...

    var textureSizeLocation = gl.getUniformLocation(program, "u_textureSize");

    ...

    // задаём размер изображения
    gl.uniform2f(textureSizeLocation, image.width, image.height);

    ...

Сравните с оригинальным изображением выше.

{{{example url="../webgl-2d-image-blend.html" }}}

Итак, теперь мы знаем, как брать значение других пикселей, теперь применим ядро свёртки, чтобы выполнить распространённые методы обработки изображений. Мы будем использовать ядро 3x3. Ядро свёртки - это просто матрица 3х3, где каждое значение в матрице означает, на сколько умножить 8 пикселей, находящихся вокруг пикселя, который мы отрисовываем. Затем мы делим результат на сумму всех значений ядра или на 1, смотря что больше. [Вот довольно неплохая статья на этот счёт](https://docs.gimp.org/2.6/en/plug-in-convmatrix.html). А [вот ещё одна статья](https://www.codeproject.com/KB/graphics/ImageConvolution.aspx), показывающая, как написать код, задающий ядро свёртки на C++.

В нашем случае мы планируем выполнить ту же работу в шейдере, поэтому вот код фрагментного шейдера.

    <script id="fragment-shader-2d" type="x-shader/x-fragment">
    precision mediump float;

    // наша текстура
    uniform sampler2D u_image;
    uniform vec2 u_textureSize;
    uniform float u_kernel[9];
    uniform float u_kernelWeight;

    // texCoords, переданные из вершинного шейдера
    varying vec2 v_texCoord;

    void main() {
       vec2 onePixel = vec2(1.0, 1.0) / u_textureSize;
       vec4 colorSum =
         texture2D(u_image, v_texCoord + onePixel * vec2(-1, -1)) * u_kernel[0] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0, -1)) * u_kernel[1] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1, -1)) * u_kernel[2] +
         texture2D(u_image, v_texCoord + onePixel * vec2(-1,  0)) * u_kernel[3] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0,  0)) * u_kernel[4] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1,  0)) * u_kernel[5] +
         texture2D(u_image, v_texCoord + onePixel * vec2(-1,  1)) * u_kernel[6] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 0,  1)) * u_kernel[7] +
         texture2D(u_image, v_texCoord + onePixel * vec2( 1,  1)) * u_kernel[8] ;

       // делим сумму на весовой коэффициент, но берём из результата только rgb
       // прозрачность установим в значение 1.0
       gl_FragColor = vec4((colorSum / u_kernelWeight).rgb, 1.0);
    }
    </script>

В JavaScript нужно задать ядро свёртки и делитель

     function computeKernelWeight(kernel) {
       var weight = kernel.reduce(function(prev, curr) {
           return prev + curr;
       });
       return weight <= 0 ? 1 : weight;
     }

     ...
     var kernelLocation = gl.getUniformLocation(program, "u_kernel[0]");
     var kernelWeightLocation = gl.getUniformLocation(program, "u_kernelWeight");
     ...
     var edgeDetectKernel = [
         -1, -1, -1,
         -1,  8, -1,
         -1, -1, -1
     ];
     gl.uniform1fv(kernelLocation, edgeDetectKernel);
     gl.uniform1f(kernelWeightLocation, computeKernelWeight(edgeDetectKernel));
     ...

И вуаля! Используйте выпадающий список для выбора различных ядер.

{{{example url="../webgl-2d-image-3x3-convolution.html" }}}

Надеюсь, эта статья убедила вас, что обработка изображений в WebGL - это довольно просто. Дальше я рассмотрю, [как применить к изображению более одного эффекта](webgl-image-processing-continued.html).

<div class="webgl_bottombar">
<h3><code>u_image</code> нигде не устанавливается. Как это работает?</h3>
<p>
Значение uniform-переменных по умолчанию равно 0, поэтому u_image использует текстурный блок 0. Текстурный блок 0 является также активной текстурой по умолчанию, поэтому вызов bindTexture привяжет текстуру к текстурному блоку 0.
</p>
<p>
WebGL содержит массив текстурных блоков. Связь между uniform-переменной и текстурой настраивается через получение ссылки этой uniform-переменной и установку индекса текстурного блока, к которому вы хотите обратиться.
</p>
<p>
Например:
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // используем текстурный блок 6.
var u_imageLoc = gl.getUniformLocation(
    program, "u_image");
gl.uniform1i(u_imageLoc, textureUnitIndex);
</pre>
<p>
Для установки текстур различным блокам вы вызываете <code>gl.activeTexture</code>, а затем привязываете нужную вам текстуру к этому блоку. Например:
</p>
<pre class="prettyprint showlinemods">
// привязать someTexture текстурному блоку 6.
gl.activeTexture(gl.TEXTURE6);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
Следующий код также работает:
</p>
<pre class="prettyprint showlinemods">
var textureUnitIndex = 6; // использовать текстурный блок 6.
// связываем someTexture с текстурным блоком 6.
gl.activeTexture(gl.TEXTURE0 + textureUnitIndex);
gl.bindTexture(gl.TEXTURE_2D, someTexture);
</pre>
<p>
Во всех реализациях WebGL должно быть по меньшей мере 8 текстурных блоков во
фрагментных шейдерах и только 0 в вершинных шейдерах. Поэтому если вы хотите
использовать больше 8 текстурных блоков, рекомендую проверить, сколько
текстурных блоков поддерживается, через вызов <code>gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS)</code>,
а если нужно проверить, сколько текстурных блоков поддерживается в вершинном
шейдере, используйте <code>gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS)</code>.
Около 99% компьютеров поддерживают по крайней мере 4 текстурных блока в
вершинных шейдерах.
</p>
</div>

<div class="webgl_bottombar">
<h3>Что означают префиксы a_, u_, and v_ в именах переменных в GLSL?</h3>
<p>
Это просто соглашение по именованию. Это вовсе не обязательно, но для меня гораздо проще с одного взгляда понимать, откуда приходят значения. a_ ставится атрибутам, данные для которых приходят из буферов. u_ - для uniform-переменных, которые являются входными данными для шейдеров. v_ ставится varying-переменным, значения которых передаются из вершинного шейдера фрагментному шейдеру и интерполируется между вершинами для каждого рисуемого пикселя.

Смотрите, <a href="webgl-how-it-works.html">как работает WebGL</a> для дополнительной информации.
</p>
</div>
