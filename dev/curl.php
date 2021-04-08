<?





//////////////////////////////	

$username = '';
$password = '';



$fields['pattern'] = '800*';
$fields['quantity'] = '5';
$fields['consecutive'] = true;
//$gw_api_query = http_build_query($fields);
$gw_api_query = json_encode($fields);
////////////////////////////////////////////////////////////////////////////////////////////////
		
$url = "https://cbd.warplite.com/cbalerts";
$ch = curl_init($url); // create a new cURL resource 
//curl_setopt($ch, CURLOPT_POST, true); 
//curl_setopt($ch, CURLOPT_POSTFIELDS, $gw_api_query); 
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1); 
curl_setopt($ch, CURLOPT_SSL_VERIFYHOST,  2); // verify the certificate's name against host
curl_setopt($ch, CURLOPT_SSL_VERIFYPEER, FALSE);   

curl_setopt($ch, CURLOPT_USERPWD, $username . ":" . $password);

curl_setopt($ch, CURLOPT_HTTPHEADER, array('X-DannyDeaner: Whatever Man, Whatever', 'Accept: application/json', 'Content-Type: application/json'));	
curl_setopt($ch, CURLINFO_HEADER_OUT, true);
curl_setopt($ch, CURLOPT_HEADER, 1);
curl_setopt($ch, CURLOPT_VERBOSE, true);

	
$raw_gateway_response = curl_exec($ch); 
$errno  = curl_errno($ch); 
$errmsg = curl_error($ch);
$httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
$headersSent = curl_getinfo($ch, CURLINFO_HEADER_OUT);
		
echo "<br>--------------------------------------------------<br>";
echo "<br> Headers Sent:<br>";
echo $headersSent;
echo "<br> Payload Sent:<br>";
echo $gw_api_query;
echo "<br>--------------------------------------------------<br>";
echo "<br>--------------------------------------------------<br>";
echo $raw_gateway_response;
echo "<br>--------------------------------------------------<br>";



/**


*/






?>