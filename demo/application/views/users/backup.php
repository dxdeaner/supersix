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
              <li class="active"><span>Email Template</span></li>
            </ol>
            <div class="clearfix">
              <h1 class="pull-left">Add Template</h1>
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
                    <label class="col-md-3 control-label" for="event_name">Template Name</label>  
                    <div class="col-md-8">
                    <input id="template" name="template_name" type="text" placeholder="Template Name" class="form-control input-md" value="<?php if(isset($template_info->template_name)){echo $template_info->template_name; } ?>">
                    </div>
                  </div>
             <!-- Textarea -->
                   <div class="form-group">
                    <label class="col-md-3 control-label" for="textarea">Template</label>
                    <div class="col-md-8">
                    <input type="hidden" id="input_value" name="template">


<div class="main-box-body clearfix">
  <div id="alerts"></div>
  <div class="btn-toolbar editor-toolbar" data-role="editor-toolbar" data-target="#editor">
    <div class="btn-group">
      <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Font">
        <i class="fa fa-font"></i>
        <b class="caret"></b>
      </a>
      <ul class="dropdown-menu"></ul>
    </div>
    <div class="btn-group">
      <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Font Size">
        <i class="fa fa-text-height"></i>&nbsp;
        <b class="caret"></b>
      </a>
      <ul class="dropdown-menu">
        <li>
          <a data-edit="fontSize 5">
            <font size="5">Huge</font>
          </a>
        </li>
        <li>
          <a data-edit="fontSize 3">
            <font size="3">Normal</font>
          </a>
        </li>
        <li>
          <a data-edit="fontSize 1">
            <font size="1">Small</font>
          </a>
        </li>
      </ul>
    </div>
    <div class="btn-group">
      <a class="btn btn-default" data-edit="bold" title="Bold (Ctrl/Cmd+B)">
        <i class="fa fa-bold"></i>
      </a>
      <a class="btn btn-default" data-edit="italic" title="Italic (Ctrl/Cmd+I)">
        <i class="fa fa-italic"></i>
      </a>
      <a class="btn btn-default" data-edit="strikethrough" title="Strikethrough">
        <i class="fa fa-strikethrough"></i>
      </a>
      <a class="btn btn-default" data-edit="underline" title="Underline (Ctrl/Cmd+U)">
        <i class="fa fa-underline"></i>
      </a>
    </div>
    <div class="btn-group">
      <a class="btn btn-default" data-edit="insertunorderedlist" title="Bullet list">
        <i class="fa fa-list-ul"></i>
      </a>
      <a class="btn btn-default" data-edit="insertorderedlist" title="Number list">
        <i class="fa fa-list-ol"></i>
      </a>
      <a class="btn btn-default" data-edit="outdent" title="Reduce indent (Shift+Tab)">
        <i class="fa fa-dedent"></i>
      </a>
      <a class="btn btn-default" data-edit="indent" title="Indent (Tab)">
        <i class="fa fa-indent"></i>
      </a>
    </div>
    <div class="btn-group">
      <a class="btn btn-default" data-edit="justifyleft" title="Align Left (Ctrl/Cmd+L)">
        <i class="fa fa-align-left"></i>
      </a>
      <a class="btn btn-default" data-edit="justifycenter" title="Center (Ctrl/Cmd+E)">
        <i class="fa fa-align-center"></i>
      </a>
      <a class="btn btn-default" data-edit="justifyright" title="Align Right (Ctrl/Cmd+R)">
        <i class="fa fa-align-right"></i>
      </a>
      <a class="btn btn-default" data-edit="justifyfull" title="Justify (Ctrl/Cmd+J)">
        <i class="fa fa-align-justify"></i>
      </a>
    </div>
    <div class="btn-group">
      <a class="btn btn-default dropdown-toggle" data-toggle="dropdown" title="Hyperlink">
        <i class="fa fa-link"></i>
      </a>
      <div class="dropdown-menu input-append">
        <input class="span2" placeholder="URL" type="text" data-edit="createLink"/>
        <button class="btn" type="button">Add</button>
      </div>
      <a class="btn btn-default" data-edit="unlink" title="Remove Hyperlink">
        <i class="fa fa-cut"></i>
      </a>
    </div>
    <div class="btn-group">
      <a class="btn btn-default" title="Insert picture (or just drag & drop)" id="pictureBtn">
        <i class="fa fa-picture-o"></i>
      </a>
      <input type="file" data-role="magic-overlay" data-target="#pictureBtn" data-edit="insertImage"/>
    </div>
    <div class="btn-group">
      <a class="btn btn-default" data-edit="undo" title="Undo (Ctrl/Cmd+Z)">
        <i class="fa fa-undo"></i>
      </a>
      <a class="btn btn-default" data-edit="redo" title="Redo (Ctrl/Cmd+Y)">
        <i class="fa fa-repeat"></i>
      </a>
    </div>
    <input type="text" data-edit="inserttext" id="voiceBtn" x-webkit-speech="">
    </div>
    <div id="editor" class="wysiwyg-editor" name="template"><?php  if(isset($template_info->template)){echo $template_info->template; } ?></div>
  </div>


                    </div>
                  </div>                  
                  <!-- Submit Button -->
                  <input type="submit" class="btn btn-primary col-xs-2 col-sm-offset-5" name="submit" id="btn_btn" value="<?php
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
      </div>
    </div>
  </div>
