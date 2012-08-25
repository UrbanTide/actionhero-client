var vows = require('vows');
var assert = require('assert');
var suite = vows.describe('actionHero Client');

var api = null;
var A = require("./actionhero_client.js").actionhero_client;
var connectionParams = {
	host: "0.0.0.0",
	port: "8000",
};

// Create an actionHero server on testing ports
var startServer = function(next){
	var actionHero = require("actionHero").actionHero;
	var params = {};
	params.configChanges = {
		general: {
			workers: 1
		},
		log: {
			logging: false,
		},
		httpServer: {
			enable: true,
			port: 9000,
		},
		httpsServer: {
			enable: false,
		},
		tcpServer: {
			enable: true,
			port: 8000,
		},
		webSockets: {
			enable: false
		},
		redis : {
			enable: false,
		}
	}
	actionHero.start(params, function(api){
		console.log("Boot Sucessful!");
		next(api);
	});
}

// test it! 
suite.addBatch({
  "I should be able to start an actionHero Server": {
    topic: function(){
    	var cb = this.callback
    	startServer(function(server_api){
    		api = server_api;
    		cb(true, api)
    	});
    },
    'I got the API object' : function(res, api){ 
    	assert.isObject(api); 
    }
  }
});

suite.addBatch({
  "The client should be able to connect": {
    topic: function(){
    	var cb = this.callback
    	A.on("connected", function(){
    		cb(true, "connected")
    	});
    	A.connect(connectionParams);
    },
    'connected?' : function(res, msg){ 
    	assert.strictEqual(msg, "connected"); 
    }
  }
});

suite.addBatch({
  "Server messages should be logged": {
    topic: function(){
    	var cb = this.callback;
    	cb(true, A.log);
    },
    'log?' : function(res, log){ 
    	var str = log[0].data.welcome;
    	assert.strictEqual(str, "Hello! Welcome to the actionHero api"); 
    }
  }
});

suite.addBatch({
  "I should be in a chat room": {
    topic: function(){
    	var cb = this.callback;
    	A.roomView(function(msg){
    		cb(true, msg)
    	})
    },
    'roomStatus?' : function(res, msg){ 
    	assert.strictEqual(msg.room, "defaultRoom"); 	
    }
  }
});

suite.addBatch({
  "I can set and view params": {
    topic: function(){
    	var cb = this.callback;
    	A.paramAdd("key", "value", function(msg){
    		A.paramsView(function(params){
    			cb(true, params)
    		});
    	})
    },
    'params?' : function(res, params){ 
    	assert.strictEqual(params.params.key, "value");
    }
  }
});

suite.addBatch({
  "I can delete (and confirm gone) params": {
    topic: function(){
    	var cb = this.callback;
    	A.paramsDelete(function(msg){
    		A.paramsView(function(params){
    			cb(true, params)
    		});
    	})
    },
    'no params?' : function(res, params){ 
    	assert.strictEqual(params.params.key, undefined);
    }
  }
});

suite.addBatch({
  "I can run an action (simple)": {
    topic: function(){
    	var cb = this.callback;
		A.action("status", function(apiResposne){
			cb(true, apiResposne)
		});
       },
    'resp (simple)?' : function(res, apiResposne){ 
    	assert.isObject(apiResposne);
    	assert.strictEqual(apiResposne.stats.uptimeSeconds > 0, true);
    	assert.strictEqual(apiResposne.stats.socketServer.numberOfLocalActiveSocketClients == 1, true);
    }
  }
});

suite.addBatch({
  "I can run an action (complex)": {
    topic: function(){
    	var cb = this.callback;
		params = { key: "mykey", value: "myValue" };
		A.actionWithParams("cacheTest", params, function(apiResposne){
			cb(true, apiResposne)
		});
       },
    'resp (complex)?' : function(res, apiResposne){ 
    	assert.isObject(apiResposne);
    	assert.strictEqual(apiResposne.cacheTestResults.loadResp.value, "myValue");
    }
  }
});

suite.addBatch({
  "I get events for say": {
    topic: function(){
    	var cb = this.callback;
    	var used = false;
    	A.on("say",function(msgBlock){
    		if(used == false){
				cb(true, msgBlock);
			}
			used = true;
		});
		api.chatRoom.socketRoomBroadcast(api, null, "TEST MESSAGE");
       },
    'resp (complex)?' : function(res, msgBlock){ 
    	assert.isObject(msgBlock);
    	assert.strictEqual(msgBlock.message, "TEST MESSAGE");
    	assert.strictEqual(msgBlock.from, "actionHero API");
    }
  }
});


// export
suite.export(module);