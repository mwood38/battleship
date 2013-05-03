var BATTLESHIP = BATTLESHIP || {};


// Sets up the game board canvas and stuff
BATTLESHIP.game = {

	init: function(){

		this.bindEvents();
	},

	/* I guess, let's try keeping the coords for these pieces here
	 * We can maybe pass them via ajax or w/e when the user locks em in?
 	 */
	ships: {

		carrier: {
			"x": 0,
			"y": 0,
			"orientation": "horizontal",
			"spaces": 5,
			"cell_nums": []
		},

		battleship: {
			"x": 0,
			"y": 0,
			"orientation": "horizontal",
			"spaces": 4,
			"cell_nums": []
		},

		sub: {
			"x": 0,
			"y": 0,
			"orientation": "horizontal",
			"spaces": 3,
			"cell_nums": []
		},

		destroyer: {
			"x": 0,
			"y": 0,
			"orientation": "horizontal",
			"spaces": 3,
			"cell_nums": []
		},

		patrol: {
			"x": 0,
			"y": 0,
			"orientation": "horizontal",
			"spaces": 2,
			"cell_nums": []
		},
	},

	// This will hold the cell numbers currently being hovered over. 
	hovered_cell_nums: [],


	// Ran after a user clicks button to save their pieces
	lockPieces: function() {
		//prob call some server side function to save their information 

		// loop through ships, make sure they all have cell_nums, if not error...

		//pass cell nums to the server for saving..somewhere
	},


	bindEvents: function() {
		var that = this,
			letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],
			i;
			
		// Loop through cells, label them and make them droppable. 	
		for(i = 0; i < letters.length; i++) {
			var letter = letters[i];
			$("#" + letter).children().each(function(i){
				var square = $(this);

				// Skip the first cell w/ the label
				if(i != 0) {
					label = letter + i;
					square.attr("data-cell", label);
					// Might as well make these droppable while we're here
					square.droppable({ over: $.proxy(that.handleOver, that) });
				}
			});
		}
		
		// Make ships dragable
		for(var prop in this.ships) {
			$("#" + prop).draggable({
				cursor: "move",
				revert: "invalid",
				revertDuration: 200,
				snap: ".droppable",
				snapTolerance: 10
				//"helper": helperFunction,
			});
		}
		
		// Make each dock droppable
		$(".dock").each(function(){
			$(this).droppable(); // need to set these options?
		});

		// Reset button
		$("#reset-button").on( "click", $.proxy(this.dockPieces, this) );
	},


	handleDrop: function(event, ui) {
		var draggable = ui.draggable,
			ships = this.ships,
			cell = $(".cell[data-cell='" + this.hovered_cell_nums[0] + "']");

		for(var prop in ships) {
			var ship = ships[prop];

			if(draggable.attr("id") == prop) {
				// Save the cell nums
				ship.cell_nums = this.hovered_cell_nums;

				if(ship.orientation == "horizontal") {
					$(draggable).css({top:-3,left:-1}).appendTo(cell);	
				}
				else {
					// vert will be different
				}
			}
		}
	},


	handleOver: function(event, ui) {
		var draggable  = ui.draggable,
			cell     = $(event.target).attr("data-cell"),
			board      = $("#my-board"),
			CELL_WIDTH = 60, 
			CELL_HEIGHT = 60, 
			spaces, orientation,
			cell_num = parseInt(cell.substr(1), 10), left, top,
			cell_letter = cell.substr(0,1),
			moving_left = false, moving_right = false,
			moving_up = false, moving_down = false,
			ships = this.ships,
			that = this;
			
			this.hovered_cell_nums = [];

		// This should be the X coord of the piece relative to the board
		left = draggable.offset().left - board.offset().left - CELL_WIDTH;
		top = draggable.offset().top - board.offset().top - CELL_HEIGHT;	
			
		// loop here and figure out which ship we're dragging
		for(var prop in ships) {
			var ship = ships[prop];

			if(draggable.attr("id") == prop) {
				spaces = ship.spaces;
				orientation = ship.orientation;
			}
		}	

		if(orientation == "horizontal") {
			// First, we need to get the first cell number for our array of cell nums. 
			// Start with the pieces w/ an odd number of spaces
			if(spaces % 2 != 0) {
				// The cell that is hovered over will have an equal number of cells
				// hovered over on each side of it. 
				var range = (spaces - 1) / 2;
				var first_num = cell_num - range;
			}
			else { 
				// Pieces w/ an even number of spaces. We need to figure out if the piece
				// is more towards the left of the hovered cell or the right. 
				var range = spaces / 2;
				var diff = (left >= CELL_WIDTH) ? left % CELL_WIDTH : left;
				
				if(diff < 30) {
					// In this case, the piece will have more cells to the left,
					// so subtract range from cell_num
					var first_num = cell_num - range;
				}
				else {
					// In this case, the piece will have more cells to the right,
					// so start with the hovered over cell num minus half the range. 
					var first_num = cell_num - (range / 2);
				} 
			}

			// Fill the array with the proper cells. 
			for(i = 0; i < spaces; i++) {
					var num = first_num + i;
					this.hovered_cell_nums.push( cell_letter + num );
			}

			// For each hovered over cell, add the hovered class to it. 
			for(var i = 0; i < this.hovered_cell_nums.length; i++) {
			 	var cell = $(".cell[data-cell='" + this.hovered_cell_nums[i] + "']");
				
				if(cell.length > 0) {
					cell.addClass("hovered");
			 	}				
			}
		}
		else { // @TODO what about vertical..

		}

		this.repaintBoard();		
	},

	
	repaintBoard: function() {
		var that = this,
		    letters = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];

		// Loop through all cells and highlight those in the hovered_cells array. 
		// Also, make those cells droppable. 
		for(i = 0; i < letters.length; i++) {
			var letter = letters[i];
			$("#" + letter).children().each(function(i){
				var square = $(this);

				// Skip the first cell w/ the label
				if(i != 0) {
					if($.inArray(square.attr("data-cell"), that.hovered_cell_nums) != -1) {

						square.droppable({ drop: $.proxy(that.handleDrop, that) })
							  .addClass("hovered")
							  .addClass("droppable");
					} 
					else {
						square.removeClass("hovered");
					}
				}
			});
		}
	},


	// Resets the pieces to their dock
	dockPieces: function() {
		var ships = this.ships;

		// Since we're not hovering over anything, blank this out
		this.hovered_cell_nums = [];

		// Loop through ships and return each one to its dock. 
		for(var prop in ships) {
			var ship = ships[prop],
			  	ship_node = $("#" + prop);

			// @TODO animate this...
			if(ship.cell_nums.length > 0) {
				$(".dock." + prop).append(ship_node);
			}
		}

		this.repaintBoard();		
	}
};