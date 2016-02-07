Websites = new Mongo.Collection("websites");

if (Meteor.isClient) {

	/////
	// routing
	/////

	Router.configure({
	  layoutTemplate: 'ApplicationLayout'
	});

	Router.route('/', function () {
	  this.render('navbar', {
	    to:"navbar"
	  });
		this.render('websites', {
	    to:"main"
	  });
	});

	Router.route('/website/:_id', function () {
	  this.render('navbar', {
	    to:"navbar"
	  });
	  this.render('website', {
	    to:"main",
	    data:function() {
	      return Websites.findOne({_id:this.params._id});
	    }
	  });
	});

	/////
	// accounts config
	/////

	Accounts.ui.config({
	  passwordSignupFields: "USERNAME_AND_EMAIL"
	});

	/////
	// template helpers
	/////

	// helper function that returns all available websites
	Template.website_list.helpers({
		websites:function(){
			if (Session.get("searchFilter")) {  // they set a filter
				var searchText = Session.get("searchFilter");
				return Websites.find({$or: [ {"title" : {$regex : searchText, $options: "i"}}, {"description" : {$regex : searchText, $options: "i"}} ]});
			}
			else {
				return Websites.find({}, {sort:{upvotes:-1, createdOn:-1}});
			}
		}
	});

	// helper function that returns all available comments
	Template.website_detail.helpers({
		comments:function(){
			var website_id = this._id;
			var comments = Websites.findOne({_id:this._id}).comments;
			return _.sortBy(comments, 'commentedOn').reverse();
		}
	});

	// helper function that returns username of comment
	Template.comment.helpers({
		username:function(){
			// get email using user id
			var user = Meteor.users.findOne({_id:this.user_id});
			return user.username;
		}
	});

	// helper function that returns automatic retrieval of url information
	Template.website_form.helpers({
		retrievedTitle:function(){
			return Session.get("retrievedTitle");
		},
		retrievedDescription:function(){
			return Session.get("retrievedDescription");
		},
		getMetasStatus:function(){
			return Session.get("getMetasStatus");
		}
	});


	/////
	// template events 
	/////

	Template.website_item.events({
		"click .js-upvote":function(event){
			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			console.log("Up voting website with id "+website_id);

			// put the code in here to add a vote to a website!
			// retrieve previous upvotes value
			var website = Websites.findOne({_id:website_id});
			var upvotes = website.upvotes;
			upvotes++;	// increase vote by one

			if (Meteor.user()) {
				Websites.update({_id:website_id}, {$set: {upvotes:upvotes}});
			}

			return false;// prevent the button from reloading the page
		}, 
		"click .js-downvote":function(event){

			// example of how you can access the id for the website in the database
			// (this is the data context for the template)
			var website_id = this._id;
			console.log("Down voting website with id "+website_id);

			// put the code in here to remove a vote from a website!
			// retrieve previous upvotes value
			var website = Websites.findOne({_id:website_id});
			var downvotes = website.downvotes;
			downvotes++;	// increase vote by one

			if (Meteor.user()) {
				Websites.update({_id:website_id}, {$set: {downvotes:downvotes}});
			}

			return false;// prevent the button from reloading the page
		}
	})

	Template.website_form.events({
		"keyup #url":function(event){
			Session.set("retrievedTitle", '');
			Session.set("retrievedDescription", '');
			Session.set("getMetasStatus", '');
		},
		"click .js-get-metas":function(event){
			Session.set("getMetasStatus", 'Retrieving fields ...');
			var url = $("#url").val();
			extractMeta(url, function (err, res) {
				if (err) {
					console.error('err while extracting metas', err);
				} else {
					Session.set("retrievedTitle", res.title);
					Session.set("retrievedDescription", res.description);
					if(res.title && res.description) {
						Session.set("getMetasStatus", 'Retrieval Done.');
					}
				}
			});
		},
		"click .js-toggle-website-form":function(event){
			$("#website_form").toggle('slow');
		}, 
		"submit .js-save-website-form":function(event){

			// here is an example of how to get the url out of the form:
			/*
			var url = event.target.url.value;
			console.log("The url they entered is: "+url);
			*/

			//  put your website saving code in here!
			var url, title, description;
      url = event.target.url.value;
			title = event.target.title.value;
			description = event.target.description.value;
      console.log("url: "+url+" title:"+title+" description:"+description);
      if (Meteor.user()) {
        Websites.insert({
            title: title,
						url: url,
						description: description,
            createdOn:new Date(),
            createdBy: Meteor.user()._id,
						upvotes: 0,
						downvotes: 0,
						comments: []
        });
			}
      $("#website_form").toggle('slow');

			return false;// stop the form submit from reloading the page

		}
	});

	Template.comment_form.events({
		"submit .js-save-comment-form":function(event){
			//  save comment
			var message, website_id;
			message = event.target.message.value;
			website_id = this._id;

			if (Meteor.user() && message) {
				Websites.update({_id: website_id}, {$push: {comments:
					{message:message, user_id:Meteor.user()._id, commentedOn:Date()}}
				});

				// Clear form
				event.target.message.value = "";
			}

			return false;// stop the form submit from reloading the page
		}
	});

	Template.navbar.events({
		"click .js-search-filter":function(event){
			var searchText = $("#search").val();
			Session.set("searchFilter", searchText);
		},
		"keyup #search":function(event){
			$("#searchclear").show();
		},
		"click .searchclear":function(event){
			$("#search").val('').focus();
			$("#searchclear").hide();
			Session.set("searchFilter", '');
		}
	})
}


if (Meteor.isServer) {
	// start up function that creates entries in the Websites databases.
  Meteor.startup(function () {
    // code to run on server at startup
    if (!Websites.findOne()){
    	console.log("No websites yet. Creating starter data.");
    	  Websites.insert({
    		title:"Goldsmiths Computing Department",
    		url:"http://www.gold.ac.uk/computing/",
    		description:"This is where this course was developed.",
    		createdOn:new Date(),
				upvotes: 0,
				downvotes: 0,
				comments: []
    	});
    	 Websites.insert({
    		title:"University of London",
    		url:"http://www.londoninternational.ac.uk/courses/undergraduate/goldsmiths/bsc-creative-computing-bsc-diploma-work-entry-route",
    		description:"University of London International Programme.",
    		createdOn:new Date(),
				upvotes: 0,
				downvotes: 0,
				comments: []
    	});
    	 Websites.insert({
    		title:"Coursera",
    		url:"http://www.coursera.org",
    		description:"Universal access to the world’s best education.",
    		createdOn:new Date(),
				upvotes: 0,
				downvotes: 0,
				comments: []
    	});
    	Websites.insert({
    		title:"Google",
    		url:"http://www.google.com",
    		description:"Popular search engine.",
    		createdOn:new Date(),
				upvotes: 0,
				downvotes: 0,
				comments: []
    	});
    }
  });
}
