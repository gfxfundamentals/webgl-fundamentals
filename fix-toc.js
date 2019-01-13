const fs = require('fs');
const path = require('path');

const settings = {
  rootFolder: 'webgl',
}

const readdirs = function(dirpath) {
  const dirsOnly = function(filename) {
    const stat = fs.statSync(filename);
    return stat.isDirectory();
  };

  const addPath = function(filename) {
    return path.join(dirpath, filename);
  };

  return fs.readdirSync(`${settings.rootFolder}/lessons`)
      .map(addPath)
      .filter(dirsOnly);
};

const extractHeader = (function() {
  const headerRE = /([A-Z0-9_-]+): (.*?)$/i;

  return function(content) {
    const metaData = { };
    const lines = content.split('\n');
    for (;;) {
      const line = lines[0].trim();
      const m = headerRE.exec(line);
      if (!m) {
        break;
      }
      metaData[m[1].toLowerCase()] = m[2];
      lines.shift();
    }
    return {
      content: lines.join('\n'),
      headers: metaData,
    };
  };
}());

const parseMD = function(content) {
  return extractHeader(content);
};

const loadMD = function(contentFileName) {
  const content = fs.readFileSync(contentFileName, 'utf-8');
  return parseMD(content);
};

const isLangFolder = function(dirname) {
  const filename = path.join(dirname, 'langinfo.hanson');
  return fs.existsSync(filename);
};

function capitalize(s) {
  return s[0].toUpperCase() + s.substring(1);
}

const pathToLang = function(filename) {
  const lang = path.basename(filename);
  const lessonBase = `${settings.rootFolder}/lessons`;
  const lessons = `${lessonBase}/${lang}`;
  return {
    lang,
    toc: `${settings.rootFolder}/lessons/${lang}/toc.html`,
    lessons: `${lessonBase}/${lang}`,
    template: 'build/templates/lesson.template',
    examplePath: `/${lessonBase}/`,
    home: `/${lessons}/`,
  };
};


let langs = [
  // English is special (sorry it's where I started)
  {
    template: 'build/templates/lesson.template',
    lessons: `${settings.rootFolder}/lessons`,
    lang: 'en',
    toc: `${settings.rootFolder}/lessons/toc.html`,
    examplePath: `/${settings.rootFolder}/lessons/`,
    home: '/',
  },
];

langs = langs.concat(readdirs(`${settings.rootFolder}/lessons`)
    .filter(isLangFolder)
    .map(pathToLang));

for (const lang of langs) {
  console.log("----------[", lang.lang, "]-------");
  const toc = fs.readFileSync(lang.toc, 'utf-8');
  const linkRE = /<a\s+href="(.*?)">(.*)<\/a>/g;
  const links = [];
  let m;
  do {
    m = linkRE.exec(toc);
    if (m) {
      const link = m[1];
      const title = m[2];
      const m2 = /\/lessons\/(\w{2}|\w{5})\//.exec(link);
      if ((m2 && m2[1] === lang.lang) ||
          (!m2 && lang.lang === 'en')) {
        if (link.endsWith(".html") && link.startsWith("/")) {
          links.push({link: m[1], title: m[2]});
        }
      }
    } 
  } while(m);
  for (const link of links) {
    const filename = link.link.replace(/^\/(.*?)\.html$/, "$1.md");
    if (fs.existsSync(filename)) {
      const md = loadMD(filename);
      if (!md.headers.toc && link.title !== md.headers.title) {
        console.log(filename, "\n  [", link.title, "]\n  [", md.headers.title, "]");
        const newContent = Object.entries(md.headers).map((kv) => {
          return `${capitalize(kv[0])}: ${kv[1]}`
        }).join('\n') + '\nTOC: ' + link.title + '\n' + md.content; 
        fs.writeFileSync(filename, newContent);
      }
    }
  }
}

