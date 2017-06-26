import {isArray, extend, isString} from 'lodash';

export default class ReferencePlugin {

  constructor(fixtureFactory) {
    this.fixtureFactory = fixtureFactory;
    this.fixtureFactoryWillGenerateField = this.fixtureFactoryWillGenerateField.bind(this);
    this.enable();
  }

  //internals, stuff

  _transform(model, split) {

    const {dataModels: models} = this.fixtureFactory;

    model.method = models[split[1]];

    if (split.length === 2) {
      if (model.reference && model.reference.properties) {
        model.method = extend(
          model.method,
          model.reference.properties
        );
      }
    } else {
      model.method = models[split[1]][split[2]];
    }

    return model;
  }

  //api

  fixtureFactoryWillGenerateField(event) {
    let {model} = event;

    if (isString(model.method) && model.method.indexOf('model.') === 0) {
      model = this._transform(model, model.method.split('.'));
    } else if (isArray(model.method)) {
      model.method[0] = this.fixtureFactoryWillGenerateField({
        model: {
          method: model.method[0]
        }
      }).method;
    }

    return model;
  }

  enable() {
    this.fixtureFactory.on('field:pre', this.fixtureFactoryWillGenerateField);
  }

  disable() {
    this.fixtureFactory.removeListener('field:pre', this.fixtureFactoryWillGenerateField);
  }

}
