<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');

//unset($_SESSION['s6_loggedin']);

header('Content-Type: application/json');
//header('Content-Type: text/plain');

$username = $_POST['username'];


$stmt = $conn->prepare("SELECT * FROM tbl_users WHERE username='$username' LIMIT 1"); 
$stmt->execute(); 
$row_arr = $stmt->fetch();

if(! $row_arr) {
	
	header('HTTP/1.1 400 Bad Creds');
	header('X-SUPERSIX: Error response - User not found');
	$s6_resp['code'] = 0;
	$s6_resp['result'] = 'Error';
	$s6_resp['message'] = 'That user is not found';
	//$s6_resp['data'] = '';
	
	//$s6_resp_json = json_encode($s6_resp, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_FORCE_OBJECT);
	$s6_resp_json = json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	
	die($s6_resp_json);
} 

//$_SESSION['s6_loggedin'] =  $row_arr['id'];


$s6_resp['code'] = 1;
$s6_resp['result'] = 'Success';
$s6_resp['message'] = 'User record found';
$s6_resp['data'] = $row_arr;



header('HTTP/1.1 200');

echo json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
