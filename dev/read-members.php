<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');
require($_SERVER['DOCUMENT_ROOT'].'/temp/_vars.php');


?>
<!doctype html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Database FUN!!</title>

<!-- javascript -->
<script src="http://code.jquery.com/jquery-latest.min.js"></script>

<!-- Latest compiled and minified CSS -->
<link rel="stylesheet" href="https://maxcdn.bootstrapcdn.com/bootstrap/3.3.2/css/bootstrap.min.css">
<!-- Custom theme
<link rel="stylesheet" href="style.css"> -->

<style type="text/css">
.form {
	width:450px;
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


<p>&nbsp;</p>

<div class="form">
	<h2>Do stuff to the table</h2>
		<div class="row">
			<div class="col-xs-8">
				<input type="text" name="fullname" class="form-control" data-table="" placeholder="Full Name">
			</div>
			<div class="col-xs-4">
				<div class="btn btn-success clicker" id="fullname">Update Fullname</div>
			</div>
		</div>
		<div class="row">
			<div class="col-xs-8">
				<input type="text" name="age" class="form-control" placeholder="age">
			</div>
			<div class="col-xs-4">
				<div class="btn btn-info clicker" id="age">Update Age</div>
			</div>
		</div>


</div>

<p>&nbsp;</p>

<div class="form">
	<h2>Submit Some Info Via Form</h2>
	<form action="" method="post" class="form-group">
		
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