Title: WebGL - Меньше кода, больше веселья
Description: Как сделать программирование в WebGL не таким многословным
TOC: WebGL - Меньше кода, больше веселья


Прим. переводчика:
В оригинале игра слов `Less Code, More Fun`, `Fun` - сокращение слова функция,
что намекает на рефакторинг проведенный в этом разделе.

Эта статья продолжает серию, которая начинается с [Основ WebGL](webgl-fundamentals.html).
Если вы ещё не читали предыдущие статьи, предлагаю прочесть по крайней мере первую
из них, а потом вернуться сюда.

Программы на WebGL предполагают, что вы напишите шейдерную программу,
которую затем скомпилируете, скомпонуете и установите значение входных
переменных для неё. Эти переменные называются атрибутами и uniform-переменными,
и чтобы установить им значение, необходимо сначала получить ссылку на
эти переменные, что довольно утомительно и занимает много места.

Рассмотрим [обычный шаблон кода WebGL компиляции шейдерных
программ](webgl-boilerplate.html). У нас есть следующие шейдеры.

Вершинный шейдер:

```
uniform mat4 u_worldViewProjection;
uniform vec3 u_lightWorldPos;
uniform mat4 u_world;
uniform mat4 u_viewInverse;
uniform mat4 u_worldInverseTranspose;

attribute vec4 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

void main() {
  v_texCoord = a_texcoord;
  v_position = (u_worldViewProjection * a_position);
  v_normal = (u_worldInverseTranspose * vec4(a_normal, 0)).xyz;
  v_surfaceToLight = u_lightWorldPos - (u_world * a_position).xyz;
  v_surfaceToView = (u_viewInverse[3] - (u_world * a_position)).xyz;
  gl_Position = v_position;
}
```

Фрагментный шейдер:

```
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
  u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
  gl_FragColor = outColor;
}
```

Вам бы предстояло написать примерно следующий код для получения ссылок
на переменные и установки всех значений:

```
// При инициализации
var u_worldViewProjectionLoc   = gl.getUniformLocation(program, "u_worldViewProjection");
var u_lightWorldPosLoc         = gl.getUniformLocation(program, "u_lightWorldPos");
var u_worldLoc                 = gl.getUniformLocation(program, "u_world");
var u_viewInverseLoc           = gl.getUniformLocation(program, "u_viewInverse");
var u_worldInverseTransposeLoc = gl.getUniformLocation(program, "u_worldInverseTranspose");
var u_lightColorLoc            = gl.getUniformLocation(program, "u_lightColor");
var u_ambientLoc               = gl.getUniformLocation(program, "u_ambient");
var u_diffuseLoc               = gl.getUniformLocation(program, "u_diffuse");
var u_specularLoc              = gl.getUniformLocation(program, "u_specular");
var u_shininessLoc             = gl.getUniformLocation(program, "u_shininess");
var u_specularFactorLoc        = gl.getUniformLocation(program, "u_specularFactor");

var a_positionLoc              = gl.getAttribLocation(program, "a_position");
var a_normalLoc                = gl.getAttribLocation(program, "a_normal");
var a_texCoordLoc              = gl.getAttribLocation(program, "a_texcoord");


// При инициализации или отрисовке в зависимости от ситуации
var someWorldViewProjectionMat = computeWorldViewProjectionMatrix();
var lightWorldPos              = [100, 200, 300];
var worldMat                   = computeWorldMatrix();
var viewInverseMat             = computeInverseViewMatrix();
var worldInverseTransposeMat   = computeWorldInverseTransposeMatrix();
var lightColor                 = [1, 1, 1, 1];
var ambientColor               = [0.1, 0.1, 0.1, 1];
var diffuseTextureUnit         = 0;
var specularColor              = [1, 1, 1, 1];
var shininess                  = 60;
var specularFactor             = 1;


// При отрисовке
gl.useProgram(program);

// Установка всех буферов и атрибутов
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.enableVertexAttribArray(a_positionLoc);
gl.vertexAttribPointer(a_positionLoc, positionNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
gl.enableVertexAttribArray(a_normalLoc);
gl.vertexAttribPointer(a_normalLoc, normalNumComponents, gl.FLOAT, false, 0, 0);
gl.bindBuffer(gl.ARRAY_BUFFER, texcoordBuffer);
gl.enableVertexAttribArray(a_texcoordLoc);
gl.vertexAttribPointer(a_texcoordLoc, texcoordNumComponents, gl.FLOAT, 0, 0);

// Настройка текстур
gl.activeTexture(gl.TEXTURE0 + diffuseTextureUnit);
gl.bindTexture(gl.TEXTURE_2D, diffuseTexture);

// Установка значений uniform-переменных
gl.uniformMatrix4fv(u_worldViewProjectionLoc, false, someWorldViewProjectionMat);
gl.uniform3fv(u_lightWorldPosLoc, lightWorldPos);
gl.uniformMatrix4fv(u_worldLoc, worldMat);
gl.uniformMatrix4fv(u_viewInverseLoc, viewInverseMat);
gl.uniformMatrix4fv(u_worldInverseTransposeLoc, worldInverseTransposeMat);
gl.uniform4fv(u_lightColorLoc, lightColor);
gl.uniform4fv(u_ambientLoc, ambientColor);
gl.uniform1i(u_diffuseLoc, diffuseTextureUnit);
gl.uniform4fv(u_specularLoc, specularColor);
gl.uniform1f(u_shininessLoc, shininess);
gl.uniform1f(u_specularFactorLoc, specularFactor);

gl.drawArrays(...);
```

