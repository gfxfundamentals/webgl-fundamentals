'use strict';

const fs = require('fs');
const path = require('path');

function safeStr(s) {
  return s.toLowerCase().replace(/[^a-z0-9_]/g, '-');
}

const qna = fs.readFileSync('webgl/lessons/webgl-qna.md', {encoding: 'utf8'});

const qnas = [];
const newQNA = qna.replace(/\[(.*?)\]\((.*?)\)/g, (_, title, soLink) => {
  const m = (/\/questions\/(\d+)/).exec(soLink);
  if (!m) {
    return `[${title}](${soLink})`;
  }
  const questionId = m[1];
  const name = `webgl-qna-${safeStr(title)}`;
  qnas.push({questionId, name, title});
  return `[${title}](${name}.html)`;
});
fs.writeFileSync('webgl/lessons/webgl-qna.md', newQNA);

if (fs.existsSync('webgl/lessons/ko/webgl-qna.md')) {
  const qnasByQuestionId = Object.fromEntries(qnas.map(q => [q.questionId, q]));
  const qna = fs.readFileSync('webgl/lessons/ko/webgl-qna.md', {encoding: 'utf8'});
  const newQNA = qna.replace(/\[(.*?)\]\((.*?)\)/g, (_, title, soLink) => {
    const m = (/\/questions\/(\d+)/).exec(soLink);
    if (!m) {
      return `[${title}](${soLink})`;
    }
    const questionId = m[1];
    const q = qnasByQuestionId[questionId];
    if (!q) {
      return `[${title}](${soLink})`;
    }
    return `[${title}](${q.name}.html)`;
  });
  fs.writeFileSync('webgl/lessons/ko/webgl-qna.md', newQNA);
}

// puts the markdown for this post in post.Text
function applyHistory(post, history) {
  if (history.length) {
    history = history.sort((a, b) => a.CreationDate > b.CreationDate ? -1 : (a.CreationDate < b.CreationDate ? 1 : 0))
    post.Text = history[0].Text;
  }
}

function writeExampleFromSnippet(filename, snippet) {
  const parts = Object.fromEntries(snippet
    .split('<!-- language: ')
    .filter(s => s.startsWith('lang-'))
    .map(s => {
      const lines = s.split('\n').map(s => s.startsWith('    ') ? s.substr(4) : s);
      const lang = lines.shift();
      const name = lang.split(' ')[0].substr(5);
      return [name, lines.join('\n')];
    }));
  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes">
<style>
${parts.css}
</style>
</head>
<body>
${parts.html}
</body>
<script>
${parts.js}
</script>
`;
  fs.writeFileSync(filename, html);
}

function extractExamples(name, md) {
  let count = 0;
  return md.replace(/<!-- begin snippet: .*? -->([\s\S]+?)<!-- end snippet -->/g, (_, snippet) => {
    const filename = `${name}-example-${++count}.html`;
    writeExampleFromSnippet(path.join('webgl', filename), snippet);
    return `{{{example url="../${filename}"}}}`;
  });
}

const userId = '128511';
const db = JSON.parse(fs.readFileSync('so.json', {encoding: 'utf8'}));

qnas.forEach(({questionId, title, name}, i) => {
  const question = db.questionsById[questionId];
  if (!question) {
    console.error(`missing question: ${questionId}`);
    return;
  }

  applyHistory(question, db.historyById[questionId])
  const answers = db.answersByParentId[questionId].filter(a => a.OwnerUserId === userId);
  for (const answer of answers) {
     applyHistory(answer, db.historyById[answer.Id]);
  }

  const questionUser = db.usersById[question.OwnerUserId];

  function userName(user) {
    return user ? user.DisplayName : 'unknown';
  }

  function userLink(user) {
    if (user) {
      return user.WebsiteUrl
          ? user.WebsiteUrl
          : `https://stackoverflow.com/users/${user.Id}`;
    }
    return '';
  }

  const md = `Title: ${title}
Description: ${title}
TOC: ${title}

## Question:

${question.Text}

## Answer:

${answers.map(a => extractExamples(name, a.Text)).join('\n\n')}

<div class="so">
  <div>The question and quoted portions thereof are 
    ${question.ContentLicense} by
    <a data-href="${userLink(questionUser)}">${userName(questionUser)}</a>
    from
    <a data-href="https://stackoverflow.com/questions/${questionId}">here</a>
  </div>
</div>
`;
  const filename = path.join('webgl', 'lessons', `${name}.md`);
  fs.writeFileSync(filename, md);
});

