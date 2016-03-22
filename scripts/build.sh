#!/bin/bash
./node_modules/.bin/babel \
  --ignore *.spec.js \
  --out-dir dist \
  src
