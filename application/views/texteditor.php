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
              <li class="active"><span>Email Template</span></li>
            </ol>
            <div class="clearfix">
              <h1 class="pull-left">Creat New Email Template</h1>
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
                    <div class="col-md-6">
                    <input id="template" name="template_name" type="text" placeholder="Template Name" class="form-control input-md" value="<?php if(isset($template_info->template_name)){echo $template_info->template_name; } ?>">
                    </div>
                  </div>

             <!-- Textarea -->
                  <div class="form-group">
                    <label class="col-md-3 control-label" for="textarea">Template</label>
                    <div class="col-md-6">                     
                      <textarea class="form-control" id="textarea" name="template"><?php if(isset($template_info->template)){echo $template_info->template; } ?></textarea>
                    </div>
                  </div>
<!-- Text Editor -->
<script>
function iFrameOn(){
  richTextField.document.designMode = 'On';
}
function iBold(){
  richTextField.document.execCommand('bold',false,null); 
}
function iUnderline(){
  richTextField.document.execCommand('underline',false,null);
}
function iItalic(){
  richTextField.document.execCommand('italic',false,null); 
}
function iFontSize(){
  var size = prompt('Enter a size 1 - 7', '');
  richTextField.document.execCommand('FontSize',false,size);
}
function iForeColor(){
  var color = prompt('Define a basic color or apply a hexadecimal color code for advanced colors:', '');
  richTextField.document.execCommand('ForeColor',false,color);
}
function iHorizontalRule(){
  richTextField.document.execCommand('inserthorizontalrule',false,null);
}
function iUnorderedList(){
  richTextField.document.execCommand("InsertOrderedList", false,"newOL");
}
function iOrderedList(){
  richTextField.document.execCommand("InsertUnorderedList", false,"newUL");
}
function iLink(){
  var linkURL = prompt("Enter the URL for this link:", "http://"); 
  richTextField.document.execCommand("CreateLink", false, linkURL);
}
function iUnLink(){
  richTextField.document.execCommand("Unlink", false, null);
}
function iImage(){
  var imgSrc = prompt('Enter image location', '');
    if(imgSrc != null){
        richTextField.document.execCommand('insertimage', false, imgSrc); 
    }
}
function submit_form(){
  var theForm = document.getElementById("myform");
  theForm.elements["myTextArea"].value = window.frames['richTextField'].document.body.innerHTML;
  theForm.submit();
}
</script>
</head>
<body onLoad="iFrameOn();">
<form action="my_parse_file.php" name="myform" id="myform" method="post">


                  <div class="form-group">
                    <label class="col-md-3 control-label" for="event_name">Template Name</label>  
                    <div class="col-md-6">
                    <input id="title" size="80" maxlength="80" name="template_name" type="text" placeholder="Template Name" class="form-control input-md" value="<?php if(isset($template_info->template_name)){echo $template_info->template_name; } ?>">
                    </div>
                  </div>
<div class="form-group">

<div id="wysiwyg_cp" style="padding:8px; width:700px;">
  <input type="button" onClick="iBold()" value="B"> 
  <input type="button" onClick="iUnderline()" value="U">
  <input type="button" onClick="iItalic()" value="I">
  <input type="button" onClick="iFontSize()" value="Text Size">
  <input type="button" onClick="iForeColor()" value="Text Color">
  <input type="button" onClick="iHorizontalRule()" value="HR"> 
  <input type="button" onClick="iUnorderedList()" value="UL">
  <input type="button" onClick="iOrderedList()" value="OL">
  <input type="button" onClick="iLink()" value="Link">
  <input type="button" onClick="iUnLink()" value="UnLink">
  <input type="button" onClick="iImage()" value="Image">
</div>

<!-- Hide(but keep)your normal textarea and place in the iFrame replacement for it -->

<div class="form-group">
                    <label class="col-md-3 control-label" for="textarea">Template</label>
                    <div class="col-md-6">                     
                    <textarea style="display:none;" class="form-control" name="myTextArea" id="myTextArea" cols="100" rows="14"><?php if(isset($template_info->template)){echo $template_info->template; } ?></textarea>

                    <iframe name="richTextField" id="richTextField" style="border:#000000 1px solid; width:465px; height:300px;"></iframe>
                    </div>
                  </div>



<!-- <textarea style="display:none;" name="myTextArea" id="myTextArea" cols="100" rows="14"></textarea>
<iframe name="richTextField" id="richTextField" style="border:#000000 1px solid; width:700px; height:300px;"></iframe> -->
<!-- End replacing your normal textarea -->
</p>
<br /><br /><input name="myBtn" type="button" value="Submit Data" onClick="javascript:submit_form();"/>
</form>
 


<!-- End Text Editor -->  
                  <!-- Submit Button -->
                  <input type="submit" class="btn btn-primary col-xs-2 col-sm-offset-5" name="submit" value="<?php
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
<script type="text/javascript">

  




 $('input[type="radio"]').click(function(){
   if($(this).val() == '1' ){
      $("#paid").show();
    }else{
      $("#paid").hide();
    } 
  });




</script>
