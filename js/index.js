var params = { allowScriptAccess: "always" };
var atts = { id: "myytplayer" };
var player_initiated = false;
var current_song_attempt = "";
var current_song_actual = "";
var current_mood_energy;
var current_id = "";
var color = Color("#665544");

$(function(){
	for(key in energy_data){
		var t_c = Color(color.rgb());
		$("body").append("<div id='"+key+"' class='mood_bar' style='background:"+color.lighten(0.016).hexString()+"'>"+key+"</div>")
	}
	schedule(function(){
		$(".mood_bar").click(function(){
			console.log(this.id);
			play_mood_energy(this.id,0.5);
		});
	});
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
   if(newState == 2){
   		play_mood_energy(current_mood_energy.mood,current_mood_energy.energy); // countine playing the same mood and energy
   }else if(newState == 1){

   }else if(newState == 0){

   }
}

function get_youtube_videos(q){
	ws.get(youtube_addkey("https://www.googleapis.com/youtube/v3/search?maxResults=10&order=relevance&part=snippet&q="+q+"&type=video"),function(res){
		var videos = res.items;
		if(typeof videos === "undefined" || videos.length == 0){
			console.log("no video found, try again..");
			play_mood_energy(current_mood_energy.mood,current_mood_energy.energy); // try again
			return;
		}
		current_id = videos[0].id.videoId;
		play_video(current_id);
		current_song_actual = q;
		for (var i =0; i < videos.length ;i++) {
			console.log(videos[i].snippet.title+" "+videos[i].id.videoId+"<br/>");
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
	current_song_attempt = song_to_play.t + " " + song_to_play.a;
	console.log("about to play : " + current_song_attempt);
	get_youtube_videos(current_song_attempt);
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

