<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>

 <div class="row" style="opacity: 1;">
    <div class="col-lg-12">
    	<div class="row">
        	<div class="col-lg-12">
           		<ol class="breadcrumb">
					<li><a href="#">Home</a></li>
					<li class="active"><span>Dashboard</span></li>
					</ol>
				<div class="clearfix">
					<h1 class="pull-left">Dashboard</h1>
					<div class="pull-right top-page-ui">
						<a href="<?php echo base_url('auth/create_user'); ?>" class="btn btn-primary pull-right">
							<i class="fa fa-plus-circle fa-lg"></i> Add user
						</a>
					</div>
				</div>
			</div>
		</div>

		
		<?php if($this->session->flashdata('message')){ ?>
        <div class="alert alert-success col-lg-10">
            <a href="#" class="close" data-dismiss="alert">&times;</a>
           <?php echo $this->session->flashdata('message'); ?>
        </div>
    <?php }else if($this->session->flashdata('error')){  ?>
        <div class="alert alert-danger">
            <a href="#" class="close" data-dismiss="alert">&times;</a>
            <?php echo $this->session->flashdata('error'); }?>
        </div>
    
		<div class="row">

		<div class="col-lg-12">		
		<div class="main-box no-header clearfix">
		<div class="main-box-body clearfix">
		<div class="table-responsive">
			<table class="table user-list table-hover">
				<thead>
					<tr>
						<th><span>User</span></th>
						<th><span>Full Name</span></th>
						<th><span>Email</span></th>
						<th><span>Designation</span></th>
						<th><span>Country</span></th>
						<th>&nbsp;</th>
					</tr>
				</thead>
				<tbody>
				<?php foreach ($users as $user):?>
				<tr>
					<td>
						<img src="<?php echo base_url().'assets/img/user_img/'.$user->user_img; ?>" alt="">
					</td>
					<td>
						<a href="#"><?php echo $user->first_name.' '.$user->last_name;?></a>
					</td>

					<td>
						<a href="#"><?php echo $user->email;?>
						</a>
					</td>

					<td>
						<?php echo $user->skill;?>			
					</td>
					<td>
						<?php echo $user->country;?>
					</td>
					<td style="width: 20%;">
						<a href="<?php echo base_url("user_manage/create_user/".$user->id) ;?>" class="table-link">
							<span class="fa-stack">
							<i class="fa fa-square fa-stack-2x"></i>
							<i class="fa fa-pencil fa-stack-1x fa-inverse"></i>
							</span>
						</a>
						<a href="<?php echo base_url("user_manage/delete/".$user->id) ;?>" class="table-link danger">
							<span class="fa-stack">
							<i class="fa fa-square fa-stack-2x"></i>
							<i class="fa fa-trash-o fa-stack-1x fa-inverse"></i>
							</span>
						</a>
					</td>
				</tr>
				<?php endforeach;?>						 
				</tbody>
				</table>
			</div>
			</div>
			</div>
			</div>		
	</div>
</div>
<?php $this->load->view('auth/layout/footer'); ?>