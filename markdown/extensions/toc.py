"""
Table of Contents Extension for Python-Markdown
* * *

(c) 2008 [Jack Miller](http://codezen.org)

Dependencies:
* [Markdown 2.1+](http://packages.python.org/Markdown/)

"""
import markdown
from markdown.util import etree
from markdown.extensions.headerid import slugify, unique, itertext

import re


class TocTreeprocessor(markdown.treeprocessors.Treeprocessor):
    # Iterator wrapper to get parent and child all at once
    def iterparent(self, root):
        for parent in root.getiterator():
            for child in parent:
                yield parent, child

    def run(self, doc):
        marker_found = False

        div = etree.Element("div")
        div.attrib["class"] = "toc"
        last_li = None

        # Add title to the div
        if self.config["title"]:
            header = etree.SubElement(div, "span")
            header.attrib["class"] = "toctitle"
            header.text = self.config["title"]

        level = 0
        list_stack=[div]
        header_rgx = re.compile("[Hh][123456]")

        # Get a list of id attributes
        used_ids = []
        for c in doc.getiterator():
            if "id" in c.attrib:
                used_ids.append(c.attrib["id"])

        for (p, c) in self.iterparent(doc):
            text = ''.join(itertext(c)).strip()
            if not text:
                continue

            # To keep the output from screwing up the
            # validation by putting a <div> inside of a <p>
            # we actually replace the <p> in its entirety.
            # We do not allow the marker inside a header as that
            # would causes an enless loop of placing a new TOC 
            # inside previously generated TOC.

            if c.text and c.text.strip() == self.config["marker"] and \
               not header_rgx.match(c.tag) and c.tag not in ['pre', 'code']:
                for i in range(len(p)):
                    if p[i] == c:
                        p[i] = div
                        break
                marker_found = True
                    
            if header_rgx.match(c.tag):
                try:
                    tag_level = int(c.tag[-1])
                    
                    while tag_level < level:
                        list_stack.pop()
                        level -= 1

                    if tag_level > level:
                        newlist = etree.Element("ul")
                        if last_li:
                            last_li.append(newlist)
                        else:
                            list_stack[-1].append(newlist)
                        list_stack.append(newlist)
                        if level == 0:
                            level = tag_level
                        else:
                            level += 1

                    # Do not override pre-existing ids 
                    if not "id" in c.attrib:
                        id = unique(self.config["slugify"](text, '-'), used_ids)
                        c.attrib["id"] = id
                    else:
                        id = c.attrib["id"]

                    # List item link, to be inserted into the toc div
                    last_li = etree.Element("li")
                    link = etree.SubElement(last_li, "a")
                    link.text = text
                    link.attrib["href"] = '#' + id

                    if self.config["anchorlink"] in [1, '1', True, 'True', 'true']:
                        anchor = etree.Element("a")
                        anchor.text = c.text
                        anchor.attrib["href"] = "#" + id
                        anchor.attrib["class"] = "toclink"
                        c.text = ""
                        for elem in c.getchildren():
                            anchor.append(elem)
                            c.remove(elem)
                        c.append(anchor)

                    list_stack[-1].append(last_li)
                except IndexError:
                    # We have bad ordering of headers. Just move on.
                    pass
        if not marker_found:
            # searialize and attach to markdown instance.
            prettify = self.markdown.treeprocessors.get('prettify')
            if prettify: prettify.run(div)
            toc = self.markdown.serializer(div)
            for pp in self.markdown.postprocessors.values():
                toc = pp.run(toc)
            self.markdown.toc = toc

class TocExtension(markdown.Extension):
    def __init__(self, configs):
        self.config = { "marker" : ["[TOC]", 
                            "Text to find and replace with Table of Contents -"
                            "Defaults to \"[TOC]\""],
                        "slugify" : [slugify,
                            "Function to generate anchors based on header text-"
                            "Defaults to the headerid ext's slugify function."],
                        "title" : [None,
                            "Title to insert into TOC <div> - "
                            "Defaults to None"],
                        "anchorlink" : [0,
                            "1 if header should be a self link"
                            "Defaults to 0"]}

        for key, value in configs:
            self.setConfig(key, value)

    def extendMarkdown(self, md, md_globals):
        tocext = TocTreeprocessor(md)
        tocext.config = self.getConfigs()
        # Headerid ext is set to '>inline'. With this set to '<prettify',
        # it should always come after headerid ext (and honor ids assinged 
        # by the header id extension) if both are used. Same goes for 
        # attr_list extension. This must come last because we don't want
        # to redefine ids after toc is created. But we do want toc prettified.
        md.treeprocessors.add("toc", tocext, "<prettify")
	
def makeExtension(configs={}):
    return TocExtension(configs=configs)
