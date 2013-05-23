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
var current_song_attempt_t = "";
var current_song_attempt_a = "";
var total_songs_to_play = 3;
var game_disconnected = false;
var disconnected_listener_atteched = false;
var current_selected_color = false;

// patch handlebars to enable object loops
Handlebars.registerHelper('each_obj', function(context, options) {
  var ret = "";
  for(var prop in context){ ret = ret + options.fn({key:prop,value:context[prop]});}
  return ret;
});

// vis is for testing purpose
var vis = {
      "game_started" : true,
      "player_two_color" : "",
      "1" : {
        "a" : "Big Band",
        "1" : "#FFF677",
        "m" : {
          "mood" : "happy",
          "energy" : 0.5
        },
        "t" : "El Africano",
        "2" : "#FFF677"
      },
      "3" : {
        "a" : "Marque",
        "1" : "#EEDE00",
        "m" : {
          "mood" : "happy",
          "energy" : 0.5
        },
        "t" : "Sleep Baby",
        "2" : "#17B0FD"
      },
      "current_song_actual" : "Sleep Baby Marque",
      "current_song_id" : "bAiw21gSxyQ",
      "player_one_name" : "you know?",
      "current_song_attempt_a" : "Marque",
      "player_one_color" : "",
      "current_song_attempt_t" : "Sleep Baby",
      "disconnected" : true,
      "2" : {
        "a" : "The Polyphonic Spree",
        "1" : "#AA9F00",
        "m" : {
          "mood" : "happy",
          "energy" : 0.5
        },
        "t" : "Section 29 [Light To Follow]",
        "2" : "#17B0FD"
      },
      "game_round" : 4,
      "player_two_name" : "nice"
    };
$(function(){
	//$("#result_vis").html(generate_result_vis(vis));
	$("#new_room").click(function(){
		window.location.href = window.location.href.split("p.html")[0];
	});
	$("#player_one_send_message").html(window.location.href);
	// get room id
	room_id = ws.localURLParam().room;
	if(!room_id || room_id==""){
		$("#caption").html("This room is not associated with any players. You must have entered this page in a wrong way.");
		$("#new_room").show();
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
		$("#stage_right .player_name").text(d.player_two_name);
		// if player two does not exist and user is not owner

		if(d.game_finished){
			$("#caption").html("Game finished");
			$("#result_vis").html(generate_result_vis(d));
			$("#new_room").show();
			$("#color_result").slideUp();
			$("#color_board").slideUp();
			$("#result_vis").slideDown();
			return;
		}

		if(typeof d.player_one_color !== "undefined" && d.player_one_color !==""){
			$("#board_left_status").html("finished choosing color");
		}else{
			$("#board_left_status").html("still choosing color..");
		}

		if(typeof d.player_two_color !== "undefined" && d.player_two_color !==""){
			$("#board_right_status").html("finished choosing color");
		}else{
			$("#board_right_status").html("still choosing color..");
		}

		if(!d.player_two_name){
			if(is_owner == false){
				st("Player two is ready. UI built for player one",0);
				is_player_two = true;
				gen_grid_ui();
				$("#player_two_prompt").show();
				attach_player_two();
			}
		}else{
			$("#player_one_waiting").fadeOut();
			$("#player_two_prompt").fadeOut();
			// if player enter the room later, ui won't show up so they can't interact
			if(!ui_presented){
				st("the room has been used before.",-1);
				$("#caption").html("The room has already been used. Please create a new room.");
				$("#new_room").show();
				return;
			}else{
				// make sure on disconnect is only attached by the owner and does not attach twice
				if(!disconnected_listener_atteched){
					disconnected_listener_atteched = true;
					data_current_stream.onDisconnect().update({disconnected:true});
				}
			}
			if(typeof d.game_round != "undefined"){
				if(d.game_round <= total_songs_to_play){
					$("#songs_sequence").html("Round "+d.game_round+"/"+total_songs_to_play);
				}else{
					data_current_stream.update({game_finished:true});
					st("Game finished",0);
					ytplayer.stopVideo(); // stop video from playing
					return;
				}
			}
			if(d.disconnected == true){
				if(is_player_one){
					$("#caption").html("Player one disconnected. Game stopped.");
				}else{
					$("#caption").html("Player two disconnected. Game stopped.");
				}
				$("#new_room").show();
				game_disconnected = true;
				ytplayer.stopVideo(); // stop video from playing
				return;
			}
			if(is_owner && !d.game_started){
				// player 1 will lose ownership of the room when opening the url again
				st("both player lose ownership of room",0);
				save_content_to_local("musicflow",{has_control_room_id:room_id});
				// player two will start the game passively, the owner (player one) starts the game as a trigger, 
				st("both player ready, starting game..",0);
				data_current_stream.update({game_started:true,game_round:1});
				start_new_song();
			}
		}

		// song id changed , tell player two to start playing music
		if(d.game_started && is_player_two && (d.current_song_id != current_song_id)){
			if(typeof d.current_song_id === "undefined") return;
			st("song id changed, previous: "+ current_song_id + " new " + d.current_song_id,0);
			current_song_id = d.current_song_id;
			current_song_actual = d.current_song_actual;
			current_song_attempt_a = d.current_song_attempt_a;
			current_song_attempt_t = d.current_song_attempt_t;
			// this will both affect player 1 and player 2
			st("play new video for a new round",0);
			play_video(current_song_id);
		}

		
		if(d.game_started && typeof d.player_one_color !== "undefined" && d.player_one_color !== "" && typeof d.player_two_color !== "undefined" && d.player_two_color !==""){
			$("#round_score").html(calculate_similarity(d.player_one_color,d.player_two_color)+"% similar");
			$("#color_board").slideUp();
			$("#color_result").slideDown();
			$("#bubble_left_color").css({background:d.player_one_color});
			$("#bubble_right_color").css({background:d.player_two_color});
			// only player one has control to start a new song
			setTimeout(function(){
				$("#color_result").slideUp();
				$("#color_board").slideDown();
				if(is_player_one){
					var u = {
						game_round : d.game_round + 1,
						player_one_color: "", // must set this to avoid infinite call back
						player_two_color: ""
					};
					u[d.game_round]={
								1:d.player_one_color,
								2:d.player_two_color,
								a:current_song_attempt_a,
								t:current_song_attempt_t,
								m:current_mood_energy
					};
					data_current_stream.update(u);
					if(u.game_round <= total_songs_to_play){
						start_new_song();
					}
				}
			},3000);
		}
	});
});

