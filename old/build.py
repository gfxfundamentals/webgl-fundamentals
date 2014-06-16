#!/usr/bin/python
# Copyright 2012, Gregg Tavares.
# All rights reserved.
#
# Redistribution and use in source and binary forms, with or without
# modification, are permitted provided that the following conditions are
# met:
#
#     * Redistributions of source code must retain the above copyright
# notice, this list of conditions and the following disclaimer.
#     * Redistributions in binary form must reproduce the above
# copyright notice, this list of conditions and the following disclaimer
# in the documentation and/or other materials provided with the
# distribution.
#     * Neither the name of Gregg Tavares. nor the names of his
# contributors may be used to endorse or promote products derived from
# this software without specific prior written permission.
#
# THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS
# "AS IS" AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT
# LIMITED TO, THE IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR
# A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT
# OWNER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
# SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT
# LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE,
# DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND ON ANY
# THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
# (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE
# OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

import markdown
import glob
import os
import re
import sys
import subprocess
from optparse import OptionParser
from prep import Convert

def Execute(cmd, args, file=subprocess.PIPE):
  return subprocess.Popen([cmd] + args, stdout=file).communicate()[0]

def ExecuteWithStdin(cmd, args, input_str, file=subprocess.PIPE):
  output = subprocess.Popen([cmd] + args, stdin=subprocess.PIPE, stdout=file).communicate(input=input_str.encode("utf-8"))[0]
  return unicode(output, "utf-8")

def markdownme(src):
  return ExecuteWithStdin("node", ["node_modules/marked/bin/marked"], src)

class Builder(object):

  def __init__ (self):
    self.file_db = {}
    self.articles = []

  def ReadFile(self, file_name):
    if file_name in self.file_db:
      return self.file_db[file_name]
    f = open(file_name, "rb")
    content = f.read().decode('utf-8-sig')
    f.close()
    self.file_db[file_name] = content
    return content


  def WriteFileIfChanged(self, file_name, content):
    if os.path.exists(file_name):
      old = self.ReadFile(file_name)
      if content == old:
        return
    f = open(file_name, "wb")
    f.write(content.encode('utf8'))
    f.close()
    print "Wrote: ", file_name


  def ExtractHeader(self, content):
    lines = content.splitlines()
    meta_data = {}
    while True:
      line = lines[0]
      m = re.match('([A-Z0-9_-]+): (.*)$', line, re.IGNORECASE)
      if not m:
        break
      meta_data[m.group(1).lower()] = m.group(2)
      lines.pop(0)
    return ("\n".join(lines), meta_data)


  def LoadMD(self, file_name):
    content = self.ReadFile(file_name)
    return self.ExtractHeader(content)


  def ApplyTemplateToFile(self, template_path, content_file_name, out_file_name, extra = {}):
    print "processing: ", content_file_name
    template = self.ReadFile(template_path)
    (md_content, meta_data) = self.LoadMD(content_file_name)
    # Call prep's Content which parses the HTML. This helps us find missing tags
    # should probably call something else.
    Convert(md_content)
    #print meta_data
    md_content = md_content.replace('%(', '__STRING_SUB__')
    md_content = md_content.replace('%', '__PERCENT__')
    md_content = md_content.replace('__STRING_SUB__', '%(')
    md_content = md_content % extra
    md_content = md_content.replace('__PERCENT__', '%')
    #html = markdown.markdown(md_content)
    #html = markdown2.markdown2.markdown(md_content)
    html = markdownme(md_content)
    meta_data['content'] = html
    meta_data['src_file_name'] = content_file_name
    meta_data['dst_file_name'] = out_file_name
    meta_data['basedir'] = ""
    output = template % meta_data
    self.WriteFileIfChanged(out_file_name, output)
    self.articles.append(meta_data)


  def ApplyTemplateToFiles(self, template_path, files_spec):
    file_names = glob.glob(files_spec)
    for file_name in file_names:
      (base_name, etc) = os.path.splitext(file_name)
      out_file_name = base_name + ".html"
      self.ApplyTemplateToFile(template_path, file_name, out_file_name)


  def Process(self):
    self.ApplyTemplateToFiles("templates/lesson.template", "webgl/lessons/*.md")


    toc = ['<li><a href="%s">%s</a></li>' % (a["dst_file_name"], a["title"]) for a in self.articles]


    self.ApplyTemplateToFile("templates/index.template", "index.md", "index.html", {
        "table_of_contents": "<ul>" + "\n".join(toc) + "</ul>",
      })

def main (argv):
  parser = OptionParser()
  parser.add_option(
      "-v", "--verbose", action="store_true",
      help="prints more output.")
  parser.add_option(
      "-d", "--debug", action="store_true",
      help="turns on debugging.")

  (options, args) = parser.parse_args(args=argv)

  b = Builder()
  b.Process()


if __name__ == '__main__':
  main(sys.argv[1:])

