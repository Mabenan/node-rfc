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

const rfcClient = require('./noderfc').Client;
const abapSystem = require('./abapSystem')();

const should = require('should');
const Promise = require('bluebird');

const CONNECTIONS = 50;

describe('Concurrency promises', function() {
    this.timeout(15000);

    let client = new rfcClient(abapSystem);

    beforeEach(function(done) {
        client.reopen(() => {
            done();
        });
    });
    
    afterEach(function(done) {
        client.close(() => {
            done();
        });
    });
    const REQUTEXT = 'Hellö SÄP!';

    it('call() should not block', function(done) {
        let asyncRes;
        let REQUTEXT = 'Hello SAP!';
        client
            .call('STFC_CONNECTION', { REQUTEXT: REQUTEXT })
            .then(res => {
                res.should.be.an.Object();
                res.should.have.property('ECHOTEXT');
                res.ECHOTEXT.should.startWith(REQUTEXT);
                asyncRes = res;
                done();
            })
            .catch(err => {
                return done(err);
            });
        should.not.exist(asyncRes);
    });

    it(`concurrency: ${CONNECTIONS} parallel connections call()`, function(done) {
        let TEXT = '';
        let callbackCount = 0;
        for (let i = 0; i < CONNECTIONS; i++) {
            new rfcClient(abapSystem)
                .open()
                .then(c => {
                    c.call('STFC_CONNECTION', { REQUTEXT: TEXT + c.id })
                        .then(res => {
                            should.exist(res);
                            res.should.be.an.Object();
                            res.should.have.property('ECHOTEXT');
                            res.ECHOTEXT.should.startWith(TEXT + c.id);
                            c.close();
                            if (++callbackCount === CONNECTIONS) done();
                        })
                        .catch(err => {
                            done(err);
                        });
                })
                .catch(err => {
                    done(err);
                });
        }
    });

    it(`concurrency: ${CONNECTIONS} sequential call() calls, using single connection`, function(done) {
        let promises = [];
        for (let counter = 0; counter < CONNECTIONS; counter++) {
            promises.push(
                client
                    .call('STFC_CONNECTION', { REQUTEXT: REQUTEXT + counter })
                    .then(res => {
                        should.exist(res);
                        res.should.be.an.Object();
                        res.should.have.property('ECHOTEXT');
                        res.ECHOTEXT.should.startWith(REQUTEXT + counter);
                    })
                    .catch(err => {
                        return err;
                    })
            );
        }
        Promise.all(promises)
            .then(() => {
                done();
            })
            .catch(err => {
                done(err);
            });
    });

    it(`concurrency: ${CONNECTIONS} recursive call() calls using single connection`, function(done) {
        function rec(depth) {
            if (depth < CONNECTIONS) {
                client
                    .call('STFC_CONNECTION', { REQUTEXT: REQUTEXT + depth })
                    .then(res => {
                        should.exist(res);
                        res.should.be.an.Object();
                        res.should.have.property('ECHOTEXT');
                        res.ECHOTEXT.should.startWith(REQUTEXT + depth);
                        rec(depth + 1);
                    })
                    .catch(err => {
                        return done(err);
                    });
            } else {
                return done();
            }
        }
        rec(1);
    });
});