Кода пришлось написать порядочно.

Но есть масса способов исправить ситуацию. Например, можно запросить у
WebGL все uniform-переменные и ссылки на них, а затем в функциях установить
их значения. В дальнейшем мы можем использовать объекты JavaScript, чтобы
код был проще. На словах всё выглядит очень запутанным, перейдём к коду и
проясним ситуацию.

```
// При инициализации
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters  = webglUtils.createAttributeSetters(gl, program);

var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};

// При инициализации или отрисовке в зависимости от ситуации
var uniforms = {
  u_worldViewProjection:   computeWorldViewProjectionMatrix(...),
  u_lightWorldPos:         [100, 200, 300],
  u_world:                 computeWorldMatrix(),
  u_viewInverse:           computeInverseViewMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
  u_lightColor:            [1, 1, 1, 1],
  u_ambient:               [0.1, 0.1, 0.1, 1],
  u_diffuse:               diffuseTexture,
  u_specular:              [1, 1, 1, 1],
  u_shininess:             60,
  u_specularFactor:        1,
};

// При отрисовке
gl.useProgram(program);

// Установка всех буферов и атрибутов
webglUtils.setAttributes(attribSetters, attribs);

// Установка всех uniform-переменных и текстур
webglUtils.setUniforms(uniformSetters, uniforms);

gl.drawArrays(...);
```

Невооружённым взглядом видно, что кода стало гораздо меньше,
он стал проще и понятнее.

Мы можем даже использовать несколько объектов JavaScript, если вам
это удобнее. Например:

