var fs = require('fs');
var path = require('path');
var sie = require('sie-reader');
var ms = {
	/* overridables */
	recache: function(file) { 		
		console.log('Re-caching ' + file);
		ms.service(null, file);
	},
	servicing: function(service) { 
		console.log('Started servicing ' + service);
	},
	authorize: function(req, res, next) {
		next();
	},
	/* publish services for file */
	service: function(app, file) {
		sie.readFile(file, function(err, so){
			if (!err) {
				if (!msi.cache[file] && app) {
					var service = encodeURI(path.basename(file));
					app.get('/' + service + '/verifikationer', ms.authorize, function(req, res, next){
						try {
							var so = msi.cache[file];
							var header = {};
							['fnamn', 'orgnr', 'ftyp', 'kptyp', 'kptyp', 'taxar', 'valuta'].forEach(function (i) { msi.shallowAdd(header,  so.list(i)[0] ); });
							msi.shallowAdd(header, so.list('gen')[0], 'gen');
							var out = [];
							var verifikationer = so.list('ver');
							for (var v in verifikationer) {
								out[out.length] = msi.shallowAdd(msi.shallowAdd({}, verifikationer[v]), header);
							}
							res.json(out);
						} catch(err) {
							next(err);
						}
					});
					app.get('/' + service + '/transaktioner',  ms.authorize, function(req, res, next){
						try {
							var so = msi.cache[file];
							var ver = so.list('ver', 'serie', req.param('serie'), 'vernr', req.param('vernr'))[0];					
							var out = [];						
							for (var t in ver.poster) {
								var transaktion =  msi.shallowAdd({ "index": t }, ver.poster[t]);						
								if (transaktion.kontonr) msi.shallowAdd(transaktion, so.getKonto(transaktion.kontonr));
								out[out.length] = transaktion;
							}
							res.json(out);					
						} catch(err) {
							next(err);
						}
					});
					app.get('/' + service + '/objektlista',  ms.authorize, function(req, res, next){
						try {
							var so = msi.cache[file];
							var trans = so.list('ver', 'serie', req.param('serie'), 'vernr', req.param('vernr'))[0].poster[req.param('index')];					
							var out = [];						
							for (var o in trans.objektlista) {
								out[out.length] = msi.shallowAdd({}, so.getObjekt(trans.objektlista[o].dimensionsnr, trans.objektlista[o].objektnr));
							}
							res.json(out);					
						} catch(err) {					
							next(err);
						}
					});
					ms.servicing(service);
				}
				msi.cache[file] = so;				
			}
		});
		fs.exists(file, function(exists) {
			if (exists) {
				if (!msi.watch[file]) {
					msi.watch[file] = file;
					fs.watch(file, function(event, filename) {
						ms.recache(file);
					}); 
				}
			}
		});
	}
};
var msi = {
	watch: {},
	cache: {},
	shallowAdd: function(t, s, p) {
		t = t || {};
		p = p || '';
		if (s) {
			for (var m in s) {
				if (m != 'etikett' && typeof(s[m]) != 'object') {
					t[p+m] = s[m];
				}
			}
		}
		return t;
	}
};
module.exports = ms;