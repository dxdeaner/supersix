<?php  $user = $this->ion_auth->user()->row(); ?>
<div id="page-wrapper" class="container">
	<div class="row">
		<div id="nav-col">
			<section id="col-left" class="col-left-nano">
				<div id="col-left-inner" class="col-left-nano-content">
				<div id="user-left-box" class="clearfix hidden-sm hidden-xs dropdown profile2-dropdown">
				<img alt="" src="<?php echo base_url().'assets/img/'.$user->user_img;?>"/>
				<div class="user-box">
				<span class="name">
				<a href="#" class="dropdown-toggle" data-toggle="dropdown">
				<?php echo $user->username;?>
				<i class="fa fa-angle-down"></i>
				</a>
				<ul class="dropdown-menu">
<li><a href="<?php echo base_url();?>admin_manage/index"><i class="fa fa-user"></i>Profile</a></li>
<li><a href="#"><i class="fa fa-cog"></i>Settings</a></li>
<li><a href="#"><i class="fa fa-envelope-o"></i>Messages</a></li>
<li><a href="<?php echo base_url(); ?>User_manage/logout"><i class="fa fa-power-off"></i>Logout</a></li>
</ul>
</span>
</div>
</div>
<div class="collapse navbar-collapse navbar-ex1-collapse" id="sidebar-nav">
<ul class="nav nav-pills nav-stacked">
<li class="nav-header nav-header-first hidden-sm hidden-xs">

</li>
<li>
<a href="<?php echo base_url('auth/index');?>">
<i class="fa fa-dashboard"></i>
<span>Dashboard</span>
<span class="label label-primary label-circle pull-right"></span>
</a>
</li>

<li>
<a href="<?php echo base_url('event');?>">
<i class="fa fa-table"></i>
<span>Task</span>
</a>
</li>

</ul>
</div>
</div>
</section>
<div id="nav-col-submenu"></div>
</div>

<!-- Main Container Start From Here -->

<div id="content-wrapper">
<div class="row">
<div class="col-lg-12">
