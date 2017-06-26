'use strict';

Object.defineProperty(exports, '__esModule', {
  value: true
});

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _lodash = require('lodash');

var ReferencePlugin = (function () {
  function ReferencePlugin(fixtureFactory) {
    _classCallCheck(this, ReferencePlugin);

    this.fixtureFactory = fixtureFactory;
    this.fixtureFactoryWillGenerateField = this.fixtureFactoryWillGenerateField.bind(this);
    this.enable();
  }

  //internals, stuff

  _createClass(ReferencePlugin, [{
    key: '_transform',
    value: function _transform(model, split) {
      var models = this.fixtureFactory.dataModels;

      model.method = models[split[1]];

      if (split.length === 2) {
        if (model.reference && model.reference.properties) {
          model.method = (0, _lodash.extend)(model.method, model.reference.properties);
        }
      } else {
        model.method = models[split[1]][split[2]];
      }

      return model;
    }

    //api

  }, {
    key: 'fixtureFactoryWillGenerateField',
    value: function fixtureFactoryWillGenerateField(event) {
      var model = event.model;

      if ((0, _lodash.isString)(model.method) && model.method.indexOf('model.') === 0) {
        model = this._transform(model, model.method.split('.'));
      } else if ((0, _lodash.isArray)(model.method)) {
        model.method[0] = this.fixtureFactoryWillGenerateField({
          model: {
            method: model.method[0]
          }
        }).method;
      }

      return model;
    }
  }, {
    key: 'enable',
    value: function enable() {
      this.fixtureFactory.on('field:pre', this.fixtureFactoryWillGenerateField);
    }
  }, {
    key: 'disable',
    value: function disable() {
      this.fixtureFactory.removeListener('field:pre', this.fixtureFactoryWillGenerateField);
    }
  }]);

  return ReferencePlugin;
})();

exports['default'] = ReferencePlugin;
module.exports = exports['default'];