import markdown
import glob
import os
import re
import sys


class ObjParser(object):
  def __init__(self, filename):
    self.positions = []
    self.normals = []
    self.texcoords = []

    self.out_positions = []
    self.out_normals = []
    self.out_texcoords = []

    file = open(filename, "r")
    lines = file.readlines()
    file.close()

    for line in lines:
      parts = line.split()
      if parts[0] == "v":
        self.positions.append([parts[1], parts[2], parts[3]])
      elif parts[0] == 'vn':
        self.normals.append([parts[1], parts[2], parts[3]])
      elif parts[0] == 'vt':
        self.texcoords.append([parts[1], parts[2]])
      elif parts[0] == 'f':
        for v in parts[1:4]:
          f = v.split("/")
          self.out_positions.append(self.positions[int(f[0]) - 1])
          self.out_texcoords.append(self.texcoords[int(f[1]) - 1])
          self.out_normals.append(self.normals[int(f[2]) - 1])

    print "// positions"
    self.dump(self.out_positions)
    print "// texcoords"
    self.dump(self.out_texcoords)
    print "// normals"
    self.dump(self.out_normals)

  def dump(self, array):
    for e in array:
      print ", ".join(e) + ","

def main (argv):
  o = ObjParser(argv[0])


if __name__ == '__main__':
  main(sys.argv[1:])