```
// При инициализации
var uniformSetters = webglUtils.createUniformSetters(gl, program);
var attribSetters  = webglUtils.createAttributeSetters(gl, program);

var attribs = {
  a_position: { buffer: positionBuffer, numComponents: 3, },
  a_normal:   { buffer: normalBuffer,   numComponents: 3, },
  a_texcoord: { buffer: texcoordBuffer, numComponents: 2, },
};

// При инициализации или отрисовке в зависимости от ситуации
var uniformsThatAreTheSameForAllObjects = {
  u_lightWorldPos:         [100, 200, 300],
  u_viewInverse:           computeInverseViewMatrix(),
  u_lightColor:            [1, 1, 1, 1],
};

var uniformsThatAreComputedForEachObject = {
  u_worldViewProjection:   perspective(...),
  u_world:                 computeWorldMatrix(),
  u_worldInverseTranspose: computeWorldInverseTransposeMatrix(),
};

var objects = [
  { translation: [10, 50, 100],
    materialUniforms: {
      u_ambient:               [0.1, 0.1, 0.1, 1],
      u_diffuse:               diffuseTexture,
      u_specular:              [1, 1, 1, 1],
      u_shininess:             60,
      u_specularFactor:        1,
    },
  },
  { translation: [-120, 20, 44],
    materialUniforms: {
      u_ambient:               [0.1, 0.2, 0.1, 1],
      u_diffuse:               someOtherDiffuseTexture,
      u_specular:              [1, 1, 0, 1],
      u_shininess:             30,
      u_specularFactor:        0.5,
    },
  },
  { translation: [200, -23, -78],
    materialUniforms: {
      u_ambient:               [0.2, 0.2, 0.1, 1],
      u_diffuse:               yetAnotherDiffuseTexture,
      u_specular:              [1, 0, 0, 1],
      u_shininess:             45,
      u_specularFactor:        0.7,
    },
  },
];

// При отрисовке
gl.useProgram(program);

// Настраиваем части, одинаковые для всех объектов
webglUtils.setAttributes(attribSetters, attribs);
webglUtils.setUniforms(uniformSetters, uniformThatAreTheSameForAllObjects);

objects.forEach(function(object) {
  computeMatricesForObject(object, uniformsThatAreComputedForEachObject);
  webglUtils.setUniforms(uniformSetters, uniformThatAreComputedForEachObject);
  webglUtils.setUniforms(unifromSetters, objects.materialUniforms);
  gl.drawArrays(...);
});
```

Вот пример использования этих функций-помощников.

{{{example url="../webgl-less-code-more-fun.html" }}}

Хорошо, идём дальше. В приведённом выше фрагменте кода мы создали буферы и
поместили их в переменную `attribs`. Но код, который эти буферы инициализирует,
не приведён. Если бы вы хотели создать координаты, нормали и текстурные
координаты, вы бы написали примерно следующий код.

    // один треугольник
    var positions = [0, -10, 0, 10, 10, 0, -10, 10, 0];
    var texcoords = [0.5, 0, 1, 1, 0, 1];
    var normals   = [0, 0, 1, 0, 0, 1, 0, 0, 1];

    var positionBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(positions), gl.STATIC_DRAW);

    var texcoordBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, texcoordsBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(texcoords), gl.STATIC_DRAW);

    var normalBuffer = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, normalBuffer);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(normals), gl.STATIC_DRAW);

Очень похоже на шаблон, давайте упростим его тоже.

    // Один треугольник
    var arrays = {
       position: { numComponents: 3, data: [0, -10, 0, 10, 10, 0, -10, 10, 0], },
       texcoord: { numComponents: 2, data: [0.5, 0, 1, 1, 0, 1],               },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1],        },
    };

    var bufferInfo = createBufferInfoFromArrays(gl, arrays);

Намного короче! Теперь при рендеринге мы можем сделать следующее:

    // Устанавливаем значения всем буферам и атрибутам
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    ...

    // Отрисовываем геометрию
    gl.drawArrays(gl.TRIANGLES, 0, bufferInfo.numElements);

И вот, что получится.

{{{example url="../webgl-less-code-more-fun-triangle.html" }}}

Это также будет работать, даже когда у нас будут индексы. `webglUtils.setBuffersAndAttributes`
установит все атрибуты и привяжет `ELEMENT_ARRAY_BUFFER` к `indices`, после чего
можно вызывать `gl.drawElements`.

    // прямоугольник с индексами
    var arrays = {
       position: { numComponents: 3, data: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0], },
       texcoord: { numComponents: 2, data: [0, 0, 0, 1, 1, 0, 1, 1],                 },
       normal:   { numComponents: 3, data: [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],     },
       indices:  { numComponents: 3, data: [0, 1, 2, 1, 2, 3],                       },
    };

    var bufferInfo = webglUtils.createBufferInfoFromArrays(gl, arrays);

