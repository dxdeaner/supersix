<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');
require($_SERVER['DOCUMENT_ROOT'].'/temp/_vars.php');


//INSERT (CREATE)
if(!empty($_POST['fullname'])) {
	echo '<pre>';
	print_r($_POST);
	echo '</pre>';
	
	$fullname = $_POST['fullname'];
	$age = $_POST['age'];
	
	$conn->query("INSERT INTO tbl_deanfam (fullname, age) VALUES ('$fullname', '$age')");
}

//UPDATE
/*if(!empty($_GET['update'])) {
	$conn->query("UPDATE tbl_deanfam SET age=$_GET[age] WHERE id=$_GET[userid]");
}*/


//DELETE
if(!empty($_POST['delete'])) { 

	die("do you see me??");
	//$conn->query("DELETE FROM tbl_deanfam WHERE id=$_GET[delete] LIMIT 1");
	//header('Location: db.php');
	//exit;
}

?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Ajax CRUDing</title>

<!-- javascript -->
<script src="http://code.jquery.com/jquery-latest.min.js"></script>

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
<!-- Custom theme
<link rel="stylesheet" href="style.css"> -->

<style type="text/css">
.form {
	width:500px;
	margin:15px auto;
}
.btn {
	width:100%;
}
.row {
	padding-bottom:12px;
}
.pointer {
	cursor:pointer;
}
.alert-hide {
	background:#eee;
	color:#888;
}
.skinnyth {
	width:65px;
}
</style>


</head>

<body>

<div class="container">


<style>
#le_body_row_5_col_2 {
	background-color:rgba(130, 130, 130, 0.5);
}
</style>


<p>
	<table cellpadding="5" cellspacing="5" class="table" id="readdeanfamTBL">
		<tbody id="addrowcontainer">
			<tr>
				<th>ID</th>
				<th>Active</th>
				<th>Fullname</th>
				<th>Age</th>
				<th>Sort</th>
				<th class="skinnyth">Hide</th>
				<th class="skinnyth">Status</th>
				<th class="skinnyth">Delete</th>
			</tr>
		<?
		//READ single entry
		/* //GOOGLE PDO RELATED INFO
		$conn->query('SELECT * FROM tbl_deanfam WHERE id=3') as $row {
			 echo $row['id'].' '.$row['fullname'].' '.$row['age'].'<br />'; //etc...
		};
		*/
		foreach($conn->query('SELECT * FROM tbl_deanfam ORDER BY id ASC') as $row) { ?>
			<tr valign="top" id="fammember_<?=$row['id'];?>"> 
				<td><?=$row['id'];?></td>
				<td><span class="label label-<?=($row['active'] == 1)?'success':'danger';?>" id="dfactiveonoff<?=$row['id'];?>"><?=($row['active'] == 1)?'Active':'Inactive';?></span></td>
				<td><?=$row['fullname'];?></td>
				<td><?=$row['age'];?></td>
				<td><?=$row['sortorder'];?></td>
				
				<td class="alert-hide text-center"><span class="glyphicon glyphicon-eye-close pointer rowhider" data-rowid="<?=$row['id'];?>"></span></td>
				
				<td class="alert-<?=($row['active'] == 1)?'warning':'info';?> text-center">
					<span class="glyphicon glyphicon-<?=($row['active'] == 1)?'minus':'plus';?>-sign pointer memberstatus" data-rowid="<?=$row['id'];?>" data-status="<?=($row['active'] == 1)?'1':'2';?>"></span>
				</td>
				
				<td class="alert-danger text-center"><span class="glyphicon glyphicon-remove pointer deletemember" data-rowid="<?=$row['id'];?>"></span></td>
				
				<!--<td><a href="?delete=<?=$row['id'];?>">X</a></td>-->
			</tr>
		<? } ?>
		</tbody>
	</table> 
</p>

