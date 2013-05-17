var color_mapping = {"#5c0c0f":["aggressive","angry","bouncy","energetic"], "#613c07":["dramatic","passionate","angst-ridden","disturbing","enthusiastic","intense"], "#655f00":["joyous","happy","cheerful","gleeful","lively"], "#004312":["quiet","soothing","calming","gentle","hypnotic","laid-back","mellow","peaceful"], "#013e5d":["carefree","humorous","playful","whimsical","light","fun"], "#210034":["spiritual","elegant" ], "#333333":["dreamy","sentimental"]};

var params = { allowScriptAccess: "always" };
var atts = { id: "myytplayer" };
var player_initiated = false;
var current_song_attempt = "";
var current_song_actual = "";
var current_mood_energy;
var current_song_id = "";
var color = Color("#665544");
var player_state;
var color_grid = [];
var room_id = "";
var data_current_stream;
var is_owner = false; // who ever created the room will be the owner for the current sesion, when the url is reopened no one will be the owner.
var is_player_one = false;
var is_player_two = false;
var ui_presented = false; // if ui doe not present ,it means the room is already used, prompts the user to creat a new room
var ytplayer; // youtube player

// patch handlebars to enable object loops
Handlebars.registerHelper('each_obj', function(context, options) {
  var ret = "";
  for(var prop in context){ ret = ret + options.fn({key:prop,value:context[prop]});}
  return ret;
});

$(function(){
	$("#new_room").click(function(){
		window.location.href = window.location.href.split("index.html")[0]+"intro.html";
	});
	// get room id
	room_id = ws.localURLParam().room;
	if(!room_id || room_id==""){
		$("#caption").html("This room is not associated with any listeners. You must have entered this page in a wrong way.");
		return;
	}
	// check if user is owner
	if(get_content_from_local("musicflow") && get_content_from_local("musicflow").owner_room_id == room_id){
		is_owner = true;
		is_player_one = true;
		st("Player one is owner now. UI built for player one",0);
		gen_grid_ui();
		// show waiting status
		$("#player_one_waiting").show();
	}
	// connect to data stream
	data_current_stream = new Firebase(root_url+'rooms/'+room_id);
	data_current_stream.on('value',function(snapshot){
		var d = snapshot.val();
		$("#stage_left .player_name").text(d.player_one_name);
		// if player two does not exist and user is not owner
		if(!d.player_two_name){
			if(is_owner == false){
				st("Player two is ready. UI built for player one",0);
				is_player_two = true;
				gen_grid_ui();
				$("#player_two_prompt").show();
				attach_player_two();
			}
		}else{
			// if player enter the room later, ui won't show up so they can't interact
			if(!ui_presented){
				st("the room has been used before.",-1);
				$("#caption").html("The room has already been used. Please create a new room.");
			}
			// player 1 will lose ownership of the room when opening the url again
			st("both player lose ownership of room",0);
			save_content_to_local("musicflow",{has_control_room_id:room_id});
			$("#stage_right .player_name").text(d.player_two_name);
			$("#player_one_waiting").fadeOut();
			$("#player_two_prompt").fadeOut();
			// player two will start the game passively, the owner (player one) starts the game as a trigger
			if(is_owner) start_game();
		}
	});
});

function attach_player_two(){
	$("#player_two_join").click(function(){
		if($("#player_two_name").val().trim() == ""){
			$("#player_two_name").after("name can't be empty");
			return;
		}
		// update player 2 name
		data_current_stream.update({player_two_name:$("#player_two_name").val()});
	});
}

function gen_color_grid(){
	for(var i=0; i<5; i++){
		for(key in color_mapping){
			var color = Color(key).lighten(i/1.5);
			color_grid.push(color.hexString());
		}
	}
}

function page(){
	var hive_template = make_template("handlebar_hive");
	var hive_html = hive_template({hives:color_mapping});
	//$("body").append(hive_html);
	schedule(function(){
		$(".hive").click(function(){
			if(player_state == -1) return; // loading
			var s_color = $(this).data('color');
			st("selected color: "+ s_color,0);
			play_mood_energy(color_mapping[s_color][getRandomInt(0,color_mapping[s_color].length-1)],0.5);
		});
	});
}

function gen_grid_ui(){
	ui_presented = true;
	gen_color_grid();
	var color_grid_template = make_template("handlebar_color_grid");
	var color_grid__html = color_grid_template({colors:color_grid});
	if(is_player_two){
		$("#board_right").html(color_grid__html);
	}else{
		$("#board_left").html(color_grid__html);
	}
	schedule(function(){
		$(".color_grid_item").click(function(){
			
		});
	});
}

function start_game(){
	play_mood_energy("happy",0.5);
}

function play_mood_energy(mood,energy){
	current_mood_energy = {mood:mood,energy:energy};
	st("select mood/energy: " + mood+"/"+energy,0);
	var mood_songs = energy_data[mood];
	if(!mood_songs){
		st("mood does not exist: "+mood,1);
		return;
	}
	if(typeof mood_songs[energy] === "undefined" ){
		st("energy level does not exist: "+ energy,1);
		return;
	}
	var energy_length = mood_songs[energy].len;
	if(energy_length == 0){
		st("length of songs in energy level is zero: "+ energy,1);
		return;
	}
	var song_to_play = mood_songs[energy].songs[getRandomInt(0,energy_length-1)];
	current_song_attempt = song_to_play.t + " " + song_to_play.a;
	st("about to play : " + current_song_attempt,0);
	get_youtube_videos(current_song_attempt);
}

// Youtube playing facilities
function onYouTubePlayerReady(playerId) {
  ytplayer = document.getElementById("myytplayer");
  ytplayer.addEventListener("onStateChange", "onytplayerStateChange");
}

function onytplayerStateChange(newState) {
	// -1 loaded ->
	// 1 started ->
	// 2 ended -> 
	// 0 paused ->
   st("Player's new state: " + newState,0);
   player_state = newState;
   if(newState == 2){
   		play_mood_energy(current_mood_energy.mood,current_mood_energy.energy); // countine playing the same mood and energy
   }else if(newState == 1){
   	$("#caption").html("playing "+ current_song_actual);
   }else if(newState == 0){

   }else{
   	$("#caption").html("loading music..")
   }
}

function get_youtube_videos(q){
	ws.get(youtube_addkey("https://www.googleapis.com/youtube/v3/search?maxResults=10&order=relevance&part=snippet&q="+q+"&type=video"),function(res){
		var videos = res.items;
		if(typeof videos === "undefined" || videos.length == 0){
			st("no video found, try again..",1);
			play_mood_energy(current_mood_energy.mood,current_mood_energy.energy); // try again
			return;
		}
		current_song_id = videos[0].id.videoId;
		play_video(current_song_id);
		current_song_actual = q;
		data_current_stream.update(
			{
				current_song_id:current_song_id,
				current_song_actual: current_song_actual
			}
		);
		for (var i =0; i < videos.length ;i++) {
			st(videos[i].snippet.title+" "+videos[i].id.videoId,0);
		};
		console.log(res);
	});
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

function st(msg,type){
	if(type==0){
		console.log("[state] "+msg);
	}else{
		console.warn("[error] "+msg);
	}
}

