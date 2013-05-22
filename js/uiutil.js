$(document).ready(ui_init);

var root_url = "https://flowmusic.firebaseio.com/";

Handlebars.registerHelper('each_obj', function(context, options) {
  var ret = "";
  for(var prop in context){ ret = ret + options.fn({key:prop,value:context[prop]});}
  return ret;
});

function ui_init(){
	//schedule(site);
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

function save_content_to_local(name,object){
	if(localStorage){
		localStorage.setItem(name,JSON.stringify(object)); 
	}
}

function get_content_from_local(name){
	if(localStorage){
		return JSON.parse(localStorage.getItem(name));
	}
}



// for data analytics (mining echonest)
var moods;
var moods_count = {};
var energy_count = {};
function get_mood(){
	ws.get(echonest_addkey("http://developer.echonest.com/api/v4/artist/list_terms?format=jsonp&type=mood"),function(res){
			console.log(res);
			moods = res.response.terms;
			for(var i=0; i<moods.length; i++){
				(function(){
					var j = i;
					for(var k=0; k<8; k++){
						(function(){
							var m = k;
							setTimeout(function(){
							get_song_list_by_hotness_and_mood(m/10,(m/10)+0.1,moods[j].name)},3000*j);
						})();
					}
				})();
				
			}
	});
}

function get_song_list_by_hotness_and_mood(minh,maxh,mood){
	var req = echonest_addkey("http://developer.echonest.com/api/v4/song/search?format=jsonp&results=100&"+"song_min_hotttnesss="+minh+"&song_max_hotttnesss="+maxh+"&mood="+mood);
	console.log(req)
	ws.get(req,function(res){
			console.log(res.response.songs.length);
			if(!moods_count[mood]) moods_count[mood] = {};
			moods_count[mood][minh] = {
				songs:res.response.songs,
				len:res.response.songs.length
			}
	});
}

function get_energy_for_hot_songs_with_mood(){
	for(var key in mood_data){
			if(mood_data[key][0.7].len > 99){
				get_song_energy_loop(0.7,key);
			}else if(mood_data[key][0.6].len > 99){
				get_song_energy_loop(0.6,key);
			}else if(mood_data[key][0.5].len > 99){
				get_song_energy_loop(0.5,key);
			}else if(mood_data[key][0.4].len > 99){
				get_song_energy_loop(0.4,key);
			}else if(mood_data[key][0.3].len > 99){
				get_song_energy_loop(0.3,key);
			}else if(mood_data[key][0.2].len > 99){
				get_song_energy_loop(0.2,key);
			}else if(mood_data[key][0.1].len > 99){
				get_song_energy_loop(0.1,key);
			}else if(mood_data[key][0].len > 99){
				get_song_energy_loop(0,key);
			}
	}
}

function get_song_energy_loop(minh,mood){
	for(var k=0; k<9; k++){
		(function(){
			var m = k;
			setTimeout(function(){
			get_song_energy(m/10,(m/10)+0.1,minh,mood)},20000*m);
		})();
	}
}

function get_song_energy(mine,maxe,minh,mood){
	var req = echonest_addkey("http://developer.echonest.com/api/v4/song/search?format=jsonp&results=100&song_min_hotttnesss="+minh+"&min_energy="+mine+"&max_energy="+maxe+"&mood="+mood);
	console.log(req)
	ws.get(req,function(res){
			console.log(res.response.songs.length);
			if(!energy_count[mood]) energy_count[mood] = {};
			energy_count[mood][mine] = {
				min_hotness:minh,
				songs:res.response.songs,
				len:res.response.songs.length
			}
	});
}

function reduce_mood_data(){
	for(var key in mood_data){
		for(level in mood_data[key]){
			for(var i=0; i< mood_data[key][level].songs.length; i++){
				delete mood_data[key][level].songs[i].artist_id;
				delete mood_data[key][level].songs[i].id;
			}
		}
	}
}

function reduce_energy_data(){
	for(var key in energy_data){
		for(level in energy_data[key]){
			for(var i=0; i< energy_data[key][level].songs.length; i++){
				delete energy_data[key][level].songs[i].artist_id;
				delete energy_data[key][level].songs[i].id;
			}
		}
	}
}

function get_songs(){
	ws.get(echonest_addkey("http://developer.echonest.com/api/v4/song/search?format=jsonp&results=100&song_min_hotttnesss=0.8"),function(res){
		console.log(res);
	});
}