<script type="text/javascript">

	$('.deletemember').click(function(){ 
		
		//alert('you clicked .....' + rowid);
		
		var rowid = $(this).data('rowid');

		console.log('These are the vars that passed -' + rowid );
		
		//var rowid = $(this).data('rowid');

		$.ajax({
		  method: "POST",
		  url: "ajax_crud.php", 
		  dataType: 'json',
		  data: { remove: rowid },
		  beforeSend: function(){
			  	console.log('i happen before send');
			  },
		  complete: function(){
			  	console.log('i happen upon complete');
			  },
		  success: function(response){
				//alert(response);  
				console.log(response);
				
		  },
		  error: function(){
			  	console.log('i happen on error');
		  }
		})
	
	
			// hide/remove
		$('tr#fammember_' + rowid).remove();
		
		$.ajax({
		  method: "POST",
		  url: "ajax_crud.php", 
		  dataType: 'json',
		  data: { delete: rowid },
		  success: function(response){
				alert(response);  
				console.log(response);
		  }
		});


	
	});



	$('.rowhider').click(function(){ 
		var rowid = $(this).data('rowid');
		
		// hide/remove
		$('tr#fammember_' + rowid).remove();
		
		$.ajax({
		  method: "POST",
		  url: "ajax_crud.php", 
		  dataType: 'json',
		  data: { delete: rowid },
		  success: function(response){
				alert(response);  
				console.log(response);
		  }
		});
	});


	$('.memberstatus').click(function(){ 
		
		//alert('you clicked .....' + rowid);
		
		var rowid = $(this).data('rowid');
		var status = $(this).data('status');

		console.log('These are the vars that passed- rowid: ' + rowid + ' status: ' + status );
		
		//var rowid = $(this).data('rowid');
		
		$('span#dfactiveonoff' + rowid).removeClass('label-success').removeClass('label-danger');
		
		if(status == 1) {
			var mynewclass = 'label-danger';
			var spantext = 'Inactive';
		} else {
			var mynewclass = 'label-success';
			var spantext = 'Active';
		}
		$('span#dfactiveonoff' + rowid).addClass(mynewclass).html(spantext);
		console.log('New class is: ' + mynewclass );
		
		
		
		
		$(this).removeClass('glyphicon-minus-sign').removeClass('glyphicon-plus-sign');
		$(this).parent().removeClass('alert-warning').removeClass('alert-info');
		
		if(status == 1) {
			var mynewclass = 'glyphicon-plus-sign';
			var myparentclass = 'alert-info';
		} else {
			var mynewclass = 'glyphicon-minus-sign';
			var myparentclass = 'alert-warning';
		}
		$(this).addClass(mynewclass);
		console.log('my new class is: ' + mynewclass);
		$(this).parent().addClass(myparentclass);		
		console.log('my new parent class is: ' + myparentclass);
		

		if(status == 1) {
			$(this).data('status','2');
			status = 2;
		} else {
			$(this).data('status','1');
			status = 1;
		}

		console.log('This is the new status: ' + status );


		$.ajax({
		  method: "POST",
		  url: "ajax_crud.php", 
		  dataType: 'json',
		  data: { update: status, rowid: rowid },
		  beforeSend: function(){
			  	console.log('i happen before send');
			  },
		  complete: function(){
			  	console.log('i happen upon complete');
			  },
		  success: function(response){
				//alert(response);  
				console.log(response);
				
		  },
		  error: function(){
			  	console.log('i happen on error');
		  }
		});



	});



</script>


<p>&nbsp;</p>
<p>&nbsp;</p>



<div class="form">
	<h2>Submit Some Info Via AJAX</h2>
		
		<input type="text" name="fullname" id="insertfullname" class="form-control" placeholder="Full Name">
		<br>
		<input type="text" name="age" id="insertage" class="form-control" placeholder="age">
		<br>
		<input type="submit" id="addrecordbtn" value="Insert" class="btn btn-lg btn-success addrow_btn">
		<div id="loadingDIV" style="display:none">Thinking... Please wait</div>

</div>


<script type="text/javascript">
	$('#addrecordbtn').click(function(){ 
		$('#addrecordbtn').hide();
		$('#loadingDIV').show();
		
		var insertfullname = $('#insertfullname').val();
		var insertage = $('#insertage').val();
	
		console.log('These are the vars that passed -' + ' age: ' + insertage + ' fullname: ' + insertfullname);
		
		
		//append new tr to elements parent tr
		//$('table#readdeanfamTBL').append('<tr><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td></tr>');

		
		
		$.ajax({
			method: "POST",
			url: "ajax_crud.php", 
			//dataType: 'json',
			data: { insert: 'insert', fullname: insertfullname, age: insertage },
			// beforeSend: function(){
			//  	console.log('i happen before send');
			//  },
			//complete: function(){
			//  	console.log('i happen upon complete');
			//  },
			success: function(response){
				//alert(response);  
				console.log(response);
				//$('table#readdeanfamTBL').append('<tr><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td><td>COLUMN</td></tr>');
				$('table#readdeanfamTBL').append(response);
		  },
		  error: function(){
			  	console.log('i happen on error');
		  }
		});
		
		
		$('#loadingDIV').hide();
		$('#addrecordbtn').show();
		$('#insertfullname').val("");
		$('#insertage').val("");
		
	});


</script>










</div><!-- end container -->



</body>
</html>


<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>


<?
$conn = null; 
?>