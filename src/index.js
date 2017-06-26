import faker from 'faker';
import {
  extend,
  isObject,
  isFunction,
  cloneDeep,
  isArray,
  isNull,
  each,
  get
} from 'lodash';
import {EventEmitter} from 'events';
import {Reference} from './plugins';

class FixtureFactory extends EventEmitter {

  dataModels = {}
  plugins = {}

  constructor() {
    super();
    this.plugins.reference = new Reference(this);
  }

  //generators, internals, stuff

  _parseFieldModel(method) {
    //check if passed method is a shorthhand, if yes parse it to proper field model
    const isProperFieldModel = !isFunction(method) && isObject(method) && method.method;
    return cloneDeep(isProperFieldModel ? method : { method: method });
  }

  _handleFunction(model, fixture, dataModel) {
    return model.method.call(
      null,
      fixture,
      model.args || model.options || {},
      dataModel,
      faker
    );
  }

  _handleString(model) {

    let callStack = model.method.split('.');
    let nestedFakerMethod = faker;
    let isMethod = true;
    let args = model.args || [];
    let options = model.options ? cloneDeep(model.options) : void 0;
    let nextMethod;
    let context;

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

    return isMethod ? nestedFakerMethod.call(context, ...args) : model.method;
  }

  _generateField(name, method, fixture, dataModel, generatedFixtures) {
    const fieldModel = this._parseFieldModel(method);

    let count = 1;
    let field;

    this.emit('field:pre', {
      name,
      model: fieldModel
    });

    if (! isNull(fieldModel.method)) {
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
        default :
          const wasArray = isArray(fieldModel.method);

          if (wasArray) {
            count = fieldModel.method[1] || 1;
          } else {
            fieldModel.method = [fieldModel.method];
          }

          field = this.generate(...fieldModel.method);

          if (! wasArray && count === 1) {
            field = field[0];
          }
      }
    } else {
      field = fieldModel.method;
    }

    this.emit('field', {
      name,
      value: field,
      model: fieldModel
    });

    return field;
  }

  _generateFixture(context, properties = {}, generatedFixtures) {

    // check if raw model definition was passed or should we fetch it from the registered ones
    let dataModel = isObject(context) ? context : this.dataModels[context] || {};
    let fixture = {};
    let fieldGenerators = {};

    const name = isObject(context) ? void 0 : context;

    // if user passed additional properties extend the dataModel with them
    dataModel = extend({}, dataModel, properties);

    this.emit('fixture:pre', {
      dataModel,
      name,
      properties,
      generatedFixtures
    });

    each(dataModel, (value, key) => {
      const functionBased = isFunction(value) || isFunction(get(value, 'method'));

      // if field has a generator function assigned to it, cache it for later
      if (! functionBased) {
        fixture[key] = this._generateField(
          key,
          value,
          fixture,
          dataModel,
          generatedFixtures
        );
      } else {
        fieldGenerators[key] = value;
      }
    });

    each(fieldGenerators, (fieldGenerator, key) => {
      fixture[key] = this._generateField(
        key,
        fieldGenerator,
        fixture,
        dataModel,
        generatedFixtures
      );
    });

    this.emit('fixture', {
      fixture,
      name,
      properties,
      generatedFixtures
    });

    return fixture;
  }

  //api

  noConflict() {
    return new FixtureFactory();
  }

  getGenerator(key) {
    return {
      generate: (...args) => this.generate(key, ...args),
      generateOne: (...args) => this.generateOne(key, ...args)
    };
  }

  register(key, dataModel) {
    var models = {};
    var isString = typeof key === 'string';

    //either user is passing k
    if (isString) {
      models[key] = dataModel;
    } else {
      models = key;
    }

    extend(this.dataModels, models);

    this.emit('registered', models);

    return this;
  }

  reset() {
    this.unregister();
  }

  unregister(key) {
    if (key) {
      delete this.dataModels[key];
      this.emit('unregistered', [key]);
    } else {
      this.emit('unregistered', Object.keys(this.dataModels));
      this.dataModels = {};
    }

    return this;
  }

  generateOne(context, properties) {
    var fixture = this.generate(context, 1, properties)[0];

    return fixture;
  }

  generate(context, count = 1, properties) {
    // make dev life easier and allow the to call
    // generate(context, properties)
    if (isObject(count)) {
      properties = count;
      count = 1;
    }

    let fixtures = [];

    while (fixtures.length < count) {
      fixtures.push(this._generateFixture(context, properties, fixtures));
    }

    return fixtures;
  }

}

export default new FixtureFactory();
