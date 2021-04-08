<ol class="breadcrumb">
	Date View:  &nbsp;&nbsp;&nbsp;
	<li><a href="#">
		<?php

			$date = date('l F dS, Y');
			$date = date_create($date);
			date_sub($date, date_interval_create_from_date_string('4 days'));
			echo date_format($date, 'l');
			
			?>
		</a> </li>
	<li><a href="#">
		<?php

			$date = date('l F dS, Y');
			$date = date_create($date);
			date_sub($date, date_interval_create_from_date_string('3 days'));
			echo date_format($date, 'l');
			
			?>
		</a> </li>
	<li><a href="#">
		<?php

			$date = date('l F dS, Y');
			$date = date_create($date);
			date_sub($date, date_interval_create_from_date_string('2 days'));
			echo date_format($date, 'l');
			
			?>
		</a></li>
	<li> <a href="#">Yesterday </a> </li>
	<li class="active"> Today </li>
</ol>

<dl class="completed_list">
	<div class='col-xs-11'>
		<div class=''>
			<div class='col-xs-2'> Date Completed </div>
			<div class='col-xs-7'> Task Title </div>
			<div class='col-xs-3'> Owner </div>
		</div>
	</div>
	<div class='col-xs-1'></div>
	<? 
		foreach($completed_array as $value => $completed) {
			echo "
				<div class='rows hover_show'>
					<div class='col-xs-11 inactive'>
						<div class='col-xs-2'>
							<dt>
								April 21st, 2016
							</dt>
						</div>
						<div class='col-xs-7'>
							<dt>
								".$completed."
							</dt>
						</div>
						<div class='col-xs-3'>
							<dt>".$activeuser."</dt>
						</div>
					</div>
					<div class='col-xs-1 hover_hide'>
						<form action='' name='ss0".$value."_title' id='ss0".$value."_title' method='post'>
							<input type='hidden' name='restore_0".$value."' id='restore_0".$value."' value='restore_0".$value."'>
							<button type='submit' class='restore glyphicon glyphicon-level-up' title='Restore'></button>
						</form>
					</div>
				</div>
			";
		}
	?>
</dl>
