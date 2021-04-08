<?php 
class Admin_manage extends CI_Controller {

	function __construct()
	{
		parent::__construct();
		$this->load->database();
		$this->form_validation->set_error_delimiters($this->config->item('error_start_delimiter', 'ion_auth'), $this->config->item('error_end_delimiter', 'ion_auth'));

		$this->lang->load('auth');

		if (!$this->ion_auth->in_group(1)){
			redirect('/auth/login', 'refresh');	
		}
	}

	public function index()
	{
	 	$user = $this->ion_auth->user()->row();
	 	$identity = $user->id;
	 	$data = array();
		if(isset($_POST['submit']) && $_POST['submit']=="Change Password")
		{			
			$old_password = $this->input->post('old_pass');
			$new_password = $this->input->post('new_pass');
			$new_password_confirm = $this->input->post('confirm_pass');			

	 		$identity = $this->session->userdata('identity');

			$change = $this->ion_auth->change_password($identity, $old_password, $new_password);

			if ($change)
			{	
				$data['message'] = "Successfully Change Password";
			}
			else
			{
				$data['eroor'] = 'Please Enter Valid Password';
			}
		}			
		$this->load->view('admin/profile', $data); 		
	}
	
	public function edit_admin_profile()
	{	
		$user = $this->ion_auth->user()->row(); 
		$id = $user->id;
		$data = array();
		if(isset($_POST['submit']) && $_POST['submit']=="Update")
		{
			$additional_data = $this->input->post();
			if(isset($additional_data['submit'])){
					unset($additional_data['submit']);
				}
			
			$updat = $this->ion_auth->update($id,$additional_data);	
			if(isset($updat) && $updat!="")
			{
				$this->session->set_flashdata('message',"Admin Update succefully");
			}	
		}
		$this->load->view('admin/profile',$data);
	}

	public function admin_img()
	{
		
	$this->load->view('admin/profile');	
	}
}		
?>