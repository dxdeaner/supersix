<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8"/>
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<meta http-equiv="X-UA-Compatible" content="IE=edge,chrome=1"/>
<title>Super Six</title>

<link rel="stylesheet" type="text/css" href="<?php echo base_url();?>assets/css/bootstrap/bootstrap.min.css"/>
 
<script src="<?php echo base_url();?>assets/js/demo-rtl.js"></script>
 
 
<link rel="stylesheet" type="text/css" href="<?php echo base_url();?>assets/css/libs/font-awesome.css"/>

<link rel="stylesheet" type="text/css" href="<?php echo base_url();?>assets/css/libs/nanoscroller.css"/>
 
<link rel="stylesheet" type="text/css" href="<?php echo base_url();?>assets/css/compiled/theme_styles.css"/>
 
 
<link href='//fonts.googleapis.com/css?family=Open+Sans:400,600,700,300|Titillium+Web:200,300,400' rel='stylesheet' type='text/css'>
 
<link type="<?php echo base_url();?>assets/image/x-icon" href="favicon.png" rel="shortcut icon"/>
</head>
<body id="login-page">
<div class="container">
<div class="row">
    <div class="col-xs-12">
        <div id="login-box">
            <div id="login-box-holder">
                <div class="row">
                    <div class="col-xs-12">
                        <div id="infoMessage"><?php //echo $message;?>              
<?php if($message){ ?>
         <div class="alert alert-danger col-lg-10 col-sm-offset-1">
            <a href="#" class="close" data-dismiss="alert">&times;</a>
            <?php echo @$message;?>
        </div>
        <?php }?>
                        </div>


                        <div class="panel-heading">
                        <h1><?php echo lang('forgot_password_heading');?></h1>
                        <p><?php echo lang('forgot_password_subheading');?></p>
                    </div>
            <header id="login-header">
<div id="login-logo">
<img src="<?php echo base_url();?>assets/img/f5.png" alt=""/>
</div>
</header>
<div id="login-box-inner">
 <?php echo form_open("auth/login");?>
<div class="input-group">
<span class="input-group-addon"><i class="fa fa-user"></i></span>
<input type="text" name="identity" value="" id="identity" class="form-control">
</div>
<div class="input-group">
<span class="input-group-addon"><i class="fa fa-key"></i></span>
<input type="password" name="password" value="" id="password" class="form-control">
</div>
<div id="remember-me-wrapper">
<div class="row">
<div class="col-xs-6">
<div class="checkbox-nice">
<input type="checkbox" name="remember" value="1" id="remember">
<label for="remember-me">
Remember me
</label>
</div>
</div>
<a href="<?php echo base_url('auth/forgot_password');?>" id="login-forget-link" class="col-xs-6">
Forgot password?
</a>
</div>
</div>
<div class="col-xs-12">
<button type="submit" class="btn btn-success col-xs-12">Login</button>
</div>
<div class="row">
</div>
</form>
</div>
</div>
</div>
</div>
<!-- <div id="login-box-footer">
<div class="row">
<div class="col-xs-12">
Do not have an account?
<a href="<?php echo base_url('auth/create_user');?>">
Register now
</a>
</div>
</div>
</div> -->
</div>
</div>
</div>
</div>
<div id="config-tool" class="closed">
<a id="config-tool-cog">
<i class="fa fa-cog"></i>
</a>
<div id="config-tool-options">
<h4>Layout Options</h4>
<ul>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-fixed-header"/>
<label for="config-fixed-header">
Fixed Header
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-fixed-sidebar"/>
<label for="config-fixed-sidebar">
Fixed Left Menu
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-fixed-footer"/>
<label for="config-fixed-footer">
Fixed Footer
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-boxed-layout"/>
<label for="config-boxed-layout">
Boxed Layout
</label>
</div>
</li>
<li>
<div class="checkbox-nice">
<input type="checkbox" id="config-rtl-layout"/>
<label for="config-rtl-layout">
Right-to-Left
</label>
</div>
</li>
</ul>
<br/>
<h4>Skin Color</h4>
<ul id="skin-colors" class="clearfix">
<li>
<a class="skin-changer" data-skin="theme-navyBlue" data-toggle="tooltip" title="Navy Blue" style="background-color: #34495e;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-white" data-toggle="tooltip" title="White/Green" style="background-color: #2ecc71;">
</a>
</li>
<li>
<a class="skin-changer blue-gradient" data-skin="theme-blue-gradient" data-toggle="tooltip" title="Gradient">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-greenSea" data-toggle="tooltip" title="Green Sea" style="background-color: #6ff3ad;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-amethyst" data-toggle="tooltip" title="Amethyst" style="background-color: #9b59b6;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-blue" data-toggle="tooltip" title="Blue" style="background-color: #7FC8BA;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-red" data-toggle="tooltip" title="Red" style="background-color: #e74c3c;">
</a>
</li>
<li>
<a class="skin-changer" data-skin="theme-whbl" data-toggle="tooltip" title="White/Blue" style="background-color: #1ABC9C;">
</a>
</li>
</ul>
</div>
</div>


<script src="<?php echo base_url();?>assets/js/demo-skin-changer.js"></script> 

<script src="<?php echo base_url();?>assets/js/jquery.js"></script>

<script src="<?php echo base_url();?>assets/js/bootstrap.js"></script>

<script src="<?php echo base_url();?>assets/js/jquery.nanoscroller.min.js"></script>

<script src="<?php echo base_url();?>assets/js/demo.js"></script>  
 
 
<script src="<?php echo base_url();?>assets/js/scripts.js"></script>
 
</body>
</html>

