#!/usr/bin/env python
"""
Sane List Extension for Python-Markdown
=======================================

Modify the behavior of Lists in Python-Markdown t act in a sane manor.

In standard Markdown sytex, the following would constitute a single 
ordered list. However, with this extension, the output would include 
two lists, the first an ordered list and the second and unordered list.

    1. ordered
    2. list

    * unordered
    * list

Copyright 2011 - [Waylan Limberg](http://achinghead.com)

"""

import re
import markdown


class SaneOListProcessor(markdown.blockprocessors.OListProcessor):
    
    CHILD_RE = re.compile(r'^[ ]{0,3}((\d+\.))[ ]+(.*)')
    SIBLING_TAGS = ['ol']


class SaneUListProcessor(markdown.blockprocessors.UListProcessor):
    
    CHILD_RE = re.compile(r'^[ ]{0,3}(([*+-]))[ ]+(.*)')
    SIBLING_TAGS = ['ul']


class SaneListExtension(markdown.Extension):
    """ Add sane lists to Markdown. """

    def extendMarkdown(self, md, md_globals):
        """ Override existing Processors. """
        md.parser.blockprocessors['olist'] = SaneOListProcessor(md.parser)
        md.parser.blockprocessors['ulist'] = SaneUListProcessor(md.parser)


def makeExtension(configs={}):
    return SaneListExtension(configs=configs)

