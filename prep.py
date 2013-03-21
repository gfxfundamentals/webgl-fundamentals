#!/bin/python
import os
import sys
import re
from optparse import OptionParser
from HTMLParser import HTMLParser

def ReadFile(filename):
  f = open(filename, "rb")
  data = f.read()
  f.close()
  return data

class MyHTMLParser(HTMLParser):
  p_marker = "---paragraph---"

  def __init__(self):
    HTMLParser.__init__(self)
    self.depth = 0
    self.text = []
    self.tags = []

  def data(self):
    return "".join(self.text)

  def handle_starttag(self, tag, in_attrs):
    attrs = dict(in_attrs)
    self.tags.append(tag)
    self.text.append("<")
    self.text.append(tag)
    for key, value in attrs.iteritems():
      if key == "href":
        if value.endswith(".html") and value.find("/") < 0:
          value = "/game/" + value[:-5] + "/"
        else:
          value = "/downloads/examples/webgl/lessons/" + value
      if key == "class":
        value= value.replace("webgl_", "gman_")
      if key == "src":
        value = "/downloads/examples/webgl/lessons/" + value
      self.text.append(" " + key + '="' + value + '"')
    self.text.append(">")

  def handle_endtag(self, tag):
    if self.tags.pop() != tag:
      raise Exception("bad closing tag")
    self.text.append("</")
    self.text.append(tag)
    self.text.append(">")

  def handle_data(self, data):
    if len(self.tags) == 0 or self.tags[-1] == "p":
      if len(data) > 1:
        data = data.replace("\n\n", MyHTMLParser.p_marker)
        data = data.replace("\n", " ")
        data = data.replace(MyHTMLParser.p_marker, "\n\n")
    elif data == "\n":
      return
    data = data.replace("<", "&lt;")
    data = data.replace(">", "&gt;")
    data = re.sub(r'`(.*?)`', r'<code>\1</code>', data)
    self.text.append(data)

  def handle_entityref(self, name):
    self.text.append("&" + name + ";")


def Convert(data):
  parser = MyHTMLParser()
  parser.feed(data)
  return parser.data()


def main (argv):
  parser = OptionParser()
  parser.add_option(
      "-v", "--verbose", action="store_true",
      help="prints more output.")
  parser.add_option(
      "-d", "--debug", action="store_true",
      help="turns on debugging.")

  (options, args) = parser.parse_args(args=argv)

  data = ReadFile(args[0])
  data = data[data.find("\n") + 1:]  # removes title
  data = data[data.find("\n") + 1:]  # removes blank line after title
  data = Convert(data)

  print data

if __name__ == '__main__':
  main(sys.argv[1:])

