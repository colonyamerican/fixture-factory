export NODE_ENV=testing

./node_modules/mocha/bin/mocha \
  --reporter spec \
  --compilers js:babel-register \
  src/**/*.spec.js
