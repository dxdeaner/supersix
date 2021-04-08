<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>
<?php  $user = $this->ion_auth->user()->row(); ?>
<div class="row" style="opacity: 1;">
  <div class="col-lg-12">
    <div class="row">
      <div class="col-lg-12">
        <ol class="breadcrumb">
          <li><a href="<?php echo base_url();?>auth/index">Home</a></li>
            <li class="active"><span>User Profile</span></li>
        </ol>
        <h1>User Profile</h1>
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
            <?php echo $this->session->flashdata('error');?>
        </div>
        <?php }?> 
        <div class="row" id="user-profile">
          <div class="col-lg-3 col-md-4 col-sm-4">
            <div class="main-box clearfix"> 
              <div class="main-box-body clearfix">
                <h2 class="text-center"><?php echo $user->first_name; ?></h2>
                <a id="a_img">
                <img src="<?php echo base_url().'assets/img/user_img/'.$user->user_img;?>" alt="" class="profile-img img-responsive center-block"></a>
                <input type="file" class="hide" name="admin_img" id="admin_img">
                <div class="profile-label">
                  <span class="label label-danger">
                  <?php echo $user->username?></span>
                </div>

                <div class="profile-since">
                  Member since: <?php echo $user->joiningdate ?>
                </div>
              </div>
            </div>
          </div>
          <div class="col-lg-9 col-md-8 col-sm-8">
            <div class="main-box clearfix">
              <div class="tabs-wrapper profile-tabs">
                <ul class="nav nav-tabs">
                  <li class="active">
                    <a href="#basic_info" data-toggle="tab" aria-expanded="true">Basic info</a>
                  </li>
                  <li class="">
                    <a href="#tab-activity" data-toggle="tab" aria-expanded="false">Change Password</a>
                  </li>
                </ul>

<div class="tab-content">
<div class="tab-pane fade active in" id="basic_info">
  <div class="table-responsive">
  <div id="admin_adit">  
    <form method="post" action="<?php echo base_url();?>admin_manage/edit_admin_profile">
    <table class="table">
      <tbody>      
      <tr>
        <td>User Name</td>        
          <td>
          <input class="form-control input-md" type="text" id="username" name="username" value="<?php echo $user->username; ?>">
        </td>
      </tr>
      <tr>
        <td>First Name</td>        
          <td>
          <input class="form-control input-md" type="text" id="first_name" name="first_name" value="<?php echo $user->first_name; ?>">
        </td>
      </tr>
      <tr>
        <td>Last Name</td>        
          <td>
          <input class="form-control input-md" type="text" id="last_name" name="last_name" value="<?php echo $user->last_name; ?>">
        </td>
      </tr>
      <tr>
        <td>Email Id</td>       
            <td>
            <input class="form-control input-md" type="email" id="email" name="email" value="<?php echo $user->email; ?>">
        </td>
      </tr>
      <tr>
        <td>Date of Birth</td>       
          <td>
          <input class="form-control input-md" type="date" id="dob" name="dob" value="<?php echo $user->dob; ?>">
        </td>
      </tr>
      <tr>
        <td>Mobile</td>     
        <td>
          <input class="form-control input-md" type="number" id="mobile" name="mobile" value="<?php echo $user->mobile; ?>"/>
        </td>
      </tr>
      <tr>
        <td>Company</td>     
        <td>
          <input class="form-control input-md" type="text" id="company" name="company" value="<?php echo $user->company; ?>"/>
        </td>
      </tr>
      <tr>
        <td>Address</td>     
        <td>
          <input class="form-control input-md" type="text" id="address" name="address" value="<?php echo $user->address; ?>"/>
        </td>
      </tr>
      <tr>
        <td>Pin Code</td>     
        <td>
          <input class="form-control input-md" type="text" id="pin" name="pin" value="<?php echo $user->pin; ?>"/>
        </td>
      </tr>
      <tr>
        <td>City</td>     
        <td>
          <input class="form-control input-md" type="text" id="city" name="city" value="<?php echo $user->city; ?>"/>
        </td>
      </tr>
    </tbody>
  </table>
  <input type="submit" class="btn btn-primary col-xs-4 col-sm-offset-4" name="submit" value="Update"/>
  </form>
</div>


<div id="inf">
  <table class="table">
    <tbody>
  <tr> 
    <td>User Name</td>       
    <td><?php echo $user->username; ?></td>  
  </tr>
  <tr><td>First Name</td>       
    <td><?php echo $user->first_name; ?></td>  
  </tr>
  <tr>
    <td>Last Name</td>       
    <td><?php echo $user->last_name; ?></td>          
  </tr>
    <tr>
      <td>Email Id</td>         
      <td><?php echo $user->email; ?></td>        
    </tr>
    <tr>
      <td>Date Of Birth</td> 
      <td><?php echo $user->dob; ?></td>
    </tr>
    <tr>
      <td>Mobile</td>
     <td><?php echo $user->mobile; ?></td>
    </tr>
    <tr>
      <td>Company</td>
     <td><?php echo $user->company; ?></td>
    </tr>
    <tr>
      <td>Address</td>
     <td><?php echo $user->address; ?></td>
    </tr>
    <tr>
      <td>Pin Code</td>
     <td><?php echo $user->pin; ?></td>
    </tr>
    <tr>
      <td>City</td>
     <td><?php echo $user->city; ?></td>
    </tr>
    </tbody>
  </table>
  <input type="submit" id="edit" class="btn btn-primary col-xs-4 col-sm-offset-4" name="edit" value="Edit"/>     
</div>
</div> 
</div>
                  
<div class="tab-pane fade" id="tab-activity">
<div id="newsfeed">
          
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
                      <input type="password" class="form-control" id="new_pass" name="new_pass">
                    </div>
                  </div>

                  <!-- Text input-->
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="textinput">Confirm Password</label>  
                    <div class="col-md-6">
                        <input id="confirm_pass" name="confirm_pass" type="password" class="form-control input-md">
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
</div>
</div>
</div>
</div>
</div>

<?php $this->load->view('auth/layout/footer'); ?>

<script type="text/javascript">
  $(document).ready(function(){
    $("#edit").click(function(){
      $('#inf').hide();
        $("#admin_adit").show();
    });
});
</script>

<script>
  $(document).ready(function(){
    $( "#a_img").click(function() {
      $( "#admin_img" ).select();
    });
  });
  
</script>


<script>
function validation(){

        if(validationstr("old_pass")==false){
          alert_message('danger', "Please Enter First Name");
          return false;
        }
        if(validationstr("new_pass")==false){
          alert_message('danger', "Please Enter Description");
          return false;
        }        
        if(validationstr("confirm_pass")==false){
          alert_message('danger', "Please Enter Password");
          return false;
        }
        return true;
    }   
    //$('#id').val('')      
    function validationstr(id){
      var old_pass = document.getElementById('#old_pass').value;
      if(name==""){
            
        document.getElementById(id).focus();
      	return false;
      }
      return true;
    }

    function alert_message(type, message)
    {
      //Types
      // success
      // info
      // warning
      // danger
      if(type == "" || message == ""){
        return false;
      }
      
      $("#page_message").hide();
        
      $("#page_message").html('<div class="alert alert-' + type + ' alert-dismissable">'+
                            '<button type="button" class="close" data-dismiss="alert" aria-hidden="true" onclick="$(this).parent().slideUp(\'slow\')">&times;</button>'+
                            message +
                          '</div>');        
      $("#page_message").slideDown("slow");
    }
</script>

