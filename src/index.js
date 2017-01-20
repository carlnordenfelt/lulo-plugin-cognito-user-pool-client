'use strict';

var aws = require('aws-sdk');
var cognitoIdentityServiceProvider = new aws.CognitoIdentityServiceProvider({ apiVersion: '2016-04-18' });

var pub = {};

pub.schema = {
    GenerateSecret: { type: 'boolean' },
    RefreshTokenValidity: { type: 'integer' }
};

pub.validate = function (event) {
    if (!event.ResourceProperties.UserPoolId) {
        throw new Error('Missing required property UserPoolId');
    }
    if (!event.ResourceProperties.ClientName) {
        throw new Error('Missing required property ClientName');
    }
};

pub.create = function (event, _context, callback) {
    var params = event.ResourceProperties;
    delete params.ServiceToken;
    cognitoIdentityServiceProvider.createUserPoolClient(params, function (error, response) {
        if (error) {
            return callback(error);
        }
        var data = {
            physicalResourceId: response.UserPoolClient.ClientId,
            ClientSecret: response.UserPoolClient.ClientSecret
        };
        callback(null, data);
    });
};

pub.update = function (event, _context, callback) {
    var params = event.ResourceProperties;
    delete params.ServiceToken;
    delete params.GenerateSecret;
    params.ClientId = event.PhysicalResourceId;
    cognitoIdentityServiceProvider.updateUserPoolClient(params, function (error, response) {
        if (error) {
            return callback(error);
        }
        var data = {
            physicalResourceId: response.UserPoolClient.ClientId,
            ClientSecret: response.UserPoolClient.ClientSecret
        };
        callback(null, data);
    });
};

pub.delete = function (event, _context, callback) {
    if (!/^[\w+]+$/.test(event.PhysicalResourceId)) {
        return callback();
    }

    var params = {
        ClientId: event.PhysicalResourceId,
        UserPoolId: event.ResourceProperties.UserPoolId
    };
    cognitoIdentityServiceProvider.deleteUserPoolClient(params, function (error) {
        if (error && error.code !== 'ResourceNotFoundException') {
            return callback(error);
        }
        callback();
    });
};

module.exports = pub;