и при отрисовке мы будем вызывать `gl.drawElements` вместо `gl.drawArrays`.

    // Устанавливаем все необходимые буферы и атрибуты
    webglUtils.setBuffersAndAttributes(gl, attribSetters, bufferInfo);

    ...

    // Отрисовываем геометрию
    gl.drawElements(gl.TRIANGLES, bufferInfo.numElements, gl.UNSIGNED_SHORT, 0);

И вот результат.

{{{example url="../webgl-less-code-more-fun-quad.html" }}}

В сущности, `createBufferInfoFromArrays` создаёт примерно такой объект:

     bufferInfo = {
       numElements: 4,        // количество элементов
       indices: WebGLBuffer,  // при отсутствии индексов этого свойства не будет
       attribs: {
         a_position: { buffer: WebGLBuffer, numComponents: 3, },
         a_normal:   { buffer: WebGLBuffer, numComponents: 3, },
         a_texcoord: { buffer: WebGLBuffer, numComponents: 2, },
       },
     };

Затем `webglUtils.setBuffersAndAttributes` использует этот объект для
инициализации всех буферов и атрибутов.

Наконец, мы можем пойти ещё дальше (на мой взгляд, даже слишком далеко).
Исходя из того, что `position` почти всегда содержит 3 компонента
(x, y, z), `texcoords` практически всегда состоит из 2 компонентов,
индексы из 3, нормали тоже из 3, мы можем дать программе возможность
угадать количество компонентов.

    // прямоугольник с индексами
    var arrays = {
       position: [0, 0, 0, 10, 0, 0, 0, 10, 0, 10, 10, 0],
       texcoord: [0, 0, 0, 1, 1, 0, 1, 1],
       normal:   [0, 0, 1, 0, 0, 1, 0, 0, 1, 0, 0, 1],
       indices:  [0, 1, 2, 1, 2, 3],
    };

Вот демонстрация этой версии.

{{{example url="../webgl-less-code-more-fun-quad-guess.html" }}}

Не уверен, что мне нравится подобный стиль. Пожалуй, меня беспокоит то,
что программа может угадать неверно. Например, мне понадобится вставить
дополнительный набор текстурных координат, а программа ошибочно установит
значение 2. Вы, конечно, можете принудительно указать значение, как это
было рассмотрено выше. Наверное, я переживаю, что подобное угадывание
может привести к нерабочей программе. Здесь выбор за вами. Некоторым
нравится, когда программа настолько простая, насколько это возможно.

А почему бы нам не посмотреть на атрибуты в программе шейдера для определения
количества компонентов? Всё потому, что из буфера приходит 3 компонента
x, y, z), но в шейдере используется `vec4`. Для атрибутов шейдер устанавливает
`w = 1` автоматически. А это значит, что мы не можем определить намерение
пользователя, так как размерность в шейдере может не соответствовать количеству
компонентов, которые передаются из буфера.

Поищем другие повторяющиеся фрагменты кода. Например, этот.

    var program = webglUtils.createProgramFromScripts(gl, ["vertexshader", "fragmentshader"]);
    var uniformSetters = webglUtils.createUniformSetters(gl, program);
    var attribSetters  = webglUtils.createAttributeSetters(gl, program);

Его можно упростить в одну строчку

    var programInfo = webglUtils.createProgramInfo(gl, ["vertexshader", "fragmentshader"]);

которая в результате вернет следующий объект

    programInfo = {
       program: WebGLProgram,  // скомпилированная программа
       uniformSetters: ...,    // результат работы функции webglUtils.createUniformSetters,
       attribSetters: ...,     // результат работы функции createAttribSetters,
    }

И это ещё одно небольшое упрощение, которое будет полезным при использовании
нескольких программ, так как программа и её переменные находятся в одном
объекте.

{{{example url="../webgl-less-code-more-fun-quad-programinfo.html" }}}

