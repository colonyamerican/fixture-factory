/* global beforeEach,afterEach */

// setup test env
import chai, {expect} from 'chai';
import _ from 'lodash';
import sinon from 'sinon';
import sinonChai from 'sinon-chai';
import chaiThings from 'chai-things';

chai.use(chaiThings);
chai.use(sinonChai);
chai.should();

// load things to test
import fixtureFactory from '../index.js';
import {Reference} from '../plugins';
import faker from 'faker';

let referencePlugin;

describe('Fixture Factory', function () {
  describe('Module', function () {
    it('should have a register method', function () {
      expect(fixtureFactory.register).to.be.a('function');
    });

    it('should have a generate method', function () {
      expect(fixtureFactory.generate).to.be.a('function');
    });

    it('should have a generateOne method', function () {
      expect(fixtureFactory.generateOne).to.be.a('function');
    });

    it('should have a unregister method', function () {
      expect(fixtureFactory.unregister).to.be.a('function');
    });

    it('should have a getGenerator method', function () {
      expect(fixtureFactory.getGenerator).to.be.a('function');
    });

    it('should register and return itself on register', function () {
      expect(fixtureFactory.register('..', {})).to.equal(fixtureFactory);
    });

  });

  describe('Reference Plugin', function () {

    before(function() {
      referencePlugin = new Reference(fixtureFactory);
    });

    after(function() {
      referencePlugin.disable();
    });

    it('should have a enable method', function () {
      expect(referencePlugin.enable).to.be.a('function');
    });

    it('should have a disable method', function () {
      expect(referencePlugin.disable).to.be.a('function');
    });

    describe('integration tests', function () {
      before(function () {
        var dataModel = {
          someField: 'name.firstName'
        };

        var dataModelWithFn = {
          someField() {
            return 'mam';
          }
        };

        var referencingModel = {
          addr: 'address.streetName',
          name: 'model.exampleModelWithFn.someField',
          data: 'model.exampleModel',
          props: {
            method: 'model.exampleModel',
            reference: {
              properties: {
                id: 'random.uuid'
              }
            }
          }
        };

        fixtureFactory.register('exampleModel', dataModel);
        fixtureFactory.register('exampleModelWithFn', dataModelWithFn);
        fixtureFactory.register('referencingModel', referencingModel);
      });

      after(function() {
        fixtureFactory.plugins.reference.enable();
      });

      it('should provide the ability to reference another model field', function () {
        var fixtures = fixtureFactory.generate('referencingModel', 20);

        expect(fixtures.length).to.equal(20);

        _.forEach(fixtures, function (fixture) {
          expect(fixture.props).to.be.a('object');
          expect(fixture.name).to.be.a('string');
        });
      });

      it('should provide the ability to pass properties to another model', function () {
        var fixture = fixtureFactory.generateOne('referencingModel');

        expect(fixture.props.id).to.exist;
        expect(fixture.props.id).to.be.a('string');
        expect(fixture.props.someField).to.be.a('string');
      });

      it('should provide the ability to reference another model', function () {
        var fixtures = fixtureFactory.generate('referencingModel', 20);

        expect(fixtures.length).to.equal(20);

        _.forEach(fixtures, function (fixture) {
          expect(fixture.data).to.be.a('object');
          expect(fixture.data.someField).to.be.a('string');
        });
      });

      it('should be able to be disabled', function () {
        referencePlugin.disable();
        fixtureFactory.plugins.reference.disable();
        var fixture = fixtureFactory.generateOne('referencingModel');
        expect(fixture.name).to.equal('model.exampleModelWithFn.someField');
        expect(fixture.data).to.equal('model.exampleModel');
      });
     });
  });

  describe('unit tests', function () {
    describe('register', function () {
      it('should return fixtureFactory service', function () {
        expect(fixtureFactory.register('..', {})).to.equal(fixtureFactory);
        fixtureFactory.unregister();
      });

      it('should register a single data model', function () {
        fixtureFactory.register('test', {});

        expect(fixtureFactory.dataModels.test).to.be.a('object');

        fixtureFactory.unregister();
      });

      it('should register multiple data models via object', function () {
        fixtureFactory.register({
          one: {},
          two: {}
        });

        expect(fixtureFactory.dataModels.one).to.be.a('object');
        expect(fixtureFactory.dataModels.two).to.be.a('object');

        fixtureFactory.unregister();
      });
    });

    describe('unregister', function () {
      it('should return fixtureFactory service', function () {
        expect(fixtureFactory.unregister()).to.equal(fixtureFactory);
      });

      it('should unregister a single data model', function () {
        fixtureFactory.register('test', {});
        fixtureFactory.register('test2', {});

        expect(fixtureFactory.dataModels.test).to.be.a('object');

        fixtureFactory.unregister('test');

        expect(fixtureFactory.dataModels).to.not.be.empty;

        expect(fixtureFactory.dataModels.test2).to.be.a('object');
      });

      it('should unregister all data models if called with no arguments', function () {
        fixtureFactory.register({
          one: {},
          two: {}
        });

        expect(fixtureFactory.dataModels.one).to.be.a('object');
        expect(fixtureFactory.dataModels.two).to.be.a('object');
        expect(fixtureFactory.dataModels).to.not.be.empty;

        fixtureFactory.unregister();

        expect(fixtureFactory.dataModels).to.be.empty;
      });
    });

    describe('getGenerator', function () {
      var sandbox;

      beforeEach(function() {
        sandbox = sinon.sandbox.create();
      });

      afterEach(function() {
        sandbox.restore();
      });

      it('should return object with delegated generate and generateOne functions', function () {

        fixtureFactory.register('testModel', {});
        fixtureFactory.register('testModel1', {});
        fixtureFactory.register('testModel2', {});
        fixtureFactory.register('testModel3', {});
        var testModelGenerator = fixtureFactory.getGenerator('testModel');

        expect(testModelGenerator.generate).to.be.a('function');
        expect(testModelGenerator.generateOne).to.be.a('function');

      });

      it('should return object that delegates to factory method using set key', function () {
        fixtureFactory.register('testModel', {});
        var testModelGenerator = fixtureFactory.getGenerator('testModel');

        sandbox.spy(fixtureFactory, 'generate');
        sandbox.spy(fixtureFactory, 'generateOne');
        testModelGenerator.generate();
        testModelGenerator.generateOne();
        expect(fixtureFactory.generate).to.have.been.calledWith('testModel');
        expect(fixtureFactory.generateOne).to.have.been.calledWith('testModel');

      });

    });

    describe('reset', function () {
      var sandbox;

      beforeEach(function() {
        sandbox = sinon.sandbox.create();
      });

      afterEach(function() {
        sandbox.restore();
      });

      it('should delegate to unregister', function () {
        sandbox.spy(fixtureFactory, 'unregister');
        fixtureFactory.reset();
        expect(fixtureFactory.unregister).to.have.been.called;
      });
    });
  });

  describe('integration tests', function () {
    var sandbox;

    beforeEach(function () {
      var dataModel = {
        someField: 'name.firstName'
      };

      var dataModelWithFn = {
        someField() {
          return 'mam';
        }
      };

      var referencingModel = {
        addr: 'address.streetName',
        name: 'model.exampleModel.someField',
        data: 'model.exampleModel'
      };

      fixtureFactory.register('exampleModel', dataModel);
      fixtureFactory.register('exampleModelWithFn', dataModelWithFn);
      fixtureFactory.register('referencingModel', referencingModel);

      sandbox = sinon.sandbox.create();
    });

    afterEach(function () {
      fixtureFactory.unregister();

      sandbox.restore();
    });

    it('should generate single fixture based on selected dataModel', function () {
      var fixture = fixtureFactory.generateOne('exampleModel');
      expect(fixture.someField).to.exist;
    });

    it('should generate single fixture based on provided dataModel object', function () {
      var fixture = fixtureFactory.generateOne({
        someField() {
          return 'mam';
        }
      });

      expect(fixture.someField).to.exist;
    });

    it('should generate array of fixtures based on selected dataModel', function () {
      var fixtures = fixtureFactory.generate('exampleModel', 10);
      expect(fixtures.length).to.equal(10);
      fixtures.should.all.have.property('someField');
    });

    it('should generate array of fixtures based on selected dataModel', function () {
      var fixtures = fixtureFactory.generate(
        {
          someField() {
            return 'mam';
          }
        },
        10
      );

      expect(fixtures.length).to.equal(10);
      fixtures.should.all.have.property('someField');
    });

    it('should default to 1 as a count when not specified for generate multiple', function () {
      var fixtures = fixtureFactory.generate('exampleModel');
      expect(fixtures.length).to.equal(1);
    });

    it('should allow to call generate without need to pass null in count', function () {
      var fixtures = fixtureFactory.generate('exampleModel', {
        someField: 'overwritenValue'
      });

      expect(fixtures[0].someField).to.equal('overwritenValue');

    });

    it('should delegate field generation to faker.js', function () {
      var spy = sandbox.spy(faker.name, 'firstName');
      fixtureFactory.generate('exampleModel', 10);
      expect(spy).to.have.callCount(10);
    });

    it('should overwrite field with provided values if present', function () {
      var fixtures = fixtureFactory.generate('exampleModel', 10, { someField: 'other value' });
      fixtures.should.all.have.property('someField', 'other value');
    });

    it('should add field with provided values if it is not present in dataModel', function () {
      var fixtures = fixtureFactory.generate('exampleModel', 10, { otherField: 'other value' });
      fixtures.should.all.have.property('someField');
      fixtures.should.all.have.property('otherField');
    });

    it('should use passed parser functions to process fixture output', function () {
      var fixture = fixtureFactory.generateOne('exampleModel', {
        lastName() {
          return 'sir';
        }
      });
      expect(fixture.lastName).to.equal('sir');
    });

    it('should use functions in data model to process fixture output', function () {
      var fixture = fixtureFactory.generateOne('exampleModelWithFn');
      expect(fixture.someField).to.equal('mam');
    });

    it('should use functions in properties to overwrite function in data model', function () {
      var fixture = fixtureFactory.generateOne('exampleModelWithFn', {
        someField() {
          return 'sir';
        }
      });

      expect(fixture.someField).to.equal('sir');
    });

    it('should process static properties before functions', function () {
      var fixture = fixtureFactory.generateOne({
        fullName(fixture) {
          expect(fixture).to.be.a('object');
          expect(fixture.firstName).to.be.a('string');
          expect(fixture.lastName).to.be.a('string');
          return fixture.firstName + ' ' + fixture.lastName;
        },
        firstName: 'name.firstName',
        lastName: 'name.lastName'
      });

      expect(fixture.fullName).to.equal(fixture.firstName + ' ' + fixture.lastName);
    });

    it('in case object is passed as context it should be used as model for generation',
    function () {
      var fixture = fixtureFactory.generateOne({ lastName: 'name.lastName' });
      expect(fixture.lastName).to.exist;
    });

    it('should generate single model with nested child model', function () {
      var fixture = fixtureFactory.generateOne({
        child: {
          firstName: 'name.firstName',
          lastName: 'name.lastName'
        }
      });

      expect(fixture.child.firstName).to.exist;
      expect(fixture.child.lastName).to.exist;
    });

    it('should generate single model with nested children array', function () {
      var fixture = fixtureFactory.generateOne({
        children: [{
            firstName: 'name.firstName',
            lastName: 'name.lastName'
          }, 10]
      });

      expect(fixture.children.length).to.equal(10);
      fixture.children.should.all.have.property('firstName');
      fixture.children.should.all.have.property('lastName');
    });

    it('should generate array if passed an array', function () {
      var fixture = fixtureFactory.generateOne({
        children: [{
            firstName: 'name.firstName',
            lastName: 'name.lastName'
          }, 1]
      });

      expect(fixture.children.length).to.equal(1);
      fixture.children.should.all.have.property('firstName');
      fixture.children.should.all.have.property('lastName');
    });

    it('should allow null to be passed as a value', function () {
      var fixture = fixtureFactory.generateOne({
        children: null
      });

      expect(fixture.children).to.equal(null);
    });

    it('Should parse references from arrays', function() {
      fixtureFactory.register('workItem', {
         date: 'date.past',
         company: 'company.companyName'
       });
       fixtureFactory.register('user', {
         firstName: 'name.firstName',
         lastName: 'name.lastName',
         work: ['model.workItem', 10]
       });

       const result = fixtureFactory.generateOne('user');
       expect(result.work).to.exist;
       expect(result.work.length).to.equal(10);
       result.work.should.all.have.property('date');
       result.work.should.all.have.property('company');
    });

    it('should preserve ability to generate function based fakes while using nested models',
       function () {
      var fixture = fixtureFactory.generateOne({
        child: {
          firstName() {
            return 'John';
          },
          lastName() {
            return 'Doe';
          }
        }
      });

      expect(fixture.child.firstName).to.equal('John');
      expect(fixture.child.lastName).to.equal('Doe');
    });

    it('should preserve string/function generation order while using nested models', function () {
      var fixture = fixtureFactory.generateOne({
        child: {
          fullName(fixture) {
            expect(fixture).to.be.a('object');
            expect(fixture.firstName).to.be.a('string');
            expect(fixture.lastName).to.be.a('string');
            return fixture.firstName + ' ' + fixture.lastName;
          },
          firstName: 'name.firstName',
          lastName: 'name.lastName'
        }
      });

      expect(fixture.child.fullName).to.equal(
        fixture.child.firstName + ' ' + fixture.child.lastName);
    });

    it('should generate single model with multiply nested child models', function () {
      var fixture = fixtureFactory.generateOne({
        child: {
          names: {
            firstName: 'name.firstName',
            secondName: 'name.firstName'
          },
          lastName: 'name.lastName'
        }
      });

      expect(fixture.child.names.firstName).to.exist;
      expect(fixture.child.names.secondName).to.exist;
      expect(fixture.child.lastName).to.exist;
    });

    it('faker', function(done) {
      done();
    });

  });
});
