<?php 
require ("apptop.php"); 

header('Content-Type: application/json');

header('HTTP/1.1 400 Bad Creds');
header('X-SUPERSIX: Error response - None Shall Pass');
$s6_resp['code'] = 0;
$s6_resp['result'] = 'Error';
$s6_resp['message'] = 'None Shall Pass';
//$s6_resp['data'] = '';

//$s6_resp_json = json_encode($s6_resp, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_FORCE_OBJECT);
$s6_resp_json = json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);

die($s6_resp_json);

?>