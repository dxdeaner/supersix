<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');


if(!empty($_POST['insertuser'])) {
	
	$firstname = $_POST['firstname'];
	$lastname = $_POST['lastname'];
	$email = $_POST['email'];
	$username = $_POST['username'];
	$password = $_POST['password'];
	$datecreated = date('Y-m-d H-i-s');
	$datelastupdated = date('Y-m-d H-i-s');
	
	/*
	echo 'This is what is sent';
	echo '<pre>';
	print_r($_POST);
	echo $datecreated;
	echo '<br>';
	echo $datelastupdated;
	echo '</pre>';
	*/
	
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
	
	/*foreach($row as $key => $val) {
		$_SESSION[$key] = $val;
	}*/

	/*
	echo 'These are returned';
	echo '<pre>';
	print_r($_SESSION);
	echo '</pre>';
	*/
	/*	
	unset($_SESSION['insertuser']);	
	unset($_SESSION['password']);	
	unset($_SESSION['password2']);	
	unset($_SESSION['datecreated']);	
	*/
}
