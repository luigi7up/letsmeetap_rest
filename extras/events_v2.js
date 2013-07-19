//GET ALL EVENTS 
//GET /events?e=xxxx&p=xxxxxxxx
//GET EVENT FOR ID:
//GET /events/101?e=xxxx&p=xxxxxxxx
[
	{
		 "id_event": 38,
        "name": "First event ",
        "description": "Descibing it. 7 days, 3 ppl with creator included",
        "created": "2013-06-27T11:04:22.153Z",
        "creator_email": "user1real@abc.com",
        "creator_nickname": "User1Nick",
			
			"days": [
				"2013-08-03T09:04:27.000Z",
				"2013-08-04T09:04:27.000Z",
				"2013-08-04T09:04:27.000Z",
				"2013-08-04T09:04:27.000Z"
			],
			
			"invited_users": [
				{
					"invitation_email":"xxxx@aaaa.com",
					"user_email":"registered_email@aaaa.com",
					"availability" : ['y','n','m','m', 'm']						
				},
				{
					"invitation_email":"xxxx@aaaa.com",
					"user_email":"registered_email@aaaa.com",
					"availability" : ['y','n','m','m', 'm']						
				},
				
			]
					
	}
]

//CREATING a NEW EVENT
//POST /events?e=xxxx&p=xxxxxxxx
{
	"name": "First event ",
	"description": "Descibing it. 7 days, 3 ppl with creator included",
	"days": [
				"2013-08-03T09:04:27.000Z",
				"2013-08-04T09:04:27.000Z",
				"2013-08-04T09:04:27.000Z",
				"2013-08-04T09:04:27.000Z"
			],
	"invited_users": [
		{
			"invitation_email":"xxxx@aaaa.com",
		},
		{
			"invitation_email":"xxxx@aaaa.com",							
		},
	]	
}
