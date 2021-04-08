<?php
class Event_model1 extends CI_Model{
	function __construct() {
	parent::__construct();
	             
	}

	public function add_event($data){
		// Inserting in Table(students) of Database(college)
		$this->db->set('create_date', 'NOW()', FALSE);
		$this->db->insert('event', $data);
		$query = $this->db->get('event');
		return $query;
    }


    public function get_event_data(){
    	$query = $this->db->get('event')->result();		
		return $query;
    }

    public function get_user_data(){
    	$query= $this->db->get('users')->result();
		return $query;
    }

    public function get_by_id($id){

    	$this->db->where('id',$id);
		$query = $this->db->get('event')->row();
		return $query;
    }

    public function update_event($id,$data){
		// Inserting in Table(students) of Database(college)
		$this->db->set('create_date', 'NOW()', FALSE);
		$this->db->where('id', $id);
		$this->db->update('event', $data);
		return true;
    }

    public function get_event_selected($id){

    	$this->db->where('selected_user',$id);
		$query = $this->db->get('event')->row();
		return $query;
    }
    

}
?>