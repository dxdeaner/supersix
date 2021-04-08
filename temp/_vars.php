<?

foreach($_REQUEST as $postkey => $postval){
	$_SESSION[$postkey] = $postval;
}


$logo = '<span class="blue logo">Super</span><span class="orange logo">Six</span>';

$activeuser = 'Deaner';






// set arrrays for super six's
if(!empty($_SESSION['item_00'])) {
	$ss01_title = $_SESSION['item_00'];
} else {
	$ss01_title = 'Work on SuperSix layout';
}
if(!empty($_SESSION['item_desc_00'])) {
	$ss01_desc = $_SESSION['item_desc_00'];
} else {
	$ss01_desc = 'Layout the page as simple as possible like a txt file notepad would be, but include simple intuitive and the minimal amount of features to enhance the capabilities beyond a txt file.';
}


if(!empty($_SESSION['item_01'])) {
	$ss02_title = $_SESSION['item_01'];
} else {
	$ss02_title = 'Get inputs submiting via form';
}
if(!empty($_SESSION['item_desc_01'])) {
	$ss02_desc = $_SESSION['item_desc_01'];
} else {
	$ss02_desc = 'When a input is filled out, it needs to save to txt file database';
}


if(!empty($_SESSION['item_02'])) {
	$ss03_title = $_SESSION['item_02'];
} else {
	$ss03_title = 'Make text file database user specific';
}
if(!empty($_SESSION['item_desc_02'])) {
	$ss03_desc = $_SESSION['item_desc_02'];
} else {
	$ss03_desc = 'Need to separate the database entries into user specific json tables.';
}


if(!empty($_SESSION['item_03'])) {
	$ss04_title = $_SESSION['item_03'];
} else {
	$ss04_title = 'Program updated tasks to save to user profile';
}
if(!empty($_SESSION['item_desc_03'])) {
	$ss04_desc = $_SESSION['item_desc_03'];
} else {
	$ss04_desc = 'Each user will have their own profile and each input content will save to the appropriate user profile table.';
}


if(!empty($_SESSION['item_04'])) {
	$ss05_title = $_SESSION['item_04'];
} else {
	$ss05_title = 'Completed tasks';
}
if(!empty($_SESSION['item_desc_04'])) {
	$ss05_desc = $_SESSION['item_desc_04'];
} else {
	$ss05_desc = 'Completed tasks will save to database as completed and tag the date and time of completion. Deleted tasks will be able to be recovered via completed tasks view.';
}


if(!empty($_SESSION['item_05'])) {
	$ss06_title = $_SESSION['item_05'];
} else {
	$ss06_title = 'User task control';
}
if(!empty($_SESSION['item_desc_05'])) {
	$ss06_desc = $_SESSION['item_desc_05'];
} else {
	$ss06_desc = 'Users can task SuperSixs to other users. (maybe send an email notiication to new SuperSix task owner). Maybe set a due date.';
}




$item_01 = array($ss01_title, $ss01_desc);
$item_02 = array($ss02_title, $ss02_desc);
$item_03 = array($ss03_title, $ss03_desc);
$item_04 = array($ss04_title, $ss04_desc);
$item_05 = array($ss05_title, $ss05_desc);
$item_06 = array($ss06_title, $ss06_desc);

$item_array = array($item_01, $item_02, $item_03, $item_04, $item_05, $item_06);





//set arrays for completed tasks

if(!empty($_SESSION['completed_00'])) {
	$comp01_title = $_SESSION['completed_00'];
} else {
	$comp01_title = 'Completed task title';
}
if(!empty($_SESSION['completed_01'])) {
	$comp02_title = $_SESSION['completed_01'];
} else {
	$comp02_title = 'Another completed task title';
}
if(!empty($_SESSION['completed_02'])) {
	$comp03_title = $_SESSION['completed_02'];
} else {
	$comp03_title = 'A third completed task title';
}
if(!empty($_SESSION['completed_03'])) {
	$comp04_title = $_SESSION['completed_03'];
} else {
	$comp04_title = 'A forth completed task title';
}


$completed_array = array($comp01_title, $comp02_title, $comp03_title, $comp04_title);









?>