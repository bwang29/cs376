var duplicated_creation = false;
var data_streams;

$(function(){
	data_streams = new Firebase(root_url+'rooms');
	$("#generate_room_button").click(create_room_with_friends);
	leader_board_data_stream = new Firebase(root_url+'leader/');
	leader_board_data_stream_limited = leader_board_data_stream.limit(20);
	leader_board_data_stream_limited.on('value',function(snapshot){
		var leaders = snapshot.val();
		var html = "";
		for(key in leaders){
			html+=leaders[key].one +" and "+leaders[key].two+" - "+leaders[key].score + "% <br/>"
		}
		$("#leader_board").html(html);
	});
});

function page(){
	
}

function create_room_with_friends(){
	if(duplicated_creation) return;
	duplicated_creation = true;
	var d = {
		player_one_name: $("#start_name").val().trim()
	};
	console.log(d);
	for(key in d){
		if(d[key] == ""){
			$("#error").append("Name is required");
			duplicated_creation = false;
			return;
		}else if(d[key].length > 40 ){
			$("#error").append("Name should be less than 40 characters");
			duplicated_creation = false;
			return;
		}
	}
	$("#generate_room_button").html("loading..");
	var p = data_streams.push(d,function(){
			duplicated_creation = false;
			save_content_to_local("musicflow",{owner_room_id:p.name(),has_control_room_id:p.name()});
			window.location.href = window.location.href.split("index.html")[0]+"p.html?&room="+p.name();
	});
}
