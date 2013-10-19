define([
  'jquery-ui',
  'backbone',
  'handlebars',
  'models/Session',
  'models/Game',
  'views/HeaderView',
  'socketio',
  'text!templates/game.handlebars',
  'text!templates/header.handlebars'
], function(ui, Backbone, Handlebars, Session, Game, HeaderView, io, gameTemplate, headerTemplate) {

  // Main view, basically deals with whether the user is authentication. 
  var GameView = Backbone.View.extend({
    el: '.container',
    // This will hold the cell numbers currently being hovered over. 
    hovered_cell_nums: [],
    letters: ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"],

    ships: {
      carrier: {
        "orientation": "horizontal",
        "spaces": 5,
        "cell_nums": []
      },

      battleship: {
        "orientation": "horizontal",
        "spaces": 4,
        "cell_nums": []
      },

      sub: {
        "orientation": "horizontal",
        "spaces": 3,
        "cell_nums": []
      },

      destroyer: {
        "orientation": "horizontal",
        "spaces": 3,
        "cell_nums": []
      },

      patrol: {
        "orientation": "horizontal",
        "spaces": 2,
        "cell_nums": []
      }
    },

    initialize: function () {
      var self = this;
      console.log('init game view');
      console.log(this.model);
      var user = Battleship.currentUser.get('username');

      this.socket = io.connect('http://' + window.location.host);
      this.socket.emit('joinGame', {
        gid: this.model.get('id'),
        username: user
      });
    },

    render: function () {
      var context = {},
          template, html;

      template = Handlebars.compile(gameTemplate);
      html = template(context);
      this.$el.html(html);

      var self = this,
          letters = this.letters;

      function makeDroppable(i) {
        var square = $(this);

        // Skip the first cell w/ the label
        if (i !== 0) {
          label = letter + i;
          square.attr("data-cell", label);
          // Might as well make these droppable while we're here
          square.droppable({
            over: function(event, ui) {
              self.handleOver(event, ui);
            }
          });
        }
      }

      // Loop through cells, label them and make them droppable.  
      for (var i = 0, l = letters.length; i < l; i++) {
        var letter = letters[i];
        $("#" + letter).children().each(makeDroppable);
      }

      // Make ships dragable
      for (var prop in this.ships) {
        $("#" + prop).draggable({
          cursor: "move",
          revert: "invalid",
          revertDuration: 200,
          snap: ".droppable",
          snapTolerance: 10
          //obstacle: ".ship",
          //preventCollision: true
          //"helper": helperFunction,
        });
      }

      // Make each dock droppable
      $(".dock").each(function(){
        $(this).droppable(); // need to set these options?
      });
    },

    events: {
      'click #reset-button' : 'dockPieces',
      'click #lock-button'  : 'lockPieces',
      'over .ui-droppable'  : 'handleOver',
      'drop .ui-droppable'  : 'handleDrop'
    },

    handleDrop: function(event, ui) {
      var draggable = ui.draggable,
          ships = this.ships,
          cell = $('.cell[data-cell="' + this.hovered_cell_nums[0] + '"]');

      for (var prop in ships) {
        var ship = ships[prop];

        if (draggable.attr('id') === prop) {
          // Save the cell nums
          ship.cell_nums = this.hovered_cell_nums;

          if (ship.orientation == "horizontal") {
            $(draggable).css({top:-3,left:-1}).appendTo(cell);
          } else {
            // vert will be different
          }
        }
      }
    },


    handleOver: function(event, ui) {
      var draggable   = ui.draggable,
          ships       = this.ships,
          cell        = $(event.target).data("cell"),
          cell_num    = parseInt(cell.substr(1), 10),
          cell_letter = cell.substr(0,1),
          board       = $("#my-board"),
          CELL_WIDTH  = 60,
          CELL_HEIGHT = 60,
          spaces, orientation, left, top, first_num, range, diff;

      // Blank this out
      this.hovered_cell_nums = [];

      // This should be the X coord of the piece relative to the board
      left = draggable.offset().left - board.offset().left - CELL_WIDTH;
      top = draggable.offset().top - board.offset().top - CELL_HEIGHT;

      // loop here and figure out which ship we're dragging
      for (var prop in ships) {
        var ship = ships[prop];

        if (draggable.attr("id") == prop) {
          spaces = ship.spaces;
          orientation = ship.orientation;
        }
      }

      if (orientation == "horizontal") {
        // First, we need to get the first cell number for our array of cell nums. 
        // Start with the pieces w/ an odd number of spaces
        if (spaces % 2 !== 0) {
          // The cell that is hovered over will have an equal number of cells
          // hovered over on each side of it. 
          range = (spaces - 1) / 2;
          first_num = cell_num - range;
        } else {
          // Pieces w/ an even number of spaces. We need to figure out if the piece
          // is more towards the left of the hovered cell or the right. 
          range = spaces / 2;
          diff = (left >= CELL_WIDTH) ? left % CELL_WIDTH : left;

          if (diff < 30) {
            // In this case, the piece will have more cells to the left,
            // so subtract range from cell_num
            first_num = cell_num - range;
          } else {
            // In this case, the piece will have more cells to the right,
            // so start with the hovered over cell num minus half the range. 
            first_num = cell_num - (range / 2);
          }
        }

        // Fill the array with the proper cells. 
        for (i = 0; i < spaces; i++) {
          var num = first_num + i;
          this.hovered_cell_nums.push( cell_letter + num );
        }

        // For each hovered over cell, add the hovered class to it. 
        for (var i = 0; i < this.hovered_cell_nums.length; i++) {
          var cell = $(".cell[data-cell='" + this.hovered_cell_nums[i] + "']");

          if (cell.length > 0) {
            cell.addClass("hovered");
          }
        }
      } else { // @TODO what about vertical..

      }

      this.repaintBoard();
    },

    // Ran after a user clicks button to save their pieces
    lockPieces: function() {
      var ships = this.ships,
        data  = {},
        errors = [];

      // loop through ships and make sure they all have cell_nums
      $.each(ships, function(shipName, props) {
        if (this.cell_nums.length === 0) {
          $(".error").text("Make sure to set your ships before locking them in.");
          $(".dock." + shipName).css("border-color", "#ea184e");
          errors.push(shipName);
          return; //??
        } else {
          $(".dock." + shipName).css("border-color", "#ffffff");
          // Save our cell numbers
          data[shipName] = props.cell_nums;
        }
      });

      if (errors.length === 0) {

        $.ajax({
          url: "/game/lock", // eventuall /game/:id/lock
          type: "post",
          data: data,
          done: function(response) {
            console.log(response);
          }
        });
        //prob call some server side function to save their information 

        //pass cell nums to the server for saving..somewhere
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

      this.resetPieces();
      this.repaintBoard();
    },

    repaintBoard: function() {
      var self = this,
          letters = this.letters;

      // Loop through all cells and highlight those in the hovered_cells array. 
      // Also, make those cells droppable. 
      for (i = 0; i < letters.length; i++) {
        var letter = letters[i];
        $("#" + letter).children().each(function(i) {
          var square = $(this);

          // Skip the first cell w/ the label
          if (i !== 0) {
            if ($.inArray(square.data("cell"), self.hovered_cell_nums) !== -1) {

              square.droppable({
                drop: function(event, ui) {
                  self.handleDrop(event, ui);
                }
              })
              .addClass("hovered")
              .addClass("droppable");
            } else {
              square.removeClass("hovered");
            }
          }
        });
      }
    },

    // Reset the pieces cell_nums - called when they're docked again. 
    resetPieces: function() {
      $.each(this.ships, function(){
        this.cell_nums = [];
      });
    }
  });

  return GameView;
});