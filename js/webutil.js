var ws = new webUtil();
function webUtil(){
	this.get = function(targetUrl, responseFunction){
		$.ajax({
			type: "GET",
			url: targetUrl,
			dataType: "jsonp", //jsonp or json should both be find
			timeout: 20000, // in milliseconds
			success: responseFunction,
			error: function(request, status, err) {
				console.log(err);
			}
		});
	};
	this.post = function(targetUrl, postInstance, responseFunction){
		$.ajax({
			type: "POST",
			url: targetUrl,
			data: postInstance, //{name:"boriwang",ddsds:""}
			dataType: "jsonp", //jsonp or json should both be fine
			timeout: 20000, // in milliseconds
			success: responseFunction,
			error: function(request, status, err) {
				console.log(err);
			}
		});
	};
	this.parse = function(response){
		var jsonResponse = eval("(" + response + ")"); //ok!				
		return jsonResponse;
	};
	this.url = function(obj){
		str = "?";
		for(property in obj){
			str += property+"="+ escape(obj[property])+"&";
		}
		return str;
	};
	this.set_cookie = function(name,value,days){
		if (days) {
			var date = new Date();
			date.setTime(date.getTime()+(days*24*60*60*1000));
			var expires = "; expires="+date.toGMTString();
		}
		else var expires = "";
		document.cookie = name+"="+value+expires+"; path=/";
	}
	this.get_cookie = function(name){
		var nameEQ = name + "=";
		var ca = document.cookie.split(';');
		for(var i=0;i < ca.length;i++) {
			var c = ca[i];
			while (c.charAt(0)==' ') c = c.substring(1,c.length);
			if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length,c.length);
		}
		return null;
	}
	this.localURLParam = function(){
		var params = {};
		if (location.search) {
			var parts = location.search.substring(1).split('&');
			for (var i = 0; i < parts.length; i++) {
				var nv = parts[i].split('=');
				if (!nv[0]) continue;
				params[nv[0]] = nv[1] || true;
			}
		}
		return params;
	}
}