<?php
require ("inc/apptop.php");
//include ("temp/_vars.php");
?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Super Six Daily Priorities and Tasking</title>


<!-- javascript -->
<script src="http://code.jquery.com/jquery-latest.min.js"></script>

<!--font-->
<link href='https://fonts.googleapis.com/css?family=Arimo:400,700' rel='stylesheet' type='text/css'>

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
<!-- Custom theme -->
<link rel="stylesheet" href="/css/library.css">
<link rel="stylesheet" href="/css/style.css">


</head>

<body>

<div class="navbar navbar-inverse">
	<img src="images/SuperSix-Logo.png" width="320" height="72" alt=""/>
		<div class="navbar-right profile_link">
		
		<div class="dropdown">
			<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
				<span id="usernameheaderSPAN"></span>
				<span class="caret"></span>
			</button>
			<ul class="dropdown-menu" aria-labelledby="dropdownMenu1">
				<li><a href="#">My Profile</a></li>
				<li role="separator" class="divider"></li>
				<li><a href="#">Logout</a></li>
			</ul>
			<a href=""><span class="glyphicon glyphicon-cog"></span></a>
		</div>
		
			
		</div>
</div>



<div class="wrapper">
	<div class="container">
		
		
		<!--Login-->
		
		<div class="login" id="loginDIV">
		
			
			<div class="alert alert-danger" id="loginerrorDIV">Login Failed</div>
			
		
			<h1>Login:</h1>
			<div class="form-group section_row">
				<div class="col-xs-3">
					<label for="username">Username:</label>
				</div>
				<div class="col-xs-9">
					<input type="text" name="username" id="username" class="form-control" value="dxdeaner" />
				</div>
			</div>
			<div class="form-group section_row">
				<div class="col-xs-3">
					<label for="password">Password:</label>
				</div>
				<div class="col-xs-9">
					<input type="password" name="password" id="password" class="form-control" />
				</div>
			</div>
			<div class="form-group section_row">
				<div class="submit_login col-sm-push-3 col-sm-9">
					<input id="submit_login" type="submit" class="btn btn-lg btn-info" value="Login">
				</div>
			</div>
		</div>
		
		
<script type="text/javascript">

	$('#submit_login').click(function(){ 
		
		var user = $('#username').val();

		console.log('These are the vars that passed | ' + user );
		
		//var rowid = $(this).data('rowid');
		$.ajax({
		  method: "POST",
		  url: "inc/ajax/login.php", 
		  dataType: 'json',
		  data: { username: user },
		  /*beforeSend: function(){
			  	console.log('i happen before send');
			  },
		  complete: function(){
			  	console.log('i happen upon complete');
			  },*/
		  success: function(response){
				//alert(response);  
				console.log(response);
				//var obj_login_resp = jQuery.parseJSON(response);
				//console.log( obj_login_resp.code === 1 ); 
				//console.log( obj_login_resp.code); 
				console.log( response.code === 1 ); 
				console.log( response.code); 
				
		  },
		  error: function(){
			  	console.log('');
		  }
		})
	
	});
	
	
/*
	var obj = jQuery.parseJSON( '{ "fname": "John" }' );
	console.log( obj.fname === "macky" ); // returns true/false
	console.log( obj.fname );
	console.log( obj.lname === "macky" ); // returns true/false
	console.log( obj.lname ); // returns undefined
*/	
	
</script>	
		
<?php
	echo '<pre>';
	print_r($_SESSION);
	echo '</pre>';
?>

		
		<div id="primary_content">
		
			<h2 class="pull-left">'s Master Priority List</h2>
			
			<h3 class="pull-right"><?=date('l - F jS, Y');?></h3>
			
			<div class="clearfix"></div>
			
			<div class="ss_section tabbable" id="ssTabs">
				<ul class="nav nav-tabs">
					<li class="active"><a href="#tab1" data-toggle="tab">Super Six's</a></li>
					<li><a href="#tab2" data-toggle="tab">Completed</a></li>
					<li><a href="#tab3" data-toggle="tab">Assigned</a></li>
					<li><a href="#tab4" data-toggle="tab">Future Sixs</a></li>
					<li><a href="#tab5" data-toggle="tab">Not So Super</a></li>
				</ul>
				
				<div class="tab-content">
					<div class="tab-pane active" id="tab1">
						<? // require('temp/inc_active_sixs.php'); ?>
					</div><!--end tab1-->
					<div class="tab-pane" id="tab2">
						<? // require('temp/inc_completed.php'); ?>
					</div><!--end tab2-->
					<div class="tab-pane" id="tab3">
						<? // require('temp/inc_assigned.php'); ?>
					</div><!--end tab3-->
					<div class="tab-pane" id="tab4">
						<? // require('temp/inc_futures.php'); ?>
					</div>
					<div class="tab-pane" id="tab5">
						<? // require('temp/inc_nss.php'); ?>
					</div>
				</div><!--end tab content-->
				
				<div class="clearfix"></div>
			</div><!--ss_section-->
			
		</div>
	
	</div><!-- end container -->
</div>
<? require('temp/inc_footer.php'); ?>








</body>
</html>

<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>