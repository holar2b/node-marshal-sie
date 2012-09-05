var assert = require('assert');
var path = require('path');
var http = require('http');
var ms = require('../marshal-sie.js');
var express = require('express');
// DRY
var port = 3000;
var host = '127.0.0.1';
// Server
var app = express();
app.listen(port, host);
ms.service(app, './test/test.SI');
// Client (test cases)
ms.servicing = function(service) {
	function options(op) {	
		return { host: host, port: port, path: '/' + service + '/' + op, method: 'GET' };
	}
	var reqVer = http.request(options('verifikationer'), function(resVer) {
		var data = [];
		resVer.setEncoding('utf8');
		resVer.on('data', function (chunk) {
			data[data.length] = chunk;
		});
		resVer.on('end', function() {
			assert.ok(resVer.statusCode == 200, '1.1 Service response: ' + resVer.statusCode);
			var vers = JSON.parse(data.join(''));
			assert.ok(vers.length == 2, '1.2 Failed to get verifications');
			assert.ok(vers[0].serie && vers[0].serie == 'A', '1.3 Failed to get serie');
			assert.ok(vers[0].vernr && vers[0].vernr == '1', '1.4 Failed to get vernr');
			var reqTrans = http.request(options('transaktioner?serie=' + vers[0].serie + '&vernr=' + vers[0].vernr), function(resTrans) {
				var data = [];
				resTrans.setEncoding('utf8');
				resTrans.on('data', function (chunk) {
					data[data.length] = chunk;
				});
				resTrans.on('end', function() {
					assert.ok(resTrans.statusCode == 200, '2.1 Service response: ' + resTrans.statusCode);
					var trans = JSON.parse(data.join(''));
					assert.ok(trans.length == 6, '2.2 Failed to get transactions');
					assert.ok(trans[0].kontonr && trans[0].kontonr == '1930', '2.3 Failed to get kontonr');
					assert.ok(trans[0].index && trans[0].index == '0', '2.4 Failed to get index');
					assert.ok(trans[0].kontotyp && trans[0].kontotyp == 'T', '2.5 Failed to get kontotyp');					
					var reqObj = http.request(options('objektlista?serie=' + vers[0].serie + '&vernr=' + vers[0].vernr + '&index=' + trans[0].index), function(resObj) {
						var data = [];
						resObj.setEncoding('utf8');
						resObj.on('data', function (chunk) {
							data[data.length] = chunk;
						});
						resObj.on('end', function() {
							assert.ok(resObj.statusCode == 200, '3.1 Service response: ' + resObj.statusCode);
							var objs = JSON.parse(data.join(''));
							assert.ok(objs.length == 1, '3.2 Failed to get object list');
							assert.ok(objs[0].objektnr && objs[0].objektnr == '0101', '3.3 Failed to get objektnr');
							assert.ok(objs[0].objektnamn && objs[0].objektnamn == 'Leverans', '3.4 Failed to get objektnamn');	
							console.log('Everything is OK');
							process.nextTick(process.exit);
							
						});
					});
					reqObj.on('error',function(err) { throw new Error('3 Connection error', err); });
					reqObj.end();											
				});
			});
			reqTrans.on('error',function(err) { throw new Error('2 Connection error', err); });
			reqTrans.end();			
		});
	});
	reqVer.on('error',function(err) { throw new Error('1 Connection error', err); });
	reqVer.end();
};
