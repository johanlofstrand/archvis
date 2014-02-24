var http = require('http')
  , express = require('express')
  , app = express()
  , port = process.env.PORT || 5001;

app.use(express.urlencoded());
app.use(express.json());   
app.use('/public', express.static(__dirname + '/public'));

var server = http.createServer(app);
server.listen(port);

var bbintegration = require("./bbintegration");

app.locals({
  title: 'Architecture visualization tool (node/express + d3)'
});

var purge_cache = true;
var bbfulldata;
var bbdata = bbfulldata;
var sonarnodes = 
[
	{"nodename":"svtlib-messagechannel","loc":"5"},
]

console.log('Web server started now..., listening on %d', port);


app.get('/',function(req,res) {
	bbinit(function(ready) {
		console.log("sending bbdata!");
		res.render("index.ejs",{bbdata:bbfulldata});
	});
})

app.get('/jsondata', function(req,res) {
	bbinit(function(ready) {
		res.render("jsondata.ejs",{bbdata:bbfulldata});
	});
})

/*------------------------------------------------------------*/
					/*RESTish api*/
/*------------------------------------------------------------*/

app.get('/module/:name', function(req,res) {
	var name = req.params.name;
	bbinit(function(ready) {
		res.render("index.ejs",{bbdata:filterData(name)});
	});
})

app.get('/modules', function(req,res) {
	var name = '^svtlib';
	bbinit(function(ready) {
		res.render("index.ejs",{bbdata:filterData(name)});
	});
})
/*------------------------------------------------------------*/

app.get('/refreshcache', function(req,res) {
	purge_cache=true;
	bbinit();
});


var filterData = function(filter) {
	console.log("Filter data with filter: " + filter);
	var keepers = new Array();
	filtering(filter,keepers);
	keepers = {"links":keepers, "sonarnodes":sonarnodes}
	return keepers;
}

var filtering = function(filter,keepers) {
	console.log("Filtering data with filter: " + filter);
	for(var key in bbfulldata.links){
    	var linkobj = bbfulldata.links[key];
    	if (linkobj['source'].match(filter)) {
    		//Add to array of keepers
    		console.log("[filtering] Keeping a node: " + filter);
    		keepers.push(linkobj);
    		var type = linkobj['type'];
    		if (type == 'dependency') {
    			var target = linkobj['target'];
    			filtering(target,keepers);
    		}
    	}
    }
	return keepers;
}

var bbinit = function(ready) {
	if (purge_cache) {
		bbintegration.bbInitiate(function(resp){
			bbfulldata = {"links":resp, "sonarnodes":sonarnodes}
			purge_cache = false;
			console.log("bbfulldata updated");
			ready();
		});
	}
	else {
		ready();
	}
}

