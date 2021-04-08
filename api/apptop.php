<?php
header('Content-Type: application/json');

if(!is_file('/config.php')) {

	header('HTTP/1.1 500');
	header('X-SUPERSIX: Error response - API is missing config file');
	$s6_resp['code'] = 0;
	$s6_resp['result'] = 'no config file';
	$s6_resp['message'] = 'That config.php is not found';
	//$s6_resp['data'] = '';
	
	//$s6_resp_json = json_encode($s6_resp, JSON_NUMERIC_CHECK | JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_FORCE_OBJECT);
	$s6_resp_json = json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK);
	
	die($s6_resp_json);
}
require('/config.php');

/**
TO DO'S
	- ERRORS HANDLER
	- ALERT HANDLER
	- SESSIONS
	- DB CONNECTOR
	- HELPERS
*/

require('_functions/func.errors.php');
require('_functions/func.alerts.php');
//require('_functions/func.sessions.php');
require('_functions/func.dbconnect.php');
require('_functions/func.helpers.php');


//only allow IPs from Danny and Marc
$ip_allow = array(DANNYSIP, '173.10.26.241', '173.65.182.45');
if(!in_array($_SERVER['REMOTE_ADDR'], $ip_allow)){
	
	//trigger_error('hi marc! ip sucks');

	header('HTTP/1.1 400');
	header('X-SUPERSIXIP: Your IP is - '.$_SERVER['REMOTE_ADDR']);
	$s6_resp['code'] = 0;
	$s6_resp['result'] = 'Denied Access';
	$s6_resp['message'] = 'IP address is not approved by admin';
	die(json_encode($s6_resp, JSON_PRETTY_PRINT | JSON_UNESCAPED_SLASHES | JSON_NUMERIC_CHECK));	
}