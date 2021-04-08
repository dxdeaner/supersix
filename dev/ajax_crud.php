<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');
require($_SERVER['DOCUMENT_ROOT'].'/temp/_vars.php');

//header('Content-Type: application/json'); //moved to json code echo below


if(!empty($_POST['insert'])){
	$fullname = $_POST['fullname'];
	$age = $_POST['age'];
	$conn->query("INSERT INTO tbl_deanfam (fullname, age) VALUES ('$fullname', '$age')");
	$insertedID = $conn->lastInsertId();
	
	if(!empty($insertedID)) {
		$response = 'Insert Successful';
	} else {
		$response = 'Insert ERRPR';
	}
	
	$newdata = $conn->query("SELECT * from tbl_deanfam WHERE id=$insertedID LIMIT 1");
	$newdata->execute(); 
	$row = $newdata->fetch();
	
	$id = $row['id'];
	$fullname = $row['fullname'];
	$age = $row['age'];
	$sortorder = $row['sortorder'];
}


if(!empty($_POST['read'])){
	
}


if(!empty($_POST['remove'])){
	$rowid = $_POST['remove'];
	//DELETE
	$conn->query("DELETE from tbl_deanfam WHERE id=$rowid");
}

if(!empty($_POST['update'])){
	$rowid = $_POST['rowid'];
	$status = $_POST['update'];
	//UPDATE
	$conn->query("UPDATE tbl_deanfam SET active=$status WHERE id=$rowid");
}


if(!empty($_POST['insert'])){
	echo '<tr valign="top" id="fammember_'.$id.'"><td>'.$id.'</td><td><span class="label label-success" id="dfactiveonoff'.$id.'">Active</span></td><td>'.$fullname.'</td><td>'.$age.'</td><td>'.$sortorder.'</td><td class="alert-hide text-center"><span class="glyphicon glyphicon-eye-close pointer rowhider" data-rowid="'.$id.'"></span></td><td class="alert-warning text-center"><span class="glyphicon glyphicon-minus-sign pointer memberstatus" data-rowid="'.$id.'" data-status="1"></span></td><td class="alert-danger text-center"><span class="glyphicon glyphicon-remove pointer deletemember" data-rowid="'.$id.'"></span></td></tr>';
} else {
	header('Content-Type: application/json');
	echo json_encode(array('message' => 'good', 'code' => '1', 'fullname' => $fullname, 'age' => $age, 'response' => $response));
}



die();

?>
