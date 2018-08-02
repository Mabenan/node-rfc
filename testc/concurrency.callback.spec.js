// Copyright 2014 SAP AG.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
// http: //www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing,
// software distributed under the License is distributed on an
// "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND,
// either express or implied. See the License for the specific
// language governing permissions and limitations under the License.

'use strict';

const should = require('should');

const rfcClient = require('../test/noderfc').Client;
const abapSystem = require('../test/abapSystem')();

const CONNECTIONS = require('./config').connections;

describe('Concurrency callbacks', function() {
    this.timeout(15000);

    let client = new rfcClient(abapSystem);

    beforeEach(function(done) {
        client.reopen(err => {
            done(err);
        });
    });

    afterEach(function(done) {
        client.close(() => {
            done();
        });
    });

    it('concurrency: invoke() should not block', function(done) {
        let asyncRes;
        client.invoke('BAPI_USER_GET_DETAIL', { USERNAME: 'DEMO' }, function(err, res) {
            if (err) return done(err);
            res.should.be.an.Object();
            res.should.have.properties('RETURN');
            res.RETURN.should.be.an.Array();
            res.RETURN.length.should.equal(0);
            asyncRes = res;
            done();
        });
        should.not.exist(asyncRes);
    });

    it(`concurrency: ${CONNECTIONS} connections invoke() in parallel`, function(done) {
        let callbackCount = 0;
        for (let i = 0; i < CONNECTIONS; i++) {
            let c = new rfcClient(abapSystem);
            c.connect(err => {
                if (err) return done(err);
                client.invoke('BAPI_USER_GET_DETAIL', { USERNAME: 'DEMO' }, function(err, res) {
                    if (err) return done(err);
                    res.should.be.an.Object();
                    res.should.have.properties('RETURN');
                    res.RETURN.should.be.an.Array();
                    res.RETURN.length.should.equal(0);
                    c.close(() => {
                        if (++callbackCount === CONNECTIONS) done();
                    });
                });
            });
        }
    });

    it(`concurrency: ${CONNECTIONS} concurrent invoke() calls using single connection`, function(done) {
        let callbackCount = 0;
        for (let count = 0; count < CONNECTIONS; count++) {
            client.invoke('BAPI_USER_GET_DETAIL', { USERNAME: 'XDEMO' + client.id }, function(err, res) {
                if (err) return done(err);
                res.should.be.an.Object();
                res.should.have.properties('RETURN');
                res.RETURN.should.be.an.Array();
                res.RETURN.length.should.equal(1);
                res.RETURN[0].should.have.properties({
                    TYPE: 'E',
                    ID: '01',
                    NUMBER: '124',
                    MESSAGE: `User XDEMO${client.id} does not exist`,
                    MESSAGE_V1: `XDEMO${client.id}`,
                    ROW: 0,
                    FIELD: 'BNAME',
                });
                if (++callbackCount === CONNECTIONS) done();
            });
        }
    });

    it(`concurrency: ${CONNECTIONS} recursive invoke() calls using single connection`, function(done) {
        let callbackCount = 0;
        function call(count) {
            client.invoke('BAPI_USER_GET_DETAIL', { USERNAME: 'XDEMO' + count }, function(err, res) {
                if (err) return done(err);
                res.should.be.an.Object();
                res.should.have.properties('RETURN');
                res.RETURN.should.be.an.Array();
                res.RETURN.length.should.equal(1);
                res.RETURN[0].should.have.properties({
                    TYPE: 'E',
                    ID: '01',
                    NUMBER: '124',
                    MESSAGE: `User XDEMO${count} does not exist`,
                    MESSAGE_V1: `XDEMO${count}`,
                    ROW: 0,
                    FIELD: 'BNAME',
                });
                if (++callbackCount == CONNECTIONS) {
                    done();
                } else {
                    call(callbackCount);
                }
            });
        }
        call(callbackCount);
    });
});