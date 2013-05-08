$(document).ready(ui_init);

function ui_init(){
	schedule(site);
	schedule(page);
}

function site(){
	var site = '\
	<div id="header"></div> \
	<div id="container"></div> \
	<div id="footer"></div> ';
	var site_template = Handlebars.compile(site);
	var site_html = site_template();
	$("body").append(site_html);
}

function schedule(func){
	setTimeout(func,0);
}

function make_div(id,position){
	$(position).append("<div id='"+id+"'></div>");
}

function make_template(id){
	return Handlebars.compile($("#"+id).html());
}

function cut_text(str){
	if(!str) return str;
	return str.substr(str.length-200,str.length);
}

function getURLParameter(name) {
    return decodeURI(
        (RegExp(name + '=' + '(.+?)(&|$)').exec(location.search)||[,null])[1]
    );
}