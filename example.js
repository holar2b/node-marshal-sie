var express = require('express');
var ms = require('./marshal-sie.js');
var app = express();
ms.service(app, './test/test.SI');
app.listen(3000);

