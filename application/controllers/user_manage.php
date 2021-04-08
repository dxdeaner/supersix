<?php defined('BASEPATH') OR exit('No direct script access allowed');

class User_manage extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		$this->load->database();
	
		$this->form_validation->set_error_delimiters($this->config->item('error_start_delimiter', 'ion_auth'), $this->config->item('error_end_delimiter', 'ion_auth'));

		$this->lang->load('auth');

		if (!$this->ion_auth->in_group(1)){
			redirect('/auth/login', 'refresh');	
		}
	}

	public function logout(){
		$this->ion_auth->logout();
		redirect('auth/login');exit();
	}

	public function user_table(){	

		$this->load->view('auth/user_table'); 
	}

	public function create_user()
	{
		$segment = $this->uri->segment(3);
		
		if(isset($_POST['submit']) && $_POST['submit']!="")
		{
			$username = $this->input->post('user_name');
			$password = $this->input->post('password');
			$email = $this->input->post('email');
			
			$additional_data = $this->input->post();
				if(isset($additional_data['submit'])){
					unset($additional_data['submit']);
				}
			if($segment==""){
				$group = array('2'); // Sets user to admin.
				$last_id = $this->ion_auth->register($username, $password, $email, $additional_data, $group);
				$rs = $this->do_upload_img($last_id);
				$this->session->set_flashdata('message','Add User Successfuly');
				redirect('auth/index');
			}else{
					
				$updat = $this->ion_auth->update($segment,$additional_data);

				if(isset($updat) && $updat!="")
					{
					$this->session->set_flashdata('message','Successfuly Data Update');				
					$this->do_upload_img($segment);
				}else{
					$this->session->set_flashdata('error','Update failed');	
				}							
				redirect('auth/index');
			}
		}
					
		$ds = array();
		if(isset($segment) && $segment!=""){
			$ds = $this->db->query("select * from users where id='".$segment."'")->row();			
		}

		$data['userinfo'] = $ds;
		$this->load->view('auth/create_user', $data); 
	}

	public function do_upload_img($last_id)
	{
	/*Image Upload Code*/
				$img_file = $_FILES['userfile']['name'];
							
				$config['upload_path'] = './assets/img/user_img/';
				$config['allowed_types'] = 'gif|jpg|png|jpeg|bmp';
				$config['max_size']	= 1024 * 2;
				$config['max_width']  = 10240;
				$config['max_height']  = 7680;				
		        $config['overwrite'] = TRUE;
		        $config['encrypt_name'] = TRUE;

				$this->load->library('upload', $config);
				$this->upload->initialize($config);
				if (!$this->upload->do_upload())
				{
					$error = array('error' => $this->upload->display_errors());
					//print_r($error);
				} 
				else
				{
					$upload_dd= $this->upload->data();
					$update_data =array(
						'user_img'=> $upload_dd['file_name'] 
						);
					$this->db->where('id',$last_id);
					$this->db->update('users',$update_data);
					//print_r($upload_dd);
				}
			
				/*Close Img Code*/
	}

	public function delete()
	{
		$id = $this->uri->segment(3);
		$del = $this->ion_auth->delete_user($id);

		if(isset($del) && $del!="")
			{
				$this->session->set_flashdata('message','Delete Record Successfuly');				
		}else{
				$this->session->set_flashdata('error','Failed Record Not Delete');	
		}	
		redirect('auth/index');
	}

}

