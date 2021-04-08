<?php
require($_SERVER['DOCUMENT_ROOT'].'/apptop.php');

//header("Access-Control-Allow-Origin: {$_SERVER['HTTP_ORIGIN']}");
//header('Access-Control-Allow-Credentials: true');
//header('Access-Control-Max-Age: 86400');    // cache for 1 day
//header('Content-Type: text/plain');

if(empty($_REQUEST['username'])) {
	header('HTTP/1.1 400 Bad Request'); //https://www.w3.org/Protocols/rfc2616/rfc2616-sec10.html
	header('X-SUPERSIX: Error response - Missing Username');
	$s6_resp['code'] = 0;
	$s6_resp['result'] = 'Error';
	$s6_resp['message'] = 'You did not send user credentials';
	//$s6_resp['data'] = '';
	
	//$s6_resp_json = json_encode($s6_resp, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_FORCE_OBJECT);
	$s6_resp_json = json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	
	die($s6_resp_json);
}


$username = $_REQUEST['username'];

try { 
	$stmt = $conn->prepare("SELECT * FROM tbl_users WHERE username='$username' LIMIT 1"); 
	$stmt->execute(); 
	$row_arr = $stmt->fetch();
    //echo "Connected successfully";
} catch(PDOException $e) {
    echo "PDO failed: " . $e->getMessage();
}


if(!$row_arr) {
	
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
