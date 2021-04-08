<?php



ini_set('error_reporting', E_ALL); // http://php.net/manual/en/errorfunc.constants.php
ini_set('display_errors', SUPER6_DISPLAY_ERRORS); // don't display errors, only log them		
ini_set('log_errors', SUPER6_LOG_ERRORS);
ini_set('error_log', SUPER6_ERRORLOG_LOCATION); // logs trigger_errors()


//if(empty($_SESSION['error']));