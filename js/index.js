var params = { allowScriptAccess: "always" };
var atts = { id: "myytplayer" };
$(function(){
	//get_youtube_videos("random song");
});

function onYouTubePlayerReady(playerId) {
  ytplayer = document.getElementById("myytplayer");
  ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
}

function onytplayerStateChange(newState) {
	// -1 loaded ->
	// 1 started ->
	// 2 ended -> 
	// 0 paused ->
   console.log("Player's new state: " + newState);
}

function get_youtube_videos(q){
	ws.get(youtube_addkey("https://www.googleapis.com/youtube/v3/search?maxResults=10&order=relevance&part=snippet&q="+q+"&type=video"),function(res){
		var videos = res.items;
		play_video(videos[0].id.videoId);
		for (var i =0; i < videos.length ;i++) {
			$("body").append(videos[i].snippet.title+" "+videos[i].id.videoId+"<br/>");
		};
		console.log(res);
	});
}

function page(){

}

function play_video(id){
	swfobject.embedSWF("http://www.youtube.com/v/"+id+"?enablejsapi=1&autoplay=1&playerapiid=ytplayer&version=3","ytapiplayer", "425", "356", "8", null, null, params, atts);
}



function change_video(id){
	ytplayer.loadVideoById(id)
}

function youtube_addkey(url){
	return url+"&key="+"AIzaSyBmtm-NaguLZ3ylUbnEPtR_o4QIXIQVpuQ&q";
}

function echonest_addkey(url){
	return url+"&api_key="+"%20L2XDGYQMCNGHVHLZF";
}

function load_new_video(){
	swfobject.embedSWF("http://www.youtube.com/v/ FXH6EdrUuno?enablejsapi=1&autoplay=1&playerapiid=ytplayer&version=3","ytapiplayer", "425", "356", "8", null, null, params, atts);
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
