<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>
<div class="col-lg-12">
  <div class="row">
    <div id="login-box-inner">
    <?php if(!isset($userinfo->id)){   ?>
      <h1>Create User</h1>
      <?php } else { ?>
      <h1>Update User</h1><?php } ?>

    <?php if($this->session->flashdata('success')){ ?>
        <div class="alert alert-success col-lg-11">
            <a href="#" class="close" data-dismiss="alert">&times;</a>
           <?php echo $this->session->flashdata('success'); ?>
        </div>
    <?php }else if($this->session->flashdata('error')){  ?>
        <div class="alert alert-danger">
            <a href="#" class="close" data-dismiss="alert">&times;</a>
            <?php echo $this->session->flashdata('error'); ?>
        </div><?php } ?>

      <form method="POST" action="<?php echo base_url();?>user_manage/create_user<?php echo '/'.$this->uri->segment(3);?>" name="add_user" enctype="multipart/form-data" onsubmit="return validate()">
           <div class="col-lg-6">
              <input type="text" class="form-control" name="first_name" value="<?php if(isset($userinfo->first_name)){ echo $userinfo->first_name; } ?>" id="first_name" placeholder="First Name" required>
            </div>

            <div class="col-lg-6">    
              <input type="text" class="form-control" name="last_name" value="<?php if(isset($userinfo->last_name)){ echo $userinfo->last_name; } ?>" id="last_name" placeholder="Last Name">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="user_name" value="<?php if(isset($userinfo->username)){ echo $userinfo->username; } ?>" id="user_name" placeholder="User Name" > 
            </div>


            <div class="col-lg-6">
              <input type="email" class="form-control" name="email" value="<?php if(isset($userinfo->email)){ echo $userinfo->email; } ?>" id="email" placeholder="Email Id">
            </div>

            <?php if(!isset($userinfo->password)){ ?>
            <div class="col-lg-6">
              <input type="password" class="form-control" name="password" value="" id="password" placeholder="Password">
            </div>

            <div class="col-lg-6">
              <input type="password" class="form-control" name="password_confirm" value="" id="password_confirm" placeholder="Confirm Password">
            </div>
            <?php } ?>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="company" value="<?php if(isset($userinfo->company)){ echo $userinfo->company; } ?>" id="company" placeholder="Company">
            </div>

            <div class="col-lg-6">
              <input type="date" class="form-control" name="dob" value="<?php if(isset($userinfo->dob)){ echo $userinfo->dob; } ?>" id="" placeholder="Date Of Birth">
            </div>

            <div class="col-lg-6">
              <select type="text" class="form-control" name="gender" id="gender" value="<?php if(isset($userinfo->gender)){ echo $userinfo->gender; } ?>">
              <option value="1">Male</option>
              <option value="2">Female</option>

            </select>
            </div>


            <div class="col-lg-6">
              <input type="text" class="form-control" name="phone" value="<?php if(isset($userinfo->phone)){ echo $userinfo->phone; } ?>" id="phone" placeholder="Phone">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="mobile" value="<?php if(isset($userinfo->mobile)){ echo $userinfo->mobile; } ?>" id="mobile" placeholder="Mobile No" maxlength="10" minlength="10">
            </div>

             <div class="col-lg-6">
              <input type="text" class="form-control" name="skill" value="<?php if(isset($userinfo->skill)){ echo $userinfo->skill; } ?>" id="skill" placeholder="Designation">
            </div>

            <div class="col-lg-6">
              <input type="date" value="<?php if(isset($userinfo->joiningdate)){ echo $userinfo->joiningdate; } ?>" class="form-control" name="joiningdate" id="joiningdate">
            </div>

             <div class="col-lg-6">
              <input type="text" class="form-control" name="experience" value="<?php if(isset($userinfo->experience)){ echo $userinfo->experience; } ?>" id="experience" placeholder="Experience">
            </div>
            
            <div class="col-lg-6">
              <input type="text" class="form-control" name="address" value="<?php if(isset($userinfo->address)){ echo $userinfo->address; } ?>" id="address" placeholder="Address">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="paddress" value="<?php if(isset($userinfo->paddress)){ echo $userinfo->paddress; } ?>" id="paddress" placeholder="Permanent Address">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="pin" value="<?php if(isset($userinfo->pin)){ echo $userinfo->pin; } ?>" id="pin" placeholder="Postal Code">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="city" value="<?php if(isset($userinfo->city)){ echo $userinfo->city; } ?>" id="city" placeholder="City">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="state" value="<?php if(isset($userinfo->state)){ echo $userinfo->state; } ?>" id="state" placeholder="State">
            </div>

            <div class="col-lg-6">
              <input type="text" class="form-control" name="country" value="<?php if(isset($userinfo->country)){ echo $userinfo->country; } ?>" id="country" placeholder="Country">
            </div>

             <div class="col-lg-6">
              <input type="file" class="form-control" name="userfile">
            </div>

            <div class="btn_mar">
              <input type="submit" class="btn btn-primary col-xs-4 col-sm-offset-4" name="submit" value="<?php if(isset($userinfo) && count($userinfo)>0){echo "Update" ;}else{echo "Create User" ;} ?>">
            </div>
            </form>            
        <div class="clearfix"></div>
      </div>
    </div>
  </div>




<?php  $this->load->view('auth/layout/footer'); ?>
