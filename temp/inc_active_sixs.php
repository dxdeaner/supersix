<dl class="master_list">
	
	<? 
		foreach($item_array as $value => $title) {
			?>
				<form action='' name='ss0<?=$value;?>_title' id='ss0<?=$value;?>_title' method='post'>
					<div class='rows hover_show'>
						<div class='col-xs-10'>
							<dt>
								<input type='text' name='item_0<?=$value;?>' id='item_0<?=$value;?>' class='form-control' placeholder='' value='<?=$title[0];?>'>
							</dt>
							<dd>
								<textarea class='form-control' name='item_desc_0<?=$value;?>'><?=$title[1];?></textarea>
							</dd>
						</div>
						<div class='col-xs-2 hover_hide action_box'>
							<div class='col-xs-6'>
								<button type='submit' class='save glyphicon glyphicon-floppy-disk' title='Save Changes'></button>
								<div class='complete glyphicon glyphicon-ok' title='Mark Complete'></div>
								<div>
									<div class='col-xs-6 moveup glyphicon glyphicon-arrow-up' title='Move Up'></div>
									<div class='col-xs-6 movedown glyphicon glyphicon-arrow-down' title='Move Down'></div>
								</div>
							</div>
							<div class='col-xs-6'>
								<div class='delete glyphicon glyphicon-trash' title='Delete'></div>
								<div class='postpone glyphicon glyphicon-circle-arrow-right' title='Postpone for tomorrow'></div>
								<div>
									<div class='col-xs-6 duplicate width_50 glyphicon glyphicon-duplicate' title='Duplicate'></div>
									<div class='col-xs-6 assign width_50 glyphicon glyphicon-send' title='Share/Assign'></div>
								</div>
							</div>
						</div>
					</div>
					<div class="clearfix master_list_height">&nbsp;</div>
				</form>
	<?	} ?>
	
</dl>
