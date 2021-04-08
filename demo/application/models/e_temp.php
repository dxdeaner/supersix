<?php
class E_temp extends CI_Model{
	function __construct() {
	parent::__construct();
	            
	}

	public function add_template($data){
		$this->db->insert('email_template', $data);
		$query = $this->db->get('email_template');
		return $query;
    }

    public function get_temlate_data(){
    	$query = $this->db->get('email_template')->result();
		return $query;
    }
    public function get_temlate_byid($id){
    	$this->db->where('id',$id);
    	$query = $this->db->get('email_template')->row();
    	return $query;
    }

    public function update_template($id,$data){
		//$this->db->set('create_date', 'NOW()', FALSE);
		$this->db->where('id',$id);
		$this->db->update('email_template', $data);
		return true;
    }

       

}
?>