<!-- Container div -->
</div>
</div>



 
<?php  $this->load->view('auth/layout/footer'); ?>

<script src="<?php echo base_url();?>assets/js/demo-skin-changer.js"></script>  
<script src="<?php echo base_url();?>assets/js/jquery.js"></script>
<script src="<?php echo base_url();?>assets/js/bootstrap.js"></script>
<script src="<?php echo base_url();?>assets/js/jquery.nanoscroller.min.js"></script>
<script src="<?php echo base_url();?>assets/js/demo.js"></script>  
 
<script src="<?php echo base_url();?>assets/js/jquery.hotkeys.js"></script>
<script src="<?php echo base_url();?>assets/js/bootstrap-wysiwyg.js"></script>
 
<script src="<?php echo base_url();?>assets/js/scripts.js"></script>
<script src="<?php echo base_url();?>assets/js/pace.min.js"></script>
 
<script>
  $(function(){
    function initToolbarBootstrapBindings() {
      var fonts = ['Serif', 'Sans', 'Arial', 'Arial Black', 'Courier', 
            'Courier New', 'Comic Sans MS', 'Helvetica', 'Impact', 'Lucida Grande', 'Lucida Sans', 'Tahoma', 'Times',
            'Times New Roman', 'Verdana'],
        fontTarget = $('[title=Font]').siblings('.dropdown-menu');
      
      $.each(fonts, function (idx, fontName) {
        fontTarget.append($('<li><a data-edit="fontName ' + fontName +'" style="font-family:\''+ fontName +'\'">'+fontName + '</a></li>'));
      });
      $('a[title]').tooltip({container:'body'});
      $('.dropdown-menu input').click(function() {return false;})
        .change(function () {$(this).parent('.dropdown-menu').siblings('.dropdown-toggle').dropdown('toggle');})
        .keydown('esc', function () {this.value='';$(this).change();});

      $('[data-role=magic-overlay]').each(function () { 
        var overlay = $(this), target = $(overlay.data('target')); 
        overlay.css('opacity', 0).css('position', 'absolute').offset(target.offset()).width(target.outerWidth()).height(target.outerHeight());
      });
      if ("onwebkitspeechchange"  in document.createElement("input")) {
        var editorOffset = $('#editor').offset();
        $('#voiceBtn').css('position','absolute').offset({top: editorOffset.top, left: editorOffset.left+$('#editor').innerWidth()-35});
      } else {
        $('#voiceBtn').hide();
      }
    };
    function showErrorAlert (reason, detail) {
      var msg='';
      if (reason==='unsupported-file-type') { msg = "Unsupported format " +detail; }
      else {
        console.log("error uploading file", reason, detail);
      }
      $('<div class="alert"> <button type="button" class="close" data-dismiss="alert">&times;</button>'+ 
       '<strong>File upload error</strong> '+msg+' </div>').prependTo('#alerts');
    };
      initToolbarBootstrapBindings(); 
    $('#editor').wysiwyg({ fileUploadError: showErrorAlert} );
  });
  </script>

<script>
$(document).ready(function(){
    $("#btn_btn").click(function(){
      var e_temp = ($('#editor').html());
      $("#input_value").val(e_temp);
    });
});
debugger;
</script>

</body>
</html>