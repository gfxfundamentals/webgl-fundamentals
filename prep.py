#!/bin/python
import os
import sys
import re
from optparse import OptionParser

def ReadFile(filename):
  f = open(filename, "rb")
  data = f.read()
  f.close()
  return data

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
  data = data.replace('class="webgl_', 'class="gman_')
  data = data.replace('href="', 'href="/downloads/examples/webgl/lessons/')
  data = data.replace('src="', 'src="/downloads/examples/webgl/lessons/')

  print data

if __name__ == '__main__':
  main(sys.argv[1:])

