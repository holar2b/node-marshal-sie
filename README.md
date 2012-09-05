*This documentation is in swedish since [SIE](http://www.sie.se/sie/home/showpage.php?page=english) is a local standard for transferring accounting information.* 

# Marshal-SIE webbtjänst
Marshal-SIE är en ramverk för att publicera SIE-filer i tabellform. 

Tjänsten gör om SIE-filen till tre tabeller. En med verifikationstabell, en tabell med transaktioner per verifikation och en med objekten för en transaktion. Varje tabell är kompletterad med relevanta uppgifter ur SIE-filens kontoplan och objektsregister.

Vårt primära syftet är tillåta skörd (*"harvesting"*) av SIE-filer m.h.a. [Marshal](http://www.risetobloome.com/Page_1_S_NodeListing.aspx?item=1830) men tjänsten är helt generell och kan användas i alla miljöer som hanterar JSON. 

## Innehåll

- [Installation](#ins)
- [Implementera din tjänst](#imp)
- [Hur man använder tjänsten](#use)
- [Licensvillkor](#lic)

<a name="ins"></a>
## Installation

```bash
$ npm install marshal-sie
```

<a name="imp"></a>
## Implementera din tjänst
Marshal-SIE är ett ramverk. Du måste tillhandahålla den källkod som avgör vilka SIE-filer som faktiskt ska publiceras samt startar tjänsten. 

Ramverket implementerar en enda metod ```service``` som du anropar för varje SIE-fil som ska publiceras. Metoden läser in SIE-filen (krävs av prestandaskäl) samt skapar de tre tjänsterna. Metoden skapar dessutom en *"lyssnare"* som laddar om filen av den händelse att den ändras efter publicering. 

Första argumentet till ```service``` är en [express](http://expressjs.com/guide.html)-applikation. Du behöver därför inkludera express i din lösning.

```bash
$ npm install express
``` 

Nedanstående exempel implementerar en tjänst som publicerar två filer.

```js
var express = require('express');
var ms = require('marshal-sie');
var app = express();
ms.service(app, './data/FAKT.SI');
ms.service(app, './data/BOKF2011.SI');
app.listen(3000);
```

Om tjänsten är tillgänglig i ett nätverk där inte samtliga användare är betrodda att ta del av information bör användaren auktoriseras. Detta sker genom att *överrida* metoden ```authorize```, se exempel nedan. 

```js
ms.authorize = function(req, res, next) { 
	if (yourCodeDecidesAuthorizationIsOK) 
		next();
	else res.send(401);
}
```

Marshal-SIE är oberoende av hur auktoriseringen utförs. För att implementera en lösning kan du t.ex. använda ramverket [Passportjs](http://passportjs.org/).

<a name="use"></a>
## Hur man använder tjänsten
Marshal-SIE ger s.k. ReST-tjänster som returnerar JSON-objekt och som är åtkomliga från alla moderna programmeringsmiljöer och direkt körbara i en webbläsare.

För varje publicerad SIE-fil skapas de tre tjänsterna *verifikationer*, *transaktioner* och *objektlista*. Följande URL:er visar hur du når de tjänsterna för filen ```./data/FAKT.SI``` i exemplet ovan.

	http://<ipaddr>:3000/FAKT.SI/verifikationer

Listar samtliga verifikationer i filen. En verfikation motsvarar en ```#VER```-post i SIE-filen men inkluderar även SIE-filens globala data, t.ex. företagsnamn, orgnr och kontoplanstyp.

	http://<ipaddr>:3000/FAKT.SI/transaktioner?serie=<serie>&vernr=<vernr>

Listar transaktionerna för en viss verifikation. Värdena på argumenten ```serie``` och ```vernr``` fås genom hämtning av verifikationerna. Varje transaktion motsvarar en transaktionsrad (```#TRANS```, ```#BTRANS```, ```#RTRANS```). Dessutom har utökad information om det konto som berörs av transkationen hämtats ur SIE-filens kontoplan, t.ex. kontonamn, kontotyp och SRU-kod.

	http://<ipaddr>:3000/FAKT.SI/objektlista?serie=<serie>&vernr=<vernr>&index=<index>

Listar objekten hörande till en viss transaktion. Argumentet ```index``` avser transaktionens position i verfikationens transaktionslista. Första ```index``` är noll (0). För varje objekt i objektlistan har tjänsten även hämtat objektnamn och fullständig namn ur SIE-filens objektregister.

**OBS!** URL:en innehåller den publicerade filens namn, inte dess fullständiga sökväg. Namnet måste vara URL-kodat. Detta innebär t.ex. att filen ```min fil.SI``` ger en URL enligt ```http://<ipaddr>:3000/min%20fil.SI/verifikationer```,  se [encodeURI](http://www.w3schools.com/tags/ref_urlencode.asp) för kodtabell.

<a name="lic"></a>
## Licensvillkor (MIT)
Copyright (C) 2012 R2B Software [http://www.r2bsoftware.com](http://www.r2bsoftware.com)

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.