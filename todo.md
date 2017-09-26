TO DO
=====

* Make build not dependent on Node 8.4

  The JSDOC template is broken on Node 8.5
  Maybe switch to the same template as twgl.
  A quick try and that broke too though.
  Not clear why.

* Use TWGL

  There's no plans to maintain the non-twgl lib

* Consider switching everything to using VAOs

  VAOs are just better period but to really use them
  correctly requires more organization. You really
  need to specify attribute locations so the
  same VAO can be used with muliple shaders.

* Consider switching everything to use template strings

  Plus: Template strings are less confusing

  Minus: Template strings can not as easily be formatted?

  A good editor could look at the type of script and
  switch modes. I suppose a good editor could also
  look for a comment or #version as well though


