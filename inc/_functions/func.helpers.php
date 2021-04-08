<?php

//get user IP
function get_ip(){
    if(!empty($_SERVER['HTTP_X_CLUSTER_CLIENT_IP'])){   
      $ip = $_SERVER['HTTP_X_CLUSTER_CLIENT_IP'];
    }elseif(!empty($_SERVER['HTTP_CLIENT_IP'])){   
      $ip = $_SERVER['HTTP_CLIENT_IP'];
    }elseif(!empty($_SERVER['HTTP_X_FORWARDED_FOR'])){   
      $ip = $_SERVER['HTTP_X_FORWARDED_FOR']; 
    }elseif(!empty($_SERVER['HTTP_X_CLIENT'])){   
      $ip = $_SERVER['HTTP_X_CLIENT']; 
    }else{
      $ip = $_SERVER['REMOTE_ADDR']; 
    }
	 $_SERVER['REMOTE_ADDR'] = $ip;
    return $ip;
}
get_ip();


//get user profile info
//foreach($conn->query('SELECT * FROM tbl_deanfam ORDER BY sortorder ASC') as $row);