function attach_player_two(){
	$("#player_two_join").click(function(){
		if($("#player_two_name").val().trim() == ""){
			$("#player_two_join").after("<br/>name can't be empty.");
			return;
		}else if ($("#player_two_name").val().trim().length > 40){
			$("#player_two_join").after("<br/>name should be less than 40 characters.");
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
	//var hive_template = make_template("handlebar_hive");
	//var hive_html = hive_template({hives:color_mapping});
	//$("body").append(hive_html);
	// schedule(function(){
	// 	$(".hive").click(function(){
	// 		if(player_state == -1) return; // loading
	// 		var s_color = $(this).data('color');
	// 		st("selected color: "+ s_color,0);
	// 		play_mood_energy(color_mapping[s_color][getRandomInt(0,color_mapping[s_color].length-1)],0.5);
	// 	});
	// });
}

function gen_grid_ui(){
	ui_presented = true;
	gen_color_grid();
	var color_grid_template = make_template("handlebar_color_grid");
	var color_grid__html = color_grid_template({colors:color_grid});
	$("#board_color_panel").append(color_grid__html);
	schedule(function(){
		$(".color_grid_item").click(function(){
			$(".color_grid_item").removeClass("color_active");
			$(this).addClass("color_active");
			current_selected_color = $(this).data("color");
			console.log(current_selected_color);
			$("#confirm_color").css({background:current_selected_color});
		});
		$("#confirm_color").click(function(){
			$(".color_grid_item").removeClass("color_active");
			if(!current_selected_color){
				alert("You have not selected a color yet.");
				return;
			}
			$("#color_cover").show();
			if(is_player_one){
				data_current_stream.update({player_one_color:current_selected_color});
			}else{
				data_current_stream.update({player_two_color:current_selected_color});
			}
			current_selected_color = false;
			$("#confirm_color").css({background:"#333"});
		});
	});
}

// this function touches any database for synchronization, used for player 1
function start_new_song(){
	play_mood_energy("happy",0.5);
}

// this function touches any database for synchronization, used for player 1
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
	current_song_attempt_t = song_to_play.t;
	current_song_attempt_a = song_to_play.a;
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
   	$("#caption").html(current_song_attempt_t + " <span style='color:#999;font-size:12px'> - " + current_song_attempt_a+"</span>");
   	$("#color_cover").hide();
   }else if(newState == 0){

   }else if(newState == -1){
   	if(!game_disconnected){
   		$("#caption").html("loading music..");
   	}
   }else if(newState == 5){
   	if(!game_disconnected){
   		$("#caption").html("Game finished");
   	}
   	$("#board_right_status").hide();
   	$("#board_left_status").hide();
   	// don't put any thing here, might affect game ending state
   }
}

// this function touches any database for synchronization, used for player 1
function get_youtube_videos(q){
	st("get youtube video with query : "+q, 0);
	ws.get(youtube_addkey("https://www.googleapis.com/youtube/v3/search?maxResults=10&order=relevance&part=snippet&q="+q+"&type=video"),function(res){
		var videos = res.items;
		console.log(videos);
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
				current_song_actual: current_song_actual,
				current_song_attempt_a: current_song_attempt_a,
				current_song_attempt_t: current_song_attempt_t
			}
		);
		for (var i =0; i < videos.length ;i++) {
			st(videos[i].snippet.title+" "+videos[i].id.videoId,0);
		};
		console.log(res);
	});
}

// this function does not touch any database for synchronization, used for player 2
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

function generate_result_vis(obj){
	var html = "<div><br/>";
	//html += '<a href="https://www.facebook.com/sharer/sharer.php?u='+'http://stanford.edu/~borui'+'" target="_blank" style="color:#133783; text-decoration:none"> Share this game on Facebook </a><br/>';
	var score_total = 0;
	for(key in obj){
		if(isNaN(key)==false){
			html += "<div class='vb'><div class='vd'><div class='vt'>"+obj[key].t+"</div><div class='va'>"+obj[key].a+"</div></div><div class='vl' style='background:"+obj[key][1]+"'></div><div class='vr' style='background:"+obj[key][2]+"'></div></div>";
			score_total += parseInt(calculate_similarity(obj[key][1],obj[key][2]));
		}
	}
	html+="<div style='font-size:25px'>"+obj.player_one_name + " and " + obj.player_two_name + " have a similar score of </div><span style='font-size:100px'>"+(score_total/total_songs_to_play).toFixed(0)+"%</span>";
	html += "</div>";
	return html;
}

function calculate_similarity(hex1,hex2){
 	var color1 = Color(hex1).rgb();
 	var color2 = Color(hex2).rgb();
 	var decimal =  1-(Math.abs(color1.r - color2.r) + Math.abs(color1.g - color2.g) + Math.abs(color1.b - color2.b))/765;
 	return (decimal*100).toFixed(0);
}

