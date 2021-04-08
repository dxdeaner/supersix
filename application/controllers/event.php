<?php defined('BASEPATH') OR exit('No direct script access allowed');
Class Event extends CI_Controller {

	public function __construct()
	{
		parent::__construct();
		$this->load->model("Event_model1");
		
		if (!$this->ion_auth->in_group(1)){
			redirect('/auth/login', 'refresh');	
		}
	}

	public function index(){
		$rs['event_info'] = $this->Event_model1->get_event_data();		
		$this->load->view('auth/event', $rs);
	}
	

	public function create_event()
	{	
		$id = $this->uri->segment(3);
		if(isset($_POST['submit']) && $_POST['submit']!="")
		{
		$u_data = $this->input->post('users');
		$string = '';
		foreach ($u_data as $value) {
			$string .= $value.',';
		}
		$selected_user = substr($string,0,-1);

		$userId = $this->ion_auth->get_user_id();
		$data = array(
			'event_name' => $this->input->post('event_name'),
			'event_dtl' => $this->input->post('event_detel'),
			'event_date' => $this->input->post('event_date'),
			'venue' => $this->input->post('venue'),
			'street' => $this->input->post('street'),
			'participation_access' => $this->input->post('checkboxes'),			
			'entry_fees' => $this->input->post('amount'),	
			'create_by' => $userId,	
			'selected_user' => $selected_user	
			); 
			/*demo*/
	
			if(isset($id) && $id!=""){
				$rs = $this->Event_model1->update_event($id,$data);
				if (isset($rs) && $rs!="") {
					$this->session->set_flashdata('message', "Update succefully");
					redirect('event/index');
				}
			}else{
				$query = $this->Event_model1->add_event($data);
				if(isset($query) && $query!=""){
				$this->session->set_flashdata('message', "Event Create succefully");
					redirect('event/index');	
			}
			
			}
		}

			$aa = array();
			if(isset($id) && $id!=""){
				$aa = $this->Event_model1->get_by_id($id);
			}
			$data['users'] = $this->Event_model1->get_user_data();					
			$data['event'] = $aa;
			
			$this->load->view('auth/create_event',$data);
	}

	public function delete($id)
	{
		//$id = $this->uri->segment(3);
  		$this->db->where('id', $id);
  		$del = $this->db->delete('event');
  		if(isset($del) && $del!="")
			{
				$this->session->set_flashdata('message','Delete Event Successfuly');				
		}else{
				$this->session->set_flashdata('error','Failed Event Not Delete');	
		}	
  		redirect('event/index');
	}

}	



