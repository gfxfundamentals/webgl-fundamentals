import markdown
import glob
import os
import sys
from optparse import OptionParser


def ReadFile(file_name):
  f = open(file_name, "rb")
  content = f.read().decode('utf8')
  f.close()
  return content


def WriteFile(file_name, content):
  f = open(file_name, "wb")
  f.write(content.encode('utf8'))
  f.close()


def ApplyTemplateToFile(template_path, content_file_name, out_file_name):
  print "processing: ", template_path, content_file_name, out_file_name
  template = ReadFile(template_path)
  content = ReadFile(content_file_name)
  html = markdown.markdown(content)
  output = template % { 
    "title": "fill this in",
    "content": html,
    "src_file_name": content_file_name,
  }
  WriteFile(out_file_name, output)


def ApplyTemplateToFiles(template_path, files_spec):
  file_names = glob.glob(files_spec)
  for file_name in file_names:
    (base_name, etc) = os.path.splitext(file_name)
    out_file_name = base_name + ".html"
    ApplyTemplateToFile(template_path, file_name, out_file_name)


def main (argv):
  parser = OptionParser()
  parser.add_option(
      "-v", "--verbose", action="store_true",
      help="prints more output.")
  parser.add_option(
      "-d", "--debug", action="store_true",
      help="turns on debugging.")

  (options, args) = parser.parse_args(args=argv)
  ApplyTemplateToFiles("templates/lesson.template", "lessons/*.md")


if __name__ == '__main__':
  main(sys.argv[1:])

