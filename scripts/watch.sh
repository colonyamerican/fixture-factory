#!/bin/bash
./node_modules/.bin/babel \
  --watch \
  --stage 0 \
  --ignore *.spec.js \
  --out-dir dist \
  src
