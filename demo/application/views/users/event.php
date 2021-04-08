<?php $this->load->view('users/layout/header'); ?>
<?php $this->load->view('users/layout/sidebar'); ?>

<div class="row" style="opacity: 1;">
  <div class="col-lg-12">
    <div class="row" style="opacity: 1;">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-12">
            <ol class="breadcrumb">
              <li><a href="<?php echo base_url('users/user_dashboard');?>">Home</a></li>
              <li class="active"><span>Event</span></li>
            </ol>
            <div class="clearfix">
              <h1 class="pull-left"> Event</h1>             
            </div>
          </div>
        </div>
      
      <div class="row">
        <div class="col-lg-12">
          <div class="main-box no-header clearfix">
            <div class="main-box-body clearfix">
              <div class="table-responsive">
                <table class="table user-list table-hover">
                  <thead>
                    <tr>
                      <th><span>Event No</span></th>
                      <th><span>Event Name</span></th>
                      <th><span>Event Date</span></th>
                      <th><span>Venue</span></th>
                      <th><span>Street</span></th>
                      <th>&nbsp;</th>
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
                        <a href="#" >
                          <?php echo $row->event_name;?></a>
                      </td>
                      <td><span class="label label-success">
                        <?php echo $row->event_date;
                        ?>                          
                          </span>                        
                      </td>
                      <td>
                        <?php echo $row->venue;?>
                      </td>
                      <td>
                        <?php echo $row->street;?>
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





<?php  $this->load->view('users/layout/footer'); ?>