const toc = [
  {
    title: "Fundamentals",
    children:   [
      { article: "webgl-fundamentals" },
      { article: "webgl-how-it-works" },
      { article: "webgl-shaders-and-glsl" },
    ],
  },
  {
    title: "Image Processing",
    children:   [
      { article: "webgl-image-processing" },
      { article: "webgl-image-processing-continued" },
    ],
  },
  {
    title: "2D translation, rotation, scale, matrix math",
    children:   [
      { article: "webgl-2d-translation" },
      { article: "webgl-2d-rotation" },
      { article: "webgl-2d-scale" },
      { article: "webgl-2d-matrices" },
    ],
  },
  {
    title: "3D",
    children:   [
      { article: "webgl-3d-orthographic" },
      { article: "webgl-3d-perspective" },
      { article: "webgl-3d-camera" },
    ],
  },
  {
    title: "Lighting",
    children:   [
      { article: "webgl-3d-lighting-directional" },
      { article: "webgl-3d-lighting-point" },
      { article: "webgl-3d-lighting-spot" },
    ],
  },
  {
    title: "Structure and Organization",
    children:   [
      { article: "webgl-less-code-more-fun" },
      { article: "webgl-drawing-multiple-things" },
      { article: "webgl-scene-graph" },
    ],
  },
  {
    title: "Geometry",
    children:   [
      { article: "webgl-3d-geometry-lathe" },
    ],
  },
  {
    title: "Textures",
    children:   [
      { article: "webgl-3d-textures" },
      { article: "webgl-data-textures" },
      { article: "webgl-2-textures" },
      { article: "webgl-cors-permission" },
      { article: "webgl-3d-perspective-correct-texturemapping" },
    ],
  },
  {
    title: "Rendering To A Texture",
    children:   [
      { article: "webgl-render-to-texture" },
    ],
  },
  {
    title: "Techniques",
    children:   [
      {
        title: "2D",
        children:     [
            { article: "webgl-2d-drawimage" },
            { article: "webgl-2d-matrix-stack" },
          ],
          
      },
      {
        title: "3D",
        children:     [
            { article: "webgl-cube-maps" },
            { article: "webgl-environment-maps" },
            { article: "webgl-skybox" },
            { article: "webgl-skinning" },
            { article: "webgl-fog" },
          ],
          
      },
      {
        title: "Text",
        children:     [
            { article: "webgl-text-html" },
            { article: "webgl-text-canvas2d" },
            { article: "webgl-text-texture" },
            { article: "webgl-text-glyphs" },
          ],  
      },
      {
        title: "Misc",
        children:   [
          { article: "webgl-setup-and-installation" },
          { article: "webgl-boilerplate" },
          { article: "webgl-resizing-the-canvas" },
          { article: "webgl-animation" },
          { article: "webgl-and-alpha" },
          { article: "webgl-2d-vs-3d-library" },
          { article: "webgl-anti-patterns" },
        ],
      },
    ],
  },
  {
    children: [
      { link: "/docs/", caption: "Helper API Docs" },
      { link: "http://twgljs.org", caption: "TWGL, A tiny WebGL helper library" },
      { link: "https://github.com/greggman/webgl-fundamentals", caption: "github" },
    ],
  },
];

function genTOC(toc, lang, prefix = '') {
  const lines = [];
  lines.push(`${prefix}<ul>`);
  for (const t of toc) {
    if (t.title) {
      lines.push(`${prefix}  <li>${t.title}</li>`);
    }
    if (t.link) {
      lines.push(`${prefix}  <li><a href="${t.link}">${t.caption}</a></li>`);
    }
    if (t.article) {
      const langFilename = path.join(lang.lessons, `${t.article}.md`);
      const engFilename = path.join(settings.rootFolder, 'lessons', `${t.article}.md`);
      const link = `/${lang.lessons}/${t.article}.html`;
      let md;
      let extra = '';
      if (fs.existsSync(langFilename)) {
        md = loadMD(langFilename);
      } else {
        md = loadMD(engFilename);
        extra = '(en)';
      }
      lines.push(`${prefix}  <li><a href="${link}">${md.headers.toc || md.headers.title}${extra}</a></li>`);      
    }
    if (t.children) {
      lines.push(...genTOC(t.children, lang, `${prefix}  `));
    }
  }

  lines.push(`${prefix}</ul>`);
  return lines;
}

console.log(genTOC(toc, langs[1]).join('\n'));
console.log(JSON.stringify(langs, null, 2));