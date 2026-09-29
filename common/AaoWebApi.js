function AaoWebApi(){
	var AAO_URL = "<AAO_URL>";
	
	var aaoTimeout;

    var mainLoopRequestObj = {};
	mainLoopRequestObj.getstringvars = [];
	mainLoopRequestObj.getvars = [];
	mainLoopRequestObj.setstringvars = [];
	mainLoopRequestObj.setvars = [];
	mainLoopRequestObj.buttons = [];
	mainLoopRequestObj.triggers = [];
	mainLoopRequestObj.scripts = [];
	
	var registeredElements = [];
	var simvars = {};
	var simstringvars = {};

    function _dataLoop() {
		var dxhttp = new XMLHttpRequest();
		dxhttp.addEventListener("load", _dataRequestListener);
		var url = encodeURI(AAO_URL + "?json=" + JSON.stringify(mainLoopRequestObj));
		url = url.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
		dxhttp.open("GET", url);
		dxhttp.send();
		mainLoopRequestObj.setstringvars = [];
		mainLoopRequestObj.setvars = [];
		mainLoopRequestObj.buttons = [];
		mainLoopRequestObj.triggers = [];
		mainLoopRequestObj.scripts = [];

    };
	
	function _dataRequestListener() {
        var commObj = JSON.parse(this.responseText);
		var i;
		if (commObj.getvars){
			for (i = 0; i < commObj.getvars.length; i++){
				if (commObj.getvars[i].var in simvars){
					simvars[commObj.getvars[i].var] = commObj.getvars[i].value;
				}
			}
		}
		if (commObj.getstringvars){
			for (i = 0; i < commObj.getstringvars.length; i++){
				simstringvars[commObj.getstringvars[i].var] = commObj.getstringvars[i].value;
			}
		}
    };
	
	this.GetSimVar = function(inGetvar){
		if (inGetvar.includes(", String") || inGetvar.includes("%!") || inGetvar.includes("'") || inGetvar.includes("(STRARR")){
			if (!(inGetvar in simstringvars))
			{
				simstringvars[inGetvar] = "";
				var toget = { "var": inGetvar, "value": ""};
				mainLoopRequestObj.getstringvars.push(toget);
				return "";
			} else{
				return simstringvars[inGetvar];
			}
		} else{
			if (!(inGetvar in simvars))
			{
				simvars[inGetvar] = 0.0;
				var toget = { "var": inGetvar, "value": 0.0};
				mainLoopRequestObj.getvars.push(toget);
				return 0.0;
			} else{
				return simvars[inGetvar];
			}
		}
	};
	
	this.SendButton = function(deviceId, channelId, buttonId) {
        var requestObj = {};
		requestObj.buttons = [];
        var tosend = { "dev": deviceId, "chn": channelId, "btn": buttonId };
		requestObj.buttons.push(tosend);
        var relxhttp = new XMLHttpRequest();
        var relurl = encodeURI(AAO_URL + "?json=" + JSON.stringify(requestObj));
        relurl = relurl.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
        relxhttp.open("POST", relurl);
        relxhttp.send();
	};
	
	this.SendEvent = function(value, event) {
        var requestObj = {};
        requestObj.triggers = [];
        var tosend = { "evt": event, "value": value};
        requestObj.triggers.push(tosend);
        var relxhttp = new XMLHttpRequest();
        var relurl = encodeURI(AAO_URL + "?json=" + JSON.stringify(requestObj));
        relurl = relurl.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
        relxhttp.open("POST", relurl);
        relxhttp.send();
	};
	
	
	this.SendScript = function(code) {
        var requestObj = {};
        requestObj.scripts = [];
        var tosend = { "code": code};
        requestObj.scripts.push(tosend);
        var relxhttp = new XMLHttpRequest();
        var relurl = encodeURI(AAO_URL + "?json=" + JSON.stringify(requestObj));
        relurl = relurl.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
        relxhttp.open("POST", relurl);
        relxhttp.send();
	};
	
	this.SetVariable = function(value, variable) {
        var requestObj = {};
        requestObj.setvars = [];
        var tosend = { "var": variable, "value": value};
        requestObj.setvars.push(tosend);
        var relxhttp = new XMLHttpRequest();
        var relurl = encodeURI(AAO_URL + "?json=" + JSON.stringify(requestObj));
        relurl = relurl.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
        relxhttp.open("POST", relurl);
        relxhttp.send();
	};
	
	
	this.SetString = function(value, variable) {
        var requestObj = {};
        requestObj.setstringvars = [];
        var tosend = { "var": variable, "value": value};
        requestObj.setstringvars.push(tosend);
        var relxhttp = new XMLHttpRequest();
        var relurl = encodeURI(AAO_URL + "?json=" + JSON.stringify(requestObj));
        relurl = relurl.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
        relxhttp.open("POST", relurl);
        relxhttp.send();
	};
	
	this.StartAPI = function(interval) {
		aaoTimeout = setInterval(_dataLoop, interval);
	};
	
	this.StopAPI = function(interval) {
		if (aaoTimeout){
			clearInterval(aaoTimeout);
			aaoTimeout = null;
		}
	};
}
