function AaoWebApi(){
	var AAO_URL = "<AAO_URL>";
	
	var aaoTimeout;
	var _inFlight = false;
	var _urlDirty = true;
	var _cachedGetUrl = '';
	var _dataRevision = 0;
	var _dataListeners = [];
	var _baseInterval = 100;
	var _lastRtt = 0;

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

	function rebuildGetUrl() {
		var url = encodeURI(AAO_URL + "?json=" + JSON.stringify(mainLoopRequestObj));
		_cachedGetUrl = url.replace(/\+/g, '%2B').replace(/&/g, '%26').replace(/#/g, '%23');
	}

	function markUrlDirty() {
		_urlDirty = true;
	}

	function notifyDataListeners() {
		var i;
		for (i = 0; i < _dataListeners.length; i++) {
			try { _dataListeners[i](); } catch (e) {}
		}
	}

	function scheduleNextLoop() {
		var wait = _baseInterval;
		if (_lastRtt > wait * 0.75) {
			wait = Math.min(2000, Math.max(wait, _lastRtt + 25));
		}
		if (aaoTimeout) clearTimeout(aaoTimeout);
		aaoTimeout = setTimeout(_dataLoop, wait);
	}

    function _dataLoop() {
		if (_inFlight) return;
		if (_urlDirty) {
			rebuildGetUrl();
			_urlDirty = false;
		}
		_inFlight = true;
		var started = Date.now();
		var dxhttp = new XMLHttpRequest();
		dxhttp.addEventListener("load", function () {
			_inFlight = false;
			_lastRtt = Date.now() - started;
			_dataRequestListener.call(dxhttp);
			scheduleNextLoop();
		});
		dxhttp.addEventListener("error", function () {
			_inFlight = false;
			_lastRtt = 2000;
			scheduleNextLoop();
		});
		dxhttp.open("GET", _cachedGetUrl);
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
		_dataRevision++;
		notifyDataListeners();
    };
	
	this.GetSimVar = function(inGetvar){
		if (inGetvar.includes(", String") || inGetvar.includes("%!") || inGetvar.includes("'") || inGetvar.includes("(STRARR")){
			if (!(inGetvar in simstringvars))
			{
				simstringvars[inGetvar] = "";
				var toget = { "var": inGetvar, "value": ""};
				mainLoopRequestObj.getstringvars.push(toget);
				markUrlDirty();
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
				markUrlDirty();
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

	this.getDataRevision = function () {
		return _dataRevision;
	};

	this.onData = function (fn) {
		if (typeof fn === 'function') _dataListeners.push(fn);
	};
	
	this.StartAPI = function(interval) {
		_baseInterval = interval || 100;
		if (aaoTimeout){
			clearTimeout(aaoTimeout);
			aaoTimeout = null;
		}
		_inFlight = false;
		aaoTimeout = setTimeout(_dataLoop, 0);
	};
	
	this.StopAPI = function(interval) {
		if (aaoTimeout){
			clearTimeout(aaoTimeout);
			aaoTimeout = null;
		}
		_inFlight = false;
	};
}
