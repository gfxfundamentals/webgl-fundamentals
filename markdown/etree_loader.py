
## Import
def importETree():
    """Import the best implementation of ElementTree, return a module object."""
    etree_in_c = None
    try: # Is it Python 2.5+ with C implemenation of ElementTree installed?
        import xml.etree.cElementTree as etree_in_c
        from xml.etree.ElementTree import Comment
    except ImportError:
        try: # Is it Python 2.5+ with Python implementation of ElementTree?
            import xml.etree.ElementTree as etree
        except ImportError:
            try: # An earlier version of Python with cElementTree installed?
                import cElementTree as etree_in_c
                from elementtree.ElementTree import Comment
            except ImportError:
                try: # An earlier version of Python with Python ElementTree?
                    import elementtree.ElementTree as etree
                except ImportError:
                    raise ImportError("Failed to import ElementTree")
    if etree_in_c: 
        if etree_in_c.VERSION < "1.0.5":
            raise RuntimeError("cElementTree version 1.0.5 or higher is required.")
        # Third party serializers (including ours) test with non-c Comment
        etree_in_c.test_comment = Comment
        return etree_in_c
    elif etree.VERSION < "1.1":
        raise RuntimeError("ElementTree version 1.1 or higher is required")
    else:
        return etree

