<?php
require($_SERVER['DOCUMENT_ROOT'].'/inc/apptop.php');

header('Content-Type: text/plain');

$id = $_POST['id'];


foreach($conn->query("SELECT * FROM tbl_tasks WHERE id_user='$id'") as $task) { ?>
	<div class="rows hover_show">
		<div class="col-xs-10">
			<dt>
				<input type="text" name="" id="" class="form-control" placeholder="Enter The Task Title" value="<?=$task['tasktitle'];?>">
			</dt>
			<dd>
				<textarea class="form-control" name="item_desc_<?=$task['id'];?>"><?=$task['taskdesc'];?></textarea>
			</dd>
		</div>
		<div class="col-xs-2 hover_hide action_box">
			<div class="col-xs-6">
				<button type="submit" class="save glyphicon glyphicon-floppy-disk" title="Save Changes" data-saveTaskID="<?=$task['id'];?>" id="saveTask<?=$task['id'];?>"></button>
				<div class="complete glyphicon glyphicon-ok" title="Mark Complete" data-completeTask="<?=$task['id'];?>" id="markTaskComplete<?=$task['id'];?>"></div>
				<div>
					<div class="col-xs-6 moveup glyphicon glyphicon-arrow-up" title="Move Up" data-moveTaskUpID="<?=$task['id'];?>" id="moveTaskUp<?=$task['id'];?>"></div>
					<div class="col-xs-6 movedown glyphicon glyphicon-arrow-down" title="Move Down" data-moveTaskDwnID="<?=$task['id'];?>" id="moveTask8Dwn<?=$task['id'];?>"></div>
				</div>
			</div>
			<div class="col-xs-6">
				<div class="delete glyphicon glyphicon-trash" title="Delete" data-deleteTask="<?=$task['id'];?>" id="deleteTask"></div>
				<div class="postpone glyphicon glyphicon-circle-arrow-right" title="Postpone for tomorrow" data-postponeTask="<?=$task['id'];?>" id="postponeTask<?=$task['id'];?>"></div>
				<div>
					<div class="col-xs-6 duplicate width_50 glyphicon glyphicon-duplicate" title="Duplicate" data-dupeTask="<?=$task['id'];?>" id="dupeTask<?=$task['id'];?>"></div>
					<div class="col-xs-6 assign width_50 glyphicon glyphicon-send" title="Share/Assign" data-assignTask="<?=$task['id'];?>"></div>
				</div>
			</div>
		</div>
	</div>
	<div class="clearfix master_list_height">&nbsp;</div>
	
<?php
	;
}