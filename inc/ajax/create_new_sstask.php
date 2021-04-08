<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');
require($_SERVER['DOCUMENT_ROOT'].'/temp/_vars.php');


if(!empty($_POST['inserttask'])) {
	
	$userid = $_POST['userid'];
	
	$conn->query("INSERT INTO tbl_tasks (id_user) VALUES ('$userid')");
	$insertedID = $conn->lastInsertId();
	
	if(!empty($insertedID)) {
		$response = 'Insert Successful';
	} else {
		$response = 'Insert ERROR';
	}
	
	$newdata = $conn->query("SELECT * from tbl_tasks WHERE id=$insertedID LIMIT 1");
	$newdata->execute(); 
	$task = $newdata->fetch();
	
	$taskid = $task['id'];
	
}

?>

	<div class="rows hover_show">
		<div class="col-xs-10">
			<dt>
				<input type="text" name="item_title_<?=$taskid;?>" id="item_title_<?=$taskid;?>" class="form-control" placeholder="Enter The Task Title" value="">
			</dt>
			<dd>
				<textarea class="form-control" name="item_desc_<?=$taskid;?>" id="item_desc_<?=$taskid;?>"></textarea>
			</dd>
		</div>
		<div class="col-xs-2 hover_hide action_box">
			<div class="col-xs-6">
				<button type="submit" class="save glyphicon glyphicon-floppy-disk" title="Save Changes" data-saveTaskID="<?=$taskid;?>" id="saveTask<?=$taskid;?>"></button>
				<div class="complete glyphicon glyphicon-ok" title="Mark Complete" data-completeTask="<?=$taskid;?>" id="markTaskComplete<?=$taskid;?>"></div>
				<div>
					<div class="col-xs-6 moveup glyphicon glyphicon-arrow-up" title="Move Up" data-moveTaskUpID="<?=$taskid;?>" id="moveTaskUp<?=$taskid;?>"></div>
					<div class="col-xs-6 movedown glyphicon glyphicon-arrow-down" title="Move Down" data-moveTaskDwnID="<?=$taskid;?>" id="moveTask8Dwn<?=$taskid;?>"></div>
				</div>
			</div>
			<div class="col-xs-6">
				<div class="delete glyphicon glyphicon-trash" title="Delete" data-deleteTask="<?=$taskid;?>" id="deleteTask"></div>
				<div class="postpone glyphicon glyphicon-circle-arrow-right" title="Postpone for tomorrow" data-postponeTask="<?=$taskid;?>" id="postponeTask<?=$taskid;?>"></div>
				<div>
					<div class="col-xs-6 duplicate width_50 glyphicon glyphicon-duplicate" title="Duplicate" data-dupeTask="<?=$taskid;?>" id="dupeTask<?=$taskid;?>"></div>
					<div class="col-xs-6 assign width_50 glyphicon glyphicon-send" title="Share/Assign" data-assignTask="<?=$taskid;?>"></div>
				</div>
			</div>
		</div>
	</div>
	<div class="clearfix master_list_height">&nbsp;</div>


<?

die();

?>
