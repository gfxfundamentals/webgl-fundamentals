#!/bin/python

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

class data:
  def __init__(self, **kwargs):
    self.__dict__.update(kwargs)

class MyHTMLParser(HTMLParser):
  p_marker = "---paragraph---"

  def __init__(self, options = None):
    HTMLParser.__init__(self)
    self.depth = 0
    self.text = []
    self.tags = []
    self.depthPrefix = ""
    if options == None:
      options = data(debug=False)
    self.options = options

  def data(self):
    return "".join(self.text)

  def handle_starttag(self, tag, in_attrs):
    self.depthPrefix = self.depthPrefix + "  "
    if self.options.debug:
      print ("%s<%s" % (self.depthPrefix, tag))
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
    if self.options.debug:
      print ("%s%s>" % (self.depthPrefix, tag))
    if self.tags.pop() != tag:
      raise Exception("bad closing tag: " + tag)
    self.text.append("</")
    self.text.append(tag)
    self.text.append(">")
    self.depthPrefix = self.depthPrefix[2:]

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
    data = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', data)
    data = re.sub(r'\*(.*?)\*', r'<i>\1</i>', data)
    self.text.append(data)

  def handle_entityref(self, name):
    self.text.append("&" + name + ";")


def Convert(data, options = None):
  parser = MyHTMLParser(options)
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
  data = Convert(data, options)

  print data

if __name__ == '__main__':
  main(sys.argv[1:])

