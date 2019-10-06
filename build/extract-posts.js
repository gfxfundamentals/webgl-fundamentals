'use strict';

/* eslint no-console: 0 */
/* eslint no-process-exit: 0 */
/* eslint no-use-before-define: 0 */

const fs = require('fs');

const db = JSON.parse(fs.readFileSync('gman-posts.json'));
Object.entries(db.questionsById).filter(([, q]) => {
  return q.Tags.includes('webgl');
}).forEach(([questionId, question], ndx) => {

  applyHistory(question, db.historyById[questionId]);

  const answers = db.answersByParentId[questionId].filter(a => a.OwnerUserId === '128511');
  for (const answer of answers) {
     applyHistory(answer, db.historyById[answer.Id]);
  }

  const filename = `webgl/lessons/webgl-qna-${(ndx + 1).toString().padStart(4, '0')}-${safeName(question.Title)}.md`;
  const content = `Title: ${question.Title}
Description:
TOC: qna

# Question:

${question.Text}

# Answer

${answers.map(a => a.Text).join('\n\n\n')}
`;

  console.log('write:', filename);
  fs.writeFileSync(filename, content);
});

function safeName(s) {
  return s.replace(/[^a-zA-Z0-9]/g, '-');
}

function applyHistory(post, history) {
  if (history.length) {
    history = history.sort((a, b) => a.CreationDate > b.CreationDate ? -1 : (a.CreationDate < b.CreationDate ? 1 : 0))
    post.Text = history[0].Text;
  }
}