import markdown
import glob
import os
import re
import sys
from optparse import OptionParser


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


  def WriteFile(self, file_name, content):
    f = open(file_name, "wb")
    f.write(content.encode('utf8'))
    f.close()


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
    print "processing: ", template_path, content_file_name, out_file_name
    template = self.ReadFile(template_path)
    (md_content, meta_data) = self.LoadMD(content_file_name)
    print meta_data
    md_content = md_content.replace('%(', '__STRING_SUB__')
    md_content = md_content.replace('%', '__PERCENT__')
    md_content = md_content.replace('__STRING_SUB__', '%(')
    md_content = md_content % extra
    md_content = md_content.replace('__PERCENT__', '%')
    html = markdown.markdown(md_content)
    meta_data['content'] = html
    meta_data['src_file_name'] = content_file_name
    meta_data['dst_file_name'] = out_file_name
    meta_data['basedir'] = ""
    output = template % meta_data
    self.WriteFile(out_file_name, output)
    self.articles.append(meta_data)


  def ApplyTemplateToFiles(self, template_path, files_spec):
    file_names = glob.glob(files_spec)
    for file_name in file_names:
      (base_name, etc) = os.path.splitext(file_name)
      out_file_name = base_name + ".html"
      self.ApplyTemplateToFile(template_path, file_name, out_file_name)


  def Process(self):
    self.ApplyTemplateToFiles("templates/lesson.template", "lessons/*.md")


    toc = ['<li><a href="%s">%s</a></li>' % (a["dst_file_name"], a["title"]) for a in self.articles]


    self.ApplyTemplateToFile("templates/lesson.template", "index.md", "index.html", {
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

