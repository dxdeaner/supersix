<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>
<div class="row" style="opacity: 1;">
  <div class="col-lg-12">
    <div class="row" style="opacity: 1;">
      <div class="col-lg-12">
        <div class="row">
          <div class="col-lg-12">
            <ol class="breadcrumb">
              <li><a href="#">Home</a></li>
              <!-- <li class="active"><span>Event</span></li> -->
            </ol>
            <div class="clearfix">
              <h1 class="pull-left">Change Password</h1>
            </div>
            
          </div>
        </div>
      <div class="row">
        <div class="col-lg-12">
          <div class="main-box no-header clearfix">
            <div class="main-box-body clearfix">          

                <form class="form-horizontal" action="" method="post">
                  <fieldset>
                  <!-- Text input-->
                  <a>
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="event_name">Old Password</label>  
                    <div class="col-md-6">
                    <input id="old_pass" name="old_pass" type="password" class="form-control input-md">
                    </div>
                  </div>

             <!-- Textarea -->
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="textarea">New Password</label>
                    <div class="col-md-6">                     
                      <input type="password" class="form-control" id="" name="new_pass">
                    </div>
                  </div>

                  <!-- Text input-->
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="textinput">Confirm Password</label>  
                    <div class="col-md-6">
                        <input id="password" name="confirm_pass" type="password" class="form-control input-md">
                    </div>
                  </div>

                  <input type="submit" class="btn btn-primary col-xs-4 col-sm-offset-4" name="submit" value="Change Password">
                  </a>
                  </fieldset>
                  </form> 
            
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
<!-- Container div -->
</div>
</div>
<?php $this->load->view('auth/layout/footer'); ?>