<?php
require ("inc/apptop.php");
include ("temp/_vars.php");
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
		<div class="navbar-right profile_link">
		
		<div class="dropdown">
			<button class="btn btn-default dropdown-toggle" type="button" id="dropdownMenu1" data-toggle="dropdown" aria-haspopup="true" aria-expanded="true">
				<?=$activeuser;?>
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


<div class="container">

	<h2 class="pull-left"><?=(!empty($_SESSION['firstname'])?$_SESSION['firstname']:'Demo');?> <?=(!empty($_SESSION['lastname'])?$_SESSION['lastname']:'User');?>'s Profile</h2>

	<h3 class="pull-right"><?=date('l - F jS, Y');?></h3>
	
	<div class="clearfix"></div>

	<div class="ss_section tabbable" id="ssTabs">
		<ul class="nav nav-tabs">
			<li class="active"><a href="#tab1" data-toggle="tab"><?=(!empty($_SESSION['firstname'])?$_SESSION['firstname']:'Demo');?> <?=(!empty($_SESSION['lastname'])?$_SESSION['lastname']:'User');?></a></li>
			<li><a href="#tab2" data-toggle="tab">History</a></li>
			<li><a href="#tab3" data-toggle="tab">Group(s)</a></li>
		</ul>
			
		<form class="form-horizontal">
		
			<div class="tab-content">
			
				<div class="tab-pane user_details active" id="tab1">
				
					<div class='rows'>
						  <div class="form-group">
							 <label for="firstname" class="col-xs-2 control-label">First Name</label>
							 <div class="col-xs-8">
								<input type="text" class="form-control" name="firstname" id="firstname" placeholder="First Name" value="<?=(!empty($_SESSION['firstname'])?$_SESSION['firstname']:'Demo');?>">
							 </div>
						  </div>
					</div>
					
					<div class='rows'>
						  <div class="form-group">
							 <label for="lastname" class="col-xs-2 control-label">Last Name</label>
							 <div class="col-xs-8">
								<input type="text" class="form-control" name="lastname" id="lastname" placeholder="Last Name" value="<?=(!empty($_SESSION['lastname'])?$_SESSION['lastname']:'User');?>">
							 </div>
					   </div>
					</div>
					
					<div class='rows'>
						  <div class="form-group">
							 <label for="email" class="col-sm-2 control-label">Email</label>
							 <div class="col-sm-8">
								<input type="email" class="form-control" name="email" id="email" placeholder="Email" value="<?=(!empty($_SESSION['email'])?$_SESSION['email']:'');?>">
							 </div>
					   </div>
					</div>

					<div class='rows'>
						  <div class="form-group">
							 <label for="phonenumber" class="col-xs-2 control-label">Phone Number</label>
							 <div class="col-xs-8">
								<input type="text" class="form-control" name="phonenumber" id="phonenumber" placeholder="Phone Number" value="<?=(!empty($_SESSION['phonenumber'])?$_SESSION['phonenumber']:'480-555-8899');?>">
							 </div>
						  </div>
					</div>
					
					<div class='rows'>
						<div class="col-xs-4 col-xs-push-8"><button class="btn btn-lg btn-info">Update Profile</button></div>
					</div>
					
				</div><!--end tab1-->



				<div class="tab-pane" id="tab2">
					<div class='rows master_list'>
						History
					</div>
				</div><!--end tab2-->



				<div class="tab-pane" id="tab3">
					<div class='rows master_list'>
						Group(s)
					</div>
				</div><!--end tab3-->


	
			</div><!--end tab content-->
			
		 </form>
		
			
		<div class="clearfix"></div>
	</div><!--ss_section-->
	
	
	
	


</div><!-- end container -->







<? require($_SERVER['DOCUMENT_ROOT'].'/temp/inc_footer.php'); ?>








</body>
</html>




<script type="text/javascript">
	$('.clicker').click(function(){ 
		var rowid = $(this).data('rowid');
		
		//alert('you clicked .....' + rowid);
		
		// hide/remove
		$('tr#fammember_' + rowid).remove();
		
		$.ajax({
		  method: "POST",
		  url: "db.php", 
		  dataType: 'json',
		  data: { delete: rowid },
		  success: function(response){
				alert(response);  
				console.log(response);
		  }
		})
	});
</script>





<!-- javascript -->
<script src="http://code.jquery.com/jquery-latest.min.js"></script>
<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>









