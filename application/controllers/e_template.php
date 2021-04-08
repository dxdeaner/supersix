<?php defined('BASEPATH') OR exit('No direct script access allowed');

Class E_template extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		$this->load->model('e_temp');
			
		if (!$this->ion_auth->in_group(1)){
			redirect('/auth/login', 'refresh');	
		}
	}

	public function index()
	{
		$data = $this->e_temp->get_temlate_data();
		$rs['template_info'] = $data;
		$this->load->view('auth/template',$rs);
	}

	public function add_template()
	{
		$id = $this->uri->segment(3);
		if(isset($_POST['submit']) && $_POST['submit']!="")
		{
		$userId = $this->ion_auth->get_user_id();
		$data = array(
			'template_name' => $this->input->post('template_name'),
			'template' => $this->input->post('template'),
			'create_by' =>$userId
			);

		
			if(isset($id) && $id!=""){
				$aa = $this->e_temp->update_template($id,$data);
				
				if(isset($aa) && $aa!=""){
				$this->session->set_flashdata('message',"Template Update succefully");
			
				redirect('e_template/index');
				}
			}else{
				$tru = $this->e_temp->add_template($data);
				
					if(isset($tru) && $tru!=""){
					$this->session->set_flashdata('message', " Add New Template succefully");
					redirect('e_template/index');
				}		
			}			
		}	
		$edata = array();
			if(isset($id) && $id!=""){
			$rs = $this->e_temp->get_temlate_byid($id);	
			$edata['template_info'] = $rs;
			}
			$this->load->view('auth/create_template',$edata);
	}

	public function delete($id)
	{
		$this->db->where('id', $id);
  		$del = $this->db->delete('email_template');
  		if(isset($del) && $del!="")
			{
				$this->session->set_flashdata('message','Delete Template Successfuly');				
		}else{
				$this->session->set_flashdata('error','Failed');	
		}	
  		redirect('e_template/index');
  	}

}	