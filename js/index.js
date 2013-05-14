var params = { allowScriptAccess: "always" };
var atts = { id: "myytplayer" };
var player_initiated = false;
var current_song = "";
var current_mood_energy;

$(function(){
	
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

function play_mood_energy(mood,energy){
	current_mood_energy = {mood:mood,energy:energy};
	var mood_songs = energy_data[mood];
	if(!mood_songs){
		console.log("mood does not exist");
		return;
	}
	if(typeof mood_songs[energy] === "undefined" ){
		console.log("energy level does not exist");
		return;
	}
	var energy_length = mood_songs[energy].len;
	if(energy_length == 0){
		console.log("length is zero");
		return;
	}
	var song_to_play = mood_songs[energy].songs[getRandomInt(0,energy_length-1)];
	current_song = song_to_play.t + " " + song_to_play.a;
	console.log("about to play : " + current_song);
	get_youtube_videos(current_song);
}

function play_video(id){
	if(player_initiated == false){
		swfobject.embedSWF("http://www.youtube.com/v/"+id+"?enablejsapi=1&autoplay=1&playerapiid=ytplayer&version=3","ytapiplayer", "425", "356", "8", null, null, params, atts);
		player_initiated = true;
	}else{
		ytplayer.loadVideoById(id);
	}
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

function getRandomInt(min, max){
    return Math.floor(Math.random() * (max - min + 1)) + min;
}

