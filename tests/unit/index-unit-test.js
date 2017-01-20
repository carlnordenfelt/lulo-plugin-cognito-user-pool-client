'use strict';

var expect = require('chai').expect;
var mockery = require('mockery');
var sinon = require('sinon');

describe('Index unit tests', function () {
    var subject;
    var createUserPoolClientStub = sinon.stub();
    var updateUserPoolClientStub = sinon.stub();
    var deleteUserPoolClientStub = sinon.stub();
    var event;

    before(function () {
        mockery.enable({
            useCleanCache: true,
            warnOnUnregistered: false
        });

        var awsSdkStub = {
            CognitoIdentityServiceProvider: function () {
                this.createUserPoolClient = createUserPoolClientStub;
                this.updateUserPoolClient = updateUserPoolClientStub;
                this.deleteUserPoolClient = deleteUserPoolClientStub;
            }
        };

        mockery.registerMock('aws-sdk', awsSdkStub);
        subject = require('../../src/index');
    });
    beforeEach(function () {
        createUserPoolClientStub.reset().resetBehavior();
        createUserPoolClientStub.yields(null, { UserPoolClient: { ClientId: 'ClientId', ClientSecret: 'ClientSecret' } });
        updateUserPoolClientStub.reset().resetBehavior();
        updateUserPoolClientStub.yields(null, { UserPoolClient: { ClientId: 'ClientId', ClientSecret: 'ClientSecret' } });
        deleteUserPoolClientStub.reset().resetBehavior();
        deleteUserPoolClientStub.yields();
        event = {
            ResourceProperties: {
                UserPoolId: 'eu-west-1_EXAMPLE',
                ClientName:'ClientName'
            }
        };
    });
    after(function () {
        mockery.deregisterAll();
        mockery.disable();
    });

    describe('validate', function () {
        it('should succeed', function (done) {
            subject.validate(event);
            done();
        });
        it('should fail if UserPoolId is not set', function (done) {
            delete event.ResourceProperties.UserPoolId;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property UserPoolId/);
            done();
        });
        it('should fail if ClientName is not set', function (done) {
            delete event.ResourceProperties.ClientName;
            function fn () {
                subject.validate(event);
            }
            expect(fn).to.throw(/Missing required property ClientName/);
            done();
        });
    });

    describe('create', function () {
        it('should succeed', function (done) {
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(createUserPoolClientStub.calledOnce).to.equal(true);
                expect(updateUserPoolClientStub.called).to.equal(false);
                expect(deleteUserPoolClientStub.called).to.equal(false);
                expect(response.physicalResourceId).to.equal('ClientId');
                expect(response.ClientSecret).to.equal('ClientSecret');
                done();
            });
        });
        it('should fail due to createUserPoolClient error', function (done) {
            createUserPoolClientStub.yields('createUserPoolClient');
            subject.create(event, {}, function (error, response) {
                expect(error).to.equal('createUserPoolClient');
                expect(createUserPoolClientStub.calledOnce).to.equal(true);
                expect(updateUserPoolClientStub.called).to.equal(false);
                expect(deleteUserPoolClientStub.called).to.equal(false);
                expect(response).to.equal(undefined);
                done();
            });
        });
    });

    describe('update', function () {
        it('should succeed ', function (done) {
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal(null);
                expect(updateUserPoolClientStub.calledOnce).to.equal(true);
                expect(createUserPoolClientStub.called).to.equal(false);
                expect(deleteUserPoolClientStub.called).to.equal(false);
                expect(response.physicalResourceId).to.equal('ClientId');
                expect(response.ClientSecret).to.equal('ClientSecret');
                done();
            });
        });
        it('should fail due to updateUserPoolClientError error', function (done) {
            updateUserPoolClientStub.yields('updateUserPoolClientError');
            subject.update(event, {}, function (error, response) {
                expect(error).to.equal('updateUserPoolClientError');
                expect(updateUserPoolClientStub.calledOnce).to.equal(true);
                expect(createUserPoolClientStub.called).to.equal(false);
                expect(deleteUserPoolClientStub.called).to.equal(false);
                expect(response).to.equal(undefined);
                done();
            });
        });
    });

    describe('delete', function () {
        it('should succeed', function (done) {
            event.PhysicalResourceId = 'asdfghjkl1234567890ASDF';
            subject.delete(event, {}, function (error) {
                expect(error).to.equal(undefined);
                expect(deleteUserPoolClientStub.calledOnce).to.equal(true);
                expect(createUserPoolClientStub.called).to.equal(false);
                expect(updateUserPoolClientStub.called).to.equal(false);
                done();
            });
        });
        it('should success but do nothing is the ClientID is invalid', function (done) {
            event.PhysicalResourceId = '2017/01/02/[$LATEST]f4d6fcbd3b2d4571a8df16834112cd96';
            subject.delete(event, {}, function (error) {
                expect(error).to.equal(undefined);
                expect(deleteUserPoolClientStub.called).to.equal(false);
                expect(createUserPoolClientStub.called).to.equal(false);
                expect(updateUserPoolClientStub.called).to.equal(false);
                done();
            });
        });
        it('should fail due to deleteUserPoolClientError error', function (done) {
            event.PhysicalResourceId = 'asdfghjkl1234567890ASDF';
            deleteUserPoolClientStub.yields('deleteUserPoolClientError');
            subject.delete(event, {}, function (error) {
                expect(error).to.equal('deleteUserPoolClientError');
                expect(deleteUserPoolClientStub.calledOnce).to.equal(true);
                expect(createUserPoolClientStub.called).to.equal(false);
                expect(updateUserPoolClientStub.called).to.equal(false);
                done();
            });
        });

        it('should not fail due to deleteUserPoolClient error', function (done) {
            event.PhysicalResourceId = 'asdfghjkl1234567890ASDF';
            deleteUserPoolClientStub.yields({ code: 'ResourceNotFoundException' });
            subject.delete(event, {}, function (error) {
                expect(error).to.equal(undefined);
                expect(deleteUserPoolClientStub.calledOnce).to.equal(true);
                expect(createUserPoolClientStub.called).to.equal(false);
                expect(updateUserPoolClientStub.called).to.equal(false);
                done();
            });
        });
    });
});