Во всяком случае, такого стиля я пытаюсь придерживаться при написании
своих программ WebGL. Однако, в своих уроках я придерживаюсь стандартного
**подробного** стиля, чтобы читатели не путали код WebGL с моим собственным
кодом, нужным для упрощения. Но всё же на определённом этапе демонстрация
всех этапов станет излишней и будет лишь отвлекать от основной идеи, поэтому
в дальнейших статьях порой будет использоваться рассматриваемый стиль.

Вы можете использовать подобный стиль и в своих проектах. Функции
`createUniformSetters`, `createAttributeSetters`, `createBufferInfoFromArrays`,
`setUniforms` и `setBuffersAndAttributes` содержатся в файле
[`webgl-utils.js`](https://github.com/gfxfundamentals/webgl-fundamentals/blob/master/webgl/resources/webgl-utils.js)
и используются во всех примерах этой статьи. Если вам нужно что-то более
систематизированное, обратите внимание на [TWGL.js](https://twgljs.org).

Далее у нас [отрисовка нескольких объектов](webgl-drawing-multiple-things.html).

<div class="webgl_bottombar">
<h3>Можем ли мы использовать сеттеры напрямую?</h3>
<p>
Читателям, знакомым с JavaScript, может быть интересно, можем ли мы устанавливать
значения напрямую следующим образом.
</p>
<pre class="prettyprint">
// При инициализации
var uniformSetters = webglUtils.createUniformSetters(program);

// При отрисовке
uniformSetters.u_ambient([1, 0, 0, 1]); // устанавливаем цвет фонового освещения в красный
</pre>
<p>Это будет не лучшей идеей, так как при работе с GLSL иногда необходимо менять код
шейдеров - например, для отладки. Скажем, у нас возникла ситуация, когда на экране
ничего не отрисовывается. Первое, что я делаю, когда ничего не отрисовывается, -
упрощаю шейдеры. Например, я мог бы установить шейдеру его простейшую форму.</p>
<pre class="prettyprint showlinemods">
// фрагментный шейдер
precision mediump float;

varying vec4 v_position;
varying vec2 v_texCoord;
varying vec3 v_normal;
varying vec3 v_surfaceToLight;
varying vec3 v_surfaceToView;

uniform vec4 u_lightColor;
uniform vec4 u_ambient;
uniform sampler2D u_diffuse;
uniform vec4 u_specular;
uniform float u_shininess;
uniform float u_specularFactor;

vec4 lit(float l ,float h, float m) {
  return vec4(1.0,
              max(l, 0.0),
              (l > 0.0) ? pow(max(0.0, h), m) : 0.0,
              1.0);
}

void main() {
  vec4 diffuseColor = texture2D(u_diffuse, v_texCoord);
  vec3 a_normal = normalize(v_normal);
  vec3 surfaceToLight = normalize(v_surfaceToLight);
  vec3 surfaceToView = normalize(v_surfaceToView);
  vec3 halfVector = normalize(surfaceToLight + surfaceToView);
  vec4 litR = lit(dot(a_normal, surfaceToLight),
                    dot(a_normal, halfVector), u_shininess);
  vec4 outColor = vec4((
  u_lightColor * (diffuseColor * litR.y + diffuseColor * u_ambient +
                u_specular * litR.z * u_specularFactor)).rgb,
      diffuseColor.a);
  gl_FragColor = outColor;
*  gl_FragColor = vec4(0,1,0,1);  // &lt;!--- просто зелёный цвет
}
</pre>
<p>Обратите внимание, что я всего лишь добавил строку, которая задаёт <code>gl_FragColor</code>
в качестве постоянного цвета. Большая часть драйверов поймёт, что ни одна из предыдущих строк
не влияет на результат, и поэтому при оптимизации не будет использовать uniform-переменные.
При следующем запуске программы при вызове <code>createUniformSetters</code> функция не создаст
сеттер для <code>u_ambient</code> и код прямого доступа к переменной
<code>uniformSetters.u_ambient()</code> прервёт выполнение с ошибкой</p>
<pre class="prettyprint">
TypeError: undefined is not a function
</pre>
<p>В <code>setUniforms</code> такой проблемы нет, так как устанавливаются только
те uniform-переменные, которые существуют.</p>
</div>
