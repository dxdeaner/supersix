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
              <li class="active"><span>Task</span></li>
            </ol>
            <div class="clearfix">
              <h1 class="pull-left">Create New Task</h1>
            </div>
            
          </div>
        </div>
      <div class="row">
        <div class="col-lg-12">
          <div class="main-box no-header clearfix">
            <div class="main-box-body clearfix">          

                <form class="form-horizontal" method="post">
                  <fieldset>
                  <!-- Text input-->
                  <a>
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="event_name">Task Title</label>  
                    <div class="col-md-6">
                    <input id="event_name" name="event_name" type="text" placeholder="Event Name" class="form-control input-md" value="<?php if(isset($event->event_name)){echo $event->event_name; } ?>">
                    </div>
                  </div>

             <!-- Textarea -->
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="textarea">Task Description</label>
                    <div class="col-md-6">                     
                      <textarea class="form-control" id="textarea" name="event_detel"><?php if(isset($event->event_dtl)){echo $event->event_dtl; } ?></textarea>
                    </div>
                  </div>

                  <!-- Text input-->
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="textinput">Date</label>  
                    <div class="col-md-6">
                    <input id="textinput" name="event_date" type="date" placeholder="Start Date" class="form-control input-md" value="<?php if(isset($event->event_date)){echo $event->event_date; } ?>">
                    </div>
                  </div>

                  <!-- Multiple Checkboxes -->

                  <!-- <div class="form-group">
                    <label class="col-md-3 control-label" for="event_name">Venue</label>  
                    <div class="col-md-6">
                    <input id="event_name" name="venue" type="text" placeholder="Venue" class="form-control input-md" value="<?php if(isset($event->venue)){echo $event->venue; } ?>">                    
                    </div>
                  </div> -->

                   <!-- Multiple Checkboxes -->

                  <!-- <div class="form-group">
                    <label class="col-md-3 control-label" for="event_name">Street</label>  
                    <div class="col-md-6">
                    <input id="street" name="street" type="text" placeholder="Street" class="form-control input-md" value="<?php if(isset($event->street)){echo $event->street; } ?>">                   
                    </div>
                  </div> -->

                  <!-- Multiple Checkboxes -->
                  <!-- <div class="form-group">
                    <label class="col-md-3 control-label" for="checkboxes">Participation Access</label>
                    <div class="col-md-2">
                    <div class="checkbox">
                      <label for="checkboxes-0">
                        <input type="radio" name="checkboxes" id="checkboxes-0" value="1"<?php 
                        if(isset($event->participation_access)){
                         if($event->participation_access==1){echo "checked";}} ?> >  
                         Paid
                      </label>
                      </div>

                    <div class="checkbox">
                      <label for="checkboxes-1">
                        <input type="radio" name="checkboxes" id="checkboxes-1" value="2" <?php 
                        if(isset($event->participation_access)){
                          if($event->participation_access==2){echo "checked";} } ?> >
                        Invite only
                      </label>
                    </div>
                    <div class="checkbox">
                      <label for="checkboxes-2">
                        <input type="radio" name="checkboxes" id="checkboxes-2" value="3" <?php 
                        if(isset($event->participation_access)){
                        if($event->participation_access==3) { echo "checked"; } } ?> >
                        Open
                      </label>
                    </div>
                    </div>
                  
                  <div id="paid" style="display: none;">
                    <div class="col-md-2">
                      <input id="amount" name="amount" type="number" min="50" class="form-control input-md" value="<?php if(isset($event->entry_fees)){echo $event->entry_fees; } ?>" placeholder="Amount">
                    </div>
                  </div>
                </div> -->

                <!-- dropdown -->               

                <div class="form-group">
                  <label class="col-md-3 control-label">Employee</label>  
                  <div class="col-sm-6">
                    <select style="width:300px" id="sel2Multi" name="users[]" multiple>
                      <?php foreach ($users as $value) {
                         $user1[$value->username]=$value->username;
                      ?>
                      <option value="<?php echo $value->id;?>"><?php echo $value->username;?></option>
                      <?php } ?>
                    </select>            
                  </div>
                </div>
                <!--  close dropdown -->

      
                  <!-- Submit Button -->
                  <input type="submit" class="btn btn-primary col-xs-4 col-sm-offset-4" name="submit" value="<?php
                  if(isset($event->event_name)){ 
                    echo 'Update Task';
                  }else{
                      echo 'Create Task';
                  } ?>">
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



 
<script src="<?php echo base_url();?>assets/js/jquery.js"></script>
<script src="<?php echo base_url();?>assets/js/bootstrap.js"></script>
<script src="<?php echo base_url();?>assets/js/jquery.nanoscroller.min.js"></script>
<script src="<?php echo base_url();?>assets/js/select2.min.js"></script>

<script type="text/javascript">

  
 $('input[type="radio"]').click(function(){
   if($(this).val() == '1' ){
      $("#paid").show();
    }else{
      $("#paid").hide();
    } 
  });
</script>

<script>
  $(function($) {
    debugger;
    <?php if(isset($event->participation_access) && $event->participation_access==1){ ?>
      $('#paid').show();
    <?php } ?>
    //tooltip init
    $('#exampleTooltip').tooltip();

    //nice select boxes
    $('#sel2').select2();
    
    $('#sel2Multi').select2({
      placeholder: 'Select Employee',
      allowClear: true
    });
  
    //masked inputs
    $("#maskedDate").mask("99/99/9999");
    $("#maskedPhone").mask("(999) 999-9999");
    $("#maskedPhoneExt").mask("(999) 999-9999? x99999");
    $("#maskedTax").mask("99-9999999");
    $("#maskedSsn").mask("999-99-9999");
    
    $("#maskedProductKey").mask("a*-999-a999",{placeholder:" ",completed:function(){alert("You typed the following: "+this.val());}});
    
    $.mask.definitions['~']='[+-]';
    $("#maskedEye").mask("~9.99 ~9.99 999");
  
    //datepicker
    $('#datepickerDate').datepicker({
      format: 'mm-dd-yyyy'
    });

    $('#datepickerDateComponent').datepicker();
    
    //daterange picker
    $('#datepickerDateRange').daterangepicker();
    
    //timepicker
    $('#timepicker').timepicker({
      minuteStep: 5,
      showSeconds: true,
      showMeridian: false,
      disableFocus: false,
      showWidget: true
    }).focus(function() {
      $(this).next().trigger('click');
    });
    
    //autocomplete simple
    $('#exampleAutocompleteSimple').typeahead({                              
      prefetch: '/data/countries.json',
      limit: 10
    });
    
    //autocomplete with templating
    $('#exampleAutocomplete').typeahead({                              
      name: 'twitter-oss',                                                        
      prefetch: '/data/repos.json',                                             
      template: [                                                              
        '<p class="repo-language">{{language}}</p>',                              
        '<p class="repo-name">{{name}}</p>',                                      
        '<p class="repo-description">{{description}}</p>'                         
      ].join(''),                                                                 
      engine: Hogan                                                               
    });
    
    //password strength meter
    $('#examplePwdMeter').pwstrength({
      label: '.pwdstrength-label'
    });
    
  });
  </script>
<?php  $this->load->view('auth/layout/footer'); ?>