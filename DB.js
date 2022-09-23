class DB
{
	static query(address, okFn, failFn, thenFn, id)
	{
		let params = {
			okFn: okFn,
			failFn: failFn,
			thenFn: thenFn,
			id: id
		};
		return DB.sendRequest('GET', address, null, params);
	}
	
	static post(address, info, okFn, failFn, thenFn, id)
	{
		let params = {
			okFn: okFn,
			failFn: failFn,
			thenFn: thenFn,
			id: id
		};
		return DB.postWithParams(address, info, params);
	}
	
	static postWithParams(address, info, params)
	{
		var contents;
		
		if (info instanceof FormData) contents = info;
		else {
			contents = '';
			for (let key in info) {
				let value = info[key];
				contents += (contents.length < 1) ? '' : '&';
				contents += key + '=' + value;
			}
		}
		return DB.sendRequest('POST', address, contents, params);
	}
	
	static sendRequest(method, address, contents, params)
	{
		let addressBits = address.split(' ');
		let target = DB.host + '/';
		for (let i = 0; i < addressBits.length; i++) {
			if (i == 0) target += '?c=' + addressBits[i];
			else if (i == 1) target += '&m=' + addressBits[i];
			else target += '&p[]=' + addressBits[i];
		}
		
		var xhr = new XMLHttpRequest();
		
		var xhrID;
		while (!xhrID || xhrID in DB.XHRs) xhrID = this.generateGUID();
		xhr.LSXHRID = xhrID;
		DB.XHRs[xhrID] = xhr;
		
		xhr.addEventListener('load', this.onLoad.bind(this, xhr, params.okFn, params.failFn, params.thenFn, params.id));
		xhr.addEventListener('error', this.onError.bind(this, xhr, params.thenFn, params.id));
		xhr.addEventListener('abort', this.onAbort.bind(this, xhr));
		
		if ('listeners' in params) {
			for (let eventName in params.listeners) {
				xhr.addEventListener(eventName, params.listeners[eventName]);
			}
		}
		
		if (xhr.upload && 'uploadListeners' in params) {
			for (let eventName in params.uploadListeners) {
				xhr.upload.addEventListener(eventName, params.uploadListeners[eventName]);
			}
		}

		xhr.open(method, target);
		xhr.withCredentials = true;
		
		if (method == 'POST') {
			if (!(contents instanceof FormData)) xhr.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
			xhr.send(contents);
		} else {
			xhr.send();
		}
		
		return xhr;
	}
	
	static onLoad(xhr, okFn, failFn, thenFn, id)
	{
		delete DB.XHRs[xhr.LSXHRID];
		if (xhr.status != 200) {
			let failText = xhr.responseText;
			if (!failText) failText = xhr.status.toString();
			if (failFn) failFn.call(this, failText, id);
			else alert(xhr.responseText);
			if (thenFn) thenFn.call(this, id);
			return;
		}
		try {
			var response = JSON.parse(xhr.responseText);
		} catch (e) {
			if (failFn) failFn.call(this, xhr.responseText, id);
			else alert(xhr.responseText || 'Unable to parse JSON: empty response from server.');
			if (thenFn) thenFn.call(this, id);
			return;
		}
		if (response && okFn) {
			if ('rows' in response && 'info' in response) okFn.call(this, response.rows, response.info, id);
			else okFn.call(this, response, {}, id);
			if (thenFn) thenFn.call(this, id);
		}
	}
	
	static onError(xhr, thenFn, id)
	{
		delete DB.XHRs[xhr.LSXHRID];
		DB.abortAll();
		alert('LSE1000: No connexion to LDBC.')
		if (thenFn) thenFn.call(this, id);
	}
	
	static onAbort(xhr)
	{
		delete DB.XHRs[xhr.LSXHRID];
	}
	
	static abortAll()
	{
		for (var id in DB.XHRs) DB.XHRs[id].abort();
	}
	
	static generateGUID()
	{
		var S4 = function() {
			return (((1+Math.random())*0x10000)|0).toString(16).substring(1);
		};
		return (S4()+S4()+"-"+S4()+"-"+S4()+"-"+S4()+"-"+S4()+S4()+S4());
	}
	
	static defaultHost(isLocal)
	{
		return isLocal ? 'http://localhost:7000' : 'https://hole.yoursite.tld/io';
	}
	
	static setHost(host)
	{
		DB.host = host;
		localStorage.setItem('LSDBHost', host);
	}
}
DB.host = localStorage.getItem('LSDBHost') || DB.defaultHost(false);
DB.XHRs = [];