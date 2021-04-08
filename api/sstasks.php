<?php
require($_SERVER['DOCUMENT_ROOT'].'/apptop.php');

$id = $_REQUEST['id'];


foreach($conn->query("SELECT * FROM tbl_tasks WHERE id_user='$id' ORDER BY id ASC") as $task) { 
	
	$recs[] = $task;
	
}



$s6_resp['code'] = 1;
$s6_resp['result'] = 'Success';
$s6_resp['message'] = 'tasks records found';
$s6_resp['data'] = $recs;


header('HTTP/1.1 200');

echo json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);

