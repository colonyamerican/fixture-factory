'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

var _lodash = require('lodash');

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

var ReferencePlugin = function () {
  function ReferencePlugin(fixtureFactory) {
    var _this = this;

    _classCallCheck(this, ReferencePlugin);

    this.fixtureFactoryWillGenerateField = function (event) {
      var model = event.model;

      var isRef = (0, _lodash.isString)(model.method) && model.method.indexOf('model') === 0;
      var split;

      if (isRef) {
        split = model.method.split('.');
        if (split[0] === 'model') {
          model = _this._transform(model, split);
        }
      }
    };

    this.fixtureFactory = fixtureFactory;
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
}();

exports.default = ReferencePlugin;