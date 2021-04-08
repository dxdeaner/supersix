<?php
require ("inc/apptop.php");
include ("temp/_vars.php");


/** INSERT (CREATE)*/
if(!empty($_POST['insertuser'])) {
	
	$firstname = $_POST['firstname'];
	$lastname = $_POST['lastname'];
	$email = $_POST['email'];
	$username = $_POST['username'];
	$password = $_POST['password'];
	$datecreated = date('Y-m-d H-i-s');
	$datelastupdated = date('Y-m-d H-i-s');
	
	echo 'This is what is sent';
	echo '<pre>';
	print_r($_POST);
	echo $datecreated;
	echo '<br>';
	echo $datelastupdated;
	echo '</pre>';
	
	$conn->query("INSERT INTO tbl_users (firstname, lastname, email, username, password, datecreated, datelastupdated) VALUES ('$firstname', '$lastname', '$email', '$username', '$password', '$datecreated', '$datelastupdated')");
	$insertedID = $conn->lastInsertId();
	
	if(!empty($insertedID)) {
		$response = 'Insert Successful';
	} else {
		$response = 'Insert ERROR';
	}
	
	$newdata = $conn->query("SELECT * from tbl_users WHERE id=$insertedID LIMIT 1");
	$newdata->execute(); 
	$row = $newdata->fetch();
	
	foreach($row as $key => $val) {
		$_SESSION[$key] = $val;
	}
	
	echo 'These are returned';
	echo '<pre>';
	print_r($_SESSION);
	echo '</pre>';
	
		
unset($_SESSION['insertuser']);	
unset($_SESSION['password']);	
unset($_SESSION['password2']);	
unset($_SESSION['datecreated']);	
}



?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Super Six Daily Priorities and Tasking</title>


<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
<!-- Custom theme -->
<link rel="stylesheet" href="/css/library.css">
<link rel="stylesheet" href="/css/style.css">

<!--font-->
<link href='https://fonts.googleapis.com/css?family=Arimo:400,700' rel='stylesheet' type='text/css'>


</head>

<body>

<div class="navbar navbar-inverse">
	<img src="images/SuperSix-Logo.png" width="320" height="72" alt=""/>
	<div class="navbar-right text-right caps">
		Registration
	</div>
</div>


<div class="container">

	<h2 class="pull-left">Register your Super Six</h2>

	<h3 class="pull-right"><?=date('l - F jS, Y');?></h3>
	
	<div class="clearfix"></div>

	<div class="ss_section">

		<form class="form-horizontal" method="post" action="">
			<input type="hidden" name="insertuser" value="yes" />
		
			<div class="tab-content">
			
				<div class="tab-pane user_details active">
				
					<div class='rows'>
						  <div class="form-group">
							 <label for="firstname" class="col-xs-3 control-label">First Name</label>
							 <div class="col-xs-7">
								<input type="text" class="form-control" name="firstname" id="firstname" placeholder="First Name" value="<?=(!empty($_SESSION['firstname'])?$_SESSION['firstname']:'');?>">
							 </div>
						  </div>
					</div>
					
					<div class='rows'>
						  <div class="form-group">
							 <label for="lastname" class="col-xs-3 control-label">Last Name</label>
							 <div class="col-xs-7">
								<input type="text" class="form-control" name="lastname" id="lastname" placeholder="Last Name" value="<?=(!empty($_SESSION['lastname'])?$_SESSION['lastname']:'');?>">
							 </div>
					   </div>
					</div>
					
					<div class='rows'>
						  <div class="form-group">
							 <label for="email" class="col-xs-3 control-label">Email</label>
							 <div class="col-xs-7">
								<input type="email" class="form-control" name="email" id="email" placeholder="Email" value="<?=(!empty($_SESSION['email'])?$_SESSION['email']:'');?>">
							 </div>
					   </div>
					</div>

					<!--<div class='rows'>
						  <div class="form-group">
							 <label for="phonenumber" class="col-xs-3 control-label">Phone Number</label>
							 <div class="col-xs-7">
								<input type="text" class="form-control" name="phonenumber" id="phonenumber" placeholder="Phone Number" value="<?=(!empty($_SESSION['phonenumber'])?$_SESSION['phonenumber']:'');?>">
							 </div>
						  </div>
					</div>-->

					<div class='rows'>
						  <div class="form-group">
							 <label for="username" class="col-xs-3 control-label">Desired Username</label>
							 <div class="col-xs-7">
								<input type="text" class="form-control" name="username" id="username" placeholder="What is your desired username?" value="<?=(!empty($_SESSION['username'])?$_SESSION['username']:'');?>">
							 </div>
						  </div>
					</div>

					<div class='rows'>
						  <div class="form-group">
							 <label for="password" class="col-xs-3 control-label">Password</label>
							 <div class="col-xs-7">
								<input type="password" class="form-control" name="password" id="password">
							 </div>
						  </div>
					</div>

					<div class='rows'>
						  <div class="form-group">
							 <label for="password2" class="col-xs-3 control-label">Repeat Password</label>
							 <div class="col-xs-7">
								<input type="password" class="form-control" name="password2" id="password2">
							 </div>
						  </div>
					</div>
					
					<div class='rows'>
						<div class="register_submit">
							<button class="btn btn-lg btn-info center-block">Register Account</button>
							<div class="smaller grey-light text-center">It's Free now, tomorrow, and forever.</div>
						</div>
					</div>
					
				</div><!--end tab1-->



	
			</div><!--end tab content-->
			
		 </form>
		
			
		<div class="clearfix"></div>
	</div><!--ss_section-->
	
	
	
	


</div><!-- end container -->







<? require($_SERVER['DOCUMENT_ROOT'].'/temp/inc_footer.php'); ?>








</body>
</html>






<!-- javascript -->
<script src="http://code.jquery.com/jquery-latest.min.js"></script>
<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>





<!--
Array
(
    [insertuser] => yes
    [firstname] => Demo3
    [lastname] => User3
    [email] => demo3@email.com
    [phonenumber] => 480-555-8899
    [username] => Demo3
    [password] => Demo3
    [password2] => Demo3
    [id] => 3
    [0] => 3
    [datecreated] => 0000-00-00 00:00:00
    [1] => 0000-00-00 00:00:00
    [datedeleted] => 0000-00-00 00:00:00
    [2] => 0000-00-00 00:00:00
    [datelastupdated] => 0000-00-00 00:00:00
    [3] => 0000-00-00 00:00:00
    [useronoff] => 1
    [4] => 1
    [5] => Demo3
    [6] => User3
    [7] => demo3@email.com
    [8] => 480-555-8899
    [9] => Demo3
    [10] => Demo3
)
-->


