<?php $this->load->view('auth/layout/header'); ?>
<?php $this->load->view('auth/layout/sidebar'); ?>

<div class="row">
  <div class="col-lg-12">
    <ol class="breadcrumb">
      <li><a href="<?php echo base_url('auth/index');?>">Home</a></li>
      <li class="active"><span>Email Template</span></li>
    </ol>
    <div class="clearfix">
      <h1 class="pull-left">Add Template</h1>
    </div>
  </div>
</div>        
<div class="row">
  <div class="col-lg-12">
    <div class="main-box clearfix" style="min-height: 520px;">
      <header class="main-box-header clearfix"></header>
      <form class="form-horizontal" method="post">
        <fieldset>

          <!-- Text input-->
          <a>
            <div class="form-group">
              <label class="col-md-3 control-label" for="event_name">Template Name</label>
              <div class="col-md-8">
                <input id="template" name="template_name" type="text" placeholder="Template Name" class="form-control input-md" value="<?php if(isset($template_info->template_name)){echo $template_info->template_name; } ?>">
                </div>
              </div>

              <!-- Textarea -->
              <div class="main-box-body clearfix">
                <div class="form-group">
                  <label class="col-md-3 control-label" for="event_name">Template</label>
                  <div class="col-md-8">
                    <textarea name="template" class="form-control ckeditor" id="exampleTextarea" rows="3"><?php  if(isset($template_info->template)){echo $template_info->template; } ?></textarea>
                  </div>
                </div>
                <input type="submit" class="btn btn-primary col-xs-2 col-sm-offset-5" name="submit" id="btn_btn" value="
                  <?php
                  if(isset($template_info->id)){ 
                    echo 'Update Template';
                  }else{
                      echo 'Create Template';
                  } ?>">
                </a>
              </fieldset>
            </form>
          </div>
        </div>
      </div>

<?php  $this->load->view('auth/layout/footer'); ?>
