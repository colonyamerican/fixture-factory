'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

var _get = function get(_x, _x2, _x3) { var _again = true; _function: while (_again) { var object = _x, property = _x2, receiver = _x3; _again = false; if (object === null) object = Function.prototype; var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { _x = parent; _x2 = property; _x3 = receiver; _again = true; desc = parent = undefined; continue _function; } } else if ('value' in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } } };

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) arr2[i] = arr[i]; return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

function _inherits(subClass, superClass) { if (typeof superClass !== 'function' && superClass !== null) { throw new TypeError('Super expression must either be null or a function, not ' + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var _faker = require('faker');

var _faker2 = _interopRequireDefault(_faker);

var _lodash = require('lodash');

var _events = require('events');

var _plugins = require('./plugins');

var FixtureFactory = (function (_EventEmitter) {
  _inherits(FixtureFactory, _EventEmitter);

  function FixtureFactory() {
    _classCallCheck(this, FixtureFactory);

    _get(Object.getPrototypeOf(FixtureFactory.prototype), 'constructor', this).call(this);
    this.dataModels = {};
    this.plugins = {};
    this.plugins.reference = new _plugins.Reference(this);
  }

  //generators, internals, stuff

  _createClass(FixtureFactory, [{
    key: '_parseFieldModel',
    value: function _parseFieldModel(method) {
      //check if passed method is a shorthhand, if yes parse it to proper field model
      var isProperFieldModel = !(0, _lodash.isFunction)(method) && (0, _lodash.isObject)(method) && method.method;
      return (0, _lodash.cloneDeep)(isProperFieldModel ? method : { method: method });
    }
  }, {
    key: '_handleFunction',
    value: function _handleFunction(model, fixture, dataModel) {
      return model.method.call(null, fixture, model.args || model.options || {}, dataModel, _faker2['default']);
    }
  }, {
    key: '_handleString',
    value: function _handleString(model) {
      var _nestedFakerMethod;

      var callStack = model.method.split('.');
      var nestedFakerMethod = _faker2['default'];
      var isMethod = true;
      var args = model.args || [];
      var options = model.options ? (0, _lodash.cloneDeep)(model.options) : void 0;
      var nextMethod = undefined;
      var context = undefined;

      if (options) {
        console.warn('Passing arguments to faker using the "options" property has been deprecated.');
        console.warn('Please use "args" property instead.');
        args.push(options);
      }

      while (callStack.length) {
        nextMethod = callStack.shift();
        if (nestedFakerMethod[nextMethod]) {
          context = nestedFakerMethod;
          nestedFakerMethod = nestedFakerMethod[nextMethod];
        } else {
          isMethod = false;
          break;
        }
      }

      return isMethod ? (_nestedFakerMethod = nestedFakerMethod).call.apply(_nestedFakerMethod, [context].concat(_toConsumableArray(args))) : model.method;
    }
  }, {
    key: '_generateField',
    value: function _generateField(name, method, fixture, dataModel, generatedFixtures) {
      if (name === 'props') {
        console.log(method);
      }

      var fieldModel = this._parseFieldModel(method);

      var count = 1;
      var field = undefined;

      this.emit('field:pre', {
        name: name,
        model: fieldModel
      });

      if (name === 'props') {
        console.log(fieldModel.method);
      }

      if (!(0, _lodash.isNull)(fieldModel.method)) {
        switch (typeof fieldModel.method) {
          case 'function':
            field = this._handleFunction(fieldModel, fixture, dataModel);
            break;

          case 'string':
            field = this._handleString(fieldModel);
            break;

          case 'number':
          case 'boolean':
            field = fieldModel.method;
            break;

          // method is an object so just return it
          default:
            var wasArray = (0, _lodash.isArray)(fieldModel.method);

            if (wasArray) {
              count = fieldModel.method[1] || 1;
            } else {
              fieldModel.method = [fieldModel.method];
            }

            field = this.generate.apply(this, _toConsumableArray(fieldModel.method));

            if (!wasArray && count === 1) {
              field = field[0];
            }
        }
      } else {
        field = fieldModel.method;
      }

      this.emit('field', {
        name: name,
        value: field,
        model: fieldModel
      });

      return field;
    }
  }, {
    key: '_generateFixture',
    value: function _generateFixture(context, properties, generatedFixtures) {
      var _this = this;

      if (properties === undefined) properties = {};

      // check if raw model definition was passed or should we fetch it from the registered ones
      var dataModel = (0, _lodash.isObject)(context) ? context : this.dataModels[context] || {};
      var fixture = {};
      var fieldGenerators = {};

      var name = (0, _lodash.isObject)(context) ? void 0 : context;

      // if user passed additional properties extend the dataModel with them
      dataModel = (0, _lodash.extend)({}, dataModel, properties);

      this.emit('fixture:pre', {
        dataModel: dataModel,
        name: name,
        properties: properties,
        generatedFixtures: generatedFixtures
      });

      (0, _lodash.each)(dataModel, function (value, key) {
        var functionBased = (0, _lodash.isFunction)(value) || (0, _lodash.isFunction)((0, _lodash.get)(value, 'method'));

        // if field has a generator function assigned to it, cache it for later
        if (!functionBased) {
          fixture[key] = _this._generateField(key, value, fixture, dataModel, generatedFixtures);
        } else {
          fieldGenerators[key] = value;
        }
      });

      (0, _lodash.each)(fieldGenerators, function (fieldGenerator, key) {
        fixture[key] = _this._generateField(key, fieldGenerator, fixture, dataModel, generatedFixtures);
      });

      this.emit('fixture', {
        fixture: fixture,
        name: name,
        properties: properties,
        generatedFixtures: generatedFixtures
      });

      return fixture;
    }

    //api

  }, {
    key: 'noConflict',
    value: function noConflict() {
      return new FixtureFactory();
    }
  }, {
    key: 'getGenerator',
    value: function getGenerator(key) {
      var _this2 = this;

      return {
        generate: function generate() {
          for (var _len = arguments.length, args = Array(_len), _key = 0; _key < _len; _key++) {
            args[_key] = arguments[_key];
          }

          return _this2.generate.apply(_this2, [key].concat(args));
        },
        generateOne: function generateOne() {
          for (var _len2 = arguments.length, args = Array(_len2), _key2 = 0; _key2 < _len2; _key2++) {
            args[_key2] = arguments[_key2];
          }

          return _this2.generateOne.apply(_this2, [key].concat(args));
        }
      };
    }
  }, {
    key: 'register',
    value: function register(key, dataModel) {
      var models = {};
      var isString = typeof key === 'string';

      //either user is passing k
      if (isString) {
        models[key] = dataModel;
      } else {
        models = key;
      }

      (0, _lodash.extend)(this.dataModels, models);

      this.emit('registered', models);

      return this;
    }
  }, {
    key: 'reset',
    value: function reset() {
      this.unregister();
    }
  }, {
    key: 'unregister',
    value: function unregister(key) {
      if (key) {
        delete this.dataModels[key];
        this.emit('unregistered', [key]);
      } else {
        this.emit('unregistered', Object.keys(this.dataModels));
        this.dataModels = {};
      }

      return this;
    }
  }, {
    key: 'generateOne',
    value: function generateOne(context, properties) {
      var fixture = this.generate(context, 1, properties)[0];

      return fixture;
    }
  }, {
    key: 'generate',
    value: function generate(context, count, properties) {
      if (count === undefined) count = 1;

      // make dev life easier and allow the to call
      // generate(context, properties)
      if ((0, _lodash.isObject)(count)) {
        properties = count;
        count = 1;
      }

      var fixtures = [];

      while (fixtures.length < count) {
        fixtures.push(this._generateFixture(context, properties, fixtures));
      }

      return fixtures;
    }
  }]);

  return FixtureFactory;
})(_events.EventEmitter);

exports['default'] = new FixtureFactory();
module.exports = exports['default'];