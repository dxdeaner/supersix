<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>

    <div class="row" style="opacity: 1;">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-12">
            <ol class="breadcrumb">
              <li><a href="#">Home</a></li>
              <li class="active"><span>Email Template</span></li>
            </ol>
            <div class="clearfix">
              <h1 class="pull-left">Email Template</h1>
              <div class="pull-right top-page-ui">
                <a href="<?php echo base_url();?>e_template/add_template" class="btn btn-primary pull-right">
                <i class="fa fa-plus-circle fa-lg"></i> Creat New Template
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
                      <th><span>Template No</span></th>
                      <th><span>Template Name</span></th>
                      <th><span>Create Date</span></th>
                      <th><span>Template</span></th>
                     <th>&nbsp;</th>
                    </tr>
                  </thead>
                  <tbody>
                 <?php // $cou=count($event_info); ?>
                  <?php foreach ($template_info as $row){ ?> 
                   <tr>
                      <td>
                        <?php echo $row->id;?>
                      </td>
                      <td>
                        <a href="#" ><?php echo $row->template_name;?></a>
                      </td>
                      <td>
                        <?php echo $row->create_date;?>
                      </td>
                      <td>
                      <?php                        
                        $text = strip_tags($row->template);
                        $cou = strlen($text);
                        if($cou>60){
                          echo substr($text,0,60);          
                        }else{
                          echo str_pad($text,60,".");
                        } ?>
                       </td>
                      <td style="width: 20%;">
                      <a href="<?php echo base_url();?>e_template/add_template/<?php echo $row->id;?>" class="table-link">
                          <span class="fa-stack">
                          <i class="fa fa-square fa-stack-2x"></i>
                          <i class="fa fa-pencil fa-stack-1x fa-inverse"></i>
                          </span>
                        </a>
                        <a href="<?php echo base_url();?>e_template/delete/<?php echo $row->id;?>" class="table-link danger">
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

<?php  $this->load->view('auth/layout/footer'); ?>

