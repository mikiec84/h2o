var popup_item_id = 0;
var popup_item_type = '';

$.noConflict();

jQuery.extend({
  	classType: function() {
		return jQuery('body').attr('id').replace(/^b/, '');
	},
	rootPath: function(){
	  return '/';
	},
	initializeTabBehavior: function() {
		jQuery('.tabs a').click(function(e) {
			var region = jQuery(this).data('region');
			jQuery('.popup').hide();
			popup_item_id = 0;
			popup_item_type = '';
			jQuery('.tabs a').removeClass("active");
			jQuery('.songs > ul').hide();
			jQuery('.pagination > div, .sort > div').hide();
			jQuery('#' + region +
				',#' + region + '_pagination' +
				',#' + region + '_sort').show();
			jQuery(this).addClass("active");
			e.preventDefault();
		});
		//TODO: Possibly generic-ize this later if more of this
		//functionality is needed. For now it's only needed
		//on bookmarks
		if(document.location.hash == '#vbookmarks') {
			jQuery('#bookmark_tab').click();
		}
	},
	observeLoginPanel: function() {
		jQuery('#header_login').click(function(e) {
			jQuery(this).toggleClass('active');
			jQuery('#login-popup').toggle();
			e.preventDefault();
		});
	},
	observeCasesCollage: function() {
		jQuery('.case_collages').click(function(e) {
			e.preventDefault();
			jQuery('#collages' + jQuery(this).data('id')).toggle();
			jQuery(this).toggleClass('active');
		});
		jQuery('.hide_collages').click(function(e) {
			e.preventDefault();
			jQuery('#collages' + jQuery(this).data('id')).toggle();
			jQuery(this).parent().siblings('.cases_details').find('.case_collages').removeClass('active');
		});
	},
	addItemToPlaylistDialog: function(itemController, itemName, itemId, playlistId) {
		var url_string = jQuery.rootPathWithFQDN() + itemController + '/' + itemId;
		if(!url_string.match(/\/[0-9]+$/)) {
			url_string = itemId;
		}
		jQuery.ajax({
			method: 'GET',
			cache: false,
			dataType: "html",
			url: jQuery.rootPath() + 'item_' + itemController + '/new',
			beforeSend: function(){
		   		jQuery.showGlobalSpinnerNode();
			},
			data: {
				url_string: url_string,
				container_id: playlistId
			},
			success: function(html){
		   		jQuery.hideGlobalSpinnerNode();
				jQuery('#dialog-item-chooser').dialog('close');
				var addItemDialog = jQuery('<div id="generic-node"></div>');
				jQuery(addItemDialog).html(html);
				jQuery(addItemDialog).dialog({
					title: 'Add ' + itemName ,
					modal: true,
					width: 'auto',
					height: 'auto',
					close: function(){
						jQuery(addItemDialog).remove();
					},
					buttons: {
						Save: function(){
							jQuery.submitGenericNode();
						},
						Close: function(){
							jQuery(addItemDialog).dialog('close');
						}
					}
				});
			}
		});
	},
	observeMarkItUpFields: function() {
		jQuery('.textile_description').observeField(5,function(){
	  		jQuery.ajax({
				cache: false,
				type: 'POST',
				url: jQuery.rootPath() + 'collages/description_preview',
				data: {
			  		preview: jQuery('.textile_description').val()
				},
	   			success: function(html){
		  			jQuery('.textile_preview').html(html);
				}
	  		});
		});
  	},

	observeTabDisplay: function(region) {
		jQuery(region + ' .link-add a').click(function() {
			var element = jQuery(this);
			var current_id = element.data('item_id');
			if(popup_item_id != 0 && current_id == popup_item_id) {
				jQuery('.popup').hide();
				popup_item_id = 0;
			} else {
				popup_item_id = current_id;
				popup_item_type = element.data('type');
				var position = element.offset();
				var results_posn = jQuery('.popup').parent().offset();
				var left = position.left - results_posn.left;
				jQuery('.popup').hide().css({ top: position.top + 24, left: left }).fadeIn(100);
			}

			return false;
		});
		jQuery('.new-playlist-item').click(function(e) {
			var itemName = popup_item_type.charAt(0).toUpperCase() + popup_item_type.slice(1);
			jQuery.addItemToPlaylistDialog(popup_item_type + 's', itemName, popup_item_id, jQuery('#playlist_id').val()); 
			e.preventDefault();
		});
	},
	listResults: function(element, data, region) {
	  	jQuery.ajax({
			type: 'GET',
			dataType: 'html',
			data: data,
			url: element.attr('href'),
			beforeSend: function(){
		   		jQuery.showGlobalSpinnerNode();
		   	},
		   	error: function(xhr){
		   		jQuery.hideGlobalSpinnerNode();
			},
			success: function(html){
		   		jQuery.hideGlobalSpinnerNode();
				if(jQuery('#bbase').length || jQuery('#busers').length) {
					jQuery(region).html(html);
					jQuery(region + '_pagination').html(jQuery(region + ' #new_pagination').html()); 
				} else {
					jQuery(region).html(html);
					jQuery('.pagination').html(jQuery(region + ' #new_pagination').html());
				}
				//Here we need to re-observe onclicks
	  			jQuery.observePagination(); 
				jQuery.observeTabDisplay(region);
				jQuery.observeCasesCollage();
			}
	  	});
	},
	observeSort: function() {
		jQuery('.sort select').selectbox({
			className: "jsb", replaceInvisible: true 
		}).change(function() {
			var element = jQuery(this);
			var data = {};
			var region = '#all_' + jQuery.classType();
			if(jQuery('#bbase').length || jQuery('#busers').length) {
				jQuery('.songs > ul').each(function(i, el) {
					if(jQuery(el).css('display') != 'none') {
						region = '#' + jQuery(el).attr('id');
						data.is_ajax = jQuery(el).attr('id').replace(/^all_/, '');
					}
				});
			} else {
				data.is_ajax = jQuery.classType();
			}
			data.sort = element.val();
			jQuery.listResults(element, data, region);
		});
	},
	observePagination: function(){
		jQuery('.pagination a').click(function(e){
	  		e.preventDefault();
			var element = jQuery(this); 
	 		var data = {};
			var region = '#all_' + jQuery.classType();
			if(jQuery('#bbase').length || jQuery('#busers').length) {
				data.is_ajax = element.closest('div').data('type');
				region = '#all_' + element.closest('div').data('type');
			} else {
				data.is_ajax = jQuery.classType();
			}
			jQuery.listResults(element, data, region);
		});
	},

	observeMetadataForm: function(){
	  jQuery('.datepicker').datepicker({
		changeMonth: true,
		changeYear: true,
		yearRange: 'c-300:c',
		dateFormat: 'yy-mm-dd'
	  });
	  jQuery('form .metadata ol').toggle();
	  jQuery('form .metadata legend').bind({
		click: function(e){
		  e.preventDefault();
		  jQuery('form .metadata ol').toggle();
		},
		mouseover: function(){
		  jQuery(this).css({cursor: 'hand'});
		},
		mouseout: function(){
		  jQuery(this).css({cursor: 'pointer'});
		}
	  });
	},

	observeMetadataDisplay: function(){
	  jQuery('.metadatum-display').click(function(e){
		  e.preventDefault();
		  jQuery(this).find('ul').toggle();
	  });
	},

	observeTagAutofill: function(className,controllerName){
	  if(jQuery(className).length > 0){
	   jQuery(className).live('click',function(){
		 jQuery(this).tagSuggest({
		   url: jQuery.rootPath() + controllerName + '/autocomplete_tags',
		   separator: ', ',
		   delay: 500
		 });
	   });
	 }
	},

	/* Only used in collages.js */
	trim11: function(str) {
	  // courtesty of http://blog.stevenlevithan.com/archives/faster-trim-javascript
		var str = str.replace(/^\s+/, '');
		for (var i = str.length - 1; i >= 0; i--) {
			if (/\S/.test(str.charAt(i))) {
				str = str.substring(0, i + 1);
				break;
			}
		}
		return str;
	},

	/* Only used in new_playlists.js */
	rootPathWithFQDN: function(){
	  return location.protocol + '//' + location.hostname + ((location.port == 80 || location.port == 443) ? '' : ':' + location.port) + '/';
	},

	observeToolbar: function(){
	  if(jQuery.cookie('tool-open') == '1'){
		jQuery('#tools').css({right: '0px', backgroundImage: 'none'});
	  }

	  jQuery('#tools').mouseenter(
		function(){
		  jQuery.cookie('tool-open','1', {expires: 365});
		  jQuery(this).animate({
			right: '0px'
			},250,'swing'
		  );
		  jQuery(this).css({backgroundImage: 'none'});
		}
	  );

	  jQuery('#hide').click(
		function(e){
		  jQuery.cookie('tool-open','0', {expires: 365});
		  e.preventDefault();
		  jQuery('#tools').animate({
			right: '-280px'
		  },250,'swing');
		  jQuery('#tools').css({backgroundImage: "url('/images/elements/tools-vertical.gif')"});
	  });
	},

	serializeHash: function(hashVals){
	  var vals = [];
	  for(var val in hashVals){
		if(val != undefined){
		  vals.push(val);
		}
	  }
	  return vals.join(',');
	},
	unserializeHash: function(stringVal){
	  if(stringVal && stringVal != undefined){
		var hashVals = [];
		var arrayVals = stringVal.split(',');
		for(var i in arrayVals){
		  hashVals[arrayVals[i]]=1;
		}
		return hashVals;
	  } else {
		return new Array();
	  }
	},

	showGlobalSpinnerNode: function() {
		jQuery('#spinner').show();
	},
	hideGlobalSpinnerNode: function() {
		jQuery('#spinner').hide();
	},
	showMajorError: function(xhr) {
		//empty for now
	},
	getItemId: function(element) {
		return jQuery(".singleitem").data("itemid");
	},

	/* 
	This is a generic UI function that applies to all elements with the "delete-action" class.
	With this, a dialog box is generated that asks the user if they want to delete the item (Yes, No).
	When a user clicks "Yes", an ajax call is made to the link's href, which responds with JSON.
	The listed item is then removed from the UI.
	*/
	observeDestroyControls: function(region){
	  	jQuery(region + ' .delete-action').live('click', function(e){
			var destroyUrl = jQuery(this).attr('href');
			var item_id = destroyUrl.match(/[0-9]+$/).toString();
			e.preventDefault();
			var confirmNode = jQuery('<div><p>Are you sure you want to delete this item?</p></div>');
			jQuery(confirmNode).dialog({
		  		modal: true,
				close: function() {
					jQuery(confirmNode).remove();
				},
		  		buttons: {
					Yes: function() {
			  			jQuery.ajax({
							cache: false,
							type: 'POST',
							url: destroyUrl,
							dataType: 'JSON',
							data: {'_method': 'delete'},
							beforeSend: function(){
				  				jQuery.showGlobalSpinnerNode();
							},
							error: function(xhr){
				  				jQuery.hideGlobalSpinnerNode();
				  				//jQuery.showMajorError(xhr); 
							},
							success: function(data){
								jQuery(".listitem" + item_id).animate({ opacity: 0.0, height: 0 }, 500, function() {
									jQuery(".listitem" + item_id).remove();
								});
				  				jQuery.hideGlobalSpinnerNode();
				  				jQuery(confirmNode).remove();
							}
			  			});
					},
		  			No: function(){
						jQuery(confirmNode).remove();
		  			}
				}
			}).dialog('open');
		});
	},

	/*
	Generic bookmark item, more details here.
	*/
	observeBookmarkControls: function(region) {
	  	jQuery(region + ' .bookmark-action').live('click', function(e){
			var item_url = jQuery.rootPathWithFQDN() + 'bookmark_item/';
			var el = jQuery(this);
			//TODO: It'd be nice to clean this up
			//It handles:
			// - bookmarking regular single item
			// - bookmarking listed item
			// - bookmarking playlist item (actual object)
			// - bookmarking playlist item from bookmark list
			if(el.hasClass('bookmark-popup')) {
				if(jQuery.classType() == 'users' && jQuery('#bookmark_tab').css('display') != 'none') {
					item_url += popup_item_type + '/' + jQuery('.listitem' + popup_item_id + ' > .data hgroup h3 a').attr('href').match(/[0-9]+/).toString();	
				} else if(jQuery.classType() == 'playlists' && jQuery('.singleitem').size() && popup_item_type != 'default') {
					item_url += popup_item_type + '/' + jQuery('.listitem' + popup_item_id + ' > .data hgroup h3 a').attr('href').match(/[0-9]+/).toString();	
				} else {
					item_url += popup_item_type + '/' + popup_item_id;
				}
			} else {
				item_url += jQuery.classType() + '/' + jQuery('.singleitem').data('itemid');
			}
			e.preventDefault();
			jQuery.ajax({
				cache: false,
				url: item_url,
				dataType: "JSON",
				data: {
					base_url: jQuery.rootPathWithFQDN()
				},
				beforeSend: function() {
				  	jQuery.showGlobalSpinnerNode();
				},
				success: function(data) {
				  	jQuery.hideGlobalSpinnerNode();
					var snode = jQuery('<span class="bookmarked">').html('BOOKMARKED!').append(
						jQuery('<a>').attr('href', jQuery.rootPathWithFQDN() + 'users/' + data.user_id + '#vbookmarks').html('VIEW BOOKMARKS'));
					if(el.hasClass('bookmark-popup')) {
						if(jQuery.classType() == 'users' && jQuery('#bookmark_tab').css('display') != 'none') {
							snode.insertBefore(jQuery('#bookmarks > .listitem' + popup_item_id + ' > .data hgroup .cl'));
						} else if(jQuery.classType() == 'playlists' && jQuery('.singleitem').size() && popup_item_type != 'default') {
							snode.insertAfter(jQuery('.sortable > .listitem' + popup_item_id + ' > .data hgroup .icon-type'));
						} else {
							jQuery('.listitem' + popup_item_id + ' h4').append(snode);
						}
					} else {
						jQuery('.singleitem > .description > h2').append(snode);
					}
				},
				error: function(xhr, textStatus, errorThrown) {
				  	jQuery.hideGlobalSpinnerNode();
				}
			});
		});
	},

	/* New Playlist and Add Item */
	observeNewPlaylistAndItemControls: function() {
	  	jQuery('.new-playlist-and-item').live('click', function(e){
			var item_id = popup_item_id;
			var actionUrl = jQuery(this).attr('href');
			e.preventDefault();
			jQuery.ajax({
				cache: false,
				url: actionUrl,
				beforeSend: function() {
				  	jQuery.showGlobalSpinnerNode();
				},
				success: function(html) {
				  	jQuery.hideGlobalSpinnerNode();
					jQuery.generateSpecialPlaylistNode(html);
				},
				error: function(xhr, textStatus, errorThrown) {
				  	jQuery.hideGlobalSpinnerNode();
				}
			});
		});
	},
	generateSpecialPlaylistNode: function(html) {
		var newItemNode = jQuery('<div id="special-node"></div>').html(html);
		var title = '';
		if(newItemNode.find('#generic_title').length) {
			title = newItemNode.find('#generic_title').html();
		}
		jQuery(newItemNode).dialog({
			title: title,
			modal: true,
			width: 'auto',
			height: 'auto',
			open: function(event, ui) {
				jQuery.observeMarkItUpFields();
			},
			close: function() {
				jQuery(newItemNode).remove();
			},
			buttons: {
				Submit: function() {
					jQuery('#special-node').find('form').ajaxSubmit({
						dataType: "JSON",
						beforeSend: function() {
							jQuery.showGlobalSpinnerNode();
						},
						success: function(data) {
							jQuery(newItemNode).dialog('close');
							var itemName = popup_item_type.charAt(0).toUpperCase() + popup_item_type.slice(1);
							jQuery.addItemToPlaylistDialog(popup_item_type + 's', itemName, popup_item_id, data.id);
						},
						error: function(xhr) {
							jQuery.hideGlobalSpinnerNode();
						}
					});
				},
				Close: function() {
					jQuery(newItemNode).remove();
				}
			}
		}).dialog('open');
	},

	/* Generic HTML form elements */
	observeGenericControls: function(region){
	  	jQuery(region + ' .remix-action,' + region + ' .edit-action,' + region + ' .new-action').live('click', function(e){
			var actionUrl = jQuery(this).attr('href');
			e.preventDefault();
			jQuery.ajax({
				cache: false,
				url: actionUrl,
				beforeSend: function() {
				  	jQuery.showGlobalSpinnerNode();
				},
				success: function(html) {
				  	jQuery.hideGlobalSpinnerNode();
					jQuery.generateGenericNode(html);
				},
				error: function(xhr, textStatus, errorThrown) {
				  	jQuery.hideGlobalSpinnerNode();
				}
			});
		});
	},
	generateGenericNode: function(html) {
		var newItemNode = jQuery('<div id="generic-node"></div>').html(html);
		var title = '';
		if(newItemNode.find('#generic_title').length) {
			title = newItemNode.find('#generic_title').html();
		}
		jQuery(newItemNode).dialog({
			title: title,
			modal: true,
			width: 'auto',
			height: 'auto',
			open: function(event, ui) {
				jQuery.observeMarkItUpFields();
			},
			close: function() {
				jQuery(newItemNode).remove();
			},
			buttons: {
				Submit: function() {
					jQuery.submitGenericNode();
				},
				Close: function() {
					jQuery(newItemNode).remove();
				}
			}
		}).dialog('open');
	},
	submitGenericNode: function() {
		jQuery('#generic-node').find('form').ajaxSubmit({
			dataType: "JSON",
			beforeSend: function() {
				jQuery.showGlobalSpinnerNode();
			},
			success: function(data) {
				document.location.href = jQuery.rootPath() + data.type + '/' + data.id;
			},
			error: function(xhr) {
				jQuery.hideGlobalSpinnerNode();
			}
		});
	}
});

