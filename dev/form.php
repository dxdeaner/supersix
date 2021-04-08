<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');
require($_SERVER['DOCUMENT_ROOT'].'/temp/_vars.php');


/** INSERT (CREATE)*/
if(!empty($_POST['insert'])) {
	echo '<pre>';
	print_r($_POST);
	echo '</pre>';
	
	$fullname = $_POST['fullname'];
	$age = $_POST['age'];
	
	$conn->query("INSERT INTO tbl_deanfam (fullname, age) VALUES ('$fullname', '$age')");
}



// UPDATE
if(!empty($_POST['update'])) {
	echo '<pre>';
	print_r($_POST);
	echo '</pre>';
	$conn->query("UPDATE tbl_deanfam SET age=$_POST[age], fullname='$_POST[fullname]' WHERE id=$_POST[id]");
}



/** DELETE
if(!empty($_POST['delete'])) { 

	die("do you see me??");
	//$conn->query("DELETE FROM tbl_deanfam WHERE id=$_GET[delete] LIMIT 1");
	//header('Location: db.php');
	//exit;
}
*/
?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Form CRUDingJ</title>

<!-- javascript -->
<script src="http://code.jquery.com/jquery-latest.min.js"></script>

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
<!-- Custom theme
<link rel="stylesheet" href="style.css"> -->

<style type="text/css">
.form {
	width:800px;
	margin:15px auto;
}
.btn {
	width:100%;
}
.row {
	padding-bottom:12px;
}
.clicker {
	cursor:pointer;
}
</style>


</head>

<body>

<div class="container">


<p>
	<table cellpadding="5" cellspacing="5" class="table">
		<tr>
			<th>ID</th>
			<th>Fullname</th>
			<th>Age</th>
			<th>Sort</th>
			<th>Delete</th>
		</tr>
<?
//READ single entry
/* //GOOGLE PDO RELATED INFO
$conn->query('SELECT * FROM tbl_deanfam WHERE id=3') as $row {
    echo $row['id'].' '.$row['fullname'].' '.$row['age'].'<br />'; //etc...
};
*/
	foreach($conn->query('SELECT * FROM tbl_deanfam ORDER BY sortorder ASC') as $row) { ?>
		<tr valign="top" id="fammember_<?=$row['id'];?>"> 
    		<td><?=$row['id'];?></td>
			<td><?=$row['fullname'];?></td>
			<td><?=$row['age'];?></td>
			<td><?=$row['sortorder'];?></td>
			
			<td><span class="glyphicon glyphicon-remove clicker" data-rowid="<?=$row['id'];?>"></span></td>
			
    		<!--<td><a href="?delete=<?=$row['id'];?>">X</a></td>-->
		</tr>
	<? } ?>
	</table> 
</p>

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


<!--<p>&nbsp;</p>

<div class="form">
	<h2>Do stuff to the table</h2>
	
	<div class="row">
		<div class="col-xs-3">
			<select name="" class="form-control">
				<option value="" selected>Select a record</option>
				<?php 
					foreach($conn->query('SELECT * FROM tbl_deanfam') as $row) { ?>
					<option value="<?=$row['id'];?>"><?=$row['fullname'];?></option>
				<?php } ?>
			</select>
		</div>
		<div class="col-xs-6">
			<input type="text" name="fullname" id="fullname" class="form-control" placeholder="Full Name">
		</div>
		<div class="col-xs-3">
			<div class="btn btn-success clickupdate" data-recordid="" id="fullname">Update Fullname</div>
		</div>
	</div>

</div>--><!--end form-->



<p>&nbsp;</p>




	<div class="wrapper">
		<div class="row">
			<div class="col-xs-1"><strong>ID</strong></div>
			<div class="col-xs-6">&nbsp;&nbsp;<strong>User</strong></div>
			<div class="col-xs-2">&nbsp;&nbsp;<strong>Age</strong></div>
			<div class="col-xs-3">&nbsp;</div>
		</div>
			
		<?php 
		foreach($conn->query('SELECT * FROM tbl_deanfam') as $row) { ?>
			<form method="post" action="">
				<input type="hidden" name="id" value="<?=$row['id'];?>" />
				<input type="hidden" name="update" value="yes" />
				
				<div class="row">
					<div class="col-xs-1">
						<?=$row['id'];?>
					</div>
					<div class="col-xs-6">
						<input name="fullname" class="form-control" value="<?=$row['fullname'];?>" />
					</div>
					<div class="col-xs-2">
						<input name="age" class="form-control" value="<?=$row['age'];?>" />
					</div>
					<div class="col-xs-3">
						<input type="submit" class="btn btn-success" value="Update Record">
					</div>
				</div>
				
			</form>
		<?php } ?>
		
	</div><!--end wrapper-->






<p>&nbsp;</p>

<div class="form">
	<h2>Submit Some Info Via Form</h2>
	<form action="" method="post" class="form-group">
		<input type="hidden" name="insert" value="yes" />
		
		<input type="text" name="fullname" class="form-control" placeholder="Full Name">
		<br>
		<input type="text" name="age" class="form-control" placeholder="age">
		<br>
		<input type="submit" value="Insert" class="btn btn-lg btn success">
		
	</form>
</div>


</div><!-- end container -->



</body>
</html>


<!-- Latest compiled and minified JavaScript -->
<script src="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/js/bootstrap.min.js"></script>


<?
$conn = null; 
?>