<?php
if(!is_file($_SERVER['DOCUMENT_ROOT'].'/config.php')) {
	die('missing config filess');
}
require($_SERVER['DOCUMENT_ROOT'].'/config.php');

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

/*
//only allow IPs from Danny and Marc
$ip_allow = array('68.104.224.111', '173.10.26.241', '173.65.182.45');
if(!in_array($_SERVER['REMOTE_ADDR'], $ip_allow)){
	die("you do not belong here!");	
}