jQuery(function() {
	
	/* Only used in collages */
	jQuery.fn.observeField =  function( time, callback ){
		return this.each(function(){
			var field = this, change = false;
			jQuery(field).keyup(function(){
				change = true;
			});
			setInterval(function(){
				if ( change ) callback.call( field );
				change = false;
			}, time * 1000);
		});
	}

  	//Fire functions for discussions
  	initDiscussionControls();

	jQuery("#search .btn-tags").click(function() {
		var $p = jQuery(".browse-tags-popup");
		
		$p.toggle();
		jQuery(this).toggleClass("active");
		
		return false;
	});
	
	jQuery(".playlist .data .dd-open").click(function() {
		jQuery(this).parents(".playlist:eq(0)").find(".playlists:eq(0)").slideToggle();
		return false;
	});
	
	jQuery(".search_all input[type=radio]").click(function() {
		jQuery(".search_all form").attr("action", "/" + jQuery(this).val());
	});
	jQuery("#search_all_radio").click();

	jQuery(".link-more,.link-less").click(function(e) {
		jQuery("#description_less,#description_more").toggle();
		e.preventDefault();
	});

	jQuery('.item_drag_handle').button({icons: {primary: 'ui-icon-arrowthick-2-n-s'}});

	jQuery('.link-copy').click(function() {
		jQuery(this).closest('form').submit();
	});
	//jQuery('#results .song details .influence input').rating();
	//jQuery('#playlist details .influence input').rating();

	/* End TODO */

	jQuery.observeDestroyControls('');
	jQuery.observeGenericControls('');
	jQuery.observeBookmarkControls('');
	jQuery.observeNewPlaylistAndItemControls();
	jQuery.observePagination(); 
	jQuery.observeSort();
	jQuery.observeTabDisplay('');
	jQuery.observeCasesCollage();
	jQuery.observeLoginPanel();
	jQuery.initializeTabBehavior();
});
