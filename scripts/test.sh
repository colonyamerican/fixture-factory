export NODE_ENV=testing

./node_modules/mocha/bin/mocha \
  --reporter spec \
  --compilers js:babel-core/register \
  src/**/*.spec.js
