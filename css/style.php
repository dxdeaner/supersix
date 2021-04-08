<?php
    header("Content-type: text/css; charset: UTF-8");

$orange = "#ef6746";
$yellow = "#fec65f";

?>

.orange {
	color: <?php echo $orange; ?>; 
}

.yellow {
	color: #fec65f;
}

.green {
	color: #7bc9a5;
}

.blue {
	color: #4cc3d9;
}

.purple {
	color: #93658d;
}

.grey {
	color: #414141;
}



html, body {
	height:101%;
}

body {
	padding: 0 0 85px;
	margin: 0;
	font-family: 'Arimo', sans-serif;
	font-size: 16px;
	color: #2b2b2b;
	background: @orange;
}

.navbar {
	background: #414141;
	border-radius: 0;
}

h1, h2 {
	font-weight: bold;
}

h2 {
	margin-bottom:1.1em;
}

h3 {
	font-size:20px;
}

.logo {
	letter-spacing: -3px;
	font-weight: bold;
	font-size: 1.12em;
	;
}

a:active, a:focus {
	outline:none;
}


ol {
}

li {
}

.top_item {
	padding-left: 2em;
}

.form-control {
	border: 0 0 1px 0;
	border-radius:0;
	box-shadow: none;
}

.form-control[type="text"] {
	border-top: 0;
	border-right: 0;
	border-left: 0;
	box-shadow: none;
	border-radius: 0;
	border-color: #414141 !important;
	font-weight: bold;
	font-size: 1.2em;
}

.form-control[type="text"]:focus {
	box-shadow:none;
	background:#fffae2;
	transition: background-color .3s;
	-webkit-transition: background-color .3s;
}

textarea.form-control {
	border: 0;
	height:auto;
}
textarea {
	font-weight:100;
}
textarea:focus {
	box-shadow:none !important;
	background:#c3e6d6;
	transition: background-color .3s;
	-webkit-transition: background-color .3s;
}

.navbar {
	color:#fff;
}

.navbar-right {
	margin-right:25px;
	font-size:1.7em;
	font-weight:600;
}

.save_task input[type="checkbox"] {
	border:0 !important;
	box-shadow:none !important;
	list-style-image:url(../images/check-task.png) none;
	cursor:pointer;
}
.save_task input[type="checkbox"]:hover {
	list-style-image:url(../images/check-completed-task.png) none;	
}

.ti_list_description {
	padding: 12px 0;
}

input[type="checkbox"] {
	margin-bottom:-33px;
	border:0;
}

.master_list {
	counter-reset: my-badass-counter;
}

.master_list dt {
	position: relative;
	font: bold 16px ;
	padding: 4px 0 10px 0;
}

.master_list dt:before {
	content: counter(my-badass-counter);
	counter-increment: my-badass-counter;
	position: absolute;
	left: 0;
	top: 0;
	font: bold 65px/1.2 "Arimo";
	color:#ef846a;
}

.master_list dd {
	margin: 0 0 35px 0;
	font-size:.9em;
}
.master_list dd h4 {
	color:#7bc9a5;
	font-weight:bold;
	font-size:1.05em;
	margin-left:12px;
}

.master_list dt, .master_list dd {
	padding-left: 50px;
}

.ss_section {
}

.rows {
	clear:both;
	min-height: 4.5em;
}

.action_box, .action_box div {
	padding:0;
	margin:0;
}

.complete, .delete, .save, .assign, .move {
	width:100%;
	color:#fff;
	text-align:center;
	cursor:pointer;
	font-size: 1.6em;
	min-height: 1.8em;
	padding-top: 0.4em !important;
	text-shadow:.5px .5px 0 #222;
}

.complete {
	height:139px !important;
	background:#ac89a6;
	padding-top: 48px !important;
}
.complete:hover {
	background:#93658d;
}

.delete {
	background:#ce6f52;
}
.delete:hover {
	background:#c0310e;
}

.save {
	background:#6fa985;
	border:0 none;
	padding-top:0;
}
.save:hover {
	background:#23925f;
}

.assign {
	background:#88d2e4;
}
.assign:hover {
	background:#4AC3DA;
}


.move  {
	background:#ac89a6;
}
.move:hover {
	background:#93658d;
}

.spacer {
	clear:both;
	margin:50px 0;
}

.hr {
	height:1px;
	background:#c5c5c5;
	width:100%;
}

.tabbable dl {
	margin-top:40px;
}

.tabbable .rows {
	padding-top:20px;
}

.nav-tabs {
	border-bottom-width:1px;
}

.hover_show > div {
	display:none;
}
.hover_show > div:first-child, .hover_show > div:first-child {
	display:block;
}
.hover_show > div:hover + div, .hover_hide:hover {
    display: block;
}




















