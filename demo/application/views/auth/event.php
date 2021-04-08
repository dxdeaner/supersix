<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>
<div class="row" style="opacity: 1;">
  <div class="col-lg-12">
    <div class="row" style="opacity: 1;">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-12">
            <ol class="breadcrumb">
              <li><a href="<?php echo base_url('auth/index');?>">Home</a></li>
              <li class="active"><span>Task</span></li>
            </ol>
            <div class="clearfix">
              <h1 class="pull-left"> Task</h1>
              <div class="pull-right top-page-ui">
                <a href="<?php echo base_url();?>event/create_event" class="btn btn-primary pull-right">
                <i class="fa fa-plus-circle fa-lg"></i> Create New Task
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
                      <th style="width: 10%;"><span>Task Id</span></th>
                      <th style="width: 20%;"><span>Task Title</span></th>
                      <th style="width: 30%;"><span>Task Desc</span></th>
                      <th style="width: 20%;"><span>Created Date</span></th>
                      <th style="width: 20%;">&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                 <?php // $cou=count($event_info); ?>
                  <?php foreach ($event_info as $row){ ?> 
                   <tr>
                      <td>
                        <?php echo $row->id;?>
                      </td>
                      <td>
                        <a href="#" ><?php echo $row->event_name;?></a>
                      </td>
                      <td>
                        <?php echo $row->event_dtl;
                        ?>
                      </td>
                      <td>
                        <?php echo $row->create_date;?>
                      </td>                      
                      <td>
                      <a href="<?php echo base_url();?>event/create_event/<?php echo $row->id;?>" class="table-link">
                          <span class="fa-stack">
                          <i class="fa fa-square fa-stack-2x"></i>
                          <i class="fa fa-pencil fa-stack-1x fa-inverse"></i>
                          </span>
                        </a>
                        <a href="<?php echo base_url();?>event/delete/<?php echo $row->id;?>" class="table-link danger">
                        <span class="fa-stack">
                        <i class="fa fa-square fa-stack-2x"></i>
                        <i class="fa fa-trash-o fa-stack-1x fa-inverse"></i>
                        </span>
                        </a>
                      </td>
                    </tr>
                      <?php } ?>
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
<!-- Container div -->
</div>
</div>
<?php  $this->load->view('auth/layout/footer'); ?>