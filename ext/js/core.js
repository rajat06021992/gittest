// /////// moment /////////////////////////////////////
if (typeof mData === 'undefined') mData = (function() {
	var _private = {
		mData_server_get: function(moment_id, callback) {
			$.ajax({
				// __moment_get_apicall
				url: App.api_root_get() + 'moments/' + moment_id,
				method: 'GET',
				dataType: 'json',
				statusCode: {
					200: function(response) {
						if (typeof callback === 'function') callback(response);
					}
				}
			});
		},
		mData_sanitize: function(moment) {
			if (DEBUG) console.log(moment);
			if (typeof moment !== 'object') return false;
			if ($.isEmptyObject(moment)) return false;

			var property_require = ['tag'];
			var property_allow = ['tag', 'time_start', 'asset_source', 'asset_source_id', 'asset_title', 'asset_publisher', 'asset_publisher_original_id', 'asset_duration', 'asset_url', 'asset_recorded_at', 'asset_storyboard_spec', 'timestamp', 'offset', 'game'];
			var youtube = [1, '1', 'yt', 'youtube'];
			var twitch = [3, '3', 'tw', 'twitch'];
			var id = App.player_id_get();
			var moment_return = {};
			var thumb = {};

			// Check if object has required attributes
			for (var i = 0; i < property_require.length; i++) {
				if (!moment.hasOwnProperty(property_require[i]))
					return false;
			}

			// Attempt getting attribute values from the video object itselft
			// Only if it exists
			if (App.video_obj_get(id)) {
				moment_return.time_start = parseInt(App.video_obj_get(id).player_time_get(id), 10);
				moment_return.asset_source = App.video_obj_get(id).asset_source_get(id);
				moment_return.asset_resource_id = App.video_obj_get(id).asset_resource_id_get(id);
				moment_return.asset_title = App.video_obj_get(id).asset_title_get(id);
				moment_return.asset_publisher = App.video_obj_get(id).asset_channel_id_get(id);
				moment_return.asset_publisher_original_id = App.video_obj_get(id).asset_channel_id_original_get(id);
				moment_return.asset_duration = App.video_obj_get(id).getDuration(id);
				moment_return.asset_thumbnail = App.video_obj_get(id).asset_thumb_get(id);
				moment_return.asset_url = App.video_obj_get(id).asset_url_get(id);
				thumb = App.video_obj_get(id).asset_thumb_at_get(id, App.video_obj_get(id).player_time_get(id));

				// Youtube moment
				if ($.inArray(moment_return.asset_source, youtube) !== -1) {
					moment_return.thumbnail_background_image = thumb.url;
					moment_return.thumbnail_background_image_rows = thumb.rows;
					moment_return.thumbnail_background_image_columns = thumb.columns;
					moment_return.thumbnail_background_image_position = thumb.position;

					moment_return.thumbnail_background_image_mobile = thumb.m_url;
					moment_return.thumbnail_background_image_mobile_rows = thumb.m_rows;
					moment_return.thumbnail_background_image_mobile_columns = thumb.m_columns;
					moment_return.thumbnail_background_image_mobile_position = thumb.m_position;

					if (document.getElementById('moment_thumb')) {
						if (document.getElementById('moment_thumb').innerHTML != '') {
							moment_return.asset_storyboard_spec = document.getElementById('moment_thumb').innerHTML;
						}
					}
				}
				// Twitch moment
				else if ($.inArray(moment_return.asset_source, twitch) !== -1) {
					moment_return.thumbnail_background_image = thumb;

					if (typeof App.video_obj_get(id).asset_status_get === 'function' && typeof App.video_obj_get(id).asset_date_create_get === 'function') {
						if (App.video_obj_get(id).asset_status_get() === 'recording') {
							moment_return.time_start = timestamp;
						}
						moment_return.asset_status = App.video_obj_get(id).asset_status_get();
						moment_return.asset_recorded_at = App.video_obj_get(id).asset_date_create_get();
						moment_return.game = App.video_obj_get(id).game;
					}
				}
				// Invalid moment
				else return false;
			}

			moment_return.auid = User.user_id_get();
			if (Browser.url_twitch_live()) {
				moment_return.time_start = moment.timestamp;
			}

			// Very Important
			if (moment.method == 'edit') {
				moment_return.time_start = moment.time_start;
				moment_return.offset = moment.offset;
				moment_return.method = 'edit';
				moment_return.editor = User.user_id_get();
			}

			// Filter invalid attributes & also give last chance to override default behavior
			for (var p in moment) {
				if ($.inArray(p, property_allow) !== -1 && typeof moment[p] !== 'function') {
					moment_return[p] = moment[p];
				}
			}

			return moment_return;
		}
	};
	return {
		mData_server_get: function(moment_id, callback) {
			_private.mData_server_get(moment_id, callback);
		},
		mData_sanitize: function(moment) {
			return _private.mData_sanitize(moment);
		}
	};
})();
if (typeof mMerch === 'undefined') mMerch = (function() {
	var _private = {
		mMerch_render: function(moment, html_parent, attr, callback, callback_click, playlist) {
			// render moment dom from moment object
			// moment	   =	moment object
			// html_parent	=	selector of the parent where the moment dom will be attached to (e.g. '#playlist_new-search-results .items')
			// attr		   =	set of additional html attributes for the moment dom (e.g. id,class)
			// callback	   =	function that would be called after attachment

			var that = this;

			// If no id is provided, default it to 0. 0 means it is just being created
			moment.id = moment.id ? moment.id : 0;

			// If moment.asset.source=1, moment.asset_source='Youtube'
			// If moment.asset.source=3, moment.asset_source='Twitch'
			if (moment.asset && moment.asset.source)
				moment.asset_source = App.asset_partner_NameKey_get(moment.asset.source);

			Utility.html_template_replace('moment.html', moment, function(moment_html, moment) {
				// __moment_data_append
				// Bind moment object to moment dom
				// moment_html	=	resultant dom
				// moment		=	intact moment object

				// Attached the moment dom as child of parent
				var moment_html = mMerch.mMerch_html_append(moment_html, moment, html_parent, attr);

				// __moment_event_bind
				// This is where all the events are attached
				if (html_parent == '#pEdit_result .items') {

					// __mMerch_pEdit_onClick
					// Handel click when moment appears within the pEdit screen.
					$(moment_html).unbind('click');
					$(moment_html).click(function(e) {
						e.preventDefault();
						e.stopPropagation();

						pEdit.pEdit_search_moment_onClick(this);
					});
				} else {

					// __mMerch_onClick_live_barrier
					$(moment_html).find('.moment_barrier').click(function(e) {
						e.preventDefault();
						e.stopPropagation();
						// Do nothing on purpose
					});

					// __mMerch_onClick
					$(moment_html).unbind('click');
					$(moment_html).click(function(e) {
						e.stopPropagation();
						e.preventDefault();

						if (typeof callback_click === 'function') {
							callback_click(this, moment);
						} else
							mMerch.mMerch_onClick(this, moment);
					});

					// __mMerch_onClick_tag
					$(moment_html).find('.moment_tag').click(function(e) {
						if ($(this).parent().hasClass('edit_mode')) {
							e.preventDefault();
							e.stopPropagation();
							// Do nothing on purpose
						}
					});

					// __mMerch_menu_circle_onClick
					$(moment_html).find('.moment_popup.bottom.right.menu,.ghost_menu.bottom.right').click(function(e) {
						e.preventDefault();
						e.stopPropagation();

						mMerch.mMerch_menu_render($(this).parent());
					});

					// __momentEdit_adjust_left
					$(moment_html).find('.moment_popup.go_left').click(function(e) {
						e.preventDefault();
						e.stopPropagation();

						mEdit.mEdit_adjust($(this).parent(), -2);
					});

					// __momentEdit_adjust_right
					$(moment_html).find('.moment_popup.go_right').click(function(e) {
						e.preventDefault();
						e.stopPropagation();

						mEdit.mEdit_adjust($(this).parent(), 2);
					});

					// __momentEdit_save_done_onClick
					$(moment_html).find('.moment_popup.done').click(function(e) {
						e.preventDefault();
						e.stopPropagation();

						mEdit.mEdit_update_ok($(this).parent());
					});

					// __momentEditsave_tag_onEnter
					$(moment_html).find('.moment_tag').unbind('keydown');
					$(moment_html).find('.moment_tag').on('keydown', function(e) {
						if (e.keyCode == 13) {
							e.preventDefault();

							mEdit.mEdit_update_ok($(this).parent());
						}
						e.stopPropagation();
					});

					// __momentEdit_cancel
					$(moment_html).find('.moment_popup.cancel').click(function(e) {
						e.preventDefault();
						e.stopPropagation();

						mEdit.mEdit_cancel($(this).parent());
					});
				}

				// __mMerch_onClick_publisher
				$(moment_html).find('.moment_popup.top.right.menu,.ghost_menu.top.right').click(function(e) {
					e.preventDefault();
					e.stopPropagation();

					location.hash = '#user/' + moment.user.id;
				});
				if (typeof callback === 'function') callback(moment_html, moment, playlist);
			});
		},
		mMerch_html_append: function(html, object, html_parent, attr) {
			// Detech if object is moment or object
			var object_moment_is = true,
				moment = {};
			if (typeof object.mode !== 'undefined') object_moment_is = false;

			// Clone html and append to body to get exact width (since width is in percent)
			var clone = $(html).clone();
			$('#main').append(clone);
			var object_width = $(clone).width();
			$(clone).remove();

			var width = (object_width) - THUMB_GAP_RIGHT - BORDER_WIDTH;
			var height = width * 9 / 16;

			var border_width = BORDER_WIDTH;

			var html = $.parseHTML(html);

			// __mMerch_height_set
			// __pMerch_height_set
			//$(html).css('height', height + 2 * border_width);

			// __mMerch_thumb_set
			// __pMerch_thumb_set
			// If all 3 values are 0 and hex is blank, the image is not stored as hex.
			if (object_moment_is == true)
				moment = object;
			else {
				if (object.moments[0])
					moment = object.moments[0];
				else {
					// Empty Playlist
					moment.thumbnail_background_image_rows = 0;
					moment.thumbnail_background_image_columns = 0;
					moment.thumbnail_background_image_position = 0;
					moment.thumbnail_hex = '';
					moment.thumbnail_background_image = Utility.image_url_resolve('moment_thumbnail_placeholder.png');
				}
			}
			if (moment.thumbnail_background_image_rows == 0 &&
				moment.thumbnail_background_image_columns == 0 &&
				moment.thumbnail_background_image_position == 0 &&
				moment.thumbnail_hex == '') {
				$(html).find('.mthumbnail img').attr('src', moment.thumbnail_background_image);
			} else {
				$(html).find('.mthumbnail img')
					// __moment_thumbnail_get_apicall
					.attr('src', App.api_root_get() + 'thumbnails/' + moment.id);
			}

			// __mMerch_html_attr_set
			// __pMerch_html_attr_set
			// Allowed attributes = {'id','class','href'}
			if (typeof attr != 'undefined') {
				for (var i in attr) {
					if (i == 'class') {
						var classes = attr[i].split(' ');
						for (var z = 0; z < classes.length; z++)
							$(html).removeClass(classes[z]).addClass(classes[z]);
					}
					if (i == 'id' || i == 'href')
						$(html).attr(i, attr[i]);
				}
			}

			// __mMerch_user_image
			// __pMerch_user_image
			if (object.user == undefined || object.user.image == '')
				$(html).find('.image_popup.top.cropping.menu img').attr('src', Utility.image_url_resolve('user_anon_image.jpg'));
			else
		  	$(html).find('.image_popup.top.cropping.menu img').attr('src', decodeURIComponent(object.user.image));

			// This is where the moment dom is actually attached to the document
			$(html_parent).append(html);

			// __site_page_moment_url_set
			// __site_page_playlist_url_set
			if (object_moment_is == true) {
				if (pPlay.pPlay_object_get() != undefined)
					$(html).attr('href', App.site_address_get() + '#playlist/' + pPlay.pPlay_object_get().id + '/moment/' + object.id);
				else
					$(html).attr('href', App.site_address_get() + '#moment/' + object.id);
				// __mMerch_twitch_live_barrier__
				// Display barrier on twitch live
				if (Browser.url_twitch_live()) $(html).find('.moment_barrier').removeClass('hidden');
			} else
				$(html).attr('href', App.site_address_get() + '#playlist/' + object.id);

			// This is important.
			return $(html);
		},
		mMerch_onClick: function(that, moment) {
			var moment_id = $(that).attr('data-moment');
			mPlay.mPlay_history_add({
				object_id: moment_id,
				object_type: 'moment'
			});

			//__mMerch_onClick_site
			if (Browser.browser_tab_in()) {

				// Check if mList is ancestor of the clicked moment. If so, seekTo() that time
				var html_parent = that.parentNode;
				while (true) {
					if (html_parent == document.body || $(html_parent).attr('id') === 'moment_list')
						break;
					html_parent = html_parent.parentNode;
				}
				if ($(html_parent).attr('id') === 'moment_list') {
					if (!Browser.url_twitch_live()) {
						if (DEBUG) console.log(parseInt($(that).attr('data-time_start'), 10));
						App.video_obj_get().player_seek(App.player_id_get(), parseInt($(that).attr('data-time_start'), 10));
						App.video_obj_get().player_play(App.player_id_get());
					}
					if (Browser.url_twitch_live()) {
						var twitch_asset_id = moment.asset.url.indexOf('?') > -1 ? '&' : '?';
						if (!$(that).hasClass('edit_mode')) window.open(moment.asset.url + twitch_asset_id + 'start=' + $(that).attr('data-time_start'), '_blank');
					}
				} else {
					location.hash = '#moment/' + moment_id;
				}
			}
			//__mMerch_onClick_ext
			else {
				//location.hash = '#moment/' + moment_id;
				var twitch_asset_id = moment.asset.url.indexOf('?') > -1 ? '&' : '?';
				chrome.tabs.create({
					url: moment.asset.url + twitch_asset_id + 'start=' + moment.time_start
				});
			}
		},
		mMerch_menu_render: function(html_parent) {
			// __mMerch_menu_html_get
			App.html_template_get('mMerch_menu.html', function(menu_html_data) {
				var menu_html = $.parseHTML(menu_html_data);
				$('.menu_item_group').remove();
				$('body').append(menu_html);

				// __mMerch_menu_show
				$(menu_html).show();
				if(parseInt(App.user.id)!=parseInt($(html_parent).attr('data-publisher')))
					$('.menu_item_group .menu_item_delete').addClass('hidden');

				// __mMerch_menu_position
				$(menu_html).css('left', $(html_parent).offset().left + $(html_parent).width() - $('.menu_item_group').width())
				$(menu_html).css('top', $(html_parent).offset().top + $(html_parent).height() - $('.menu_item_group').height());

				// __mMerch_menu_onMouseleave
				$(menu_html).on('mouseleave', function() {
					$(menu_html).remove();
				});

				// __mMerch_menu_item_delete
				var menu_item_delete = $('.menu_item_group .menu_item_delete');
				$(menu_item_delete).unbind('click');
				$(menu_item_delete).click(function(e) {
					e.preventDefault();
					e.stopPropagation();
					mMerch.mMerch_menu_item_delete_onClick(html_parent, menu_html);
				});

				// __mMerch_menu_item_edit
				var menu_item_edit = $('.menu_item_group .menu_item_edit');
				$(menu_item_edit).unbind('click');
				$(menu_item_edit).click(function(e) {
					e.preventDefault();
					e.stopPropagation();
					mMerch.mMerch_menu_item_edit_onClick(html_parent, this, menu_html);
				})
			});
		},
		mMerch_menu_item_edit_onClick: function(html_parent, that, menu) {

			$(menu).remove();
			$('.edit_mode').removeClass('edit_mode');
			$('.moment_adjustment').remove();

			// __global_offset_reset
			App.currentOffset = 0;

			//if (Browser.url_native() && (!$('.p-container').length)) return;

			$(html_parent).addClass('edit_mode');

			// __momentEdit_new_hide on computer and not twitch
			if (!Browser.device_touch() && !Browser.url_twitch_live()) $('#moment_playhead').hide();
			$('.edit_mode .moment_tag').attr('contenteditable', true);

			if (!Browser.url_twitch_live() && App.video_obj_get()) App.video_obj_get().player_pause(App.player_id_get());
			if (!Browser.url_twitch_live() && App.video_obj_get()) App.video_obj_get().player_seek(App.player_id_get(), $(html_parent).attr('data-time_start'));
		},
		mMerch_menu_item_delete_onClick: function(moment_html, menu) {
			var moment_id = $(moment_html).attr('data-moment');
			if (DEBUG) console.log(moment_id);
			if (moment_id == undefined) return;

			$(menu).remove();
			// mMerch_menu_delete_confirm
			if (confirm("Are you sure you'd like to remove this moment?")) {
				// __moment_remove_apicall
				$.ajax({
					url: App.api_root_get() + 'users/' + User.user_id_get() + '/moments/' + moment_id,
					data: {
						method: 'remove'
					},
					method: 'POST',
					dataType: 'json',
					statusCode: {
						204: function(response) {
							$(moment_html).remove();
						},
						400: function(response) {
							alert('Looks like it"s not yours!');
						}
					}
				});
			}
		},
		mMerch_refresh: function() {}
	};
	return {
		mMerch_render: function(moment, parent, attr, callback, callback_click, playlist) {
			_private.mMerch_render(moment, parent, attr, callback, callback_click, playlist);
		},
		mMerch_html_append: function(html, object, parent, attr) {
			return _private.mMerch_html_append(html, object, parent, attr);
		},
		mMerch_onClick: function(that, moment) {
			_private.mMerch_onClick(that, moment);
		},
		mMerch_menu_render: function(html_parent) {
			_private.mMerch_menu_render(html_parent);
		},
		mMerch_menu_item_edit_onClick: function(html_parent, that, menu) {
			_private.mMerch_menu_item_edit_onClick(html_parent, that, menu);
		},
		mMerch_menu_item_delete_onClick: function(html_parent, menu) {
			_private.mMerch_menu_item_delete_onClick(html_parent, menu);
		},
		mMerch_refresh: function() {
			_private.mMerch_refresh();
		}
	};
})();
if (typeof mPlay === 'undefined') mPlay = (function() {
	var _private = {
		mPlay_play_byID: function(moment_id) {
			if (moment_id == 0 || moment_id == undefined || moment_id == null) return;
			if (Browser.ext_window_in()) return;
			var that = this;
			if (pPlay.pPlay_object_get() != undefined) {} else {
				mData.mData_server_get(moment_id, function(moment) {
					mPlay.mPlay_play_byObj(moment);
				});
			}
		},
		mPlay_play_byObj: function(moment, playlist) {
			// Will 1) SEEK in current video; or 2) load new VIDEO in current player, or 3) load new PLAYER
			if (!moment || !moment.id) return;

			mPlay.mPlay_history_add({
				object_id: moment.id,
				object_type: 'moment'
			});

			if ($('#invisible_layer').hasClass('opened') && pPlay.pPlay_object_get() != undefined) {
				// __events_pPlay_mPlay_position
				Events.event_post('pPlay', 'mPlay', pPlay.pPlay_position_get());
			}

			var that = this;
			var asset_resource_id = moment.asset.resource_id;
			var asset_source = moment.asset.source;

			App.video_obj_set(moment);

			var mPlay_player = mPlay.mPlay_page_render(moment, playlist);
			var mPlay_player_id = $(mPlay_player).attr('id');
			var mPlay_page = $('#container-' + mPlay_player_id);

			mList.mList_reset()

			// __moment_title_render
			$('.mPlay_header_title').text(pPlay.pPlay_position_get() + '. ' + moment.tag);
			$('.pPlay_header_moment_title_editable').val(moment.tag);

			mPlay.mPlay_page_data_update(mPlay_player_id, moment);

			// 1) SEEK in current video, if same video
			if (asset_resource_id == mPlay.asset_resource_id) {

				// __mPlay_youtube_seek_only
				if (moment.asset.source == 1) {
					player.seekTo(moment.time_start);
					if (Browser.device_iPhone()) player.pauseVideo();

					setTimeout(function() {
						if (Browser.device_iPhone()) player.pauseVideo();
					}, 2000);

					App.video_obj_get().player_info_update(mPlay_player_id, moment);

					// __mPlay_twitch_seek_only
				} else if (moment.asset.source == 3) {
					if (Browser.device_iPhone())
						App.video_obj_get().player_embed(mPlay_player_id, moment);
					else {
						if ($('#' + mPlay_player_id)[0] && typeof $('#' + mPlay_player_id)[0].videoSeek === 'function') {
							$('#' + mPlay_player_id)[0].videoSeek(parseInt(moment.time_start, 10) - 1);
						}
					}

					App.video_obj_get().player_info_update(mPlay_player_id, moment);
				}
				mPlay.asset_resource_id = asset_resource_id;
				mPlay.asset_source = asset_source;
				return;
			}
			// 2) load new VIDEO in current player, if same player
			if (asset_source == mPlay.asset_source) {

				// __mPlay_youtube_video_load
				if (moment.asset.source == 1) {

					player.loadVideoById({
						videoId: moment.asset.resource_id,
						startSeconds: moment.time_start
					});

					App.video_obj_get().player_info_update(mPlay_player_id, moment);

					// __mPlay_twitch_video_load
				} else if (moment.asset.source == 3) {
					if (!Browser.device_iPhone())
						$('#' + mPlay_player_id).empty();

					App.video_obj_get().player_embed(mPlay_player_id, moment);

					App.video_obj_get().player_info_update(mPlay_player_id, moment);
					//Twitch loadVideo seems erratic
					//if($('#')+id[0] && typeof $('#'+id)[0].loadVideo==='function')
					//	$('#'+id)[0].loadVideo(asset_resource_id);
					//
				}
				mPlay.asset_resource_id = asset_resource_id;
				mPlay.asset_source = asset_source;
				return;
			}
			// __mPlay_data_html_append
			$('#' + mPlay_player_id).remove();
			$(mPlay_page).prepend(mPlay_player);

			mPlay.asset_resource_id = asset_resource_id;
			mPlay.asset_source = asset_source;

			// Message about twitch not playing on mobile no longer applicable
			$(mPlay_page).find('.error_message').addClass('hidden');

			// __mPlay_back
			$('.back').unbind('click');
			$('.back').click(function(e) {
				mPlay.mPlay_back_onClick();
			});

			// if(!YT){if(DEBUG)console.log("Couldn't load YT from youtube!!!!!");return;}

			// 3) load new video PLAYER
			App.video_obj_get().player_embed(mPlay_player_id, moment);

			App.video_obj_get().player_info_update(mPlay_player_id, moment);

			// __playlist_play
			if (pPlay.pPlay_state()) {
				pPlay.pPlay_page_render(mPlay_page);
			} else
				mList.mList_populate(moment, mPlay_page);
		},
		mPlay_page_render: function(moment, playlist) {

			var mPlay_page;
			var mPlay_player_id = Utility.id_random_generate();

			// The opera(.p-container) is already loaded
			if ($('.p-container').length > 0) {
				mPlay_page = $('.p-container');
				mPlay_player_id = $(mPlay_page).attr('data-id');
			}
			// Nothing loaded yet
			else {
				mPlay_page = $('<div>', {
					id: 'container-' + mPlay_player_id,
					class: 'p-container'
				}).attr('data-id', mPlay_player_id);
				$(mPlay_page).appendTo($('body'));
				// __mPlay_header_html_get
				App.html_template_get('mPlay_header.html', function(data) {
					$(mPlay_page).append(data);
				});
			}

			// Reset mPlay.asset_source, mPlay.asset_resource_id
			if ($('#' + mPlay_player_id).length == 0) {
				mPlay.asset_source = undefined;
				mPlay.asset_resource_id = undefined;
			}
			// __mPlay_data_set
			var mPlay_player = $('<div>', {
				id: mPlay_player_id
			});
			// On iphone, we load <iframe> for twitch videos
			if (moment.asset.source == 3 && Browser.device_iPhone())
				mPlay_player = $('<iframe>', {
					id: mPlay_player_id
				}).attr('width', PLAYER_WIDTH).attr('height', '100%').css('border', 0);

			if (typeof playlist !== 'undefined') {
				if (!$('.p-container').attr('data-played_once')) {
					// __events_pPlay_play_playlistID
					Events.event_post('pPlay', 'play', playlist.id);
					// __events_pPlay_mPlay_position
					Events.event_post('pPlay', 'mPlay', 1);
					$('.p-container').attr('data-played_once', 'true');
				}

				$(mPlay_player).attr('data-playlist', playlist.id);
			}

			return $(mPlay_player);
		},
		mPlay_page_data_update: function(mPlay_player_id, moment) {

			$('#' + mPlay_player_id).attr('data-time_start', moment.time_start);
			$('#' + mPlay_player_id).attr('data-asset_source', App.asset_partner_NameKey_get(moment.asset.source));
			$('#' + mPlay_player_id).attr('data-asset_resource_id', moment.asset.resource_id);
			$('#' + mPlay_player_id).attr('data-asset_id', moment.asset.id);
			$('#' + mPlay_player_id).attr('data-moment', moment.id);
			$('#' + mPlay_player_id).attr('data-flag', 'false');

			if (moment.asset.source == 1)
				$('#' + mPlay_player_id).attr('data-asset_source', 'youtube').addClass('yt-player').addClass('player');
			else if (moment.asset.source == 2)
				$('#' + mPlay_player_id).attr('data-asset_source', 'netflix');
			else if (moment.asset.source == 3)
				$('#' + mPlay_player_id).attr('data-asset_source', 'twitch').addClass('tw-player').addClass('player');
		},
		mPlay_back_onClick: function() {
			//Get updated stat
			$.ajax({
				url: App.api_root_get() + 'users/' + User.user_id_get() + '/stat',
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					App.userStat = response;
				}
			});

			$('.p-container').fadeIn().remove();

			App.video_obj_set(false);

			pPlay.pPlay_playlist_id_set();
			pPlay.pPlay_object_set();
			mPlay.asset_source = undefined;
			mPlay.asset_resource_id = undefined;
			clearInterval(Twitch.timer);
			for (var p in Twitch) {
				if (Twitch.hasOwnProperty(p) && typeof Twitch[p] !== 'function')
					delete Twitch[p];
			}
			for (var p in mPlay) {
				if (mPlay.hasOwnProperty(p) && typeof mPlay[p] !== 'function')
					delete mPlay[p];
			}
			player = null;
			mList.mList_reset()

			if (App.hash_previous_get())
				location.hash = App.hash_previous_get();
			else
				location.hash = '#';
		},
		mPlay_html_append: function(html_page) {
			// Called from 2 places
			// pNext.pNext_render, mList.mList_populate
			// Appends <div id='invisible_layer'></div> to html_page
			$('#invisible_layer').remove();
			if (Browser.url_twitch()) {
				$('.player').append($('<div>', {
					id: 'invisible_layer',
					class: 'clearfix'
				}));
				$('.player').append($('<div>', {
					id: 'transparent_layer',
					class: 'pointer-event-fill'
				}));
			} else {
				$(html_page).append($('<div>', {
					id: 'invisible_layer',
					class: 'clearfix'
				}));
				$(html_page).append($('<div>', {
					id: 'transparent_layer',
					class: 'pointer-event-fill'
				}));
			}

			$(html_page).append($('<div>', {
				class: 'curtain right'
			}));
			$(html_page).append($('<div>', {
				class: 'curtain left'
			}));
		},
		mPlay_history_add: function(param, callback) {
			//required keys: object_id,object_type
			//example: {object_id:418,object_type:'playlist'}
			//example: {object_id:1492,object_type:'moment'}
			if (!param) return;
			if (!param.object_id || !param.object_type) return;
			$.ajax({
				// __mPlay_post_apicall
				dataType: 'json',
				method: 'POST',
				url: App.api_root_get() + 'play/moment',
				data: {
					object_id: param.object_id,
					object_type: param.object_type,
					auid: User.user_id_get()
				},
				success: function(response) {
					if (DEBUG) console.log(param.object_type + ' - ' + param.object_id + ' played ');
					if (typeof callback === 'function') callback();
				}
			});
		},
		mPlay_delay_twitch_live: function(now) {
			var threshold = TWITCH_VOD_DELAY;
			$('#moment_list .items .moment').each(function() {
				var timestamp = parseInt($(this).attr('data-timestamp'), 10);
				if (Browser.url_twitch_live()) {
					if ((now - timestamp) > threshold)
						$(this).find('.moment_barrier').addClass('hidden');
					else
						$(this).find('.moment_barrier').removeClass('hidden').text('Ready in ' + (threshold - (now - timestamp)) + ' sec.');

					//if(DEBUG)console.log(now-timestamp);
				}
			});
		},
		mPlay_state: function() {
			if (location.hash.indexOf('#moment/') > -1)
				return true;
			return false;
		}
	};
	return {
		mPlay_play_byID: function(moment_id) {
			_private.mPlay_play_byID(moment_id);
		},
		mPlay_play_byObj: function(moment, playlist) {
			_private.mPlay_play_byObj(moment, playlist);
		},
		mPlay_page_data_update: function(mPlay_player_id, moment) {
			_private.mPlay_page_data_update(mPlay_player_id, moment);
		},
		mPlay_page_render: function(moment, playlist) {
			return _private.mPlay_page_render(moment, playlist);
		},
		mPlay_back_onClick: function() {
			_private.mPlay_back_onClick();
		},
		mPlay_html_append: function(container) {
			_private.mPlay_html_append(container);
		},
		mPlay_history_add: function(param, callback) {
			_private.mPlay_history_add(param, callback);
		},
		mPlay_delay_twitch_live: function(now) {
			_private.mPlay_delay_twitch_live(now);
		},
		mPlay_state: function() {
			return _private.mPlay_state();
		}
	};
})();
if (typeof mEdit === 'undefined') mEdit = (function() {
	var _private = {
		mEdit_new_save: function(object, tag, timestamp, id, callback) {
			// __moment_save
			delete object['time_start'];
			var data = mData.mData_sanitize($.extend(object, {
				tag: tag,
				timestamp: timestamp,
				asset_source: object.asset_source_get(id),
				asset_resource_id: object.asset_resource_id_get(id),
				method: 'new'
			}));
			if (DEBUG) console.log('About to save moment');
			if (DEBUG) console.log(data);
			$.ajax({
				// __moment_post_apicall
				dataType: 'json',
				method: 'POST',
				url: App.api_root_get() + 'moments',
				data: data,
				success: function(response) {
					if (DEBUG) console.log('Moment saved');
					if (DEBUG) console.log(response);
					// __moment_history_addcall
					mPlay.mPlay_history_add({
						object_id: response.id,
						object_type: 'moment'
					});
					if (Browser.ext_installed()) {
						chrome.runtime.sendMessage({
							greeting: "moment_create_notification",
							items: response.addedTo
						}, function(response) {});
					}
					if (typeof callback === 'function') {
						if (DEBUG) console.log('calling');
						callback(response);
					}
				},
				error: function() {
					if (typeof callback === 'function') {
						if (DEBUG) console.log('calling with error');
						callback();
					}
				}
			});
		},
		mEdit_update_save: function(moment_id, object, tag, timestamp, id, callback) {
			// __moment_edit
			var data = mData.mData_sanitize($.extend(object, {
				tag: tag,
				timestamp: timestamp,
				time_start: $('#' + id).attr('data-time_start'),
				method: 'edit'
			}));
			if (DEBUG) console.log(object, tag, timestamp, id, $('#' + id).attr('data-time_start'));
			if (DEBUG) console.log('About to edit moment');
			if (DEBUG) console.log(data);
			$.ajax({
				// __moment_post_apicall
				dataType: 'json',
				method: 'POST',
				url: App.api_root_get() + 'moments/' + moment_id,
				data: data,
				statusCode: {
					201: function(response) {
						if (typeof callback === 'function')
							callback(201, response);
						// __moment_history_addcall
						mPlay.mPlay_history_add({
							object_id: moment_id,
							object_type: 'moment'
						});
					},
					200: function(response) {
						if (typeof callback === 'function')
							callback(200, response);
						// __moment_history_addcall
						mPlay.mPlay_history_add({
							object_id: moment_id,
							object_type: 'moment'
						});
					}
				}
			});
		},
		mEdit_clone: function(moment, change, callback) {
			var data = {};
			for (var p in moment) {
				if (moment.hasOwnProperty(p)) {
					data[p] = moment[p];
					if (typeof moment[p] === 'object') { //asset,user
						for (var sp in moment[p]) {
							data[p + '_' + sp] = moment[p][sp];
						}
					}
				}
			}
			if (data['asset_source'] == 'Youtube' || data['asset_source'] == 'youtube' || data['asset_source'] == 'yt' || data['asset_source'] == 'YT')
				data['asset_source'] = 'youtube';
			else if (data['asset_source'] == 'Twitch' || data['asset_source'] == 'twitch' || data['asset_source'] == 'tw' || data['asset_source'] == 'TW')
				data['asset_source'] = 'twitch';
			for (var c in change) {
				data[c] = change[c];
			}
			data.method = 'edit';
			data.editor = User.user_id_get();
			if (DEBUG) console.log('About to edit moment');
			if (DEBUG) console.log(data);
			// __moment_post_apicall
			$.ajax({
				dataType: 'json',
				method: 'POST',
				url: App.api_root_get() + 'moments/' + data.id,
				data: data,
				success: function(response) {
					if (typeof callback === 'function')
						callback(response);
					mPlay.mPlay_history_add({
						object_id: data.id,
						object_type: 'moment'
					});
				}
			});
		},
		mEdit_new_ok: function(moment_html) {
			var randomId = Utility.id_random_generate();

			mEdit.mEdit_reset(moment_html, function(tag, timestamp, moment_html) {
				$(moment_html).find('.moment_tag').text(DEFAULT_TAG);

				//Prepare the showcase moment object, just for rendering purpose;
				var moment = {};
				moment.asset = {};
				moment.asset.url = App.video_obj_get().asset_url_get(App.player_id_get());
				moment.time_start = App.video_obj_get().player_time_get(App.player_id_get());
				moment.tag = tag;

				//The thumbnail Zone
				//For asset.source='youtube',rows>=0,columns>=0,position>=0
				//For asset.source='twitch',rows=0,columns=0,position=0
				//We are doing the hex thing on server side
				var thumb = App.video_obj_get().asset_thumb_at_get(App.player_id_get(), App.video_obj_get().player_time_get(App.player_id_get()));
				moment.thumbnail_background_image = thumb.url ? thumb.url : thumb;
				moment.thumbnail_background_image_rows = thumb.rows ? thumb.rows : 0;
				moment.thumbnail_background_image_columns = thumb.columns ? thumb.columns : 0;
				moment.thumbnail_background_image_position = thumb.position ? thumb.position : 0;
				moment.thumbnail_hex = '';

				if (DEBUG) console.log(moment);

				//Quick render, identified by randomId
				mMerch.mMerch_render(moment, '#moment_list .items', {
					class: 'item',
					id: randomId
				}, function() {

					$('#' + randomId).attr('data-timestamp', timestamp);
					Utility.cursor_position_reset($('#' + randomId).find('.moment_tag'));
					mList.mList_refresh();
					mEdit.mEdit_new_save(
						App.video_obj_get(),
						tag,
						timestamp,
						App.player_id_get(),
						function(m) {
							if (DEBUG) console.log(m);

							//Update the previously unknown attributes
							$('#' + randomId).attr('data-moment', m.id)
								.attr('data-asset_id', m.asset.id)
								.attr('data-asset_source', m.asset.source)
								.attr('data-asset_resource_id', m.asset.resource_id)
								.attr('data-time_start', m.time_start)
								.attr('href', App.site_address_get() + '#moment/' + m.id);

							$('#' + randomId).find('.moment_thumbnail img')
								.attr('src', App.api_root_get() + 'thumbnails/' + m.id);

							mList.mList_refresh();
						}
					);
				});
			});
		},
		mEdit_update_ok: function(moment_html) {
			mEdit.mEdit_reset(moment_html, function(tag, timestamp, moment_html) {
				if (parseInt($(moment_html).attr('data-moment')) > 0) {
					Utility.cursor_position_reset($(moment_html).find('.moment_tag'));
					mEdit.mEdit_update_save(
						parseInt($(moment_html).attr('data-moment')),
						$.extend(App.video_obj_get(), {
							time_start: $(moment_html).attr('data-time_start'),
							offset: $(moment_html).attr('data-offset')
						}),
						tag,
						timestamp,
						App.player_id_get(),
						function(code, moment) {
							if (DEBUG) console.log(code, moment);

							if (code == 200) {
								$(moment_html).removeAttr('data-original_time_start');
								$(moment_html).removeAttr('data-offset');

								$(moment_html).attr('data-time_start', moment.time_start);
								$(moment_html).attr('data-timestamp', moment.timestamp);
							} else if (code == 201) {
								if ($(moment_html).attr('data-original_time_start')) {
									$(moment_html).attr('data-time_start', $(moment_html).attr('data-original_time_start'));
									$(moment_html).removeAttr('data-original_time_start');
								}
								$(moment_html).find('.moment_tag').text($(moment_html).attr('data-tag'));

								mMerch.mMerch_render(moment, '#moment_list .items', {
									class: 'item hidden'
								});
							}
							mList.mList_refresh();
						}
					);
				}
			});
		},
		mEdit_reset: function(moment_html, callback) {
			// __global_offset_reset
			App.currentOffset = 0;

			// Remove adjustment UI
			$('.moment_adjustment').remove();

			// Remove edit UI
			$(moment_html).removeClass('edit_mode');
			$(moment_html).find('.moment_tag').attr('contenteditable', false);

			// Rip html tags
			var tag = $(moment_html).find('.moment_tag').html().replace(/(<([^>]+)>)/ig, "");
			if (DEBUG) console.log(tag);

			if (!Browser.device_touch()) {
				// Where we are hiding it?
				$('#moment_playhead').show();
			}

			if (tag != '') {
				// Resume Vod
				if (!Browser.url_twitch_live() && App.video_obj_get())
					App.video_obj_get().player_play(App.player_id_get());

				// Correct auid
				if (Browser.ext_installed()) {
					chrome.runtime.sendMessage({
						greeting: "isLoggedIn"
					}, function(response) {
						if (response.data.user_id_registered) User.user_id_set(response.data.user_id_registered);
						else User.user_id_set(response.data.user_id_anon);
						save(moment_html);
					});
				} else
					save(moment_html);

				function save(moment_html) {
					timestamp = App.time_server_calc();
					callback(tag, timestamp, moment_html);
				}

			}
		},
		mEdit_adjust: function(html_element, offset) {
			if (!App.currentOffset)
				App.currentOffset = offset;
			else App.currentOffset = App.currentOffset + offset;

			if ($('.moment_adjustment').length == 0)
				$('body').append($('<div>', {
					class: 'moment_adjustment'
				}));

			if (App.currentOffset != 0)
				$('.moment_adjustment').removeClass('hidden').text(App.currentOffset + ' sec');
			else
				$('.moment_adjustment').addClass('hidden');

			$('#moment_list .moment').removeClass('edit_mode');
			$(html_element).addClass('edit_mode');
			$(html_element).find('.moment_tag').attr('contenteditable', true);

			if (!Browser.url_twitch_live() && App.video_obj_get())
				App.video_obj_get().player_pause(App.player_id_get());

			var new_start = parseInt($(html_element).attr('data-time_start')) + offset;
			if (DEBUG) console.log(new_start);

			if (!Browser.url_twitch_live() && App.video_obj_get())
				App.video_obj_get().player_seek(App.player_id_get(), new_start);

			if (!$(html_element).attr('data-original_time_start'))
				$(html_element).attr('data-original_time_start', $(html_element).attr('data-time_start'));
			$(html_element).attr('data-time_start', new_start);
			$(html_element).attr('data-offset', App.currentOffset);

			mEdit.mEdit_refresh();
		},
		mEdit_cancel: function(el) {

			// __global_offset_reset
			App.currentOffset = 0;

			$('.moment_adjustment').remove();

			if (!Browser.device_touch()) $('#moment_playhead').show();
			if ($(el).attr('id') === 'moment_playhead') {
				if (!Browser.device_touch())
					$(el).find('.moment_tag').text(DEFAULT_TAG);
			} else
				$(el).find('.moment_tag').text($(el).attr('data-tag'));
			// __mEdit_new_live_twitch_video_play
			if (!Browser.url_twitch_live() && App.video_obj_get())
				App.video_obj_get().player_play(App.player_id_get());

			$(el).removeClass('edit_mode');
			$(el).find('.moment_tag').attr('contenteditable', false);
			if ($(el).attr('data-original_time_start'))
				$(el).attr('data-time_start', $(el).attr('data-original_time_start')).removeAttr('data-original_time_start');
		},
		mEdit_render: function(moment, parent, attr) {

			var that = this;

			Utility.html_template_replace('playhead.html', moment, function(moment_playhead) {
				var border_width = BORDER_WIDTH;
				var width = $(this).width() - THUMB_GAP_RIGHT - BORDER_WIDTH;

				var height = width * 9 / 16;
				var moment_playhead = $.parseHTML(moment_playhead);

				// __mEdit_new_live_twitch_thumb_html_css
				var rows = parseInt($(moment_playhead).attr('data-rows'), 10);
				var columns = parseInt($(moment_playhead).attr('data-columns'), 10);
				var position = parseInt($(moment_playhead).attr('data-position'), 10);
				//$(moment_playhead).css('height', height + 2 * border_width);
				$(moment_playhead).find('.moment_thumbnail')
					.css('background-image', 'url(' + $(moment_playhead).attr('data-image') + ')')
					.css('background-size', rows * 100 + '% ' + columns * 100 + '%')
					.css('background-position', '-' + ((position % columns) * width) + 'px -' + (Math.floor(position / rows) * height) + 'px');
				if (rows == 0 && columns == 0 && position == 0) $(moment_playhead).find('.moment_thumbnail').css('background-size', '100% 100%');

				// __mEdit_new_live_twitch_html_css_insert
				if (Browser.url_twitch_live())
					$(moment_playhead).insertBefore('#moment_list .items');
				else
					$(parent).append(moment_playhead);

				$(moment_playhead).unbind('click');

				// __mEdit_new_live_twitch_onClick
				$(moment_playhead).click(function(e) {
					e.stopPropagation();
					var that = this;

					// __global_offset_reset
					App.currentOffset = 0;

					$('.moment_adjustment').remove();

					$('.edit_mode').removeClass('edit_mode');
					$(that).addClass('edit_mode');

					//If moment_playhead is clicked
					// __mEdit_new_live_twitch_onClick
					if ($(that).attr('id') === 'moment_playhead') {

						//Pause the Video
						if (!Browser.url_twitch_live())
						// __mEdit_new_live_twitch_video_pause
							App.video_obj_get().player_pause(App.player_id_get());

						$(that).find('.moment_tag').attr('contenteditable', 'true').text('');
						if (Browser.device_touch()) {
							// __mEdit_new_live_twitch_touch
							$(that).find('.moment_tag').focus(function() {
								var input = $('<div>', {
									id: 'touch_input'
								});
								$(input).append($('<input type="text" id="input" class="form-control font-medium no-border"/>'));
								$(input).append($('<div>', {
									class: 'button done font-medium'
								}).html('Done'));
								$(input).append($('<div>', {
									class: 'button cancel font-medium'
								}).html('Cancel'));

								$('body').append(input);
								$('body').children().addClass('hidden');
								$('#touch_input').removeClass('hidden');

								$('#touch_input input').css('display', 'block').focus();

								// __mEdit_new_live_twitch_save_touch_onClick
								$('#touch_input .done').click(function() {
									var tag = $('#touch_input input[type="text"]').val();
									$('.hidden').removeClass('hidden');
									$('#touch_input input').blur();
									$('#touch_input').remove();
									$('#moment_playhead').find('.moment_tag').html(tag);
								});
								// __mEdit_new_live_twitch_cancel_touch_onClick
								$('#touch_input .cancel').click(function() {
									$('.hidden').removeClass('hidden');
									$('#touch_input input').blur();
									$('#touch_input').remove();
								});
							});
						} else {
							// __mEdit_new_live_twitch_save_enterKey_bind
							$(that).find('.moment_tag').css('display', 'block').focus();
							$(that).find('.moment_tag').unbind('keydown');
							$(that).find('.moment_tag').on('keydown', function(e) {
								if (e.keyCode == 13) {
									e.preventDefault();

									mEdit.mEdit_new_ok($(this).parent());
								}
								e.stopPropagation();
							});
						}
						if (Browser.device_touch())
							$(that).find('.mpopup.left').css('left', -$(that).find('.mpopup.left').width() / 2);
						return false;
					}

					var moment_id = $(that).attr('data-moment');
					// __mEdit_new_live_twitch_event
					if (Browser.browser_tab_in()) {
						App.video_obj_get().player_seek(App.player_id_get(), parseInt($(that).attr('data-time_start'), 10));
						App.video_obj_get().player_play(App.player_id_get());
					} else {
						location.hash = '#moment/' + moment_id;
						var t = moment.asset.url.indexOf('?') > -1 ? '&' : '?';
						chrome.tabs.create({
							url: moment.asset.url + t + 'start=' + moment.time_start
						});
					}
				});

				// __mEdit_new_live_twitch_html_attribute_set
				if (typeof attr != 'undefined') {
					for (var i in attr) {
						if (i == 'class')
							$(moment_playhead).removeClass(attr[i]).addClass(attr[i]);
						if (i == 'id')
							$(moment_playhead).attr('id', attr[i]);
					}
				}
				// __mEdit_new_live_twitch_save_onClick
				$(moment_playhead).find('.moment_popup.done').click(function(e) {
					e.preventDefault();
					e.stopPropagation();

					mEdit.mEdit_new_ok($(this).parent());
				});
				// __mEdit_new_live_twitch_cancel_onClick
				$(moment_playhead).find('.moment_popup.cancel').click(function(e) {
					e.preventDefault();
					e.stopPropagation();

					mEdit.mEdit_cancel($(this).parent());
				});
				// __mEdit_new_live_twitch_adjust_left_onClick
				$(moment_playhead).find('.moment_popup.go_left').click(function(e) {
					e.preventDefault();
					e.stopPropagation();

					mEdit.mEdit_adjust($(this).parent(), -2);
				});
				// __mEdit_new_live_twitch_adjust_right_onClick
				$(moment_playhead).find('.moment_popup.go_right').click(function(e) {
					e.preventDefault();
					e.stopPropagation();

					mEdit.mEdit_adjust($(this).parent(), 2);
				});
			});
		},
		mEdit_refresh: function() {
			// __pPlay_moment_timeajust_html_css_position
			if ($('.moment_adjustment').length != 0 && $('.edit_mode').length != 0) {
				var adj = 0;
				if (Browser.url_twitch()) adj = $('#main_col .tse-scroll-content').scrollTop();
				if (Browser.url_youtube()) adj = $('body').scrollTop();
				if ($('.edit_mode').offset()) {
					$('.moment_adjustment')
						.css('top', $('.edit_mode').offset().top - 20 - adj)
						.css('left', $('.edit_mode').offset().left)
						.css('width', $('.edit_mode').width());
				}
			}

			// __mEdit_new_edit_html_css_position
			$('.edit_mode').unbind('hover');
			$('.edit_mode').hover(function() {
				var adj = 0;
				if (Browser.url_twitch()) adj = $('#main_col .tse-scroll-content').scrollTop();
				if (Browser.url_youtube()) adj = $('body').scrollTop();
				$('.moment_adjustment')
					.removeClass('hidden')
					.css('top', $('.edit_mode').offset().top - 20 - adj)
					.css('left', $('.edit_mode').offset().left)
					.css('width', $('.edit_mode').width());
			});
			$('.edit_mode').unbind('mouseleave');
			$('.edit_mode').mouseleave(function() {
				$('.moment_adjustment').addClass('hidden');
			});
		}
	};
	return {
		mEdit_new_save: function(object, tag, timestamp, id, callback) {
			_private.mEdit_new_save(object, tag, timestamp, id, callback);
		},
		mEdit_update_save: function(moment_id, object, tag, timestamp, id, callback) {
			_private.mEdit_update_save(moment_id, object, tag, timestamp, id, callback);
		},
		mEdit_clone: function(moment, change, callback) {
			_private.mEdit_clone(moment, change, callback);
		},
		mEdit_new_ok: function(moment_html) {
			_private.mEdit_new_ok(moment_html);
		},
		mEdit_update_ok: function(moment_html) {
			_private.mEdit_update_ok(moment_html);
		},
		mEdit_reset: function(moment_html, callback) {
			_private.mEdit_reset(moment_html, callback);
		},
		mEdit_adjust: function(html_element, offset) {
			_private.mEdit_adjust(html_element, offset);
		},
		mEdit_cancel: function(el) {
			_private.mEdit_cancel(el);
		},
		mEdit_render: function(moment, parent, attr) {
			_private.mEdit_render(moment, parent, attr);
		},
		mEdit_refresh: function() {
			_private.mEdit_refresh();
		}
	};
})();
if (typeof mList === 'undefined') mList = (function() {
	var _private = {
		mList_populate: function(moment, html_page) {
			// Called at 3 places
			// Youtube.init, Twitch.init, mPlay.mPlay_play_byObj

			// Append <div id='invisible_layer'></div> to html_page first
			// html_page is the parent dom selector.
			// For youtube.init & Twitch.init, it is $('body')
			// For mPlay.mPlay_play_byObj, it is $('#container-{id}')
			mPlay.mPlay_html_append(html_page);

			// The param object for Asset.asset_moment_all_get
			var user_id_and_asset_type = {};
			user_id_and_asset_type.auid = User.user_id_get();
			user_id_and_asset_type.type = 'vod';
			if (Browser.url_twitch_live()) user_id_and_asset_type.type = 'live';

			// __asset_moment_all_get_call
			// Server call to get moments for a given asset
			Asset.asset_moment_all_get(moment.asset.source, moment.asset.resource_id, user_id_and_asset_type, function(moment_array) {
				// __mList_all_render__
				mList.mList_render(moment_array);
			});
		},
		mList_render: function(moment_array) {
			// Sort by time
			moment_array = Utility.sort(moment_array, 'time_start', 'asc');
			mList.moments = moment_array;

			// Append <div id='moment_list'></div> to <div id='invisible_layer'></div>
			$('#invisible_layer').append($('<div>', {
				id: 'moment_list',
				class: 'clearfix'
			}));
			$('#moment_list').append($('<div>', {
				class: 'hook'
			}).append($('<div>', {
				class: 'vertical_bar'
			})).append($('<div>', {
				class: 'vertical_bar'
			})).append($('<div>', {
				class: 'vertical_bar'
			})));

			//
			var animating = false;
			if (!Browser.url_twitch_live()) {
				$('#moment_list .hook').unbind('click');
				$('#moment_list .hook').click(function() {
					mList.mList_vod_hook_onClick();
				});
			}
			if (Browser.url_twitch_live()) {
				$('#moment_list .hook').unbind('click');
				$('#moment_list .hook').click(function() {
					mList.mList_live_hook_onClick();
				});
			}

			// __mList_moment_render
			// Append <div class='items'></div> to <div id='moment_list'></div>
			$('#moment_list').append($('<div>', {
				class: 'items'
			}));

			// Finally the moment_html is appended to <div class='items'></div>
			for (var i = 0; i < mList.moments.length; i++) {
				mMerch.mMerch_render(mList.moments[i], '#moment_list .items', {
					class: 'item hidden'
				}, function(moment_html, moment) {
					if (moment.associated_playlist)
						$(moment_html).find('.pMerch_title').text(moment.associated_playlist.title);
				});
			}

			mList.mList_refresh();

			if (Browser.device_touch()) {
				// __mList_populate
				var t, z;
				var animating = false;
				$('#moment_list .items').scroll(function() {
					if (animating) return;
					mList.scrolling = false;
					clearTimeout(t);
					clearTimeout(z);
					t = setTimeout(function() {
						mList.mList_live_scroll();
						if (!App.userScrolledOnce) {
							if (DEBUG) console.log('Auto Scrolling to Playhead');
							z = setTimeout(function() {
								mList.scrolling = true;
							}, 1000);
						}
						animating = false;
					}, 200);
				});
			}
		},
		mList_refresh: function() {
			var that = this;
			if (mPlay.mPlay_state() || Browser.url_youtube() || Browser.url_twitch()) {

				// __mPlay_html_css_position
				// Width
				if (Browser.url_native() || Browser.url_youtube() || Browser.url_twitch() && !Browser.url_twitch_live()) {
					// __mPlay_drawer_default_html_css_position
					if (!($('#invisible_layer').hasClass('collapsed') || $('#invisible_layer').hasClass('opened'))) {
						if (Browser.device_touch())
							$('#invisible_layer').addClass('collapsed');
						else
							$('#invisible_layer').addClass('opened');
					}
					// __mPlay_drawer_collapse_html_css_position
					if ($('#invisible_layer').hasClass('collapsed')) {
						$('#moment_list .item').addClass('hidden');
						$('#invisible_layer').css('width', $('#moment_list .hook').outerWidth(true));
					}
					// __mPlay_drawer_opened_html_css_position
					else if ($('#invisible_layer').hasClass('opened')) {
						$('#moment_list .item').removeClass('hidden');
						$('#invisible_layer').css('width', $(App.player_selector_get()).width());
					}
				}
				// __mEdit_new_live_twitch_html_css_position
				if (Browser.url_twitch_live()) {
					$('#invisible_layer').css('width', 'auto');
					$('#moment_list .items').css('max-width', $(App.player_selector_get()).width() - $('#moment_list .hook').outerWidth(true) - $('#moment_playhead').outerWidth(true));
					$('#invisible_layer').css('max-width', $(App.player_selector_get()).width());

					// __mEdit_new_live_twitch_drawer_default_html_css_position
					if (!($('#invisible_layer').hasClass('collapsed') || $('#invisible_layer').hasClass('opened'))) {
						$('#invisible_layer').addClass('opened');
					}
					// __mEdit_new_live_twitch_drawer_close_html_css_position
					if ($('#invisible_layer').hasClass('collapsed')) {
						$('#moment_list .items .item').addClass('hidden');
						$('#invisible_layer').css('width', $('#moment_list .hook').outerWidth(true) + $('#moment_playhead').outerWidth(true));
					}
					// __mEdit_new_live_twitch_drawer_opened_html_css_position
					else if ($('#invisible_layer').hasClass('opened')) {
						$('#moment_list .item').removeClass('hidden');
						$('#invisible_layer').css('width', $('#moment_list .hook').outerWidth(true) + $('#moment_playhead').outerWidth(true) + $('#moment_list .items .item').length * $('#moment_list .items .item').outerWidth(true));
						$('#moment_list .items').scrollLeft(INFINITE);
					}
				}

				var bottom = MOMENT_MODE_YOUTUBE_BOTTOM;
				if (App.player_state_get() == 'Twitch')
					bottom = MOMENT_MODE_TWITCH_BOTTOM;
				if (Browser.device_iPhone())
					bottom = MOMENT_MODE_IPHONE_BOTTOM;

				// Bottom
				$('#invisible_layer,#transparent_layer').css('bottom', bottom);

				// Left / Right
				$('#invisible_layer').css('left', $(App.player_selector_get()).offset().left);
				if (Browser.url_twitch()) {
					$('#invisible_layer').css('left', 0).css('right', 'auto');
					if (Browser.url_twitch_live()) {
						$('#invisible_layer').css('left', 'auto').css('right', 0);
					}
				}

				// Top
				$('#invisible_layer,#transparent_layer').css('top', 'auto');
				if (Browser.url_youtube()) {
					$('#invisible_layer,#transparent_layer').css('bottom', 'auto');
					$('#invisible_layer').css('top', $(App.player_selector_get()).offset().top + $(App.player_selector_get()).height() - $('#moment_list .moment').height() - MOMENT_MODE_EXTRA_HEIGHT - bottom);
					$('#transparent_layer').css('top', $(App.player_selector_get()).offset().top + $(App.player_selector_get()).height() - $('#moment_list .moment').height() - bottom + TRANSPARENT_LAYER_HEIGHT);
				}

				$('#invisible_layer,#moment_list,#moment_list .items,#moment_list .hook')
					.css('height', $('#moment_list .moment').height() + MOMENT_MODE_EXTRA_HEIGHT);

				// __pPlay_drawer_curtain_right
				$('.curtain')
					.css('height', $('#invisible_layer').height());

				$('#transparent_layer')
					.css('width', $(App.player_selector_get()).width())
					.css('height', TRANSPARENT_LAYER_HEIGHT);

				if (!Browser.device_touch()) {
					$('#invisible_layer #moment_list .mthumb').each(function() {
						var selector;
						if (Browser.url_partner())
							selector = App.player_selector_get();
						else
							selector = '#' + App.player_id_get();

						var duration = App.video_obj_get().getDuration(App.player_id_get());
						var current = $(this).attr('data-time_start');
						//Show all
						$(this).removeClass('hidden');
						if ($(this).attr('id') === 'next_moment')
							return;
						// __mEdit_new_live_twitch_position
						if (DEBUG) console.log(duration);
						if (duration > 0 && !Browser.url_twitch_live()) {
							$(this).css('position', 'absolute').css('left', parseInt((current / duration) * $(selector).width() - ($(this).width() / 2)));
						}
					});
				}
			}
			mMerch.mMerch_refresh();
			Display.disp_chain_set('group1', '.no-touch #invisible_layer,.p-container .wrapper,#transparent_layer');
		},
		mList_playhead_populate: function(asset_source, asset_resource_id) {
			// Only moment mode or partner site
			if (!(mPlay.mPlay_state() || Browser.url_partner())) return;
			var that = this;

			var param = {
				auid: User.user_id_get(),
				type: 'vod',
				offset: 0,
				limit: 1
			};
			// We will be using it on Asset.asset_moment_all_get() as third param
			// and filter moments that are very close to each other
			that.param = param;

			// __mEdit_new_create
			var current = parseInt(App.video_obj_get().player_time_get(App.player_id_get()), 10);
			var thumb = App.video_obj_get().asset_thumb_at_get(App.player_id_get(), current);
			if (!thumb.url) {
				var t = thumb;
				thumb = {};
				thumb.url = t;
				thumb.rows = 0;
				thumb.columns = 0;
				thumb.position = 0;
			}
			var moment = {
				asset: {
					source: asset_source,
					resource_id: asset_resource_id,
				},
				tag: '',
				asset_source: asset_source,
				asset_resource_id: asset_resource_id,
				thumbnail_background_image: thumb.url,
				thumbnail_background_image_rows: thumb.rows,
				thumbnail_background_image_columns: thumb.columns,
				thumbnail_background_image_position: thumb.position
			};
			if (!Browser.device_iPhone()) moment.tag = DEFAULT_TAG;

			tryit();

			function tryit() {
				// If #moment_list is not yet attached to the dom try again
				if ($('#moment_list').length < 1) {
					setTimeout(tryit, 1000);
					return;
				}
				// __mEdit_new_render
				mEdit.mEdit_render(moment, '#moment_list .items', {
					id: 'moment_playhead',
					class: 'item'
				});

				mList.mList_refresh();

				if (Browser.device_iPhone()) {
					$('#moment_playhead').addClass('font-medium syncopate').text('tag this #moment')
				}

				var player_selector;
				if (Browser.url_partner())
					player_selector = App.player_selector_get();
				else
					player_selector = '#' + App.player_id_get();

				// Kickoff
				that.mList_playhead_refresh(player_selector);
			}
		},
		mList_playhead_refresh: function(player_selector) {
			// __mEdit_new_update__
			var that = this;
			var playhead_html = $('#moment_playhead');
			var current_time = App.video_obj_get().player_time_get(App.player_id_get());
			var total_duration = App.video_obj_get().getDuration(App.player_id_get());
			var thumb = App.video_obj_get().asset_thumb_at_get(App.player_id_get(), current_time);
			if (!thumb.url) {
				var t = thumb;
				thumb = {};
				thumb.url = t;
				thumb.rows = 0;
				thumb.columns = 0;
				thumb.position = 0;
			}

			var width = $(playhead_html).width(); //-THUMB_GAP_RIGHT-BORDER_WIDTH;
			var height = Math.round((width) * 9 / 16);

			$(playhead_html).attr('data-time_start', parseInt(current_time));
			//$(html).css('height',height+2*border_width);
			if (!Browser.device_iPhone()) {
				$(playhead_html).find('.moment_thumbnail')
					.css('background-image', 'url(' + thumb.url + ')')
					.css('background-size', thumb.rows * 100 + '% ' + thumb.columns * 100 + '%')
					.css('background-position', '-' + ((thumb.position % thumb.columns) * (width)) + 'px -' + (Math.floor(thumb.position / thumb.rows) * height) + 'px');
				if ((thumb.rows == 0) && (thumb.columns == 0) && (thumb.position == 0)) $(playhead_html).find('.moment_thumbnail').css('background-size', '100% 100%');
			}

			if (Browser.device_touch()) {
				that.mList_playhead_refresh_touch(playhead_html, player_selector, current_time, total_duration);
			} else {
				that.mList_playhead_refresh_mouse(playhead_html, player_selector, current_time, total_duration);
			}
			that.mList_filter_crowded();
			mList.timer = setTimeout(function() {
				that.mList_playhead_refresh(player_selector);
			}, 1000);
		},
		mList_playhead_refresh_touch: function(playhead_html, player_selector, current_time, total_duration) {
			var that = this;
			if (current_time > 0) {
				if (!that.once) {
					setTimeout(function() {
						Browser.browser_refresh('moment playhead grace');
					}, 1000);
					that.once = true;
				}
				var last = $('#moment_list .items .item').not($(playhead_html)).filter(function() {
					return parseInt($(this).attr("data-time_start"), 10) > current_time;
				}).first();

				var first = $('#moment_list .items .item').not($(playhead_html)).filter(function() {
					return parseInt($(this).attr("data-time_start"), 10) <= current_time;
				});
				var len = first.length;
				first = first.last();

				if (typeof $(first).attr('data-moment') === 'undefined')
					$(playhead_html).insertBefore(last);
				else {
					if ($(first).next().attr('id') === 'moment_playhead') {} else {
						$(playhead_html).insertAfter(first);
					}
				}
				if (mList.scrolling) $('#moment_list .items').animate({
					scrollLeft: (len - 1) * $('#moment_list .items .moment').outerWidth(true)
				}, 300);
			}
		},
		mList_playhead_refresh_mouse: function(playhead_html, player_selector, current_time, total_duration) {
			if (Browser.url_twitch_live())
				$(playhead_html).css('left', 'auto');
			else {
				// __mList_twitch
				$(playhead_html).css('left', (current_time / total_duration) * $(player_selector).width() - $(playhead_html).width() / 2);
			}
		},
		mList_filter_crowded: function() {
			var that = this;
			if (typeof that.lock === 'undefined' || that.lock == false) {
				that.lock = true;
				$('#moment_list .item:visible').not('#moment_playhead').each(function() {
					if ($(this).prev().length > 0) {
						if (($(this).offset().left - $(this).prev().offset().left) < 20) {
							that.param.offset++;
							$(this).remove();
							Asset.asset_moment_all_get(mPlay.asset_source, mPlay.asset_resource_id, that.param, function(moments) {
								// __mList_twitch_render_partial
								for (var i = 0; i < moments.length; i++) {
									mMerch.mMerch_render(moments[i], '#moment_list .items', {
										class: 'item hidden'
									});
								}
								that.lock = false;
							});
							return false;
						}
					}
				});
			}
		},
		mList_reset: function() {
			clearTimeout(mList.timer);
		},
		mList_vod_hook_onClick: function() {
			var that = this;
			if (that.animating) return;
			that.animating = true;
			$('#moment_list .items').animate({
				scrollLeft: 0
			}, 100);
			if ($('#invisible_layer').hasClass('collapsed')) {
				$('#invisible_layer').animate({
					width: $(App.player_selector_get()).width()
				}, 300, function() {
					$('#moment_list .item').removeClass('hidden');
					$('#invisible_layer').removeClass('collapsed').addClass('opened');
					that.animating = false;
				});
			} else if ($('#invisible_layer').hasClass('opened')) {
				$('#moment_list .item').removeClass('hidden').addClass('hidden');
				$('#invisible_layer').animate({
					width: $('#moment_list .hook').outerWidth(true)
				}, 300, function() {
					$('#invisible_layer').removeClass('opened').addClass('collapsed');
					that.animating = false;
				});
			}
		},
		mList_live_hook_onClick: function() {
			var that = this;
			if (that.animating) return;
			that.animating = true;

			if ($('#invisible_layer').hasClass('collapsed')) {
				$('#moment_list .items .item').removeClass('hidden');

				$('#invisible_layer').animate({
					width: $('#moment_list .hook').outerWidth(true) + $('#moment_playhead').outerWidth(true) + $('#moment_list .items .item').length * $('#moment_list .items .item').outerWidth(true)
				}, 300, function() {
					$('#invisible_layer').removeClass('collapsed').addClass('opened');
					mList.mList_refresh();
					that.animating = false;
				});
			} else if ($('#invisible_layer').hasClass('opened')) {
				$('#moment_list .items .item').addClass('hidden');

				$('#invisible_layer').animate({
					width: $('#moment_list .hook').outerWidth(true) + $('#moment_playhead').outerWidth(true)
				}, 300, function() {
					$('#invisible_layer').removeClass('opened').addClass('collapsed');
					that.animating = false;
				});
			}
		},
		mList_live_scroll: function() {
			var border_width = BORDER_WIDTH;
			var unit = $('#moment_list .items .moment').outerWidth(true);
			var scrollLeft = $('#moment_list .items').scrollLeft();

			if (scrollLeft % unit > 0) {
				var t = scrollLeft / unit;
				var z = Math.ceil(t) - (t);
				//if(DEBUG)console.log(t,z);
				if (z < 0.5) {
					$('#moment_list .items').animate({
						scrollLeft: unit * Math.ceil(t)
					}, 300);
				} else {
					$('#moment_list .items').animate({
						scrollLeft: unit * Math.floor(t)
					}, 300);
				}
			}
		}
	};
	return {
		mList_populate: function(moment, html_page) {
			_private.mList_populate(moment, html_page);
		},
		mList_reset: function() {
			_private.mList_reset();
		},
		mList_playhead_populate: function(asset_source, asset_resource_id) {
			_private.mList_playhead_populate(asset_source, asset_resource_id);
		},
		mList_render: function(moment_array) {
			_private.mList_render(moment_array);
		},
		mList_vod_hook_onClick: function() {
			_private.mList_vod_hook_onClick();
		},
		mList_live_hook_onClick: function() {
			_private.mList_live_hook_onClick();
		},
		mList_live_scroll: function() {
			_private.mList_live_scroll();
		},
		mList_refresh: function() {
			_private.mList_refresh();
		}
	};
})();

// /////// playlist ///////////////////////////////////
if (typeof pData === 'undefined') pData = (function() {
	var _private = {
		pData_server_get: function(playlist_id, callback) {
			$.ajax({
				// __playlist_data_get_apicall
				url: App.api_root_get() + 'playlists/' + playlist_id,
				method: 'GET',
				dataType: 'json',
				statusCode: {
					200: function(response) {
						if (!response) {
							location.hash = '#feed';
							return;
						}
						if (typeof callback === 'function') callback(response);
					}
				}
			});
		},
		pData_moment_position_id_set: function(position, moment) {
			// Server side
			// __playlist_moment_index_set_apicall
			$.ajax({
				url: App.api_root_get() + 'playlists/' + pPlay.pPlay_playlist_id_get(),
				data: {
					method: 'setmomentat',
					position: position,
					moment_id: moment.id
				},
				method: 'POST',
				success: function(response) {
					if (typeof callback === 'function') callback(response);
				}
			});
		}
	};
	return {
		pData_server_get: function(playlist_id, callback) {
			_private.pData_server_get(playlist_id, callback);
		},
		pData_moment_position_id_set: function(position, moment) {
			_private.pData_moment_position_id_set(position, moment);
		}
	};
})();
if (typeof pMerch === 'undefined') pMerch = (function() {
	var _private = {
		pMerch_render: function(playlist, html_parent, attr, callback, callback_click) {

			var that = this;

			//if (playlist.moment_count < 1) return;

			Utility.html_template_replace('playlist.html', playlist, function(playlist_html, playlist) {
				// __playlist_data_append
				// Bind playlist object to playlist dom
				// playlist_html	=	resultant dom
				// playlist			=	intact playlist object

				// Attached the playlist dom as child of parent
				var playlist_html = mMerch.mMerch_html_append(playlist_html, playlist, html_parent, attr);

				if (playlist.mode == 'autoadd') {
					if (App.user.id != playlist.user.id) {
						// __pMerch_moment_count_text_set
						$(playlist_html).find('.moment_count').text(playlist.moment_count);
					} else {
						// __pMerch_moment_count_text_autoadd_set
						if (playlist.terms == '')
							$(playlist_html).find('.moment_count').text(AUTO_ADD_PREFIX_EMPTY + playlist.terms);
						else
							$(playlist_html).find('.moment_count').text(AUTO_ADD_PREFIX + playlist.terms);
					}
				} else {
					// __pMerch_moment_count_text_set
					$(playlist_html).find('.moment_count').text(playlist.moment_count);
				}

				// __pMerch_view_count_text_set
				var view_count = parseInt(playlist.count_played_dup);
				var view_text = view_count > 1 ? ' views' : ' view';
				$(playlist_html).find('.view_count').text(Utility.string_number_format(view_count + view_text));

				// __pMerch_visibility_status_set
				if (parseInt(playlist.status_public) == 0) {
					$(playlist_html).addClass('private');
					$(playlist_html).find('.status').removeClass('hidden');
				}

				// Event Listeners
				// __pMerch_onClick
				$(playlist_html).click(function(e) {
					if (typeof callback_click === 'function')
						callback_click(this, playlist);
					else {
						e.preventDefault();
						e.stopPropagation();
						pMerch.pMerch_onClick(this);
					}
				});

				// __pMerch_menu_open_onClick_event
				$(playlist_html).find('.playlist_popup.bottom.right.menu,.ghost_menu.bottom.right').hover(function(e) {
					e.preventDefault();
					e.stopPropagation();

					pMerch.pMerch_menu_render($(this).parent());
				});
				// __pMerch_menu_publisher_onClick_event
				$(playlist_html).find('.image_popup.top.cropping.menu,.ghost_menu.top.right').click(function(e) {
					e.preventDefault();
					e.stopPropagation();

					pMerch.pMerch_menu_publisher_onClick($(this).parent());
				});

				if (typeof callback === 'function') callback(playlist_html, playlist);
			});
		},
		pMerch_onClick: function(that) {
			var playlist_id = $(that).attr('data-playlist');

			// __moment_thumb_onClick_site_event
			if (Browser.browser_tab_in()) {
				if (Browser.url_partner()) {
					Utility.link_open(App.site_address_get() + '#playlist/' + playlist_id);
				} else {
					location.hash = '#playlist/' + playlist_id;
				}
			}
			// __moment_thumb_onClick_ext_event
			else {
				chrome.tabs.create({
					url: App.site_address_get() + '#playlist/' + playlist_id
				});
			}
		},
		pMerch_menu_render: function(html_parent) {
			// __pMerch_menu_html_get
			App.html_template_get('mMerch_menu.html', function(data) {
				var menu_html = $.parseHTML(data);
				$('.menu_item_group').remove();
				$('body').append(menu_html);

				// __pMerch_menu_location_html_css
				$(menu_html).show();
				if(parseInt(App.user.id)!=parseInt($(html_parent).attr('data-publisher')))
					$('.menu_item_group .menu_item_delete').addClass('hidden');

				$(menu_html).css('left', $(html_parent).offset().left + $(html_parent).width() - $('.menu_item_group').width());
				$(menu_html).css('top', $(html_parent).offset().top + $(html_parent).height() - $('.menu_item_group').height());
				// __pMerch_menu_onMouseLeave
				$(menu_html).on('mouseleave', function() {
					$(menu_html).remove();
				});

				// __pMerch_menu_delete_onClick
				$(menu_html).find('.menu_item_delete').click(function(e) {
					e.preventDefault();

					pMerch.pMerch_menu_delete_onClick(html_parent, menu_html);
				});
				// __pMerch_menu_edit_onClick
				$(menu_html).find('.menu_item_edit').click(function(e) {
					e.preventDefault();

					pMerch.pMerch_menu_edit_onClick(html_parent, menu_html);
				});
			});
		},
		pMerch_menu_publisher_onClick: function(that) {
			// __userprofile_url_load
			if (Browser.url_partner()) {
				Utility.link_open(App.site_address_get() + '#user/' + $(that).attr('data-publisher'));
			} else
				location.hash = '#user/' + $(that).attr('data-publisher');
		},
		pMerch_menu_edit_onClick: function(html_parent, menu) {
			var playlist_id = $(html_parent).attr('data-playlist');
			if (playlist_id == undefined || playlist_id == null || playlist_id <= 0) return;
			// __pEdit_url_load
			if (Browser.url_partner()) {
				Utility.link_open(App.site_address_get() + '#playlist/' + playlist_id + '/edit');
			} else
				location.hash = '#playlist/' + playlist_id + '/edit';
		},
		pMerch_menu_delete_onClick: function(html_parent, menu) {
			if (DEBUG) console.log($(html_parent).attr('data-playlist'));
			var playlist_id = $(html_parent).attr('data-playlist');
			if (playlist_id == undefined) return;

			$(menu).remove();
			// __pMerch_menu_delete_ddialog
			if (confirm("Are you sure you'd like to remove this remix?")) {
				// __user_playlist_delete_apicall
				$.ajax({
					url: App.api_root_get() + 'users/' + User.user_id_get() + '/playlists/' + playlist_id,
					data: {
						method: 'remove'
					},
					method: 'POST',
					dataType: 'json',
					statusCode: {
						204: function(response) {
							$('[data-playlist="' + playlist_id + '"]').remove();
						},
						400: function(response) {
							if (DEBUG) console.log(response);
						}
					}
				});
			}
		}
	};
	return {
		pMerch_render: function(playlist, html_parent, attr, callback, callback_click) {
			_private.pMerch_render(playlist, html_parent, attr, callback, callback_click);
		},
		pMerch_onClick: function(that) {
			_private.pMerch_onClick(that);
		},
		pMerch_menu_render: function(html_parent) {
			_private.pMerch_menu_render(html_parent);
		},
		pMerch_menu_publisher_onClick: function(that) {
			_private.pMerch_menu_publisher_onClick(that);
		},
		pMerch_menu_edit_onClick: function(html_parent, menu) {
			_private.pMerch_menu_edit_onClick(html_parent, menu);
		},
		pMerch_menu_delete_onClick: function(html_parent, menu) {
			_private.pMerch_menu_delete_onClick(html_parent, menu);
		}
	};
})();
if (typeof pPlay === 'undefined') pPlay = (function() {
	var _private = {
		pPlay_play_byID: function(playlist_id, moment_id) {
			if (playlist_id == 0 || playlist_id == undefined || playlist_id == null) return;
			if (Browser.ext_window_in()) return;
			var that = this;

			// If the playlist object is already loaded
			// __pPlay_asset_same
			if (pPlay.pPlay_object_get() != undefined && pPlay.pPlay_playlist_id_get() == playlist_id) {
				if (DEBUG) console.log('--Updating Index 2--');
				that.pPlay_moment_set_byID(pPlay.pPlay_object_get(), moment_id);
			}
			// Otherwise fetch it
			// __pPlay_asset_change
			else {
				if (DEBUG) console.log('--Fetching Playlist--');
				// __playlist_data_get_call
				pData.pData_server_get(playlist_id, function(playlist) {
					if (DEBUG) console.log(playlist_id, playlist);
					// __history_playlist_add
					mPlay.mPlay_history_add({
						object_id: playlist_id,
						object_type: 'playlist'
					}, function() {
						if (playlist.moments && playlist.moments[0]) {
							// __history_moment_add
							mPlay.mPlay_history_add({
								object_id: playlist.moments[0].id,
								object_type: 'moment'
							});
						}
					});
					if (DEBUG) console.log('--Updating Index 1--');
					that.pPlay_moment_set_byID(playlist, moment_id);
				});
			}
		},
		pPlay_page_render: function(mPlay_page) {
			// Intent   =  Render only playlist specific parts (title, adjustment UI, playlist_owner, moment_serial, instructions, next_list).
			var that = this;

			// __pPlay_header_title_render
			$('.p-container .pPlay_header_title').text('Remix: ' + pPlay.pPlay_object_get().title);

			// Someone is playing his/her own reMix
			// __pPlay_own
			if (App.user.id == pPlay.pPlay_object_get().publisher_id) {

				// __pPlay_adjustmentUI_show
				$('.p-container .adjustment').removeClass('hidden');

				// __pPlay_moment_timeajust_step_set
				var step = STEP_MOVE_YOUTUBE;
				if (parseInt(pPlay.pPlay_moment_next_get(-1).asset.source) == 3)
					step = STEP_MOVE_TWITCH;
				if (DEBUG) console.log('Step - ', step);

				// __pPlay_moment_clone
				function task() {
					// __moment_clone_call
					mEdit.mEdit_clone(pPlay.pPlay_moment_next_get(-1), {
						time_start: mPlay.currentTime
					}, function(moment) {
						$('[data-moment="' + pPlay.pPlay_moment_next_get(-1).id + '"]')
							.attr('data-moment', moment.id)
							.attr('data-tag', moment.tag)
							.attr('data-time_start', moment.time_start);

						// __playlist_moment_set_call__
						pPlay.pPlay_moment_next_set(pPlay.pPlay_position_get(), moment, function(final) {
							mPlay.currentTime = parseInt(pPlay.pPlay_moment_next_get(-1).time_start);
						});
					});
				};

				// __pPlay_moment_timeajust_forward_onClick
				$('.p-container .adjustment .fa-forward').unbind('click');
				$('.p-container .adjustment .fa-forward').click(function() {

					clearTimeout(App.t);
					mPlay.currentTime = parseInt(pPlay.pPlay_moment_next_get(-1).time_start) + step;
					if (DEBUG) console.log('New time start - ', mPlay.currentTime);

					App.video_obj_get().player_pause(App.player_id_get());
					App.video_obj_get().player_seek(App.player_id_get(), mPlay.currentTime);
					App.video_obj_get().player_play(App.player_id_get());
					// __moment_clone_call
					App.t = setTimeout(task, 1000);
				});

				// __pPlay_moment_timeajust_back_onClick
				$('.p-container .adjustment .fa-backward').unbind('click');
				$('.p-container .adjustment .fa-backward').click(function() {

					clearTimeout(App.t);
					mPlay.currentTime = parseInt(pPlay.pPlay_moment_next_get(-1).time_start) - step;
					if (mPlay.currentTime < 0) mPlay.currentTime = 0;
					if (DEBUG) console.log('New time start - ', mPlay.currentTime);

					App.video_obj_get().player_pause(App.player_id_get());
					App.video_obj_get().player_seek(App.player_id_get(), mPlay.currentTime);
					App.video_obj_get().player_play(App.player_id_get());
					// __moment_clone_call
					App.t = setTimeout(task, 1000);
				});

				// __pPlay_moment_tag_onClick
				$('.p-container .pPlay_header_moment_title').unbind('click');
				$('.p-container .pPlay_header_moment_title').click(function() {
					$('.p-container .pPlay_header_moment_title_editable').height($('.p-container .pPlay_header_moment_title').height());
					$('.p-container .pPlay_header_moment_title').addClass('hidden');
					$('.p-container .pPlay_header_moment_title_editable').removeClass('hidden');
					$('.p-container .pPlay_header_moment_title_editable').focus();
				});
				$('.p-container .pPlay_header_moment_title_editable').unbind('keypress');
				// __pPlay_moment_tag_onEnter
				$('.p-container .pPlay_header_moment_title_editable').keypress(function(e) {
					if (e.keyCode == 13)
					//  __pPlay_moment_tag_change_save_call
						t();
				});
				//  __pPlay_moment_tag_change_save
				function t() {
					var moment = pPlay.pPlay_moment_next_get(-1);
					$('.p-container .pPlay_header_moment_title').removeClass('hidden');
					$('.p-container .pPlay_header_moment_title_editable').addClass('hidden');

					// __moment_title_render__
					$('.p-container .pPlay_header_moment_title_editable').text(moment.tag);
					$('.p-container .pPlay_header_moment_title').text(moment.tag);

					// __moment_clone_call
					mEdit.mEdit_clone(pPlay.pPlay_moment_next_get(-1), {
						tag: $('.p-container .pPlay_header_moment_title_editable').val()
					}, function(moment) {
						$('[data-moment="' + pPlay.pPlay_moment_next_get(-1).id + '"]')
							.attr('data-moment', moment.id)
							.attr('data-tag', moment.tag)
							.attr('data-time_start', moment.time_start)
							.find('.mtag').text(moment.tag);

						// __moment_title_render__
						$('.p-container .pPlay_header_moment_title_editable').text(moment.tag);
						$('.p-container .pPlay_header_moment_title').text(moment.tag);

						// __playlist_moment_set_call__
						pPlay.pPlay_moment_next_set(pPlay.pPlay_position_get(), moment, function(final) {
							mPlay.currentTime = parseInt(pPlay.pPlay_moment_next_get(-1).time_start);
						});
					});
				}
			}
			// __pPlay_other__
			else {
				$('.p-container .profile-menu').removeClass('hidden');

				$('.p-container .profile_image img').attr('src', pPlay.pPlay_object_get().user.image);
				$('.p-container .display_name').text('by ' + pPlay.pPlay_object_get().user.display_name);
				$('.p-container .profile-menu').attr('data-owner_id', pPlay.pPlay_object_get().user.id);
				$('.p-container .profile-menu').click(function() {
					location.hash = '#user/' + $(this).attr('data-owner_id');
				});
			}

			// __pPlay_pagetitle_text_set
			document.title = '#moment ' + pPlay.pPlay_object_get().title;

			// __pPlay_moment_index_text_set
			//  $('.moment_position').text(pPlay.pPlay_position_get() + '. ');

			pNext.pNext_populate(mPlay_page);

			// __pPlay_header_instruction__
			// __instruction_get_apicall
			Instruct.instruct_pPlay_header_render(mPlay_page);

			// __pPlay_next_instruction__
			// __instruction_get_apicall
			Instruct.instruct_pPlay_next_render(mPlay_page);
		},
		pPlay_moment_set_byID: function(playlist, moment_id) {
			var that = this;
			var current_moment = 0;
			var index = 0;
			if (DEBUG) console.log(playlist.moments.length);
			for (var i = 0; i < playlist.moments.length; i++) {
				if (moment_id == playlist.moments[i].id) {
					current_moment = playlist.moments[i].id;
					index = i + 1;
					break;
				}
			}
			if (DEBUG) console.log('--Index = ' + index + ', Current = ' + current_moment);

			if (current_moment == 0) {
				index = 1;
				current_moment = playlist.moments[0].id;
			}

			if (DEBUG) console.log('Current Moment - ', current_moment);

			if (current_moment != 0) {
				pPlay.pPlay_playlist_id_set(playlist.id);
				pPlay.pPlay_object_set(playlist);
				pPlay.pPlay_position_set(index);
				App.current_moment = current_moment;
				//__pPlay_call
				mPlay.mPlay_play_byObj(pPlay.pPlay_moment_next_get(-1), playlist);
			}
		},
		pPlay_playlist_id_set: function(id) {
			this.current = id;
		},
		pPlay_playlist_id_get: function() {
			return this.current;
		},
		pPlay_position_set: function(index) {
			this.index = index
		},
		pPlay_position_get: function() {
			return this.index;
		},
		pPlay_object_set: function(object) {
			this.currentObject = object;
		},
		pPlay_object_get: function() {
			return this.currentObject;
		},
		pPlay_moment_next_get: function(offset) {
			if (offset == undefined || offset == null) offset = 0;
			if (this.currentObject != undefined) {
				if (this.currentObject.moments[this.index + offset])
					return this.currentObject.moments[this.index + offset];
			}
		},
		pPlay_moment_next_set: function(position, moment, callback) {
			// Replaces the moment at i-th position with the provided moment - both client & server side
			if (pPlay.pPlay_object_get() == undefined) return;

			// Client side
			this.currentObject.moments[position - 1] = moment;

			// Server side
			pData.pData_moment_position_id_set(position, moment);
		},
		pPlay_state: function() {
			if (location.hash.indexOf('#playlist/') > -1 && location.hash.indexOf('edit') == -1)
				return true;
			return false;
		}
	};
	return {
		pPlay_play_byID: function(playlist_id, moment_id) {
			_private.pPlay_play_byID(playlist_id, moment_id);
		},
		pPlay_page_render: function(mPlay_page) {
			// pPlay.pPlay_page_render should be called from mPlay.mPlay_play_byID() only
			// pPlay.pPlay_page_render is called after mList.mList_populate() [since they share some parts in common] inside mPlay.mPlay_play
			_private.pPlay_page_render(mPlay_page);
		},
		pPlay_playlist_id_set: function(id) {
			_private.pPlay_playlist_id_set(id);
		},
		pPlay_playlist_id_get: function() {
			return _private.pPlay_playlist_id_get()
		},
		pPlay_position_set: function(index) {
			_private.pPlay_position_set(index);
		},
		pPlay_position_get: function() {
			return _private.pPlay_position_get();
		},
		pPlay_object_set: function(object) {
			_private.pPlay_object_set(object);
		},
		pPlay_object_get: function() {
			return _private.pPlay_object_get();
		},
		pPlay_moment_next_get: function(offset) {
			return _private.pPlay_moment_next_get(offset);
		},
		pPlay_moment_next_set: function(position, moment, callback) {
			_private.pPlay_moment_next_set(position, moment, callback);
		},
		pPlay_state: function() {
			return _private.pPlay_state();
		},
	};
})();
if (typeof pEdit === 'undefined') pEdit = (function() {
	var _private = {
		pEdit_init: function(playlist_id) {
			pEdit.pEdit_id_set(playlist_id);
			// __pEdit_header_html_get
			App.html_template_get('pEdit_header.html', function(data) {
				var container = $('<div>', {
					id: 'playlist_create',
					class: 'omniknight'
				});
				$(container).append(data);
				// __pEdit_body_html_get
				App.html_template_get('pEdit_body.html', function(data) {
					$(container).append(data);
					$('body').append(container);
					$(pEdit.pEdit_html_selector_get()).animate({
						'left': '0px'
					}, 500);
					document.title = '#moment Edit Playlist';

					pEdit.pEdit_render();
				});
			});
		},
		pEdit_render: function() {
			if (pEdit.pEdit_id_get() === '') {

				// Default status and mode
				pEdit.pEdit_visibility_set('public');
				pEdit.pEdit_autoadd_set('handpick');

				pEdit.pEdit_page_handler_set();
				pEdit.pEdit_state_change(true);
			} else {
				$(pEdit.pEdit_html_selector_get()).attr('data-playlist', pEdit.pEdit_id_get());
				// __playlist_data_get_apicall
				$.ajax({
					url: App.api_root_get() + 'playlists/' + pEdit.pEdit_id_get() + '?limit=1000',
					method: 'GET',
					dataType: 'json',
					success: function(response) {

						if (App.user.id == response.publisher_id)
							$(pEdit.pEdit_html_selector_get()).find('.create').text('Save Remix');
						else
							$(pEdit.pEdit_html_selector_get()).find('.create').text('Copy Remix');


						$(pEdit.pEdit_html_selector_get()).find('.title:visible').val(response.title);
						$(pEdit.pEdit_html_selector_get()).find('.search:visible').val(response.terms);

						if (parseInt(response.status_public) == PLAYLIST_STATUS_PUBLIC)
							pEdit.pEdit_visibility_set('public');
						else
							pEdit.pEdit_visibility_set('private');

						if (response.mode == "autoadd")
							pEdit.pEdit_autoadd_set('autoadd');
						else
							pEdit.pEdit_autoadd_set('handpick');

						// __pEdit_sequence_render
						pEdit.pEdit_sequence_clearAll();
						for (var i = 0; i < response.moments.length; i++) {
							pEdit.pEdit_sequence_moment_add(response.moments[i].id);
							mMerch.mMerch_render(response.moments[i], '#pEdit_sequence', {
								class: 'listed'
							});
						}

						// The placeholder
						if (response.moments.length > 0) {
							var c = $('.current.slot');
							$(c).clone().appendTo($(c).parent());
							$(c).remove();
						}
						$('.listed').attr('data-listed', 'true');
						$('[data-listed="true"]').unbind('click');
						$('[data-listed="true"]').click(function(e) {
							e.preventDefault();
							e.stopPropagation();
							var id = $(this).attr('data-moment');
							pEdit.pEdit_sequence_moment_remove(id);
							$('[data-moment=' + id + '][data-listed!="true"]').removeClass('hidden');
							$(this).remove();
						});
						pEdit.pEdit_page_handler_set();
						pEdit.pEdit_state_change(true);
					}
				});
			}
		},
		pEdit_html_selector_get: function() {
			return '#playlist_create';
		},
		pEdit_id_set: function(id) {
			this.id = id;
		},
		pEdit_id_get: function() {
			return this.id ? this.id : '';
		},
		pEdit_visibility_set: function(phrase) {
			// phrase = ['public','private']
			if (phrase.toLowerCase() == 'public')
				$(pEdit.pEdit_html_selector_get()).find('.status .switch-input').prop('checked', false);
			else if (phrase.toLowerCase() == 'private')
				$(pEdit.pEdit_html_selector_get()).find('.status .switch-input').prop('checked', true);
		},
		pEdit_autoadd_set: function(phrase) {
			// phrase = ['handpick','autoadd']
			if (phrase.toLowerCase() == 'handpick')
				$(pEdit.pEdit_html_selector_get()).find('.mode .switch-input').prop('checked', false);
			else if (phrase.toLowerCase() == 'autoadd')
				$(pEdit.pEdit_html_selector_get()).find('.mode .switch-input').prop('checked', true);
		},
		pEdit_page_handler_set: function() {

			//__pEdit_visibility_set
			$(pEdit.pEdit_html_selector_get()).find('.status .switch-input').change(function() {
				if (!this.checked)
					pEdit.pEdit_visibility_set('public');
				else
					pEdit.pEdit_visibility_set('private');
				pEdit.pEdit_state_change();
			});

			// __pEdit_autoadd_set
			$(pEdit.pEdit_html_selector_get()).find('.mode .switch-input').change(function() {
				if (!this.checked)
					pEdit.pEdit_autoadd_set('handpick');
				else
					pEdit.pEdit_autoadd_set('autoadd');
				pEdit.pEdit_state_change();
			});

			//__pEdit_back_onClick
			$(pEdit.pEdit_html_selector_get()).find('.back').unbind('click');
			$(pEdit.pEdit_html_selector_get()).find('.back').click(function() {
				mPlay.mPlay_back_onClick();
			});

			//__pEdit_search_field_onKeyup
			$(pEdit.pEdit_html_selector_get()).find('.search:visible').keyup(function(event) {
				clearTimeout($.data(this, 'timer'));
				var key = event.which || event.keyCode || event.charCode;
				if (key == 13) {
					pEdit.pEdit_state_change(true);
				} else
					$(this).data('timer', setTimeout(function() {
						pEdit.pEdit_state_change(true);
					}, 500));
			});

			$(pEdit.pEdit_html_selector_get()).find('.create').click(function(e) {
				e.preventDefault();
				pEdit.pEdit_save_onClick();
			});

			$(pEdit.pEdit_html_selector_get()).find('.more').unbind('click');
			$(pEdit.pEdit_html_selector_get()).find('.more').click(function() {
				if (pEdit.searchResultLock) return;
				pEdit.searchResultLock = true;
				$.ajax({
					url: App.api_root_get() + 'media/search?term=' + pEdit.pEdit_state_get().search + '&scope=1&order=0&status=1&limit=25&offset=' + pEdit.searchResultOffset + '&item_type=moment&auid=' + User.user_id_get(),
					method: 'GET',
					success: function(response) {
						pEdit.searchResultLock = false;
						var response = JSON.parse(response);
						for (var i = 0; i < response.length; i++) {
							mMerch.mMerch_render(response[i], pEdit.pEdit_search_container_selector_get() + ' .items');
						}
						pEdit.searchResultOffset += response.length;
					}
				});
			});
		},
		pEdit_state_get: function() {
			var state = {
				title: $(pEdit.pEdit_html_selector_get()).find('.title:visible').val(),
				search: $(pEdit.pEdit_html_selector_get()).find('.search:visible').val(),
				status_public: $(pEdit.pEdit_html_selector_get()).find('.status .switch-input').is(':checked') ? PLAYLIST_STATUS_PRIVATE : PLAYLIST_STATUS_PUBLIC,
				mode: $(pEdit.pEdit_html_selector_get()).find('.mode .switch-input').is(':checked') ? 'autoadd' : 'handpick'
					//playlist_type:1
			};
			if ($(pEdit.pEdit_html_selector_get()).attr('data-playlist')) state.id = $(pEdit.pEdit_html_selector_get()).attr('data-playlist');
			return state;
		},
		pEdit_state_change: function(force) {
			// __pEdit_slot_instruction_autoadd_render
			if (pEdit.pEdit_state_get().mode == 'autoadd') {
				var middle = (pEdit.pEdit_state_get().search == '') ? ' ' : ' "' + pEdit.pEdit_state_get().search + '" ';
				$('.current.slot .mthumbnail').html(CONFIG.config_get('#playlist_edit_auto-add_instriction_prefix').instruction_text + middle + CONFIG.config_get('#playlist_edit_auto-add_instriction_suffix').instruction_text);

				// __pEdit_header_instruction_render
				// __instruction_get_apicall
				Instruct.instruct_general_header_render('#playlist_edit_autoadd_instruction', true);
			}
			// __pEdit_slot_instruction_handpick_render
			else if (pEdit.pEdit_state_get().mode = 'handpick') {
				$('.current.slot .mthumbnail').html(CONFIG.config_get('#playlist_edit_sequence_slot_instruction').instruction_text);
			}
			if (force) {
				// __pEdit_results_render_call
				Media.pEdit_search($.extend(pEdit.pEdit_state_get(), {
					term: pEdit.pEdit_state_get().search
				}), function(items) {
					pEdit.pEdit_search_render(items);
				});
			}
		},
		pEdit_save_onClick: function() {
			User.user_stat_get(function(stat) {
				if ($(pEdit.pEdit_html_selector_get()).find('.title:visible').val() == '') {
					alert('Empty Title?!');
					return;
				}
				var data = $.extend(pEdit.pEdit_state_get(), {
					auid: User.user_id_get()
				});
				data = $.extend(data, {
					moment_ids: pEdit.pEdit_sequence_get().join()
				});
				if (DEBUG) console.log(data);
				// __playlist_data_get_apicall
				$.ajax({
					url: App.api_root_get() + 'playlists/' + pEdit.pEdit_id_get(),
					data: data,
					method: 'POST',
					dataType: 'json',
					success: function(response) {
						if (App.hash_previous_get())
							location.hash = App.hash_previous_get();
						else
							location.hash = '#feed';
					}
				});
			});
		},

		pEdit_sequence_clearAll: function() {
			this.moments = [];
		},
		pEdit_sequence_moment_add: function(moment_id) {
			if (!this.moments) this.moments = [];
			if ($.inArray(moment_id, this.moments) == -1)
				this.moments.push(moment_id);
			if (DEBUG) console.log(this.moments);
		},
		pEdit_sequence_moment_remove: function(moment_id) {
			if (!this.moments) this.moments = [];
			this.moments = $.grep(this.moments, function(a) {
				return a != moment_id;
			});
			if (DEBUG) console.log(this.moments);
		},
		pEdit_sequence_get: function() {
			if (!this.moments) this.moments = [];
			return this.moments;
		},
		pEdit_sequence_slot_instruction_set: function() {},

		pEdit_search_scope_get: function() {},
		pEdit_search_render: function(items, append) {
			if (!append)
				$(pEdit.pEdit_search_container_selector_get()).find('.items').empty();
			if (items.length == 0) {
				$(pEdit.pEdit_search_container_selector_get()).find('.items').append($('<div>', {
					class: 'font-medium lightest-teal'
				}).text('No matching moments'));
				return;
			}
			for (var i = 0; i < items.length; i++) {
				mMerch.mMerch_render(items[i], pEdit.pEdit_search_container_selector_get() + ' .items');
				if ($('[data-listed="true"][data-moment=' + items[i].id + ']').length)
					$('[data-listed!="true"][data-moment=' + items[i].id + ']').addClass('hidden');
			}
			if (!append) {
				$(pEdit.pEdit_search_container_selector_get()).find('.more').removeClass('hidden');
				pEdit.searchResultOffset = 5;
			}
		},
		pEdit_search_container_selector_get: function() {
			return '#pEdit_result';
		},
		pEdit_search_moment_onClick: function(that) {
			var id = $(that).attr('data-moment');
			pEdit.pEdit_sequence_moment_add(id);

			$(that).clone().attr('data-listed', 'true').addClass('listed').insertAfter('#pEdit_sequence .current.slot');
			var c = $('.current.slot');
			if ($('.slot').not('.current').length > 0) {
				$('.current.slot').parent().find('.slot').not('.current').first().addClass('current');
			} else {
				$(c).clone().appendTo($(c).parent());
			}
			$(c).remove();
			$(that).addClass('hidden');
			$('[data-listed="true"]').unbind('click');
			$('[data-listed="true"]').click(function(e) {
				e.preventDefault();
				e.stopPropagation();
				var id = $(this).attr('data-moment');
				pEdit.pEdit_sequence_moment_remove(id);
				$('[data-moment=' + id + '][data-listed!="true"]').removeClass('hidden');
				$(this).remove();
			});
		},
		pEdit_refresh: function() {}
	};
	return {
		pEdit_init: function(playlist_id) {
			_private.pEdit_init(playlist_id);
		},
		pEdit_render: function() {
			_private.pEdit_render();
		},
		pEdit_html_selector_get: function() {
			return _private.pEdit_html_selector_get();
		},
		pEdit_id_get: function() {
			return _private.pEdit_id_get();
		},
		pEdit_id_set: function(id) {
			_private.pEdit_id_set(id);
		},
		pEdit_visibility_set: function(phrase) {
			_private.pEdit_visibility_set(phrase);
		},
		pEdit_autoadd_set: function(phrase) {
			_private.pEdit_autoadd_set(phrase);
		},
		pEdit_page_handler_set: function() {
			_private.pEdit_page_handler_set();
		},
		pEdit_state_get: function() {
			return _private.pEdit_state_get();
		},
		pEdit_state_change: function(force) {
			_private.pEdit_state_change(force);
		},
		pEdit_save_onClick: function() {
			_private.pEdit_save_onClick();
		},
		pEdit_sequence_get: function() {
			return _private.pEdit_sequence_get();
		},
		pEdit_sequence_setup: function() {
			_private.pEdit_sequence_setup();
		},
		pEdit_sequence_moment_add: function(moment_id) {
			_private.pEdit_sequence_moment_add(moment_id);
		},
		pEdit_sequence_moment_remove: function(moment_id) {
			_private.pEdit_sequence_moment_remove(moment_id);
		},
		pEdit_sequence_clearAll: function() {
			_private.pEdit_sequence_clearAll();
		},
		pEdit_sequence_slot_instruction_set: function() {
			_private.pEdit_sequence_slot_instruction_set();
		},

		pEdit_search_scope_get: function() {
			return _private.pEdit_search_scope_get();
		},
		pEdit_search_render: function(items, append) {
			_private.pEdit_search_render(items, append);
		},
		pEdit_search_container_selector_get: function() {
			return _private.pEdit_search_container_selector_get();
		},
		pEdit_search_moment_onClick: function(that) {
			_private.pEdit_search_moment_onClick(that);
		},
		pEdit_refresh: function() {
			_private.pEdit_refresh();
		}
	};
})();
if (typeof pNext === 'undefined') pNext = (function() {
	var _private = {
		pNext_populate: function(mPlay_page) {
			var that = this;

			mPlay.mPlay_html_append(mPlay_page);

			if (Browser.url_native() && pPlay.pPlay_state() && pPlay.pPlay_object_get() != undefined) {
				that.pNext_render(pPlay.pPlay_object_get());
			}
		},
		pNext_populate_twitch: function(playlist_object) {
			$('#invisible_layer').remove();
			$('#video-1').append($('<div>', {
				id: 'invisible_layer',
				class: 'clearfix'
			}));
			$('#video-1').append($('<div>', {
				id: 'transparent_layer',
				class: 'pointer-event-fill'
			}));
			pPlay.pPlay_object_set(playlist_object);
			pPlay.pPlay_position_set(1);
			this.pNext_render(playlist_object);
			clearInterval(pNext.twitch_seek_try);
			pNext.twitch_seek_try = setInterval(function() {
				if ((document.getElementsByTagName('object')[0]) && typeof(document.getElementsByTagName('object')[0].videoSeek) === 'function' && typeof(document.getElementsByTagName('object')[0].getVideoTime) === 'function') {
					setTimeout(function() {
						App.video_obj_get().player_seek(App.player_id_get(), parseInt(playlist_object.moments[0].time_start));
						clearInterval(pNext.twitch_seek_try);
					}, 1000);
				}
			}, 1000);
		},
		pNext_render: function(playlist, callback) {
			// Private method, should be called from pNext_populate only
			if (DEBUG) console.log('pNext_render - ', playlist);

			// Append dom user_id_get_page_data to the page
			$('#invisible_layer').append($('<div>', {
				id: 'next_list',
				class: 'clearfix'
			}));

			// __pPlay_next_hook_render
			$('#next_list').append($('<div>', {
				class: 'hook'
			}).append($('<div>', {
				class: 'vertical_bar'
			})).append($('<div>', {
				class: 'vertical_bar'
			})).append($('<div>', {
				class: 'vertical_bar'
			})));

			// __pPlay_next_all_render_opened
			$('#next_list').append($('<div>', {
				class: 'items'
			}));
			// __pPlay_next_all_render_collapsed
			$('#next_list').append($('<div>', {
				class: 'items_collapsed clearfix'
			}));

			// __pPlay_next_hook_onClick
			$('#next_list .hook').unbind('click');
			$('#next_list .hook').click(function() {
				pNext.pNext_hook_onClick();
			});

			var _selector = '#next_list';
			var moments = playlist.moments;
			delete Carousel['next_list'];

			// __pPlay_next_all_render_opened
			Carousel.carousel_render(_selector, moments, function() {
				$(_selector).removeClass('hidden');
				$(_selector).preloader();
			});

			// __pPlay_next_all_render_collapsed
			for (var i = 0; i < moments.length; i++) {
				mMerch.mMerch_render(moments[i], '#next_list .items_collapsed', {
					class: 'item_collapsed hidden',
					href: App.site_address_get() + '#playlist/' + playlist.id + '/moment/' + moments[i].id
				});
			}
			pNext.pNext_refresh();
			pNext.pNext_moment_more_get();
		},
		pNext_moment_more_get: function() {
			var playlist = pPlay.pPlay_object_get();

			if (playlist.moments.length < playlist.moment_count) {
				// More to come
				var n = Carousel['next_list'].length;

				// __playlist_data_get_apicall
				$.ajax({
					url: App.api_root_get() + 'playlists/' + playlist.id + '?offset=' + (n) + '&limit=5',
					dataType: 'json',
					method: 'GET',
					success: function(response) {
						// __pPlay_next_more_render
						for (var i = 0; i < response.moments.length; i++) {
							Carousel['next_list'].push(response.moments[i]);

							// __pPlay_next_all_render_collapsed
							mMerch.mMerch_render(response.moments[i], '#next_list .items_collapsed', {
								class: 'item_collapsed hidden'
							});
						}
						// __pPlay_next_all_render_opened
						Carousel.carousel_refresh();

						// Recursion
						pNext.pNext_moment_more_get();
						pNext.pNext_refresh();
					}
				});
			}
		},
		pNext_moment_onClick: function(self) {
			Twitch.start_timer();

			// __pPlay_next_update__
			$('.current').removeClass('current');
			$('[data-moment="' + $(self).attr('data-moment') + '"]').addClass('current');

			if ($('#invisible_layer').hasClass('collapsed')) {
				// __events_pPlay_pNext_position
				Events.event_post('pPlay', 'pNext', pPlay.pPlay_position_get() + 1);

				pNext.pNext_refresh_collapsed();
				pNext.pNext_moment_next_title_collapsed();
			}

			if (Browser.url_twitch()) {
				var playlist = pPlay.pPlay_object_get();
				var current_moment = 0;
				var index = 0;
				if (DEBUG) console.log(playlist.moments.length);
				for (var i = 0; i < playlist.moments.length; i++) {
					if ($(self).attr('data-moment') == playlist.moments[i].id) {
						current_moment = playlist.moments[i].id;
						index = i + 1;
						break;
					}
				}
				if (DEBUG) console.log('--Index = ' + index + ', Current = ' + current_moment);

				if (current_moment == 0) {
					index = 1;
					current_moment = playlist.moments[0].id;
				}

				if (DEBUG) console.log('Current Moment - ', current_moment);

				if (current_moment != 0) {
					pPlay.pPlay_playlist_id_set(playlist.id);
					pPlay.pPlay_object_set(playlist);
					pPlay.pPlay_position_set(index);
				}
				Events.event_post('pPlay', 'mPlay', pPlay.pPlay_position_get());
			} else {
				if (location.hash.indexOf('playlist/' + pPlay.pPlay_playlist_id_get() + '/moment/' + $(self).attr('data-moment')) > -1) {
					// __events_pPlay_mPlay_position
					Events.event_post('pPlay', 'mPlay', pPlay.pPlay_position_get());
				}
				location.hash = '#playlist/' + pPlay.pPlay_playlist_id_get() + '/moment/' + $(self).attr('data-moment');
			}
			App.video_obj_get().player_seek(App.player_id_get(), $(self).attr('data-time_start'));
		},
		pNext_hook_onClick: function() {
			var that = this;

			if (that.animating) return;
			that.animating = true;

			if ($('#invisible_layer').hasClass('collapsed')) {
				// __events_pPlay_drawer_open
				Events.event_post('pPlay', 'drawer', 'open');
				if (DEBUG) console.log('pPlay_drawer_open');

				var marginLeft = 0;
				$('#invisible_layer').animate({
					marginLeft: marginLeft
				}, 300, function() {
					$('#invisible_layer').removeClass('collapsed').addClass('opened');
					that.animating = false;
					pNext.pNext_refresh();
				});
			} else if ($('#invisible_layer').hasClass('opened')) {
				// __events_pPlay_drawer_open
				Events.event_post('pPlay', 'drawer', 'close');
				if (DEBUG) console.log('pPlay_drawer_close');

				$('#invisible_layer').removeClass('opened').addClass('collapsed');
				var marginLeft = $('body').width() * PLAYER_WIDTH_FACTOR - $('#next_list .item_collapsed:visible:first').width() - $('#next_list .hook').width() - THUMB_GAP_RIGHT;
				if (Browser.device_touch()) marginLeft += $('.curtain.left').width();
				$('#invisible_layer').animate({
					marginLeft: marginLeft
				}, 300, function() {
					that.animating = false;
					pNext.pNext_refresh();
				});
			}
		},
		pNext_calculate_left: function() {
			var width = $('body').width() * PLAYER_WIDTH_FACTOR;
			if (Browser.url_twitch())
				width = $('#video-1').width();
			var left = 0;
			var items = Browser.site_page_column_count('pNext');
			if (items == 5) left = width * (1 - .9375);
			else if (items == 6) left = width * (1 - .9);
			else left = 0;
			return left;
		},
		pNext_refresh: function() {
			// Repositioning invisible_layer
			// __mList_html_css_position
			var that = this;
			if (pPlay.pPlay_object_get() != undefined) {
				if (DEBUG) console.log('pNext refresh', App.player_state_get());

				// NextList bottom px
				var bottom = PLAYLIST_MODE_YOUTUBE_BOTTOM;
				if (App.player_state_get() == 'Twitch')
					bottom = PLAYLIST_MODE_TWITCH_BOTTOM;
				if (Browser.device_iPhone())
					bottom = PLAYLIST_MODE_IPHONE_BOTTOM;

				if (!($('#invisible_layer').hasClass('collapsed') || $('#invisible_layer').hasClass('opened'))) {
					$('#invisible_layer').addClass('opened');
				}
				var left = that.pNext_calculate_left();

				if (Browser.url_twitch()) {
					$('#invisible_layer')
						.css('width', $('#video-1').width())
						.css('left', left);
					$('#invisible_layer,#transparent_layer')
						.css('top', 'auto')
						.css('bottom', bottom);
					$('#next_list .hook')
						.css('height', $('#next_list .mthumb:visible').outerHeight(true));
				} else {

					$('#invisible_layer')
						.css('width', $('body').width() * PLAYER_WIDTH_FACTOR);

					if ($('#invisible_layer').hasClass('collapsed'))
						$('#invisible_layer').css('left', $('body').width() * PLAYER_MARGIN_FACTOR);
					else
						$('#invisible_layer').css('left', $('body').width() * PLAYER_MARGIN_FACTOR + left);

					$('#invisible_layer,.curtain,#transparent_layer')
						.css('top', 'auto')
						.css('bottom', bottom);
					$('#transparent_layer')
						.css('width', $(App.player_selector_get()).width())
						.css('height', TRANSPARENT_LAYER_HEIGHT);

					// __pPlay_drawer_handle_html_css_position
					// __pPlay_drawer_curtain_right
					$('#next_list .hook,.curtain')
						.css('height', $('#next_list .mthumb:visible').outerHeight(true));
				}

				// __pPlay_next_update__
				var playlist = pPlay.pPlay_object_get();
				var current = pPlay.pPlay_position_get() - 1;
				for (var i = 0; i < playlist.moments.length; i++) {
					if (current == i) {
						$('.current').removeClass('current');
						$('#next_list [data-moment="' + playlist.moments[i].id + '"]').addClass('current');
						break;
					}
				}
				// __pPlay_drawer_collapse_html_css_position
				if ($('#invisible_layer').hasClass('collapsed')) {
					pNext.pNext_refresh_collapsed();
				} else {
					//$('#next_list').carousel($('#next_list .items .carousel-inner .item .current').parent().prevAll().length);
					$('#next_list .carousel-control.right').css('right', left);
				}

				// __pPlay_next_items_onClick
				$('#next_list .mthumb').unbind('click');
				$('#next_list .mthumb').click(function(e) {
					e.preventDefault();
					e.stopPropagation();
					pNext.pNext_moment_onClick(this);
				});
				if ($('#invisible_layer').hasClass('collapsed'))
					pNext.pNext_moment_next_title_collapsed();
				else
					pNext.pNext_moment_next_title_opened();
				Instruct.instruct_refresh();

				setTimeout(function() {
					if(!$('.no-touch #invisible_layer,.p-container .header.wrapper,.p-container .instruction.wrapper,#transparent_layer').hasClass('hover')){
						$('.no-touch #invisible_layer,.p-container .header.wrapper,.p-container .instruction.wrapper,#transparent_layer').removeClass('hover').removeClass('visible');
					}
				}, 5000);
			}
		},
		pNext_moment_next_title_collapsed: function() {
			var i = 1;
			$('#next_list .item_collapsed').each(function() {
				$(this).attr('data-serial', i);
				i++;
			});
			$('#next_list .item_collapsed.current').next().find('.mtag').html('<span class="next_title">Next - </span><span class="serial">' + $('#next_list .item_collapsed.current').next().attr('data-serial') + '. </span>' + $('#next_list .item_collapsed.current').next().attr('data-tag'));
		},
		pNext_moment_next_title_opened: function() {
			var i = 1;
			$('#next_list .carousel .mthumb').each(function() {
				$(this).attr('data-serial', i);
				$(this).find('.mtag').html('<span class="serial">' + $(this).attr('data-serial') + '. </span>' + $(this).attr('data-tag'));
				i++;
			});
		},
		pNext_refresh_collapsed: function() {
			$('#next_list .item_collapsed').addClass('hidden');
			$('#next_list .item_collapsed.current').next().removeClass('hidden');
			var width = $('body').width() * PLAYER_WIDTH_FACTOR;
			if (Browser.url_twitch()) {
				width = $('#video-1').width();
				$('#invisible_layer').css('left', '-10px');
			}
			var marginLeft = width - $('#next_list .item_collapsed:visible:first').width() - $('#next_list .hook').width() - THUMB_GAP_RIGHT;
			if (Browser.device_touch()) marginLeft += $('.curtain.left').width();
			$('#invisible_layer').css('margin-left', marginLeft);
		}
	};
	return {
		pNext_populate: function(mPlay_page) {
			_private.pNext_populate(mPlay_page);
		},
		pNext_populate_twitch: function(playlist_object) {
			_private.pNext_populate_twitch(playlist_object);
		},
		pNext_moment_more_get: function() {
			_private.pNext_moment_more_get();
		},
		pNext_moment_onClick: function(self) {
			_private.pNext_moment_onClick(self);
		},
		pNext_hook_onClick: function() {
			_private.pNext_hook_onClick();
		},
		pNext_refresh: function() {
			_private.pNext_refresh();
		},
		pNext_moment_next_title_collapsed: function() {
			_private.pNext_moment_next_title_collapsed();
		},
		pNext_moment_next_title_opened: function() {
			_private.pNext_moment_next_title_opened();
		},
		pNext_refresh_collapsed: function() {
			_private.pNext_refresh_collapsed();
		}
	};
})();
if (typeof pPromo === 'undefined') pPromo = (function() {
	var _private = {
		pPromo_render: function(playlist_obj, carousel_item_html) {
			App.html_template_get('pPromo_item.html', function(html) {
				var html = $.parseHTML(html);

				$(html).find('.pPromo_thumb a').attr('href', App.site_address_get() + '#playlist/' + playlist_obj.id);
				$(html).find('.pPromo_title').attr('href', App.site_address_get() + '#playlist/' + playlist_obj.id);

				// Thumbnail Images
				$(html).find('.pPromo_thumb img').attr('src', Utility.image_url_resolve('moment_thumbnail_placeholder.png'));
				if (playlist_obj.moments[0] && playlist_obj.moments[0].id)
					$(html).find('.pPromo_thumb_1').attr('src', App.api_root_get() + 'thumbnails/' + playlist_obj.moments[0].id);
				if (playlist_obj.moments[1] && playlist_obj.moments[1].id)
					$(html).find('.pPromo_thumb_2').attr('src', App.api_root_get() + 'thumbnails/' + playlist_obj.moments[1].id);
				if (playlist_obj.moments[2] && playlist_obj.moments[2].id)
					$(html).find('.pPromo_thumb_3').attr('src', App.api_root_get() + 'thumbnails/' + playlist_obj.moments[2].id);

				// User Image
				$(html).find('.pPromo_user_image img').attr('src', Utility.image_url_resolve('user_anon_image.jpg'));
				if (playlist_obj.user.image && playlist_obj.user.image != '')
					$(html).find('.pPromo_user_image img').attr('src', playlist_obj.user.image);

				$(html).find('.pPromo_title').text(playlist_obj.title);

				$(html).find('.pPromo_detail_moment_count').text(playlist_obj.moment_count);
				$(html).find('.pPromo_detail_moment_count_suffix').html((playlist_obj.moment_count > 1) ? '&nbsp;highlights' : '&nbsp;highlight');
				$(html).find('.pPromo_detail_time_ago').text(Utility.time_since_calc(playlist_obj.epoch_added));
				$(html).find('.pPromo_detail_publisher_name').text(playlist_obj.user.display_name);

				//$(html).find('.pPromo_detail_publisher_name').parent().attr('href', App.site_address_get() + '#user/' + object.user.id);
				$(html).find('.pPromo_user_image').attr('href', App.site_address_get() + '#user/' + playlist_obj.user.id);

				$(html).find('.pPromo_detail_view_count').text(playlist_obj.count_played_dup + ' View' + (playlist_obj.count_played_dup > 1 ? 's' : ''));

				$(html).preloader();

				$(html).appendTo(carousel_item_html);
			});
		},
		pPromo_populate: function(playlist_items) {
			if (typeof playlist_items === 'string')
				playlist_items = JSON.parse(playlist_items);

			$('#pPromo_carousel .carousel-indicators').empty();
			$('#pPromo_carousel .carousel-inner').empty();
			for (var i = 0; i < playlist_items.length; i++) {
				if (typeof playlist_items[i] === 'string')
					playlist_items[i] = JSON.parse(playlist_items[i]);
				var item = $('<div>', {
					class: 'item',
					id: 'item-' + i
				});
				$(item).appendTo('#pPromo_carousel .carousel-inner');

				pPromo.pPromo_render(playlist_items[i], '#item-' + i);

				$('<li data-target="#pPromo_carousel" data-slide-to="' + i + '"></li>').appendTo('#pPromo_carousel .carousel-indicators')
			}
			$('#pPromo_carousel .item').first().addClass('active');
			$('#pPromo_carousel .carousel-indicators li').first().addClass('active');
			$('#pPromo_carousel .carousel-indicators > li').first().addClass('active');
			$('#pPromo_carousel').carousel({

			});
			$('#pPromo_carousel').on('slid.bs.carousel', function() {
				Carousel.carousel_end_check(this);
			});
		},
		pPromo_prepare: function(pPromo_redirect, playlist_items) {
			if (!pPromo_redirect) {
				$.ajax({
					url: App.api_root_get() + 'playlists/promo?limit=5&offset=0&days=7',
					method: 'GET',
					success: function(response) {
						var playlist_items = JSON.parse(response);
						pPromo.pPromo_populate(playlist_items);
					}
				});
			} else {
				pPromo.pPromo_populate(playlist_items);
			}
		}
	};
	return {
		pPromo_render: function(playlist_obj, carousel_item_html) {
			_private.pPromo_render(playlist_obj, carousel_item_html);
		},
		pPromo_populate: function(playlist_items) {
			_private.pPromo_populate(playlist_items);
		},
		pPromo_prepare: function(pPromo_redirect, playlists_items) {
			_private.pPromo_prepare(pPromo_redirect, playlists_items);
		}
	};
})();

// ///////  app user_id_get_page_data ////////////////////////////
if (typeof Feed === 'undefined') Feed = (function() {
	var _private = {
		feed_page_selector_get: function() {
			return '#feed-';
		},
		feed_page_populate: function(param, callback) {
			var that = this;
			if (that.once) {
				$('.frame').addClass('hidden');
				$(that.feed_page_selector_get()).removeClass('hidden');
				if (typeof callback === 'function') callback();
				return;
			}
			that.once = true;
			if (DEBUG) console.log('Crossed Barrier');

			// __feed_body_html_get
			App.html_template_get('feed.html', function(html) {
				$(that.feed_page_selector_get()).html(html);

				// __fRow_playlist_recommended_create
				that.fRow_recommend_populate();

				// __fRow_playlist_new_create
				that.fRow_new_populate();

				// __fRow_playlist_featured_create
				that.fRow_titleMatch_populate();

				if (App.user.personalize.length > 0) {
					Feed.personalize_checker=setInterval(function(){
						if(App.user.personalize!=Feed.personalize){
							Feed.personalize=App.user.personalize;
							var personalize = JSON.parse(App.user.personalize);
							if (personalize.favorite_partner_channel) {
								var channels = personalize.favorite_partner_channel.split(',');
								for (var i = 0; i < channels.length; i++) {
									var parts = channels[i].split('/');
									that.fRow_channel_populate(parts[0], parts[1]);
								}
							}
						}
					},1000);
				}

				$('.frame').addClass('hidden');
				$(that.feed_page_selector_get()).removeClass('hidden');
				if (typeof callback === 'function') callback();
			});
		},
		fRow_channel_populate: function(partner, channel) {
			var that = this;
			var _partner = partner ? partner : 'twitch';
			var _channel = channel ? channel : false;
			if (!_channel) return;
			var offset = 0;
			var limit = FEED_PARTNER_PLAYLIST_INIT_ITEMS;

			// __fRow_playlist_hit_key_get
			var key = 'playlists' + '/' + _partner + '/channel/' + _channel + '?offset=' + offset + '&limit=' + limit;
			var _selector = '#' + _partner + '-' + _channel + '-playlists';
			var _class = 'mrow hidden feed-playlist hit-playlist clearfix feed-gap';
			var _title = channel;
			var _position = {
				position: 'before',
				selector: that.fRow_recommend_selector_get()
			};
			var _subkey = '_playlists';
			$(_selector).remove();
			Row.row_populate(key, _selector, _class, _title, _position, _subkey, function() {
				$(_selector).find('.title .fa-times').remove();
				$(_selector).find('.title').append($('<div>', {
					class: 'fa fa-times'
				}).attr('data-channel', partner + '/' + channel));
				$(_selector).find('.title .fa-times').unbind('click');
				$(_selector).find('.title .fa-times').click(function(e) {
					var parent = $(this).closest('.hit-playlist');
					var channel = $(this).attr('data-channel');
					var favorite_partner_channel = User.user_favorite_partner_channel_get();

					var favorite_partner_channel_new = [];
					$.each(favorite_partner_channel, function(i, el) {
						if (el != channel) favorite_partner_channel_new.push(el);
					});
					User.uData_update({
						favorite_partner_channel: favorite_partner_channel_new.join(',')
					});
					$(parent).remove();
				});
			});
		},
		fRow_recommend_selector_get: function() {
			return '#fRow_recommend_selector';
		},
		fRow_recommend_key_get: function() {
			return this.importantPlaylistKey ? this.importantPlaylistKey : 'playlists/important?scope=3&limit=' + FEED_PLAYLIST_INIT_ITEMS + '&auid=' + User.user_id_get();
		},
		fRow_recommend_populate: function() {
			var that = this;
			var key = that.fRow_recommend_key_get();
			var _selector = '#fRow_recommend_selector';
			var _class = 'mrow hidden feed-playlist clearfix feed-gap';
			var _title = 'Recommended';
			var _position = {
				position: 'static'
			};
			var _subkey = undefined;
			Row.row_populate(key, _selector, _class, _title, _position, _subkey);
		},
		fRow_new_selector_get: function() {
			return '#fRow_new_selector';
		},
		fRow_new_key_get: function() {
			return this.newPlaylistKey ? this.newPlaylistKey : 'playlists/all?limit=' + FEED_PLAYLIST_INIT_ITEMS + '&scope=3';;
		},
		fRow_new_populate: function() {
			var that = this;
			var key = that.fRow_new_key_get();
			var _selector = '#fRow_new_selector';
			var _class = 'mrow hidden feed-playlist clearfix feed-gap';
			var _title = 'New Remix';
			var _position = {
				position: 'static'
			};
			var _subkey = undefined;
			Row.row_populate(key, _selector, _class, _title, _position, _subkey);
		},
		fRow_titleMatch_populate: function() {
			var that = this;
			CONFIG.config_obj_get(function(config) {
				var list = config['feed_category_playlist_title'].split(';');
				list = list.reverse();
				for (var i = 0; i < list.length; i++) {
					var term = list[i].toLowerCase();
					var original = list[i];

					(function(term, original) {
						// __fRow_playlist_featured_key_get
						var key = 'media/search?term=' + term + '&item_type=playlist&scope=3&order=0&limit=' + FEED_PLAYLIST_INIT_ITEMS + '&auid=' + User.user_id_get();
						var _selector = '#' + term + '-playlists';
						var _class = 'mrow hidden feed-playlist featured-playlist clearfix feed-gap';
						var _title = original;
						var _position = {
							position: 'after',
							selector: that.fRow_new_selector_get()
						};
						var _subkey = undefined;
						Row.row_populate(key, _selector, _class, _title, _position, _subkey);

					})(term, original);
				}
			});
		},
		feed_refresh: function() {}
	};
	return {
		feed_page_selector_get: function() {
			return _private.feed_page_selector_get();
		},
		feed_page_populate: function(param, callback) {
			_private.feed_page_populate(param, callback);
		},
		fRow_channel_populate: function(partner, channel) {
			_private.fRow_channel_populate(partner, channel);
		},
		fRow_recommend_selector_get: function() {
			return _private.fRow_recommend_selector_get();
		},
		fRow_recommend_populate: function() {
			_private.fRow_recommend_populate();
		},
		fRow_new_selector_get: function() {
			return _private.fRow_new_selector_get();
		},
		fRow_new_key_get: function() {
			return _private.fRow_new_key_get();
		},
		fRow_new_populate: function() {
			_private.fRow_new_populate();
		},
		fRow_titleMatch_populate: function() {
			_private.fRow_titleMatch_populate();
		},
		feed_refresh: function() {
			_private.feed_refresh();
		}
	};
})();
if (typeof Row === 'undefined') Row = (function() {
	var _private = {
		row_load: function(key, sub, callback) {
			if (DEBUG) console.log(key, sub);
			$.ajax({
				url: App.api_root_get() + key,
				method: 'GET',
				success: function(response) {
					Local.local_thumb_clear();
					Local.local_thumb_clear();
					Local.local_thumb_clear();
					try {
						localStorage.setItem(key, response);
					} catch (e) {
						if (DEBUG) console.log('Unable to cache on first attempt - ', key);
						Local.local_thumb_clear();
						try {
							localStorage.setItem(key, response);
						} catch (ee) {
							if (DEBUG) console.log('Unable to cache on second attempt - ', key);
						}
					}
					var response = JSON.parse(response);
					// sub object
					if (typeof sub !== 'undefined') response = response[sub];
					if (typeof callback === 'function') callback(response);
				}
			});
		},
		row_render: function(_selector, _class, _title, _position, _items, _options) {
			if (DEBUG) console.log(_selector, _class, _title, _position, _items, _options);
			if (typeof _items === 'undefined') return;
			var container = $('<div>', {
				id: _selector.replace('#', ''),
				class: _class
			}).attr('data-index', 0);
			var title = $('<div>', {
				class: 'title font-large'
			}).text(Utility.ucfirst(_title)).appendTo($(container));
			var items = $('<div>', {
				class: 'items clearfix'
			}).appendTo($(container));

			if ($(_selector).length == 0) {
				if (_position.position == 'before') {
					$(container).insertBefore(_position.selector);
				} else if (_position.position == 'after')
					$(container).insertAfter(_position.selector);
			} else
				$(_selector).find('.items').children().not('#playlist_new').remove();

			if (_items.length == 0) {
				$(_selector).find('.items').children().not('#playlist_new').addClass('hidden');
				return;
			}
			if (_selector == '#my-playlists' || _selector == '#my-moments' || _selector == '.my-history') {
				for (var i = 0; i < _items.length; i++) {
					if (!_items[i].mode)
						mMerch.mMerch_render(_items[i], $(_selector).find('.items'), {
							class: 'slide'
						});
					else
						pMerch.pMerch_render(_items[i], $(_selector).find('.items'), {
							class: 'slide'
						});
				}
				$(_selector).removeClass('hidden');
				$(_selector).preloader();
			} else {
				Carousel.carousel_render(_selector, _items, function() {
					$(_selector).removeClass('hidden');
					$(_selector).preloader();
				});
			}
		},
		row_keyHash_changed: function(key, hash, callback) {
			var _get = '?hash=';
			if (key.indexOf('?') > -1)
				_get = '&hash=';
			$.ajax({
				url: App.api_root_get() + key + _get + hash,
				method: 'GET',
				success: function(response) {
					if (typeof callback === 'function') callback(JSON.parse(response));
				}
			});
		},
		row_populate: function(key, _selector, _class, _title, _position, _subkey, _callback) {
			if (localStorage.getItem(key)) {
				var hash = CryptoJS.MD5(localStorage.getItem(key));
				var _items = JSON.parse(localStorage.getItem(key));
				if (typeof _subkey !== 'undefined') _items = _items[_subkey];

				// __fRow_container_get
				// __fRow_html
				Row.row_render(_selector, _class, _title, _position, _items);
				if (typeof _callback === 'function') _callback();
				setTimeout(function() {
					Row.row_keyHash_changed(key, hash, function(r) {
						if (DEBUG) console.log(r);
						if (r.outOfDate == true) {
							// __fRow_data_get
							Row.row_load(key, _subkey, function(response) {
								// __fRow_container_get
								// __fRow_html
								Row.row_render(_selector, _class, _title, _position, response);
								if (typeof _callback === 'function') _callback();
							});
						} else
						; //render(JSON.parse(localStorage.getItem(key))['_playlists']);
					});
				}, 1000);
			} else {
				// __fRow_data_get
				Row.row_load(key, _subkey, function(response) {
					// __fRow_container_get
					// __fRow_html
					Row.row_render(_selector, _class, _title, _position, response);
					if (typeof _callback === 'function') _callback();
				});
			}
		}
	};
	return {
		row_load: function(key, sub, callback) {
			_private.row_load(key, sub, callback);
		},
		row_render: function(_selector, _class, _title, _position, _items, _options) {
			_private.row_render(_selector, _class, _title, _position, _items, _options);
		},
		row_keyHash_changed: function(key, hash, callback) {
			_private.row_keyHash_changed(key, hash, callback);
		},
		row_populate: function(key, _selector, _class, _title, _position, _subkey, _callback) {
			_private.row_populate(key, _selector, _class, _title, _position, _subkey, _callback);
		}
	};
})();
if (typeof My === 'undefined') My = (function() {
	var _private = {
		my_page_selector_get: function() {
			return '#playlists-';
		},
		my_page_populate: function(callback) {
			var that = this;
			if (that.once == true) {
				$('.frame').addClass('hidden');
				$(that.my_page_selector_get()).removeClass('hidden');
				if (typeof callback === 'function') callback();
				return;
			}
			if (DEBUG) console.log('Crossed Barrier');
			// __my_body_html_get
			App.html_template_get('my.html', function(html) {
				$(that.my_page_selector_get()).html(html);

				// __my_playlist_create
				that.my_playlist_populate();

				// __my_moment_create
				that.my_moment_populate();

				// __my_history_create
				that.my_history_populate();

				$('.frame').addClass('hidden');
				$(that.my_page_selector_get()).removeClass('hidden');
				if (typeof callback === 'function') callback();
			});
		},
		my_page_handler_set: function(callback) {
			var that = this;
			that.itemOffset = MY_HISTORY_INIT_ITEMS;
			that.playlistOffset = MY_PLAYLIST_INIT_ITEMS;
			that.momentOffset = MY_MOMENT_INIT_ITEMS;
			$('#playlist_new').click(function() {
				location.hash = '#playlist/new';
				pEdit.pEdit_sequence_clearAll();
			});
			$('.btn-google').attr('href', App.Config[App.Config.active.mode].google.signup);
			$('.btn-google').click(function(event) {
				if (Browser.ext_installed()) {
					event.preventDefault();
					chrome.tabs.create({
						url: App.Config[App.Config.active.mode].google.signup
					});
				} else
					location.href = App.Config[App.Config.active.mode].google.signup;
			});
			$(that.my_history_general_selector_get()).find('.more').unbind('click');
			$(that.my_history_general_selector_get()).find('.more').click(function() {
				if (that.itemLock) return;
				that.itemLock = true;
				$.ajax({
					url: App.api_root_get() + 'users/' + User.user_id_get() + '/moments/history?offset=' + that.itemOffset + '&limit=' + MY_HISTORY_MORE_ITEMS,
					method: 'GET',
					dataType: 'json',
					success: function(response) {
						that.itemLock = false;
						that.my_history_render(response.items, true);
						that.itemOffset += response.items.length;
					}
				});
			});
			$(that.my_playlist_selector_get()).find('.more').unbind('click');
			$(that.my_playlist_selector_get()).find('.more').click(function() {
				if (that.playlistLock) return;
				that.playlistLock = true;
				$.ajax({
					url: App.api_root_get() + 'users/' + User.user_id_get() + '/playlists?' + 'offset=' + that.playlistOffset + '&limit=' + MY_PLAYLIST_MORE_ITEMS,
					method: 'GET',
					dataType: 'json',
					success: function(response) {
						that.playlistLock = false;
						that.my_playlist_render(response.items, true);
						that.playlistOffset += response.items.length;
					}
				});
			});
			$(that.my_moment_selector_get()).find('.more').unbind('click');
			$(that.my_moment_selector_get()).find('.more').click(function() {
				if (that.momentLock) return;
				that.momentLock = true;
				$.ajax({
					url: App.api_root_get() + 'users/' + User.user_id_get() + '/moments?' + 'offset=' + that.momentOffset + '&limit=' + MY_MOMENT_MORE_ITEMS,
					method: 'GET',
					dataType: 'json',
					success: function(response) {
						that.momentLock = false;
						that.my_moment_render(response.items, true);
						that.momentOffset += response.items.length;
					}
				});
			});
			if (typeof callback === 'function') callback();
		},
		my_history_selector_get: function() {
			return '.my-history.visible';
		},
		my_history_general_selector_get: function() {
			return '.my-history';
		},
		my_history_populate: function() {
			var that = this;
			// __my_history_key_get
			var key = 'users/' + User.user_id_get() + '/moments/history?limit=' + MY_HISTORY_INIT_ITEMS;
			var _selector = that.my_history_general_selector_get();
			var _class = '';
			var _title = '';
			var _position = {
				position: 'static'
			};
			var _subkey = 'items';
			Row.row_populate(key, _selector, _class, _title, _position, _subkey, function() {
				that.my_history_populate_insertionPoint(that);
			});
		},
		my_history_populate_insertionPoint: function(that) {
			if (parseInt($(that.my_playlist_selector_get()).find('.items').children().length, 10) > 0)
				$(that.my_history_general_selector_get()).removeClass('visible').last().addClass('visible');
			else
				$(that.my_history_general_selector_get()).removeClass('visible').first().addClass('visible');
		},
		my_history_render: function(response, append) {
			var that = this;
			if (!append)
				$(that.my_history_general_selector_get()).find('.items').empty();
			for (var i = 0; i < response.length; i++) {
				if (response[i].moments)
					pMerch.pMerch_render(response[i], that.my_history_general_selector_get() + ' .items');
				else
					mMerch.mMerch_render(response[i], that.my_history_general_selector_get() + ' .items');
			}
			if (!append) {
				$(that.my_history_general_selector_get()).find('.more').removeClass('hidden');
				that.itemOffset = response.length;
			}
		},
		my_playlist_selector_get: function() {
			return '#my-playlists';
		},
		my_playlist_populate: function() {
			var that = this;
			// __my_playlist_key_get
			var key = 'users/' + User.user_id_get() + '/playlists?limit=' + MY_PLAYLIST_INIT_ITEMS;
			var _selector = that.my_playlist_selector_get();
			var _class = '';
			var _title = '';
			var _position = {
				position: 'static'
			};
			var _subkey = 'items';
			Row.row_populate(key, _selector, _class, _title, _position, _subkey);
		},
		my_playlist_render: function(response, append) {
			var that = this;
			if (!append)
				$(that.my_playlist_selector_get()).find('.items').children().not('#playlist_new').remove();
			for (var i = 0; i < response.length; i++) {
				pMerch.pMerch_render(response[i], that.my_playlist_selector_get() + ' .items');
			}
			if (!append) {
				$(that.my_playlist_selector_get()).find('.more').removeClass('hidden');
				that.playlistOffset = response.length;
			}
		},
		my_moment_selector_get: function() {
			return '#my-moments';
		},
		my_moment_populate: function() {
			var that = this;
			// __my_moment_key_get
			var key = 'users/' + User.user_id_get() + '/moments?limit=' + MY_MOMENT_INIT_ITEMS;
			var _selector = that.my_moment_selector_get();
			var _class = '';
			var _title = '';
			var _position = {
				position: 'static'
			};
			var _subkey = 'items';
			Row.row_populate(key, _selector, _class, _title, _position, _subkey);
		},
		my_moment_render: function(response, append) {
			var that = this;
			if (!append)
				$(that.my_moment_selector_get()).find('.items').empty();
			for (var i = 0; i < response.length; i++) {
				mMerch.mMerch_render(response[i], that.my_moment_selector_get() + ' .items');
			}
			if (!append) {
				$(that.my_moment_selector_get()).find('.more').removeClass('hidden');
				that.momentOffset = response.length;
			}
		},
		my_following_populate: function() {
			Profile.profile_userID_set(User.user_id_get());
			$(Profile.profile_follows_selector_get()).find('.items').empty();
			$(Profile.profile_followers_selector_get()).find('.items').empty();

			Profile.profile_follows_get(function(r) {
				if (r.follows.length > 0)
					Profile.profile_follows_render(r.follows);
				$(My.my_page_selector_get()).find('.self.follow_count').text(r.total);
				$(My.my_page_selector_get()).find('.self.display_name').text('You');
			});
			Profile.profile_followers_get(function(r) {
				if (r.followers.length > 0)
					Profile.profile_followers_render(r.followers);
				$(My.my_page_selector_get()).find('.self.follower_count').text(r.total);
				$(My.my_page_selector_get()).find('.self.display_name').text('You');
			});
		},
		my_refresh: function() {}
	};
	return {
		my_page_selector_get: function() {
			return _private.my_page_selector_get();
		},
		my_page_populate: function(callback) {
			_private.my_page_populate(callback);
		},
		my_page_handler_set: function(callback) {
			_private.my_page_handler_set(callback);
		},
		my_history_selector_get: function() {
			return _private.my_history_selector_get();
		},
		my_history_populate: function() {
			_private.my_history_populate();
		},
		my_history_render: function(response, append) {
			_private.my_history_render(response, append);
		},
		my_playlist_selector_get: function() {
			return _private.my_playlist_selector_get();
		},
		my_playlist_populate: function() {
			_private.my_playlist_populate();
		},
		my_playlist_render: function(response) {
			_private.my_playlist_render(response);
		},
		my_moment_selector_get: function() {
			return _private.my_moment_selector_get();
		},
		my_moment_populate: function() {
			_private.my_moment_populate();
		},
		my_moment_render: function(response) {
			_private.my_moment_render(response);
		},
		my_following_populate: function() {
			_private.my_following_populate();
		},
		my_refresh: function() {
			_private.my_refresh();
		}
	};
})();
if (typeof User === 'undefined') User = (function() {
	var _private = {
		uData_update: function(fields, callback) {
			$.ajax({
				url: App.api_root_get() + 'users/' + User.user_id_get() + '/personalisation',
				method: 'POST',
				data: fields,
				success: function(response) {
					if (typeof response !== 'object')
						response = JSON.parse(response);
					App.user = response;
				}
			});
		},
		uData_login_is: function() {
			if (User.user_id_get_page_data('user_id_registered').text())
				return true;
			return false;
		},
		uMerch_render_byObj: function(object, parent) {

			// __uMerch_html_get
			App.html_template_get('uMerch.html', function(html) {
				var html = $.parseHTML(html);
				$(html).find('.profile_image img').attr('src', object.image);
				$(html).find('.display_name').text(object.display_name);

				$(html).find('.display_name').unbind('click');
				$(html).find('.display_name').click(function() {
					location.hash = '#user/' + object.id;
				});

				var plural = object.followers > 1 ? 's' : '';
				$(html).find('.follower_count').text(object.followers + ' Follower' + plural);

				$(parent).append($(html));
			});
		},
		uData_merge: function() {
			// Merge user_id_anon and user_id_registered
			if (User.user_id_get_page_data('user_id_anon').text()) {
				if (User.user_id_get_page_data('user_id_registered').text()) {
					$.ajax({
						// __user_merge_post_apicall
						url: App.api_root_get() + 'merge',
						method: 'POST',
						data: {
							auid: User.user_id_get_page_data('user_id_anon').text(),
							user_id_registered: User.user_id_get_page_data('user_id_registered').text()
						},
						dataType: 'json',
						success: function(response) {
							if (DEBUG) console.log(response);
							App.table_data_load();
						}
					});
				}
				return;
			}
			setTimeout(function() {
				User.uData_merge();
			}, 1000);
		},
		uMerch_image_render: function(user_object) {
			$('.anonymous.profile_image img').attr('src', Utility.image_url_resolve('user_anon_image.jpg'));
			$('.self.display_name').text(user_object.display_name);
			$('.self.profile_image img').attr('src', decodeURIComponent(user_object.image));
		},
		user_id_get: function() {
			if (this.user_id_get_page_data('user_id_registered').html())
				return this.user_id_get_page_data('user_id_registered').html();
			if (this.user_id_get_page_data('user_id_anon').html())
				return this.user_id_get_page_data('user_id_anon').html();
			if (this.AUID) return this.AUID;
		},
		user_id_anon_get: function() {
			if (this.user_id_get_page_data('user_id_anon').html())
				return this.user_id_get_page_data('user_id_anon').html();
		},
		user_id_set: function(AUID) {
			this.AUID = AUID;
		},
		user_info_attach_ext_window_page_data: function(callback) {
			// callback is the next method in chain

			// Extension popup
			if (Browser.ext_window_in()) {
				// Add user_id_anon & user_id_registered to Extension popup.html
				// Keep watching for background message. User might be logged out in some tab
				function observe() {
					chrome.runtime.sendMessage({
						greeting: 'isLoggedIn'
					}, function(response) {
						if (!User.user_id_get_page_data('user_id_anon').text()) {
							// __user_data_user_id_anon_html_bind
							$('body').append($('<div>', {
								class: 'user_id_anon'
							}).css('display', 'none').text(response.data.user_id_anon));
						}
						User.user_id_set(response.data.user_id_anon);
						if (response.data.loggedIn === true) {
							if (!User.user_id_get_page_data('user_id_registered').text()) {
								// __user_data_user_id_registered_html_bind
								$('body').append($('<div>', {
									id: 'user_id_registered'
								}).css('display', 'none').text(response.data.user_id_registered));
							}
							User.user_id_set(response.data.user_id_registered);
							$('.outworld').hide();
						} else
							$('#user_id_registered').remove();

						if (!App.env) {
							callback();
							App.env = true;
						}
						setTimeout(function() {
							observe();
						}, 1000);
					});
				}
				// This is only for Extension popup.html
				observe();
			} else {
				// Native Site
				if (Browser.url_native()) {
					callback();
				}
				// Partner Site
				else if (Browser.url_partner()) {
					chrome.runtime.sendMessage({
						greeting: 'isLoggedIn'
					}, function(response) {
						User.user_id_set(response.data.user_id_anon);
						if (response.data.loggedIn === true)
							User.user_id_set(response.data.user_id_registered);
						callback();
					});
				}
			}
		},
		user_id_get_page_data: function(key) {
			if (key == 'user_id_anon')
				return $('.user_id_anon').first();
			if (key == 'user_id_registered')
				return $('#user_id_registered');
		},
		user_stat_get: function(callback) {
			var that = this;
			if (App.userStat != undefined && typeof callback === 'function') {
				callback(App.userStat);
				return;
			}
			// __user_stat_get_apicall
			$.ajax({
				url: App.api_root_get() + 'users/' + User.user_id_get() + '/stat',
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					App.userStat = response;
					if (typeof callback === 'function') {
						callback(response);
					}
				}
			});
		},
		user_favorite_partner_channel_get: function() {
			var favorite_partner_channel = [];
			if (App.user.personalize.length > 0) {
				var personalize = JSON.parse(App.user.personalize);
				if (personalize.favorite_partner_channel)
					favorite_partner_channel = personalize.favorite_partner_channel.split(',');
			}
			return favorite_partner_channel;
		}
	};
	return {
		uData_update: function(fields, callback) {
			_private.uData_update(fields, callback);
		},
		uData_login_is: function() {
			return _private.uData_login_is();
		},
		uMerch_render_byObj: function(object, parent) {
			_private.uMerch_render_byObj(object, parent);
		},
		uData_merge: function() {
			_private.uData_merge();
		},
		uMerch_image_render: function(user_object) {
			_private.uMerch_image_render(user_object);
		},
		user_id_get: function() {
			return _private.user_id_get();
		},
		user_id_anon_get: function() {
			return _private.user_id_anon_get();
		},
		user_id_set: function(AUID) {
			_private.user_id_set(AUID);
		},
		user_info_attach_ext_window_page_data: function(callback) {
			_private.user_info_attach_ext_window_page_data(callback);
		},
		user_id_get_page_data: function(key) {
			return _private.user_id_get_page_data(key);
		},
		user_stat_get: function(callback) {
			_private.user_stat_get(callback);
		},
		user_favorite_partner_channel_get: function(){
			return _private.user_favorite_partner_channel_get();
		}
	};
})();
if (typeof Profile === 'undefined') Profile = (function() {
	var _private = {
		profile_userID_set: function(id) {
			this.uid = id;
		},
		profile_userID_get: function() {
			return this.uid;
		},
		profile_page_selector_get: function() {
			return '#profile-';
		},
		profile_page_init: function(state) {
			var that = this;
			document.title = '#moment ' + state.user.display_name;
			$(that.profile_page_selector_get()).find('.display_name').text(state.user.display_name);

			if (state.user && state.user.image)
				$(that.profile_page_selector_get()).find('.profile_image img').attr('src', decodeURIComponent(state.user.image));
			else
				$(that.profile_page_selector_get()).find('.profile_image img').attr('src', Utility.image_url_resolve('user_anon_image.jpg'));

			if (state.self == true) {
				$(that.profile_page_selector_get()).find('.switch.follow').addClass('hidden');
			}
			if (state.isFollowing == true)
				$(that.profile_page_selector_get()).find('.follow .switch-input').prop('checked', true);
			else
				$(that.profile_page_selector_get()).find('.follow .switch-input').prop('checked', false);
		},
		profile_page_populate: function(callback) {
			var that = this;
			// __userprofile_html_get
			App.html_template_get('profile.html', function(html) {
				$('body').append(html);
				$(that.profile_page_selector_get()).animate({
					'left': '0px'
				}, 500);
				$.ajax({
					url: App.api_root_get() + 'users/' + Profile.profile_userID_get() + '?auid=' + User.user_id_get(),
					method: 'GET',
					dataType: 'json',
					success: function(response) {
						that.profile_page_init(response);
						if (typeof callback === 'function') callback();
					}
				});
			});
		},
		profile_page_handler_set: function(callback) {
			var that = this;
			$(that.profile_playlist_selector_get()).find('.more').unbind('click');
			$(that.profile_playlist_selector_get()).find('.more').click(function() {
				if (that.publicPlaylistLock) return;
				that.publicPlaylistLock = true;
				$.ajax({
					url: App.api_root_get() + 'users/' + Profile.profile_userID_get() + '/playlists?' + 'offset=' + that.publicPlaylistOffset,
					method: 'GET',
					dataType: 'json',
					success: function(response) {
						that.publicPlaylistLock = false;
						that.profile_playlist_render(response.items, true);
						that.publicPlaylistOffset += 10;
					}
				});
			});
			// __userprofile_back_onClick
			$(that.profile_page_selector_get()).find('.back').unbind('click');
			$(that.profile_page_selector_get()).find('.back').click(function() {
				mPlay.mPlay_back_onClick();
			});
			$(that.profile_page_selector_get()).find('.follow .switch-input').change(function() {
				if (this.checked)
					that.profile_follow_changeOn_save();
				else
					that.profile_follow_changeOff_save();
			});
			if (typeof callback === 'function') callback();
		},
		profile_playlist_selector_get: function() {
			return '#user-public-playlists';
		},
		profile_playlist_get: function(callback) {
			var that = this;
			$.ajax({
				// __user_playlists_get_apicall
				url: App.api_root_get() + 'users/' + Profile.profile_userID_get() + '/playlists?&limit=10',
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					if (typeof callback === 'function') callback(response.items);
				}
			});
		},
		profile_playlist_render: function(response, append) {
			var that = this;
			if (!append)
				$(that.profile_playlist_selector_get()).find('.items').empty();
			for (var i = 0; i < response.length; i++) {
				pMerch.pMerch_render(response[i], that.profile_playlist_selector_get() + ' .items');
			}
			if (!append) {
				$(that.profile_playlist_selector_get()).find('.more').removeClass('hidden');
				that.publicPlaylistOffset = 10;
			}
		},
		profile_follow_changeOn_save: function() {
			var that = this;
			Events.event_post('user', 'follow', Profile.profile_userID_get());
			$.ajax({
				url: App.api_root_get() + 'users/' + User.user_id_get(),
				method: 'POST',
				dataType: 'json',
				data: {
					method: 'follow',
					target: Profile.profile_userID_get()
				},
				success: function(response) {
					if (DEBUG) console.log(response);
				}
			});
		},
		profile_follow_changeOff_save: function() {
			var that = this;
			Events.event_post('user', 'unfollow', Profile.profile_userID_get());
			$.ajax({
				url: App.api_root_get() + 'users/' + User.user_id_get(),
				method: 'POST',
				dataType: 'json',
				data: {
					method: 'unfollow',
					target: Profile.profile_userID_get()
				},
				success: function(response) {
					if (DEBUG) console.log(response);
				}
			});
		},
		profile_follows_selector_get: function() {
			return '#user-follows';
		},
		profile_follows_get: function(callback) {
			var that = this;
			$.ajax({
				// __user_following_get_apicall
				url: App.api_root_get() + 'users/' + Profile.profile_userID_get() + '/follows',
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					if (typeof callback === 'function') callback(response);
				}
			});
		},
		profile_follows_render: function(items, selector) {
			var that = this;
			if (typeof selector === 'undefined') selector = that.profile_follows_selector_get();
			for (var i = 0; i < items.length; i++) {
				User.uMerch_render_byObj(items[i], selector + ' .items');
			}
		},
		profile_followers_selector_get: function() {
			return '#user-followers';
		},
		profile_followers_get: function(callback) {
			var that = this;
			$.ajax({
				// __user_followedby_get_apicall
				url: App.api_root_get() + 'users/' + Profile.profile_userID_get() + '/followers',
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					if (typeof callback === 'function') callback(response);
				}
			});
		},
		profile_followers_render: function(items) {
			var that = this;
			for (var i = 0; i < items.length; i++) {
				User.uMerch_render_byObj(items[i], that.profile_followers_selector_get() + ' .items');
			}
		},
		profile_refresh: function() {}
	};
	return {
		profile_userID_set: function(id) {
			_private.profile_userID_set(id);
		},
		profile_userID_get: function() {
			return _private.profile_userID_get();
		},
		profile_page_selector_get: function() {
			return _private.profile_page_selector_get();
		},
		profile_page_populate: function(callback) {
			_private.profile_page_populate(callback);
		},
		profile_page_handler_set: function(callback) {
			_private.profile_page_handler_set(callback);
		},
		profile_playlist_selector_get: function() {
			return _private.profile_playlist_selector_get();
		},
		profile_playlist_get: function(callback) {
			_private.profile_playlist_get(callback);
		},
		profile_playlist_render: function(items) {
			_private.profile_playlist_render(items);
		},
		profile_follows_selector_get: function() {
			return _private.profile_follows_selector_get();
		},
		profile_follows_get: function(callback) {
			_private.profile_follows_get(callback);
		},
		profile_follows_render: function(items, selector) {
			_private.profile_follows_render(items, selector);
		},
		profile_followers_selector_get: function() {
			return _private.profile_followers_selector_get();
		},
		profile_followers_get: function(callback) {
			_private.profile_followers_get(callback);
		},
		profile_followers_render: function(items) {
			_private.profile_followers_render(items);
		},
		profile_refresh: function() {
			_private.profile_refresh();
		}
	};
})();
if (typeof Instruct === 'undefined') Instruct = (function() {
	var _private = {
		instruct_get_byHash: function(hash, callback) {
			// Instructions are loaded very early and cached at CONFIG
			if (CONFIG.config_get(hash)) {
				var response = CONFIG.config_get(hash);
				if (response.instruction_text == '') return;
				response.instruction_text = response.instruction_text.replace('{{base}}', Browser.url_base_get() + 'images');
				if (typeof callback === 'function') callback(response);
			} else {
				if (typeof callback === 'function') callback({});
			}
		},
		instruct_uData_dismiss_byHash: function(hash, callback) {
			$.ajax({
				url: App.api_root_get() + 'instructions/dismiss',
				data: {
					hash: hash,
					auid: User.user_id_get()
				},
				method: 'POST',
				dataType: 'json',
				success: function(response) {
					if (DEBUG) console.log(response);
					if (typeof callback === 'function') callback(response);
				}
			});
		},
		instruct_general_header_render: function(hash, stack, callback) {
			var that = this;
			if (hash == '') {
				$('.instruction').remove();
				if (typeof callback === 'function') callback();
				return;
			}
			// __instruct_header_html_get
			App.html_template_get('instructions.html', function(html) {
				var html = that.instruct_html_bind($.parseHTML(html));
				// __instruction_get_apicall
				that.instruct_get_byHash(hash, function(object) {
					if (DEBUG) console.log(hash, object);
					if (stack == false)
						$('.instruction').remove();
					var h = hash.replace('#', '').replace('/', '-');
					$(html).attr('id', h + '-instruction');
					if (object.read == false) {
						$(html).find('.message').html(object.instruction_text);
						$(html).find('.dismiss').unbind('click');
						$(html).find('.dismiss').click(function() {
							var t = CONFIG.config_get(hash);
							t.read = true;
							CONFIG.config_set(hash, t);
							$(html).remove();
							that.instruct_uData_dismiss_byHash(hash);
							if (hash == '#feed')
								Events.event_post('feed', 'instruction', 'close');
						});
						if ($('#' + h + '-instruction').length == 0) {
							if ($('.omniknight').length > 0) {
								if ($('.instruction.wrapper').length > 0)
									$(html).insertAfter('.instruction.wrapper:last')
								else
									$(html).insertAfter('.omniknight .wrapper:first');
							} else
								$(html).insertAfter('.header.wrapper');
						}
					}
					if (typeof callback === 'function') callback();
				});
			});
		},
		instruct_html_bind: function(html) {
			return html;
		},
		instruct_pPlay_header_render: function(container) {
			Instruct.instruct_get_byHash('#playlist_play_instruction_primary', function(response) {
				if (DEBUG) console.log(response);
				if (response.read == false) {
					if ($('.instruction.primary').length > 0) return;
					$('.instruction.primary').remove();
					// __instruction_html_get
					App.html_template_get('instructions.html', function(html) {
						var html = $.parseHTML(html);
						$(html).addClass('primary');

						// __pPlay_header_instruction_html_css
						$(html).css('top', $(container).find('.wrapper').first().outerHeight());
						$(html).find('.message').html(response.instruction_text);

						// __pPlay_header_instruction_dismiss_onClick
						$(html).find('.dismiss').click(function() {
							Instruct.instruct_uData_dismiss_byHash('#playlist_play_instruction_primary', function() {
								// __events_instruct_pPlay_header_close
								Events.event_post('instruct', 'pPlay_header', 'close');
								var t = CONFIG.config_get('#playlist_play_instruction_primary');
								t.read = true;
								CONFIG.config_set('#playlist_play_instruction_primary', t);
								$(html).remove();
							})
						});
						$(container).find('.wrapper').first().after(html);
					});
				}
			});
		},
		instruct_pPlay_next_render: function(container) {
			Instruct.instruct_get_byHash('#playlist_play_instruction_secondary', function(response) {
				if (DEBUG) console.log(response);
				if (response.read == false) {
					if ($('.instruction.secondary').length > 0) return;
					$('.instruction.secondary').remove();
					// __instruction_html_get
					App.html_template_get('instructions.html', function(html) {
						var html = $.parseHTML(html);
						$(html).addClass('secondary');

						// __pPlay_next_instruction_html_css
						$(html).css('bottom', parseInt($('#invisible_layer').css('bottom')) + $('#next_list .items:visible').height())
							.css('width', $('#next_list .mthumb:visible').first().outerWidth() + $('#next_list .hook').outerWidth());
						$('#invisible_layer').css('border-top-left-radius', 0);
						$(html).find('.message').html(response.instruction_text);

						// __pPlay_next_instruction_dismiss_click__
						$(html).find('.dismiss').click(function() {
							Instruct.instruct_uData_dismiss_byHash('#playlist_play_instruction_secondary', function() {
								// __events_instruct_pPlay_next_close
								Events.event_post('instruct', 'pPlay_next', 'close');
								var t = CONFIG.config_get('#playlist_play_instruction_secondary');
								t.read = true;
								CONFIG.config_set('#playlist_play_instruction_secondary', t);
								$(html).remove();
								$('#invisible_layer').css('border-top-left-radius', '10px');
							});
						});
						$(container).append(html);
					});
				}
			});
		},
		instruct_refresh: function() {
			// __pPlay_html_group
			Display.disp_chain_set('group1', '.no-touch #invisible_layer,.p-container .header.wrapper,.p-container .instruction.wrapper,#transparent_layer');

			// __instruct_header_html_css_position
			$('.instruction.primary').css('top', $('.p-container').find('.wrapper').first().outerHeight());
			// __instruction_next_html_css_position
			$('.instruction.secondary').css('bottom', parseInt($('#invisible_layer').css('bottom')) + $('#invisible_layer').height())
				.css('width', $('#next_list .mthumb:visible').first().outerWidth() + $('#next_list .hook').outerWidth());
		}
	};
	return {
		instruct_get_byHash: function(hash, callback) {
			_private.instruct_get_byHash(hash, callback);
		},
		instruct_uData_dismiss_byHash: function(hash, callback) {
			_private.instruct_uData_dismiss_byHash(hash, callback);
		},
		instruct_general_header_render: function(hash, stack, callback) {
			_private.instruct_general_header_render(hash, stack, callback);
		},
		instruct_pPlay_header_render: function(container) {
			_private.instruct_pPlay_header_render(container);
		},
		instruct_pPlay_next_render: function(container) {
			_private.instruct_pPlay_next_render(container);
		},
		instruct_refresh: function() {
			_private.instruct_refresh();
		}
	};
})();
if (typeof Asset === 'undefined') Asset = (function() {
	var _private = {
		asset_moment_all_get: function(asset_source, asset_resource_id, user_id_and_asset_type, callback) {
			// __asset_resolve_api_call
			if (asset_source == 'Twitch' && (Browser.url_twitch() && !(location.href.split('/')[4] == '' || location.href.split('/')[4] == undefined))) {
				$.ajax({
					url: App.api_root_get() + 'playlists/twitch/asset/' + asset_resource_id + '?limit=100',
					method: 'GET',
					success: function(playlists) {
						if (typeof playlists !== 'object')
							playlists = JSON.parse(playlists);

						playlists = playlists['_filtered_playlists'];
						var moments = [];
						for (var i = 0; i < playlists.length; i++) {
							var moment = playlists[i].moments[0];
							moment['associated_playlist'] = playlists[i];
							moments.push(moment);
						}
						if (typeof callback === 'function')
							callback(moments);
					}
				});
			} else {
				$.ajax({
					url: App.api_root_get() + 'assets/resolve',
					data: {
						asset_source: asset_source,
						asset_resource_id: asset_resource_id,
						param: user_id_and_asset_type
					},
					method: 'POST',
					dataType: 'json',
					success: function(moments) {
						if (typeof callback === 'function')
							callback(moments);
					}
				});
			}
		}
	};
	return {
		asset_moment_all_get: function(asset_source, asset_resource_id, user_id_and_asset_type, callback) {
			_private.asset_moment_all_get(asset_source, asset_resource_id, user_id_and_asset_type, callback);
		}
	};
})();
if (typeof Media === 'undefined') Media = (function() {
	var _private = {
		pEdit_search: function(param, callback) {
			/*
				param={
					term:
					scope:
					order:
					status:
					limit:
					offset:
					item_type:
				}
			*/
			var term = typeof param.term !== 'undefined' ? param.term : '';
			var scope = typeof param.scope !== 'undefined' ? param.scope : PLAYLIST_SCOPE_MINE;
			var order = typeof param.order !== 'undefined' ? param.order : PLAYLIST_ORDER_NEW_FIRST;
			var status = typeof param.status !== 'undefined' ? param.status : PLAYLIST_STATUS_PUBLIC;
			var limit = typeof param.limit !== 'undefined' ? param.limit : 5;
			var offset = typeof param.offset !== 'undefined' ? param.offset : 0;
			var item_type = typeof param.item_type !== 'undefined' ? param.item_type : 'moment';
			//if (!force && existingString.length < 2) return; //wasn't enter, not > 2 char

			var search_string = 'term=' + term + '&scope=1&order=' + order + '&status=' + status + '&limit=' + limit + '&offset=' + offset + '&item_type=' + item_type + '&auid=' + User.user_id_get();

			// __pEdit_search_get_api_call
			$.get(App.api_root_get() + 'media/search?' + search_string, function(result) {
				if (typeof callback === 'function') callback(JSON.parse(result));
			});
		}
	};
	return {
		pEdit_search: function(param, callback) {
			_private.pEdit_search(param, callback);
		}
	};
})();

// /////// partners ///////////////////////////////////////
if (typeof Twitch === 'undefined') Twitch = (function() {
	var _private = {
		player_play_twitch: function(id) {
			// __twitch_player_play
			if (Utility.obj_defined(id))
				Browser.browser_page_script_run('(function(){document.getElementsByTagName("object")[0].playVideo();})();');
			else $('#' + id)[0].playVideo();
		},
		player_pause_twitch: function(id) {
			// __twitch_player_pause
			if (Utility.obj_defined(id))
				Browser.browser_page_script_run('(function(){document.getElementsByTagName("object")[0].pauseVideo();})();');
			else $('#' + id)[0].pauseVideo();
		},
		player_seek_twitch: function(id, time) {
			// __twitch_player_playhead_set
			if (Utility.obj_defined(id))
				Browser.browser_page_script_run('(function(){document.getElementsByTagName("object")[0].videoSeek(' + parseInt(time, 10) + ');})();');
			else {
				$('#' + id)[0].videoSeek(parseInt(time, 10) - 1);
			}
		},
		player_time_get_twitch: function(id) {
			// __twitch_player_playhead_get
			if (Utility.obj_defined(id)) {
				Browser.browser_page_script_run('(function(){document.getElementById("moment_time").innerHTML=document.getElementsByTagName("object")[0].getVideoTime();})();');
				return $("#moment_time").html();
			}
			return $('#' + id)[0].getVideoTime();
		},
		player_embed_twitch_desktop: function(mPlay_player_id, moment) {
			var attributes = {};
			attributes['data-time_start'] = moment.time_start;
			attributes['data-asset_id'] = moment.asset.id;
			attributes['data-asset_source'] = App.asset_partner_NameKey_get(moment.asset.source);
			attributes['data-asset_resource_id'] = moment.asset.resource_id;
			attributes['data-playlist'] = (pPlay.pPlay_object_get()) ? pPlay.pPlay_object_get().id : '';

			swfobject.embedSWF("http://www-cdn.jtvnw.net/swflibs/TwitchPlayer.swf",
				mPlay_player_id,
				PLAYER_WIDTH,
				'100%',
				"11",
				null, {
					"eventsCallback": "function(e){Twitch.player_embed_onStateChange_twitch(e,'" + mPlay_player_id + "')}",
					"embed": 1,
					"videoId": moment.asset.resource_id,
					"auto_play": "true"
				}, {
					"allowScriptAccess": "always",
					"allowFullScreen": "true"
				},
				attributes);
		},
		player_embed_twitch_mobile: function(mPlay_player_id, moment) {
			$('#' + mPlay_player_id).attr('src', 'http://player.twitch.tv/?video=' + moment.asset.resource_id + '&time=' + moment.time_start);
		},
		player_embed_twitch: function(mPlay_player_id, moment) {
			if (Browser.device_iPhone())
				this.player_embed_twitch_mobile(mPlay_player_id, moment);
			else
				this.player_embed_twitch_desktop(mPlay_player_id, moment);
		},
		player_info_update_twitch: function(mPlay_player_id, moment) {
			var channel = moment.asset.url.split('/').reverse()[2];

			// __partner_video_info_get_call
			Twitch.resource_id = moment.asset.resource_id;
			Twitch.title = moment.asset.title;
			Twitch.publisher = moment.asset.publisher;
			Twitch.publisher_original_id = moment.asset.publisher_original_id;
			Twitch.duration = parseInt(moment.asset.duration, 10);
			Twitch.thumbnail = moment.asset.thumbnail;
			Twitch.url = moment.asset.url;

			$.ajax({
				url: App.api_root_get() + 'assist?video_id=' + moment.asset.resource_id + '&source=twitch&channel=' + channel,
				dataType: 'json',
				method: 'GET',
				statusCode: {
					200: function(data) {
						Twitch.duration = parseInt(data.length, 10);
						Twitch.thumbnail = data.preview;
					}
				}
			});
		},
		player_embed_onStateChange_twitch: function(data, id) {
			var player = $('#' + id)[0];
			// __twitch_player_playhead_set
			// @refazul there is another inside the twitch class definition
			data.forEach(function(event) {
				//Possible values of event.event
				//playerInit, videoLoading, videoLoaded, videoPlaying
				if (event.event == "videoLoaded") {}
				if (event.event == "videoPlaying") {
					if (DEBUG) console.log('----Playling!!----');
					if ($(player).attr('data-time_start') && ($(player).attr('data-flag') == 'false' || !$(player).attr('data-flag'))) {
						player.videoSeek(parseInt($(player).attr('data-time_start'), 10));
						$(player).attr('data-flag', 'true');

						mList.mList_playhead_populate('Twitch', $(player).attr('data-asset_resource_id'));
					}
					player.playVideo();
					Twitch.start_timer();
				}
			});
		},

		asset_title_get_twitch: function(id) {
			// __twitch_video_title_get
			if (Utility.obj_defined(id))
				return this.title;
			return Twitch.title;
		},
		asset_channel_id_get_twitch: function(id) {
			// __twitch_video_publisher_get
			if (Utility.obj_defined(id))
				return this.publisher;
			return Twitch.publisher;
		},
		asset_channel_id_original_get_twitch: function(id) {
			// __twitch_video_publisher_original_id_get
			if (Utility.obj_defined(id))
				return this.publisher_original_id;
			return Twitch.publisher_original_id;
		},
		asset_getDuration_twitch: function(id) {
			// __twitch_video_duration_get
			if (Utility.obj_defined(id))
				return this.duration;
			return Twitch.duration;
		},
		asset_resource_id_get_twitch: function(id) {
			// __twitch_video_resource_id_get
			if (Utility.obj_defined(id))
				return this.resource_id ? this.resource_id : location.href.split('/')[4] + location.href.split('/')[5];
			return Twitch.resource_id;
		},
		asset_thumb_get_twitch: function(id) {
			// __twitch_video_thumb_get
			if (Utility.obj_defined(id))
				return this.thumbnail;
			return Twitch.thumbnail;
		},
		asset_thumb_at_get_twitch: function(id, time) {
			// __twitch_video_thumb_at_get
			// @refazul, does this work?
			if (Utility.obj_defined(id))
				return this.thumbnail;
			return Twitch.thumbnail;
		},
		asset_source_get_twitch: function() {
			// __twitch_partner_name_get
			return 'twitch';
		},
		asset_url_get_twitch: function(id) {
			// __twitch_url_create
			if (Utility.obj_defined(id))
				return this.url;
			return Twitch.url;
		},

		partner_profile_nav_selector_get: function() {
			return '.directory_header';
		},
		twitch_profile_remixes_nav_id_get: function() {
			return 'twitch_profile_remixes_nav';
		},
		twitch_profile_remixes_content_id_get: function() {
			return 'twitch_profile_remixes_content';
		},
		twitch_profile_remixes_get: function(publisher, limit, offset, callback) {
			var key = 'playlists/twitch/channel/' + publisher + '?offset=' + offset + '&limit=' + limit;
			// Fetch playlists
			$.ajax({
				url: App.api_root_get() + key,
				method: 'GET',
				success: function(response) {
					if (typeof response !== 'object')
						response = JSON.parse(response);
					if (typeof callback === 'function')
						callback(response);
				}
			});
		},
		twitch_profile_remixes_populate: function(publisher, limit, offset) {
			var nav = $('<li>');
			var nav_a = $('<a>', {
				id: Twitch.twitch_profile_remixes_nav_id_get()
			}).text('0 Remix').appendTo($(nav));
			$(Twitch.partner_profile_nav_selector_get() + ' .nav').append($(nav));

			if ($('#' + Twitch.twitch_profile_remixes_content_id_get()).length == 0)
				$(Twitch.partner_profile_nav_selector_get()).parent().append($('<div>', {
					id: Twitch.twitch_profile_remixes_content_id_get(),
					class: 'clearfix'
				}));

			// Other navs
			$(Twitch.partner_profile_nav_selector_get() + ' .nav').find('a').not('#' + Twitch.twitch_profile_remixes_nav_id_get()).click(function() {
				var page = $(this).attr('href').split('/')[3];
				if (page == '' || page == undefined) {
					Twitch.twitch_past_broadcasts_remixes_check = setTimeout(function() {
						Twitch.twitch_past_broadcasts_remixes_populate();
					}, 1000);
				} else {
					clearTimeout(Twitch.twitch_past_broadcasts_remixes_check);
				}

				$('#' + Twitch.twitch_profile_remixes_nav_id_get()).removeClass('active');
				$(this).addClass('active');

				$('#' + Twitch.twitch_profile_remixes_content_id_get()).addClass('hidden');
				$('#' + Twitch.twitch_profile_remixes_content_id_get()).parent().find('.more').addClass('hidden');

				$(Twitch.partner_profile_nav_selector_get()).parent().find('> .ember-view').removeClass('hidden');
				$(Twitch.partner_profile_nav_selector_get()).parent().find('> .videos').removeClass('hidden');
			});

			// Our nav
			$(nav_a).click(function() {
				$(Twitch.partner_profile_nav_selector_get() + ' .nav').find('a').removeClass('active');
				$(this).addClass('active');

				$('#' + Twitch.twitch_profile_remixes_content_id_get()).removeClass('hidden');
				$('#' + Twitch.twitch_profile_remixes_content_id_get()).parent().find('.more').removeClass('hidden');

				$(Twitch.partner_profile_nav_selector_get()).parent().find('> .ember-view').addClass('hidden');
				$(Twitch.partner_profile_nav_selector_get()).parent().find('> .videos').addClass('hidden');
			});

			Twitch.twitch_profile_remixes_render(publisher, limit, offset);

			$('<div>', {
				class: 'more'
			}).text('More').css('padding', '10px').appendTo($('#' + Twitch.twitch_profile_remixes_content_id_get()).parent());

			$('#' + Twitch.twitch_profile_remixes_content_id_get()).parent().find('.more').unbind('click');
			$('#' + Twitch.twitch_profile_remixes_content_id_get()).parent().find('.more').click(function() {
				$(this).addClass('hidden');
				var more_limit = TWITCH_PROFILE_REMIXES_ITEM_COUNT_MORE;
				var more_offset = $('#' + Twitch.twitch_profile_remixes_content_id_get() + ' .mthumb').length;
				Twitch.twitch_profile_remixes_render(publisher, more_limit, more_offset);
			});
		},
		twitch_profile_remixes_render: function(publisher, limit, offset) {
			Twitch.twitch_profile_remixes_get(publisher, limit, offset, function(response) {
				var playlists = response['_playlists'];
				var total = parseInt(response['_total']);
				var nav_text = total > 1 ? total + ' Remixes' : total + ' Remix';

				$('#' + Twitch.twitch_profile_remixes_nav_id_get()).text(nav_text);

				// Render playlists
				for (var i = 0; i < playlists.length; i++) {
					pMerch.pMerch_render(playlists[i], '#' + Twitch.twitch_profile_remixes_content_id_get(), {}, function(playlist_html, playlist) {
						$(playlist_html).find('.view_count').text(Utility.time_since_calc(playlist.epoch_added) + ' ago');
						$(playlist_html).attr('href', playlist.moments[0].asset.url + '?playlist=' + playlist.id);
					}, function() {

					});
				}
				$('#' + Twitch.twitch_profile_remixes_content_id_get()).parent().find('.more').removeClass('hidden');
				if (offset == 0) {
					$('#' + Twitch.twitch_profile_remixes_content_id_get()).addClass('hidden');
					$('#' + Twitch.twitch_profile_remixes_content_id_get()).parent().find('.more').addClass('hidden');
				}
			});
		},

		twitch_past_broadcasts_remixes_get: function(resource_ID, callback) {
			var key = 'playlists/twitch/asset/' + resource_ID + '?limit=5';
			// Fetch playlists
			$.ajax({
				url: App.api_root_get() + key,
				method: 'GET',
				success: function(response) {
					if (typeof response !== 'object')
						response = JSON.parse(response);
					if (typeof callback === 'function')
						callback(response);
				}
			});
		},
		twitch_past_broadcasts_remixes_populate: function() {
			$('.video.item').not('.processed').each(function() {

				var that = $(this);
				var partner_thumb = $(this).find('.thumb');
				var parent = $(this).parent();
				var temp_array = $(this).find('.cap').attr('href').split('/');
				var resource_ID = temp_array.splice(-1, 1);

				$(this).addClass('processed');
				resource_ID = temp_array.splice(-1, 1) + resource_ID;

				Twitch.twitch_past_broadcasts_remixes_get(resource_ID, function(response) {
					var playlists = response['_filtered_playlists'];
					if (playlists.length > 0) {
						$(that).css('clear', 'both');
						for (var i = 0; i < playlists.length; i++) {
							if (i == 4) break;
							var moment = playlists[i].moments[0];
							mMerch.mMerch_render(playlists[i].moments[0], parent, {}, function(moment_html, moment, playlist) {
								$(moment_html).width($(partner_thumb).width() * TWITCH_EMBEDDED_THUMB_SIZE_FACTOR);
								$(moment_html).css('margin-top', $(partner_thumb).width() * .10 + 6);
								$(moment_html).attr('href', moment.asset.url + '?start=' + moment.time_start);
								$(moment_html).find('.pMerch_title').text(playlist.title);
								$(moment_html).append($('<div>', {
									class: 'view_count font-small'
								}).text(Utility.seconds_to_hmmss_convert(moment.time_start)));
							}, function(moment_html, moment) {
								Utility.link_open(moment.asset.url + '?start=' + moment.time_start);
							}, playlists[i]);
						}
						$(parent).append($('<div>').css('clear', 'both'));
					}
				});
			});
			Twitch.twitch_past_broadcasts_remixes_check = setTimeout(function() {
				Twitch.twitch_past_broadcasts_remixes_populate();
			}, 1000);
		},

		partner_search_dom_selector_get: function() {
			return '#results_col';
		},
		twitch_search_remixes_content_id_get: function() {
			return 'twitch_search_remixes_content';
		},
		twitch_search_remixes_get: function(term, limit, offset, callback) {
			var key = 'media/search?term=' + term + '&item_type=playlist&scope=3&order=3&limit=' + limit + '&offset=' + offset + '&auid=' + User.user_id_get();
			// Fetch playlists
			$.ajax({
				url: App.api_root_get() + key,
				method: 'GET',
				success: function(response) {
					if (typeof response !== 'object')
						response = JSON.parse(response);
					if (typeof callback === 'function')
						callback(response);
				}
			});
		},
		twitch_search_remixes_populate: function(term, limit, offset) {
			Twitch.twitch_search_remixes_get(term, limit, offset, function(response) {
				var playlists = response['_playlists'];

				// Render playlists
				for (var i = 0; i < playlists.length; i++) {
					var id = Utility.id_random_generate();
					$('#' + Twitch.twitch_search_remixes_content_id_get()).append($('<div>', {
						id: id,
						class: 'vods result archive video clearfix processed'
					}));
					pMerch.pMerch_render(playlists[i], '#' + id, {}, function(playlist_html, playlist) {
						$(playlist_html).width($('#st-results-container').find('.vods.result .cap_and_profile .thumb').last().width() + 6);
						$(playlist_html).css('clear', 'both').css('margin', '0px 10px 0px 0px');
						$(playlist_html).find('.pMerch_title').addClass('hidden');
						$(playlist_html).find('.view_count').addClass('hidden');
						$(playlist_html).attr('href', playlist.moments[0].asset.url + '?playlist=' + playlist.id);

						var section_right = $('<div class="mthumb-part">').css('float', 'left').css('margin-top', '10px');

						var title = $('<a class="title">').css('display', 'block').attr('href', playlist.moments[0].asset.url + '?playlist=' + playlist.id);
						$(title).text(playlist.title);

						var time_ago = $('<div>').css('text-transform', 'uppercase').css('color', '#8c8c8c');
						$(time_ago).text(Utility.time_since_calc(playlist.epoch_added) + ' ago');

						$(section_right).append($(title)).append($(time_ago));
						$('#' + id).append($(section_right));
					}, function() {});
				}
			});
		},
		twitch_embedded_search_remixes_populate: function(term, limit, offset) {
			$('.vods.result.archive.video').not('.processed').each(function() {

				var partner_thumb = $(this).find('.thumb img');
				var temp_array = $(this).find('.thumb').attr('href').split('/');
				var resource_ID = temp_array.splice(-1, 1);
				var parent = $(this).find('.video_meta');
				var that = this;

				resource_ID = temp_array.splice(-1, 1) + resource_ID;
				$(this).addClass('processed');
				$(this).find('.video_meta').css('width', '100%');

				Twitch.twitch_past_broadcasts_remixes_get(resource_ID, function(response) {
					var playlists = response['_filtered_playlists'];
					if (playlists.length > 0) {
						$(that).find('.video_stats').remove();
						$(that).find('.search_topstats').remove();

						for (var i = 0; i < playlists.length; i++) {
							if (i == 3) break;
							var moment = playlists[i].moments[0];
							mMerch.mMerch_render(moment, parent, {}, function(moment_html, moment, playlist) {
								$(moment_html).width($(partner_thumb).width() * TWITCH_EMBEDDED_THUMB_SIZE_FACTOR);
								$(moment_html).find('.pMerch_title').text(playlist.title);
								$(moment_html).attr('href', moment.asset.url + '?start=' + moment.time_start);
								$(moment_html).append($('<div>', {
									class: 'view_count font-small'
								}).text(Utility.seconds_to_hmmss_convert(moment.time_start)));
							}, function(moment_html, moment) {
								Utility.link_open(moment.asset.url + '?start=' + moment.time_start);
							}, playlists[i]);
						}
						$(parent).append($('<div>').css('clear', 'both'));
					}
				});
			});
		},

		partner_page_loaded_twitch: function(id) {
			// __twitch_page_onLoad_is
			if (Utility.obj_defined(id)) {
				if (!document.getElementById('player'))
					return false;
				if ((document.getElementsByTagName('object')[0]) && typeof(document.getElementsByTagName('object')[0].videoSeek) === 'function' && typeof(document.getElementsByTagName('object')[0].getVideoTime) === 'function') {
					$('#moment_container').remove();
					this.partner_page_data_append_twitch();
					return true;
				}
				return false;
			}

			if (typeof $('#' + id)[0].videoSeek === 'function' && typeof $('#' + id)[0].getVideoTime === 'function')
				return true;
			return false;

			if (Browser.ext_window_in()) return true;
			return true;
		},
		partner_page_data_append_twitch: function() {
			// __twitch_page_data_append
			var container = $('<div>', {
				id: 'moment_container',
				class: 'hidden'
			});

			$(container).append($('<div>', {
				id: 'moment_button',
				class: 'moment_button twitch '
			}).text('#moment'));
			$(container).append($('<div>', {
				id: 'asset_source',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'asset_resource_id',
				class: 'moment_info'
			}));

			$(container).append($('<div>', {
				id: 'moment_time',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'moment_tag',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'moment_thumb',
				class: 'moment_info'
			}));

			$(container).append($('<div>', {
				id: 'video_title',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_publisher',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_publisher_original_id',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_duration',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_thumbnail',
				class: 'moment_info'
			}));

			$('#player').append(container);
		},
		partner_page_populate_twitch: function() {
			// __twitch_page_onLoad
			var that = this;
			if (Browser.url_twitch()) {
				$('html').removeClass('twitch-search-page').removeClass('twitch-profile-page').removeClass('twitch-playlist-mode');
				if (Utility.url_parameter_get_byName('playlist') != '') {
					var playlist_id = Utility.url_parameter_get_byName('playlist');
					if (!$('html').hasClass('twitch-playlist-mode')) {
						$('html').addClass('twitch-playlist-mode');
					}
					if (playlist_id == that.playlist_id) return;
					//Utility.addFontToExtension('FontAwesome', 'fontawesome-webfont.woff');
					Utility.addFontToExtension('Glyphicons Halflings', 'glyphicons-halflings-regular.woff');
					that.playlist_id = playlist_id;

					pData.pData_server_get(playlist_id, function(playlist) {
						pNext.pNext_populate_twitch(playlist);
					});

				} else if (location.href.split('/')[3].split('?')[0] == 'search' || location.href.split('/')[3].split('#')[0] == 'search') {
					$('html').addClass('twitch-search-page');
					var term = Utility.url_parameter_get_byName('query');

					if (!$(Twitch.partner_search_dom_selector_get()).attr('data-once')) {
						$(Twitch.partner_search_dom_selector_get()).attr('data-once', true);
						var limit = 25,
							offset = 0;

						Twitch.twitch_search_remixes_populate(term, 5, offset);
						Twitch.twitch_embedded_search_remixes_populate(term, limit, offset);

						if ($('#' + Twitch.twitch_search_remixes_content_id_get()).length == 0)
							$('<div>', {
								id: Twitch.twitch_search_remixes_content_id_get(),
								class: 'clearfix'
							}).insertAfter($('#st-results-container').find('.vods.result').last()).css('position', 'relative').css('left', '-2px');
					}
				}
				//channel
				else if (location.href.split('/')[4] == '' || location.href.split('/')[4] == undefined) {
					if ($('#player object [name="flashvars"]').first().attr('value') == undefined) return;
					var channel = $('#player object [name="flashvars"]').first().attr('value').split('channel=')[1] ? $('#player object [name="flashvars"]').first().attr('value').split('channel=')[1].split('&')[0] : $('#player .player').attr('data-channel');
					if (channel == that.channel) return;

					$('#invisible_layer').remove();
					$('html').removeClass('live');

					that.channel = channel;

					if (DEBUG) console.log('Channel - ' + that.channel);

					// __twitch_settings_menu__
					$('.player-button--settings').unbind('click');
					$('.player-button--settings').click(function() {
						if ($('.player-menu__menu').attr('data-state') == 'closed' || $('.player-menu__menu').attr('data-state') == undefined) {
							$('#invisible_layer,#transparent_layer').addClass('hidden');
						} else
							$('#invisible_layer,#transparent_layer').removeClass('hidden');
					});

					// __twitch_page_video_live
					that.channel_live_is_twitch(that.channel, function(live) {
						if (live === true) {
							if (DEBUG) console.log(that.channel + ' is Online');
							$('html').removeClass('live').addClass('live');

							that.channel_live_get_twitch(that.channel, function(live_video) {
								if (DEBUG) console.log('Live Video -');
								if (DEBUG) console.log(live_video);
								if (Utility.obj_defined(live_video)) return;

								//Detected - Live channel
								that.channel_video_get_twitch(that.channel, function(response) {
									if (DEBUG) console.log('Video Info -');
									if (DEBUG) console.log(response);

									//Tick every 1 seconds
									function tick() {
										mPlay.mPlay_delay_twitch_live(App.time_server_calc());
										setTimeout(tick, 1000);
									}
									tick();

									//Update every 10 seconds
									//__twitch_video_thumb_live_get
									function update() {
										that.channel_video_get_twitch(that.channel, function(response) {
											if (DEBUG) console.log(response);

											// __twitch_page_object_assign
											that.twitch_page_object_assign(response);
											//$('#moment_playhead .moment_thumbnail').css('background-image','url('+response.preview.medium+')');
											setTimeout(update, 10000);
										});
									}
									update();

									that.asset_recorded_at = response.recorded_at;
									that.asset_status = 'recording';

									twitch_info_loaded(response);
								});
							});
						} else
						if (DEBUG) console.log(that.channel + ' is Offline');
					});
				}
				// __twitch_page_video_vod
				else if (location.href.split('/')[4] && location.href.split('/')[5] && $.isNumeric(location.href.split('/')[5].split('?')[0])) {
					var resourceId = location.href.split('/')[4] + location.href.split('/')[5].split('?')[0];
					if (resourceId == that.resourceId) return;

					$('#invisible_layer').remove();
					$('html').removeClass('live');

					if (DEBUG) console.log('Vod - ' + that.resourceId);

					that.resourceId = resourceId;

					that.twitch_video_info_get_api(that.resourceId, function(response) {

						that.asset_recored_at = 0;
						that.asset_status = 'recorded';

						twitch_info_loaded(response);
					});
				} else if (location.href.split('/')[4] == 'profile') {
					// Example: http://www.twitch.tv/riotgames/profile

					$('html').addClass('twitch-profile-page');
					if (!$(Twitch.partner_profile_nav_selector_get()).attr('data-once')) {
						$(Twitch.partner_profile_nav_selector_get()).attr('data-once', true);
						var publisher = location.href.split('/')[3];

						if (location.href.split('/')[5] == '' || location.href.split('/')[5] == undefined) {
							// Example: http://www.twitch.tv/riotgames/profile
							// Past Broadcasts Tab
							Twitch.twitch_past_broadcasts_remixes_populate();
						}

						// X Remixes Tab
						Twitch.twitch_profile_remixes_populate(publisher, TWITCH_PROFILE_REMIXES_ITEM_COUNT_INIT, 0);
					}
				}

				//channel or vod
				function twitch_info_loaded(video) {
					// __twitch_page_onLoad_event_dispatch__
					if (DEBUG) console.log(video);

					function c() {
						if (DEBUG) console.log("waiting");
						if (Twitch.partner_page_loaded()) {
							twitch_video_loaded(video);
							var moment = {};
							moment.asset = {};
							moment.asset.source = 'Twitch';
							moment.asset.resource_id = video._id;
							mList.mList_populate(moment, 'body');
							mList.mList_playhead_populate('Twitch', video._id);
							return;
						}
						setTimeout(c, 1000);
					}
					c();
				}

				function twitch_video_loaded(video) {
					// __twitch_momentbutton_show__

					// __twitch_page_object_assign
					that.twitch_page_object_assign(video);

					function d() {
						try {
							if (document.getElementsByTagName('object')[0].getVideoTime() > 0) {
								document.getElementsByTagName('object')[0].videoSeek(Utility.url_parameter_get_byName('start'));
								return;
							}
							setTimeout(d, 1000);
						} catch (err) {
							if (DEBUG) console.log('Failed - Trying again');
							setTimeout(d, 1000);
						}
					}
					d();
					if (DEBUG) console.log('--Done--');
				}
			}
		},
		twitch_video_info_get_api: function(resource_id, callback) {
			// __twitch_video_info_get_api
			$.ajax({
				dataType: "json",
				method: 'GET',
				url: 'https://api.twitch.tv/kraken/videos/' + resource_id,
				success: function(response) {
					if (typeof callback === 'function')
						callback(response);
				}
			});
		},
		channel_video_get_twitch: function(channel, callback) {
			// __twitch_video_info_get
			$.ajax({
				dataType: "json",
				method: 'GET',
				url: 'https://api.twitch.tv/kraken/streams/' + channel,
				success: function(r) {
					var stream = r.stream;
					$.ajax({
						url: 'https://api.twitch.tv/kraken/channels/' + channel + '/videos?broadcasts=true',
						success: function(response) {
							var object = {};
							for (var i = 0; i < response.videos.length; i++) {
								if (response.videos[i].status == 'recording') {
									object = response.videos[i];
									break;
								}
							}
							//console.log(object.preview);
							//console.log(stream.preview.template.replace('{width}',320).replace('{height}',180));
							//console.log(object);
							object.preview = stream.preview.template.replace('{width}', 320).replace('{height}', 180);
							if (typeof callback === 'function')
								callback(object);
						}
					});
				}
			});
		},
		twitch_page_object_assign: function(object) {
			// __twitch_page_object_assign
			this.resource_id = object._id;
			this.title = object.title;
			this.publisher = object.channel.display_name;
			this.publisher_original_id = object.channel.name;
			this.duration = parseInt(object.length, 10);
			this.thumbnail = object.preview;
			this.url = object.url;
			Twitch.game = object.game;

			document.getElementById('asset_source').innerHTML = ('twitch');
			document.getElementById('asset_resource_id').innerHTML = (Twitch.asset_resource_id_get());
			document.getElementById('video_title').innerHTML = (Twitch.asset_title_get());
			document.getElementById('video_publisher').innerHTML = (Twitch.asset_channel_id_get());
			document.getElementById('video_publisher_original_id').innerHTML = (Twitch.asset_channel_id_original_get());
			document.getElementById('video_duration').innerHTML = (Twitch.getDuration());
			document.getElementById('video_thumbnail').innerHTML = (Twitch.asset_thumb_get());
		},
		channel_live_is_twitch: function(channel, callback) {
			// __twitch_publisher_live_is
			$.ajax({
				url: 'https://api.twitch.tv/kraken/streams?channel=' + channel,
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					if (typeof callback === 'function') {
						if (response.streams.length == 1)
							callback(true);
						else
							callback(false);
					}
				}
			});
		},
		channel_live_get_twitch: function(channel, callback) {
			// __channel_live_get_twitch
			$.ajax({
				url: 'https://api.twitch.tv/kraken/channels/' + channel + '/videos?broadcasts=true',
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					var recording;
					for (var i = 0; i < response.videos.length; i++) {
						if (response.videos[i].status == 'recording') {
							recording = response.videos[i];
							break;
						}
					}
					if (typeof callback === 'function')
						callback(recording);
				}
			});
		},
		start_timer: function() {
			Twitch.start_time = Date.now();
			clearInterval(Twitch.timer);
			Twitch.timer = setInterval(function() {
				// mPlay / watch / sec-watched
				var end_time = Math.floor((Date.now() - Twitch.start_time) / 1000);
				if (DEBUG) console.log(end_time);
				Events.event_post('mPlay', 'watch', end_time);
			}, 10000);
		}
	};
	return {
		/* <iframe id='id'></iframe> */
		player_play: function(id) {
			_private.player_play_twitch(id);
		},
		player_pause: function(id) {
			_private.player_pause_twitch(id);
		},
		player_seek: function(id, time) {
			_private.player_seek_twitch(id, time);
		},
		player_time_get: function(id) {
			return _private.player_time_get_twitch(id);
		},
		player_embed: function(mPlay_player_id, moment) {
			_private.player_embed_twitch(mPlay_player_id, moment)
		},
		player_info_update: function(mPlay_player_id, moment) {
			_private.player_info_update_twitch(mPlay_player_id, moment);
		},
		player_embed_onStateChange_twitch: function(data, id) {
			_private.player_embed_onStateChange_twitch(data, id);
		},

		asset_title_get: function(id) {
			return _private.asset_title_get_twitch(id);
		},
		asset_channel_id_get: function(id) {
			return _private.asset_channel_id_get_twitch(id);
		},
		asset_channel_id_original_get: function(id) {
			return _private.asset_channel_id_original_get_twitch(id);
		},
		getDuration: function(id) {
			return _private.asset_getDuration_twitch(id);
		},
		asset_resource_id_get: function(id) {
			return _private.asset_resource_id_get_twitch(id);
		},
		asset_thumb_get: function(id) {
			return _private.asset_thumb_get_twitch(id);
		},
		asset_thumb_at_get: function(id, time) {
			return _private.asset_thumb_at_get_twitch(id, time);
		},
		asset_source_get: function(id) {
			return _private.asset_source_get_twitch(id);
		},
		asset_url_get: function(id) {
			return _private.asset_url_get_twitch(id);
		},

		partner_profile_nav_selector_get: function() {
			return _private.partner_profile_nav_selector_get();
		},
		twitch_profile_remixes_nav_id_get: function() {
			return _private.twitch_profile_remixes_nav_id_get();
		},
		twitch_profile_remixes_content_id_get: function() {
			return _private.twitch_profile_remixes_content_id_get();
		},
		twitch_profile_remixes_get: function(publisher, limit, offset, callback) {
			_private.twitch_profile_remixes_get(publisher, limit, offset, callback);
		},
		twitch_profile_remixes_populate: function(publisher, limit, offset) {
			_private.twitch_profile_remixes_populate(publisher, limit, offset);
		},
		twitch_profile_remixes_render: function(publisher, limit, offset) {
			_private.twitch_profile_remixes_render(publisher, limit, offset);
		},

		twitch_past_broadcasts_remixes_get: function(resource_ID, callback) {
			_private.twitch_past_broadcasts_remixes_get(resource_ID, callback);
		},
		twitch_past_broadcasts_remixes_populate: function() {
			_private.twitch_past_broadcasts_remixes_populate();
		},

		partner_search_dom_selector_get: function() {
			return _private.partner_search_dom_selector_get();
		},
		partner_search_moment_html_nav_id_get: function() {
			return _private.partner_search_moment_html_nav_id_get();
		},
		twitch_search_remixes_content_id_get: function() {
			return _private.twitch_search_remixes_content_id_get();
		},
		twitch_search_remixes_get: function(publisher, limit, offset, callback) {
			_private.twitch_search_remixes_get(publisher, limit, offset, callback);
		},
		twitch_search_remixes_populate: function(term, limit, offset) {
			_private.twitch_search_remixes_populate(term, limit, offset);
		},
		twitch_embedded_search_remixes_populate: function(term, limit, offset) {
			_private.twitch_embedded_search_remixes_populate(term, limit, offset);
		},

		partner_page_loaded: function(id) {
			return _private.partner_page_loaded_twitch(id);
		},
		partner_init: function() {
			_private.partner_page_populate_twitch();
		},
		asset_status_get: function() {
			return _private.asset_status;
		},
		asset_date_create_get: function() {
			return _private.asset_recorded_at;
		},
		start_timer: function() {
			_private.start_timer();
		}
	};
})();
if (typeof Youtube === 'undefined') Youtube = (function() {
	var _private = {
		player_play_youtube: function(id) {
			// __youtube_player_play__
			if (Utility.obj_defined(id))
				Browser.browser_page_script_run('(function(){yt.player.getPlayerByElement(document.getElementById("player-api")).playVideo();})();');
			else YT.get(id).playVideo();
		},
		player_pause_youtube: function(id) {
			// __youtube_player_pause__
			if (Utility.obj_defined(id))
				Browser.browser_page_script_run('(function(){yt.player.getPlayerByElement(document.getElementById("player-api")).pauseVideo();})();');
			else YT.get(id).pauseVideo();
		},
		player_seek_youtube: function(id, time) {
			// __youtube_player_playhead_set
			if (Utility.obj_defined(id))
				Browser.browser_page_script_run('(function(){yt.player.getPlayerByElement(document.getElementById("player-api")).seekTo(' + time + ');})();');
			else YT.get(id).seekTo(time);
		},
		player_time_get_youtube: function(id) {
			// __youtube_player_playhead_get__
			if (Utility.obj_defined(id)) {
				Browser.browser_page_script_run('(function(){document.getElementById("moment_time").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getCurrentTime();})();');
				return $('#moment_time').html();
			}
			return YT.get(id).getCurrentTime();
		},
		player_embed_youtube: function(mPlay_player_id, moment) {
			player = new YT.Player(mPlay_player_id, {
				height: '100%',
				width: PLAYER_WIDTH,
				videoId: moment.asset.resource_id,
				playerVars: {
					'autoplay': 1,
					'showinfo': 0
				},
				events: {
					'onReady': function(e) {
						Youtube.player_embed_youtube_onReady(e, $('#' + mPlay_player_id));
						mPlay.mPlay_page_data_update(mPlay_player_id, moment);
					},
					'onStateChange': function(e) {
						Youtube.player_embed_onStateChange_youtube(e, $('#' + mPlay_player_id));
					}
				}
			});
		},
		player_info_update_youtube: function(mPlay_player_id, moment) {
			// __asset_post_api_call
			$.ajax({
				url: App.api_root_get() + 'assets',
				dataType: 'json',
				method: 'POST',
				data: {
					asset_source: 'Youtube',
					asset_resource_id: moment.asset.resource_id
				},
				statusCode: {
					200: function(data) {
						var storyboard_spec = data.storyboard_spec;
						if (DEBUG) console.log(storyboard_spec);
						$('#' + mPlay_player_id).attr('data-storyboard_spec', storyboard_spec);
					}
				}
			});
		},
		player_embed_youtube_onReady: function(event, object) {
			// __youtube_player_play
			// @refazul there is another inside the YouTube class definition
			//event.target.playVideo();
			if (DEBUG) console.log('ready----');
			if (Browser.device_iPhone()) {
				if (DEBUG) console.log('seeking---');
				player.seekTo(parseInt($(object).attr('data-time_start'), 10));
			}
			//if(Browser.device_iPhone())player.pauseVideo();
		},
		player_embed_onStateChange_youtube: function(event, object) {
			// __youtube_player_playhead_set
			// @refazul there is another inside the YouTube class definition
			if (DEBUG) console.log('here in playback', event.data);
			if (event.data == YT.PlayerState.BUFFERING) {

				if (DEBUG) console.log('buffering');

				if ($(event.target.f).attr('data-flag') == 'false') {
					$(event.target.f).attr('data-flag', 'true');
					if (Browser.device_iPhone()) {
						player.seekTo(parseInt($(event.target.f).attr('data-time_start'), 10));
						//player.pauseVideo();
					}
				}

			} else if (event.data == YT.PlayerState.PLAYING) {
				if (DEBUG) console.log('entering');
				if ($(event.target.f).attr('data-flag') == 'false' || $(event.target.f).attr('data-flag') == undefined) {
					$(event.target.f).attr('data-flag', 'true');
					if (!Browser.device_iPhone()) player.seekTo(parseInt($(event.target.f).attr('data-time_start'), 10));
					if (DEBUG) console.log('pausing - from play');
					if (Browser.device_iPhone()) player.pauseVideo();
					mList.mList_playhead_populate('Youtube', $(event.target.f).attr('data-asset_resource_id'));
				}
			} else if (event.data == YT.PlayerState.PAUSED) {
				if (DEBUG) console.log('pausing - from pause');
				if (Browser.device_iPhone()) player.pauseVideo();
				if (parseInt(App.video_obj_get().player_time_get(App.player_id_get())) <= parseInt($(event.target.f).attr('data-time_start'))) return;
				if (pPlay.pPlay_state() && ($(event.target.f).attr('data-once') === 'true') && Browser.device_iPhone()) {
					var p = pPlay.pPlay_object_get();
					for (var i = 0; i < p.moments.length; i++) {
						if (App.current_moment == p.moments[i].id && p.moments[i + 1].id)
							location.hash = '#playlist/' + p.id + '/moment/' + p.moments[i + 1].id;
					}
				}
			}
		},

		asset_title_get_youtube: function(id) {
			// __youtube_video_title_get__
			if (Utility.obj_defined(id)) {
				Browser.browser_page_script_run('(function(){document.getElementById("video_title").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getVideoData().title;})();');
				return $('#video_title').html();
			}
			return YT.get(id).getVideoData().title;
		},
		asset_channel_id_get_youtube: function(id) {
			// __youtube_video_publisher_get__
			if (Utility.obj_defined(id)) {
				Browser.browser_page_script_run('(function(){document.getElementById("video_publisher").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getVideoData().author;})();');
				return $('#video_publisher').html();
			}
			return YT.get(id).getVideoData().author;
		},
		asset_channel_id_original_get_youtube: function(id) {
			// __youtube_video_publisher_original_id_get__
			return undefined;
		},
		asset_getDuration_youtube: function(id) {
			// __youtube_video_duration_get__
			if (Utility.obj_defined(id)) {
				Browser.browser_page_script_run('(function(){document.getElementById("video_duration").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getDuration();})();');
				return parseInt($('#video_duration').html(), 10);
			}
			return (typeof YT.get(id).getDuration === 'function') ? YT.get(id).getDuration() : 0;
		},
		asset_resource_id_get_youtube: function(id) {
			// __youtube_video_resource_id_get__
			if (Utility.obj_defined(id))
				return Utility.url_parameter_get_byName('v');
			return $('#' + id).attr('data-asset_resource_id');
		},
		asset_thumb_get_youtube: function(id) {
			// __youtube_video_thumb_get
			if (Utility.obj_defined(id))
				return 'https://img.youtube.com/vi/' + Youtube.asset_resource_id_get() + '/default.jpg';
			return 'https://img.youtube.com/vi/' + $('#' + id).attr('data-asset_resource_id') + '/default.jpg';
		},
		asset_thumb_at_get_youtube: function(id, time) {
			// __youtube_video_thumb_at_get__
			/*
			var r={
				'rows':0,
				'columns':0,
				'position':0,
				'm_rows':0,
				'm_columns':0,
				'm_position':0
			};
			r.url=this.asset_thumb_get(id);
			r.m_url=this.asset_thumb_get(id);
			return r;
			*/

			var storyboard = '';
			if (Utility.obj_defined(id))
				storyboard = $('#moment_thumb').html();
			else {
				//Skipping storyboard
				storyboard = $('#' + id).attr('data-storyboard_spec');
			}
			//if(DEBUG)console.log(storyboard);
			var seconds = this.asset_getDuration_youtube(id);
			try {
				var mobile_thumb = {};
				var best_thumb = {};

				/*
				https://i.ytimg.com/sb/hMjL76obRLI/storyboard3_L$L/$N.jpg
				|48#27#100#10#10#0#default#DoBpEXT7bOS1vivqNiHTtqQhH2k
				|80#45#136#10#10#2000#M$M#svnVOloYnXCM5uSXWxZ9k7kg75E
				|160#90#136#5#5#2000#M$M#Fw_tBgH-q3rv91dOl1-QshZx5xg
				*/
				var array = storyboard.split('|');
				mobile_thumb.url = array[0].replace('$L', 1);
				best_thumb.url = array[0].replace('$L', array.length - 2);

				var mobile = array[1];
				var best = array.reverse()[0];

				//if(DEBUG)console.log(mobile);
				//if(DEBUG)console.log(best);
				var mobile_tokens = mobile.split('#');
				var best_tokens = best.split('#');

				mobile_thumb.width = parseInt(mobile_tokens[0], 10);
				mobile_thumb.height = parseInt(mobile_tokens[1], 10);
				mobile_thumb.total = parseInt(mobile_tokens[2]);
				mobile_thumb.gridX = parseInt(mobile_tokens[3]);
				mobile_thumb.gridY = parseInt(mobile_tokens[4]);
				//var thumb.unknown=tokens[5];
				mobile_thumb.name = mobile_tokens[6];
				mobile_thumb.sigh = mobile_tokens[7];

				best_thumb.width = parseInt(best_tokens[0], 10);
				best_thumb.height = parseInt(best_tokens[1], 10);
				best_thumb.total = parseInt(best_tokens[2]);
				best_thumb.gridX = parseInt(best_tokens[3]);
				best_thumb.gridY = parseInt(best_tokens[4]);
				//var thumb.unknown=tokens[5];
				best_thumb.name = best_tokens[6];
				best_thumb.sigh = best_tokens[7];

				mobile_thumb.totalseconds = parseInt(seconds, 10);
				best_thumb.totalseconds = parseInt(seconds, 10);
				this.mobile_thumb = mobile_thumb;
				this.best_thumb = best_thumb;
				//if(DEBUG)console.log(this.mobile_thumb);
				//if(DEBUG)console.log(this.best_thumb);

				time = Math.floor(time);

				var mobile_per = Math.ceil(this.mobile_thumb.totalseconds / this.mobile_thumb.total);
				var best_per = Math.ceil(this.best_thumb.totalseconds / this.best_thumb.total);
				//if(DEBUG)console.log(mobile_per,best_per);

				var mobile_desired_thumb = Math.floor((time / mobile_per) + 1);
				var best_desired_thumb = Math.floor((time / best_per) + 1);
				//if(DEBUG)console.log(mobile_desired_thumb,best_desired_thumb);

				var mobile_sheet = Math.floor(mobile_desired_thumb / (this.mobile_thumb.gridX * this.mobile_thumb.gridY));
				var best_sheet = Math.floor(best_desired_thumb / (this.best_thumb.gridX * this.best_thumb.gridY));
				//if(DEBUG)console.log(mobile_sheet,best_sheet);

				var mobile_pos = (mobile_desired_thumb % (this.mobile_thumb.gridX * this.mobile_thumb.gridY));
				var best_pos = (best_desired_thumb % (this.best_thumb.gridX * this.best_thumb.gridY));
				//if(DEBUG)console.log(mobile_pos,best_pos);

				var mobile_url = this.mobile_thumb.url;
				mobile_url = mobile_url.replace('$N', 'M' + mobile_sheet) + '?sigh=' + this.mobile_thumb.sigh;

				var best_url = this.best_thumb.url;
				best_url = best_url.replace('$N', 'M' + best_sheet) + '?sigh=' + this.best_thumb.sigh;

				//last page fix
				if (Math.floor(this.best_thumb.total / (this.best_thumb.gridX * this.best_thumb.gridY)) == best_sheet) {
					var lptotal = this.best_thumb.total % (this.best_thumb.gridX * this.best_thumb.gridY);
					var lpcolumn = Math.ceil(lptotal / this.best_thumb.gridY);

					this.best_thumb.gridY = lpcolumn;
				}
				if (Math.floor(this.mobile_thumb.total / (this.mobile_thumb.gridX * this.mobile_thumb.gridY)) == best_sheet) {
					var lptotal = this.mobile_thumb.total % (this.mobile_thumb.gridX * this.mobile_thumb.gridY);
					var lpcolumn = Math.ceil(lptotal / this.mobile_thumb.gridY);

					this.mobile_thumb.gridY = lpcolumn;
				}
				var r = {
					'url': best_url.replace(/\\\//g, '/'),
					'rows': this.best_thumb.gridX,
					'columns': this.best_thumb.gridY,
					'position': best_pos,
					'm_url': mobile_url.replace(/\\\//g, '/'),
					'm_rows': this.mobile_thumb.gridX,
					'm_columns': this.mobile_thumb.gridY,
					'm_position': mobile_pos
				};
				//if(DEBUG)console.log(r);
				return r;
			} catch (err) {
				if (DEBUG) console.log('---Unable to parse storyboard spec---');
				return false;
			}
		},
		asset_source_get_youtube: function(id) {
			// __youtube_partner_name_get
			return 'youtube';
		},
		asset_url_get_youtube: function(id) {
			// __youtube_url_create__
			if (Utility.obj_defined(id))
				return 'https://www.youtube.com/watch?v=' + Youtube.asset_resource_id_get();
			return 'https://www.youtube.com/watch?v=' + $('#' + id).attr('data-asset_resource_id');
		},

		partner_page_loaded_youtube: function(id) {
			// __youtube_page_onLoad_is__
			if (Utility.obj_defined(id)) {
				$('#moment_container').remove();
				this.partner_page_data_append_youtube();
				if (!document.getElementById('player-api'))
					return false;
				Browser.browser_page_script_run('(function(){document.getElementById("video_title").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getVideoData().title;document.getElementById("video_publisher").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getVideoData().author;document.getElementById("video_duration").innerHTML=yt.player.getPlayerByElement(document.getElementById("player-api")).getDuration();})();');
				Browser.browser_page_script_run('(function(){document.getElementById("moment_thumb").innerHTML=ytplayer.config.args.storyboard_spec;})();');
				if (DEBUG) console.log(Utility.url_parameter_get_byName('v'));
				if (document.getElementById('video_title').innerHTML && document.getElementById('video_publisher').innerHTML && document.getElementById('video_duration').innerHTML && document.getElementById('moment_thumb').innerHTML != '' && document.getElementById('moment_thumb').innerHTML.indexOf(Utility.url_parameter_get_byName('v') > -1)) {
					if (DEBUG) console.log(document.getElementById('moment_thumb').innerHTML);
					return true;
				}
				return false;
			}

			if (typeof YT.get(id) === 'undefined' ||
				typeof YT.get(id).pauseVideo === 'undefined' ||
				typeof YT.get(id).playVideo === 'undefined' ||
				typeof YT.get(id).player_time_get === 'undefined' ||
				typeof YT.get(id).getVideoData === 'undefined' ||
				typeof YT.get(id).getDuration === 'undefined' ||
				typeof YT.get(id).seekTo === 'undefined' ||
				!$('#' + id).attr('data-storyboard_spec') ||
				!$('#' + id).attr('data-resource') ||
				!$('#' + id).attr('data-asset')
			)
				return false;

			if (Browser.ext_window_in()) return true;
			return true;
		},
		partner_page_data_append_youtube: function() {
			// __youtube_page_data_append__
			var container = $('<div>', {
				id: 'moment_container',
				class: 'hidden'
			});

			$(container).append($('<div>', {
				id: 'moment_button',
				class: 'moment_button youtube '
			}).text('#moment'));
			$(container).append($('<div>', {
				id: 'asset_source',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'asset_resource_id',
				class: 'moment_info'
			}));

			$(container).append($('<div>', {
				id: 'moment_time',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'moment_tag',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'moment_thumb',
				class: 'moment_info'
			}));

			$(container).append($('<div>', {
				id: 'video_title',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_publisher',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_duration',
				class: 'moment_info'
			}));
			$(container).append($('<div>', {
				id: 'video_thumbnail',
				class: 'moment_info'
			}));

			$('.ytp-chrome-controls').append(container);
		},
		partner_page_populate_youtube: function() {
			// __youtube_page_onLoad__
			var that = this;
			if (Browser.url_youtube()) {
				if (Utility.url_parameter_get_byName('v')) {
					var video = Utility.url_parameter_get_byName('v');
					if (video == that.video) return;

					$('#invisible_layer').remove();

					that.video = video;

					if (DEBUG) console.log('Video - ' + that.video);

					function d() {
						// __youtube_page_onLoad_event_dispatch__
						if (Youtube.partner_page_loaded()) {
							that.asset_thumb_storyboard_get_youtube(that.video, function(storyboard) {
								if (DEBUG) console.log(storyboard);
								document.getElementById("moment_thumb").innerHTML = storyboard;
								var moment = {};
								moment.asset = {};
								moment.asset.source = 'Youtube';
								moment.asset.resource_id = that.video;
								mList.mList_populate(moment, 'body');
								mList.mList_playhead_populate('Youtube', that.video);

								// __youtube_settings_button__
								$('.ytp-settings-button').unbind('click');
								$('.ytp-settings-button').click(function() {
									setTimeout(function() {
										c();
									}, 500);
								});
								$(document).unbind('mouseup');
								$(document).mouseup(function(e) {
									var container = $(".ytp-settings-button");
									if (!container.is(e.target) // if the target of the click isn't the container...
										&& container.has(e.target).length === 0) // ... nor a descendant of the container
									{
										setTimeout(function() {
											c();
										}, 500);
									}
								});

								function c() {
									// __youtube_settings_menu__
									if ($('.ytp-settings-menu').is(':visible'))
										$('#invisible_layer,#transparent_layer').addClass('hidden');
									else
										$('#invisible_layer,#transparent_layer').removeClass('hidden');
								}
								// __youtube_resize_button__
								$('.ytp-size-button').unbind('click');
								$('.ytp-size-button').click(function() {
									setTimeout(function() {
										Browser.browser_refresh('youtube change video size');
									}, 500);
								});
								return;
							});
						} else
							setTimeout(d, 1000);
					}
					d();
				}
			}
		},

		asset_thumb_storyboard_get_youtube: function(video, callback) {
			if (typeof callback === 'function') callback(document.getElementById('moment_thumb').innerHTML);
		}
	};
	return {
		/* <iframe id='id'></iframe> */
		player_play: function(id) {
			_private.player_play_youtube(id);
		},
		player_pause: function(id) {
			_private.player_pause_youtube(id);
		},
		player_seek: function(id, time) {
			_private.player_seek_youtube(id, time);
		},
		player_time_get: function(id) {
			return _private.player_time_get_youtube(id);
		},
		player_embed: function(mPlay_player_id, moment) {
			_private.player_embed_youtube(mPlay_player_id, moment)
		},
		player_info_update: function(mPlay_player_id, moment) {
			_private.player_info_update_youtube(mPlay_player_id, moment);
		},
		player_embed_youtube_onReady: function(event, object) {
			_private.player_embed_youtube_onReady(event, object);
		},
		player_embed_onStateChange_youtube: function(event, object) {
			_private.player_embed_onStateChange_youtube(event, object);
		},

		asset_title_get: function(id) {
			return _private.asset_title_get_youtube(id);
		},
		asset_channel_id_get: function(id) {
			return _private.asset_channel_id_get_youtube(id);
		},
		asset_channel_id_original_get: function(id) {
			return _private.asset_channel_id_original_get_youtube(id);
		},
		getDuration: function(id) {
			return _private.asset_getDuration_youtube(id);
		},
		asset_resource_id_get: function(id) {
			return _private.asset_resource_id_get_youtube(id);
		},
		asset_thumb_get: function(id) {
			return _private.asset_thumb_get_youtube(id);
		},
		asset_thumb_at_get: function(id, time) {
			return _private.asset_thumb_at_get_youtube(id, time);
		},
		asset_source_get: function(id) {
			return _private.asset_source_get_youtube(id);
		},
		asset_url_get: function(id) {
			return _private.asset_url_get_youtube(id);
		},

		partner_page_loaded: function(id) {
			return _private.partner_page_loaded_youtube(id);
		},
		partner_init: function() {
			_private.partner_page_populate_youtube();
		}
	};
})();

// /////// support services ///////////////////////////
const
	DEBUG = 1,
	INFINITE = 2000000,
	PLAYLIST_ORDER_OLD_FIRST = 1,
	PLAYLIST_ORDER_NEW_FIRST = 0,
	PLAYLIST_STATUS_PUBLIC = 1,
	PLAYLIST_STATUS_PRIVATE = 0,
	PLAYLIST_SCOPE_ALL = 1,
	PLAYLIST_SCOPE_MINE = 0,
	PLAYLIST_MODE_AUTOADD = 1,
	PLAYLIST_MODE_HANDPICK = 0,
	DEFAULT_TAG = 'tag the moment',
	PLAYLIST_MODE_YOUTUBE_BOTTOM = 50,
	PLAYLIST_MODE_TWITCH_BOTTOM = 62,
	PLAYLIST_MODE_IPHONE_BOTTOM = 0,
	MOMENT_MODE_YOUTUBE_BOTTOM = 50,
	MOMENT_MODE_TWITCH_BOTTOM = 62,
	MOMENT_MODE_IPHONE_BOTTOM = 0,
	MOMENT_MODE_EXTRA_HEIGHT = 20,
	TRANSPARENT_LAYER_HEIGHT = 30,
	BASE_DIR = 'ext',
	BORDER_WIDTH = 1,
	THUMB_GAP_RIGHT = 20,
	TWITCH_VOD_DELAY = 103,
	AUTO_ADD_PREFIX_EMPTY = 'Sticky',
	AUTO_ADD_PREFIX = '+ ',
	SCOPE = 'themoment-tv',
	STEP_MOVE_YOUTUBE = 2,
	STEP_MOVE_TWITCH = 4,
	PLAYER_WIDTH = '90%',
	PLAYER_WIDTH_FACTOR = .90,
	PLAYER_MARGIN_FACTOR = .05,
	MY_PLAYLIST_INIT_ITEMS = 4,
	MY_PLAYLIST_MORE_ITEMS = 25,
	MY_HISTORY_INIT_ITEMS = 5,
	MY_HISTORY_MORE_ITEMS = 25,
	MY_MOMENT_INIT_ITEMS = 5,
	MY_MOMENT_MORE_ITEMS = 25,
	FEED_PLAYLIST_INIT_ITEMS = 50,
	TWITCH_EMBEDDED_THUMB_SIZE_FACTOR = 0.80,
	TWITCH_PROFILE_REMIXES_ITEM_COUNT_INIT = 25,
	TWITCH_PROFILE_REMIXES_ITEM_COUNT_MORE = 25,
	FEED_PARTNER_PLAYLIST_INIT_ITEMS = 100;
if (typeof CONFIG === 'undefined') CONFIG = (function() {
	var _private = {
		config_obj_get: function(callback) {
			if (typeof callback === 'function') {
				callback(CONFIG.config_get('config'));
			}
		},
	};
	return {
		// __site_const_get
		config_get: function(key) {
			return _private[key];
		},
		// __site_const_set
		config_set: function(key, value) {
			_private[key] = value;
		},
		config_obj_get: function(callback) {
			_private.config_obj_get(callback);
		}
	}
})();
if (typeof Browser === 'undefined') Browser = (function() {
	var _private = {
		device_touch: function() {
			return (('ontouchstart' in window) || (navigator.MaxTouchPoints > 0) || (navigator.msMaxTouchPoints > 0));
		},
		device_iPhone: function() {
			if (/iPhone/i.test(navigator.userAgent)) {
				return true;
			}
			return false;
		},
		ext_window_in: function() {
			return !this.browser_tab_in();
		},
		ext_installed: function() {
			if (window.chrome && chrome.runtime && chrome.runtime.id)
				return true;
			return false;
		},
		url_native: function() {
			if (App.site_address_get() == location.href.split('#')[0])
				return true;
			return false;
		},
		url_partner: function() {
			if (Browser.url_youtube()) return true;
			if (Browser.url_twitch()) return true;
			if (Browser.url_twitch_live()) return true;
			return false;
		},
		url_twitch: function() {
			if (location.href.indexOf('twitch.tv') > -1)
				return true;
			return false;
		},
		url_twitch_live: function() {
			if ($('html').hasClass('live'))
				return true;
			return false;
		},
		url_youtube: function() {
			if (location.href.indexOf('youtube.com') > -1)
				return true;
			return false;
		},
		url_base_get: function() {
			if (location.protocol === 'chrome-extension:')
				return '';
			if (Browser.url_partner())
				return chrome.extension.getURL('');
			return BASE_DIR + '/';
		},
		url_prepend_root: function(data) {
			if (Browser.browser_tab_in())
				data = data.replace(/{{site}}/g, '');
			else
				data = data.replace(/{{site}}/g, App.site_address_get());
			return data;
		},
		site_page_data_append: function() {
			if (Browser.device_touch()) {
				$('html').addClass('touch');
			} else
				$('html').addClass('no-touch')

			if (Browser.url_native())
				$('html').addClass('host ' + SCOPE);
			else if (Browser.url_partner())
				$('html').addClass('partner');

			if (Browser.ext_window_in())
				$('html').addClass('ext ' + SCOPE);
			if (Browser.device_iPhone())
				$('html').addClass('iphone');

			if (Browser.url_twitch())
				$('html').addClass('twitch');
			if (Browser.url_youtube())
				$('html').addClass('youtube');

			if (User.uData_login_is()) {
				$('html').removeClass('guest').removeClass('registered').addClass('registered');
			} else {
				$('html').removeClass('guest').removeClass('registered').addClass('guest');
			}
		},
		site_page_column_count: function(context) {
			var step = 2;
			if ($(window).width() >= 480 && $(window).width() < 640)
				step = 3;
			else if ($(window).width() >= 640 && $(window).width() < 992)
				step = 4;
			else if ($(window).width() >= 992)
				step = 5;
			if (context == 'pNext' && !Browser.device_touch()) step += 1;
			return step;
		},
		browser_page_script_run: function(script) {
			var s = document.createElement('script');
			s.setAttribute('type', 'text/javascript');
			s.textContent = script;
			document.getElementsByTagName('head')[0].appendChild(s);
			document.getElementsByTagName('head')[0].removeChild(s);
		},
		browser_tab_in: function() {
			if (location.protocol === 'chrome-extension:')
				return false;
			return true;
		},
		browser_url_changed: function(e) {
			if (DEBUG) console.log(location.hash);
			$('html').removeClass('playlist-mode');
			$('html').removeClass('moment-mode');
			if ($('.omniknight').length > 0) {
				$('.omniknight').attr('id', 'temp');
				$('.omniknight').animate({
					'left': '100%'
				}, 500, function() {
					$('#temp.omniknight').remove();
				});
			}
			$('.popup-menu').remove();
			if (location.hash.indexOf('#mine') > -1) {
				Events.event_post('my', 'load', '');
				Instruct.instruct_general_header_render('#mine', false);
				document.title = '#moment Mine';
				$('.p-container').remove();

				// Hide promo from #mine page
				$('#pPromo_carousel').addClass('hidden');

				mList.mList_reset();
				App.hash_previous_set('#mine');
				My.my_page_populate(function() {
					My.my_page_handler_set(function() {
						My.my_following_populate();
					});
				});
			} else if (location.hash.indexOf('#moment/') > -1) {
				if (typeof pPlay.pPlay_playlist_id_get() !== 'undefined') return;
				var moment_id = location.hash.split('#moment/')[1];
				if (moment_id) {
					$('html').addClass('moment-mode');
					//$('.p-container').remove();
					mList.mList_reset()
					mPlay.mPlay_play_byID(moment_id);
				}
			} else if (location.hash.indexOf('#playlist/') > -1) {
				var playlist_id = location.hash.split('#playlist/')[1].split('/')[0];
				var moment_id = location.hash.split('/moment/')[1] ? location.hash.split('/moment/')[1] : 0;
				if (DEBUG) console.log(playlist_id, moment_id);
				//$('.p-container').empty();
				mList.mList_reset()
				if (playlist_id === 'new') {
					Events.event_post('pEdit', 'create', '');
					pEdit.pEdit_init();
					Instruct.instruct_general_header_render('#playlist/new', false);
				} else if (playlist_id > 0) {
					if (location.hash.indexOf('edit') > -1) {
						Events.event_post('pEdit', 'edit', '');
						pEdit.pEdit_init(playlist_id);
						Instruct.instruct_general_header_render('#playlist/new', false);
					} else {
						User.user_stat_get(function(stat) {
							if (DEBUG) console.log(stat);
							if (!App.hash_previous_get() && (parseInt(stat.playlist_played) == 0)) {
								App.hash_previous_set('#');
								regular_feed();
								Instruct.instruct_general_header_render('#pPromo_redirect', false);
								Events.event_post('feed', 'pPromo', playlist_id); //feed / pPromo / playlist_id
								$.ajax({
									url: App.api_root_get() + 'playlists/' + playlist_id,
									method: 'GET',
									success: function(response) {
										pPromo.pPromo_prepare(true, [response]);
										$('.pPromo_thumb a,.pPromo_title').unbind('click');
										$('.pPromo_thumb a,.pPromo_title').click(function(e) {
											e.preventDefault();
											e.stopPropagation();
											pPlay.pPlay_play_byID(playlist_id);
											$('html').addClass('playlist-mode');
										});
									}
								});
							} else {
								pPlay.pPlay_play_byID(playlist_id, moment_id);
								$('html').addClass('playlist-mode');
							}
						});
					}
				}
			} else if (location.hash.indexOf('#user/') > -1) {
				var user_id = location.hash.split('#user/')[1].split('/')[0];
				if (user_id) {
					Events.event_post('user', 'profileView', user_id);
					$('.p-container').empty();
					mList.mList_reset()
					Profile.profile_userID_set(user_id);
					Profile.profile_page_populate(function() {
						Profile.profile_page_handler_set(function() {
							Profile.profile_playlist_get(function(r) {
								Profile.profile_playlist_render(r);
							});
							Profile.profile_follows_get(function(r) {
								if (r.follows.length > 0)
									Profile.profile_follows_render(r.follows);
								$(Profile.profile_page_selector_get()).find('.self.follow_count').text(r.total);
							});
							Profile.profile_followers_get(function(r) {
								if (r.followers.length > 0)
									Profile.profile_followers_render(r.followers);
								$(Profile.profile_page_selector_get()).find('.self.follower_count').text(r.total);
							});
						});
					});
				}
			} else if (location.hash.indexOf('#twitch/') > -1) {
				var channel = location.hash.split('#twitch/')[1] ? location.hash.split('#twitch/')[1] : false;
				if (!channel) {
					Events.event_post('feed', 'load', '');
					regular_feed();
				} else {
					regular_feed();
					pPromo.pPromo_prepare();
					document.title = '#moment : ' + channel;
					App.hash_previous_set(location.hash);
					// __fRow_playlist_hit_create
					Feed.fRow_channel_populate('twitch', channel);

					Events.event_post('feed', 'twitch', channel);

					var favorite_partner_channel = User.user_favorite_partner_channel_get();

					var favorite_partner_channel_new = [];
					$.each(favorite_partner_channel, function(i, el) {
						if (el != 'twitch/' + channel) favorite_partner_channel_new.push(el);
					});
					favorite_partner_channel_new.push('twitch/' + channel);
					User.uData_update({
						favorite_partner_channel: favorite_partner_channel_new.join(',')
					});
				}
			} else {
				Events.event_post('feed', 'load', '');
				App.hash_previous_set('#');
				regular_feed();
				pPromo.pPromo_prepare();
			}

			function regular_feed() {
				// Show promo in feed page
				$('#pPromo_carousel').removeClass('hidden');

				Instruct.instruct_general_header_render('', false);
				document.title = '#moment Feed';
				$('.p-container').remove();
				mList.mList_reset()
				Feed.feed_page_populate({
					include: ''
				}, function() {
					App.site_header_handler_set();
				});
			}
		},
		browser_window_resize: function() {

			if (new Date() - Browser.rtime < Browser.delta) {
				setTimeout(Browser.browser_window_resize, Browser.delta);
			} else {
				Browser.timeout = false;

				Browser.browser_refresh('window resize');

				if (Browser.device_touch())
					mList.mList_live_scroll();
			}
		},
		browser_window_scroll_top: function() {
			setTimeout(function() {
				window.scrollTo(0, 0);
			}, 1);
		},
		browser_refresh: function() {
			Instruct.instruct_refresh();
			Feed.feed_refresh();
			My.my_refresh();
			mList.mList_refresh();
			Profile.profile_refresh();
			pEdit.pEdit_refresh();
			mEdit.mEdit_refresh();
			Carousel.carousel_refresh(function() {
				pNext.pNext_refresh();
				Instruct.instruct_refresh();
			});
		}
	};
	return {
		device_touch: function() {
			return _private.device_touch();
		},
		device_iPhone: function() {
			return _private.device_iPhone();
		},
		ext_window_in: function() {
			return _private.ext_window_in();
		},
		ext_installed: function() {
			return _private.ext_installed();
		},
		url_native: function() {
			return _private.url_native();
		},
		url_partner: function() {
			return _private.url_partner();
		},
		url_twitch: function() {
			return _private.url_twitch();
		},
		url_twitch_live: function() {
			return _private.url_twitch_live();
		},
		url_youtube: function() {
			return _private.url_youtube();
		},
		url_base_get: function() {
			return _private.url_base_get();
		},
		url_prepend_root: function(data) {
			return _private.url_prepend_root(data);
		},
		site_page_data_append: function() {
			_private.site_page_data_append();
		},
		site_page_column_count: function(context) {
			return _private.site_page_column_count(context);
		},
		browser_page_script_run: function(script) {
			_private.browser_page_script_run(script);
		},
		browser_tab_in: function() {
			return _private.browser_tab_in();
		},
		browser_url_changed: function() {
			_private.browser_url_changed();
		},
		browser_window_resize: function() {
			_private.browser_window_resize();
		},
		browser_window_scroll_top: function() {
			_private.browser_window_scroll_top();
		},
		browser_refresh: function() {
			_private.browser_refresh();
		}
	};
})();
if (typeof App === 'undefined') App = (function() {
	var _private = {
		app_env_config_load: function(callback) {
			var that = this;
			Utility.file_load('app_env_config.json', function(config) {
				if (typeof config !== 'object') config = JSON.parse(config);
				App.Config = config;

				// Set API root and Site address
				that.api_root_site_address_set(config);

				// Treat presence of login=true or logout=true in the URL as login or logout state
				that.ext_login_logout_by_url();

				// Extension init
				that.ext_init();

				// Sync Extension and Site
				that.ext_site_sync(config, function() {

					// Use core.js once
					if ((Browser.url_native() && !Browser.ext_installed()) || (!Browser.url_native() && Browser.ext_installed())) {

						// Finally
						User.user_info_attach_ext_window_page_data(callback);
					}
				});
			});
		},
		table_data_load: function(callback) {
			$.ajax({
				// __config_get_apicall
				url: App.api_root_get() + 'config?auid=' + User.user_id_get(),
				method: 'GET',
				dataType: 'json',
				success: function(response) {
					if (typeof response !== 'object')
						response = JSON.parse(response);

					var temp = {};
					var config = response.config;
					for (var i = 0; i < config.length; i++)
						temp[config[i].key] = config[i].value;
					CONFIG.config_set('config', temp);

					var instructions = response.instructions.instructions;
					for (var i = 0; i < instructions.length; i++) {
						CONFIG.config_set(instructions[i].key, instructions[i]);
					}

					App.user = response.user;
					if (typeof callback === 'function') callback();
				}
			});
		},
		html_template_load: function(callback) {
			$.get(Browser.url_base_get() + 'template/template.phtml?_=' + new Date().getTime(), function(data) {
				$('body').append(data);
				if (typeof callback === 'function')
					callback(data);
			});
		},
		site_page_populate: function() {
			if (DEBUG) console.log('Bootstrapping...');

			App.bootstrapped = true;

			App.time_server_get();

			User.user_stat_get();

			Browser.site_page_data_append();

			User.uData_merge();

			Browser.timeout = false;
			Browser.delta = 200;
			// __browser_page_resize__
			$(window).resize(function() {
				Browser.rtime = new Date();
				if (Browser.timeout === false) {
					Browser.timeout = true;
					setTimeout(Browser.browser_window_resize, Browser.delta);
				}
			});

			window.onhashchange = Browser.browser_url_changed;

			// __site_comp_navTopRow_render
			if (!Browser.url_partner()) {
				// __site_comp_navTopRow_html_get
				App.html_template_get('site_header.html', function(data) {
					data = Browser.url_prepend_root(data);
					$('body').prepend(data);
					// __site_body_html_get
					App.html_template_get('site_body.html', function(data) {
						$('#main').append(data);

						App.html_template_get('pPromo_carousel.html', function(carousel_html) {
							$('#main').prepend(carousel_html);

							Browser.browser_url_changed();

							if (User.uData_login_is())
								$('.outworld').hide();

							User.uMerch_image_render(App.user);
						});
					});
				});
			}
		},
		api_root_get: function() {
			return this.APIROOT;
		},
		api_root_set: function(root) {
			this.APIROOT = root;
		},
		site_address_set: function(site) {
			this.SITEADDR = site;
		},
		site_address_get: function() {
			return this.SITEADDR;
		},
		hash_previous_set: function(hash) {
			this.previousHash = hash;
		},
		hash_previous_get: function() {
			return this.previousHash;
		},
		html_template_get: function(template, callback) {
			if (!App.templates) App.templates = {};

			App.templates[template] = $('#' + template.replace('.html', '') + '_template').html()

			function recursion() {
				var h = /{{.*\.html}}/g;
				var matches = App.templates[template].match(h);
				//If there are no more {{*.html}}
				if (!matches || matches.length == 0) {
					if (typeof callback === 'function')
						callback(App.templates[template]);
					return;
				}

				function l(index) {
					if (!matches[index]) {
						recursion();
						return;
					}
					var microtemplate = matches[index];
					microtemplate = microtemplate.replace('{{', '').replace('}}', '');
					App.templates[microtemplate] = $('#' + microtemplate.replace('.html', '') + '_template').html();
					App.templates[template] = App.templates[template].replace(matches[index], App.templates[microtemplate]);
					l(++index);
				}
				l(0);
			}
			recursion();
		},
		player_selector_get: function() {
			var selector;
			if (Browser.url_twitch())
				selector = '.player';
			else if (Browser.url_youtube())
				selector = '.html5-video-player';
			else if (Browser.url_native())
				selector = '#' + App.player_id_get();
			return selector;
		},
		asset_partner_NameKey_get: function(key) {
			//if(!(Number(key)===key && key%1===0))return key;
			if (parseInt(key, 10) == 1) return 'Youtube';
			if (parseInt(key, 10) == 2) return 'Netflix';
			if (parseInt(key, 10) == 3) return 'Twitch';
			if (parseInt(key, 10) == 4) return 'Vimeo';

			if (key == 'Youtube' || key == 'youtube' || key == 'yt') return 'Youtube';
			if (key == 'Twitch' || key == 'twitch') return 'Twitch';
		},
		api_root_site_address_set: function(config) {
			// This function sets API root and Site address.

			// Default API root
			App.api_root_set(config[config.active.mode].api.url[0]);

			// Default user_id_anon Site address
			App.site_address_set(config[config.active.mode].app.url[0]);

			var url = location.href.split('#')[0];

			var pool = config[config.active.mode].app.url;
			for (var i = 0; i < pool.length; i++) {
				if (url.indexOf(pool[i]) > -1) {
					// Why we are setting url as Site address?
					// Primarily for localhost. So that the project can exist in different localhost directory.
					// For me it is http://localhost/moment_v2/ For paul it is http://localhost/moment_repositories/moment_app
					App.site_address_set(url);
				}
			}
		},
		ext_login_logout_by_url: function() {
			// Treat presence of ?login=true or ?logout=true in the URL as login or logout state

			if (location.href.indexOf('?') > -1) {
				if (location.href.split('?')[1]) {
					var l = location.href.split('?')[1];
					if (l.split('=')[1]) {
						if (l.split('=')[0] == 'login' && l.split('=')[1] == 'true') {
							// URL has ?login=true

							// If extension is installed, send login message to the background
							if (Browser.ext_installed()) {
								chrome.runtime.sendMessage({
									greeting: "login",
									data: {
										user_id_registered: User.user_id_get()
									}
								}, function(response) {
									// Remove the ?login=true part from URL
									window.location = window.location.href.split('?')[0];

									// Reload all tabs that are in the same scope
									chrome.runtime.sendMessage({
										greeting: "reload"
									}, function(response) {});
								});
							} else {
								// Only remove the ?login=true part from the URL if the extension is not installed
								window.location = window.location.href.split('?')[0];
							}

						} else if (l.split('=')[0] == 'logout' && l.split('=')[1] == 'true') {
							// URL has ?logout=true

							// If extension is installed, send logout message to the background
							if (Browser.ext_installed()) {
								chrome.runtime.sendMessage({
									greeting: "logout"
								}, function(response) {
									// Remove the ?logout=true part from URL
									window.location = window.location.href.split('?')[0];

									// Reload all tabs that are in the same scope
									chrome.runtime.sendMessage({
										greeting: "reload"
									}, function(response) {});
								});
							} else {
								// Only remove the ?logout=true part from the URL if the extension is not installed
								window.location = window.location.href.split('?')[0];
							}
						}
					}
				}
			}
		},
		partner_page_load_ext: function() {
			// Constanty look for resource_id change
			// This is the kickoff for partner sites
			setInterval(function() {
				if (location.href.indexOf('youtube.com') > -1)
					Youtube.partner_init();
				else if (location.href.indexOf('netflix.com') > -1)
				; //Netflix.partner_init()
				else if (location.href.indexOf('twitch.tv') > -1)
					Twitch.partner_init();
			}, 2000);
		},
		ext_init: function() {
			var that = this;
			if (Browser.ext_installed()) {
				chrome.runtime.sendMessage({
					greeting: "hello"
				}, function(response) {
					Utility.addFontToExtension('FontAwesome', 'fontawesome-webfont.woff');
					that.partner_page_load_ext();
				});
			}
		},
		ext_site_sync: function(config, callback) {
			var that = this;
			if (Browser.ext_installed()) {
				// First check if we are in the native sites
				for (var z = 0; z < config[config.active.mode].app.url.length; z++) {
					if (App.site_address_get().indexOf(config[config.active.mode].app.url[z]) > -1) {

						var t = setInterval(function() {
							if (User.user_id_get_page_data('user_id_anon').text()) {
								clearInterval(t);
								var user_id_anon = User.user_id_get_page_data('user_id_anon').text();

								// If Site has user_id_registered component, send login message to background
								if (User.user_id_get_page_data('user_id_registered').text()) {
									var user_id_registered = User.user_id_get_page_data('user_id_registered').text();
									chrome.runtime.sendMessage({
										greeting: "login",
										data: {
											user_id_registered: user_id_registered
										}
									}, function(response) {});
								}
								// Else send logout message to background
								else {
									chrome.runtime.sendMessage({
										greeting: "logout"
									}, function(response) {});
								}

								chrome.runtime.sendMessage({
									greeting: "isLoggedIn"
								}, function(response) {

									// If Extension user_id_anon differs from that of Site, we need to kill one
									// More clarification @refazul
									if (response.data.user_id_anon != user_id_anon) {
										$.ajax({
											// __user_merge_sacrifice_post_apicall
											url: App.api_root_get() + 'merge/sacrifice',
											data: {
												ext: response.data.user_id_anon,
												site: user_id_anon
											},
											dataType: 'json',
											method: 'POST',
											success: function(r) {
												chrome.runtime.sendMessage({
													greeting: "impose",
													user_id_anon: user_id_anon
												}, function(response) {});
												if (r.status = 'sacrificed') {

												}
											}
										});
									} else {
										if (typeof callback === 'function') callback();
										return;
									}
								});
							}
						}, 1000);
						break;
					}
				}
				if (typeof callback === 'function') callback();
				return;
			} else {
				if (typeof callback === 'function') callback();
			}
		},
		site_header_handler_set: function() {
			$('.profile-menu.registered').unbind('click');
			$('.profile-menu.registered').click(function() {
				if (location.hash.indexOf('#mine') > -1) {
					// __uMerch_menu_html_get
					App.html_template_get('uMerch_menu.html', function(data) {
						if ($('.uMerch_menu').length == 0) {
							$('body').append(data);

							$('#logout-button').click(function(e) {
								// __site_comp_regButton_logout_onClick
								if (Browser.ext_window_in()) {
									e.preventDefault();
									e.stopPropagation();
									chrome.tabs.create({
										url: App.site_address_get() + $(this).attr('href')
									});
								}
							});
						}
						$('.uMerch_menu').toggle();
						$('.uMerch_menu')
							.css('position', 'absolute')
							.css('width', $('.profile-menu:visible').width())
							.css('top', $('.profile-menu:visible').offset().top + $('.profile-menu:visible').outerHeight())
							.css('left', $('.profile-menu:visible').offset().left);
						$(data).unbind('mouseleave');
						$(data).bind('mouseleave', function() {
							$(this).remove();
						});
					});
				} else location.hash = '#mine';
			});
			$('.profile-menu.guest').unbind('click');
			$('.profile-menu.guest').click(function() {
				location.hash = '#mine';
			});
			$('.home').unbind('click');
			$('.home').click(function() {
				if (location.hash == '#feed')
					location.reload();
			});

			$(document).on('click touchstart', function(e) {
				$('.menu_item_group').remove();
			});

			var that = this;
			var selector = '#moment_list .items';
			that.userScrolledOnce = false;

			function foo() {
				if ($(selector).length) {
					$(selector).unbind('mousewheel');
					$(selector).unbind('touchstart');
					$(selector).on('mousewheel touchstart', function() {
						that.userScrolledOnce = true;
					});
					return;
				}
				setTimeout(foo, 1000);
			}
			setTimeout(foo, 1000);
		},
		time_server_get: function(callback) {
			var that = this;
			$.ajax({
				url: App.api_root_get() + 'timestamp',
				dataType: 'json',
				method: 'GET',
				success: function(response) {
					that.timestamp_server = response;
					that.timestamp_server_fetch_time = Math.floor(new Date().getTime() / 1000);
					if (typeof callback == 'function')
						callback();
				}
			});
		},
		time_server_calc: function() {
			var that = this;
			var now = Math.floor(new Date().getTime() / 1000);
			return that.timestamp_server + (now - that.timestamp_server_fetch_time);
		}
	};
	return {
		app_env_config_load: function(callback) {
			_private.app_env_config_load(callback);
		},
		table_data_load: function(callback) {
			_private.table_data_load(callback);
		},
		html_template_load: function(callback) {
			_private.html_template_load(callback);
		},
		site_page_populate: function() {
			_private.site_page_populate();
		},
		api_root_get: function() {
			return _private.api_root_get();
		},
		api_root_set: function(root) {
			_private.api_root_set(root);
		},
		site_address_set: function(site) {
			_private.site_address_set(site);
		},
		site_address_get: function() {
			return _private.site_address_get();
		},
		api_root_get: function() {
			return _private.api_root_get();
		},

		asset_partner_NameKey_get: function(key) {
			return _private.asset_partner_NameKey_get(key);
		},
		html_template_get: function(template, callback) {
			//#App.html_template_get()
			//What is does - loads a template (e.g. moment.html) & caches it in App.templates for fast response later on
			_private.html_template_get(template, callback);
		},
		player_selector_get: function() {
			//#App.player_selector_get()
			//What is does - returns player selectors of partner sites
			return _private.player_selector_get();
		},
		player_id_get: function() {
			return $('.p-container').children().first().attr('id');
		},
		player_state_get: function() {
			if (Browser.url_native())
				return $('.p-container').children().first().attr('data-asset_source');
			else {
				if (Browser.url_twitch()) return 'Twitch';
				if (Browser.url_youtube()) return 'Youtube';
			}
		},
		video_obj_get: function() {
			if (Browser.browser_tab_in()) {
				if (Browser.url_partner()) {
					if (Browser.url_youtube()) return Youtube;
					if (Browser.url_twitch()) return Twitch;
				} else {
					return this.Video;
				}
			}
		},
		video_obj_set: function(moment) {
			if (!moment) {
				this.Video = false;
				return;
			}
			if (moment.asset.source == 1) {
				this.Video = Youtube;
			} else if (moment.asset.source == 3)
				this.Video = Twitch;
		},
		hash_previous_set: function(hash) {
			_private.hash_previous_set(hash);
		},
		hash_previous_get: function() {
			return _private.hash_previous_get();
		},
		site_header_handler_set: function() {
			_private.site_header_handler_set();
		},
		time_server_get: function(callback) {
			_private.time_server_get(callback);
		},
		time_server_calc: function() {
			return _private.time_server_calc();
		}
	};
})();
if (typeof Utility === 'undefined') Utility = (function() {
	var _private = {
		addFontToExtension: function(font_family, font_file) {
			var fa = document.createElement('style');
			fa.type = 'text/css';
			//fa.textContent = '@font-face { font-family: FontAwesome; src: url("' + chrome.extension.getURL('fonts/fontawesome-webfont.woff?v=4.0.3') + '"); }';
			fa.textContent = '@font-face { font-family: ' + font_family + '; src: url("' + chrome.extension.getURL('fonts/' + font_file) + '"); }';
			document.head.appendChild(fa);
		},
		obj_defined: function(object) {
			if (typeof object === 'undefined') return true;
			return false;
		},
		url_parameter_get_byName: function(name) {
			name = name.replace(/[\[]/, "\\[").replace(/[\]]/, "\\]");
			var regex = new RegExp("[\\?&]" + name + "=([^&#]*)"),
				results = regex.exec(location.search);
			return results === null ? "" : decodeURIComponent(results[1].replace(/\+/g, " "));
		},
		html_template_replace: function(template, object, callback) {
			App.html_template_get(template, function(data) {
				for (var prop in object) {
					if (typeof object[prop] === 'object') {
						for (var p in object[prop]) {
							var r = new RegExp('{{' + prop + '_' + p + '}}', "g");
							data = data.replace(r, object[prop][p]);
						}
					} else {
						var r = new RegExp('{{' + prop + '}}', "g");
						data = data.replace(r, object[prop]);
					}
				}
				if (typeof callback === 'function')
					callback(data, object);
			});
		},
		sort: function(objects, property, order) {
			if (typeof order === 'undefined') order = 'asc';

			function descCompare(a, b) {
				if (parseInt(a[property], 10) < parseInt(b[property], 10))
					return 1;
				if (parseInt(a[property], 10) > parseInt(b[property], 10))
					return -1;
				return 0;
			}

			function ascCompare(a, b) {
				if (parseInt(a[property], 10) < parseInt(b[property], 10))
					return -1;
				if (parseInt(a[property], 10) > parseInt(b[property], 10))
					return 1;
				return 0;
			}
			if (order == 'asc')
				objects.sort(ascCompare);
			else if (order == 'desc')
				objects.sort(descCompare);

			return objects;
		},
		string_number_format: function(x) {
			return x.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
		},
		id_random_generate: function() {
			var text = "";
			var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
			for (var i = 0; i < 32; i++)
				text += possible.charAt(Math.floor(Math.random() * possible.length));
			return text;
		},
		cursor_position_reset: function(html) {
			var value = $(html).text();
			html.text('');
			setTimeout(function() {
				$(html).text(value);
			}, 1);
		},
		time_since_calc: function(timestamp) {

			var seconds = Math.floor((Date.now() / 1000 - timestamp));

			var interval = Math.floor(seconds / 31536000);

			if (interval > 1) {
				return interval + " years";
			}
			interval = Math.floor(seconds / 2592000);
			if (interval > 1) {
				return interval + " months";
			}
			interval = Math.floor(seconds / 86400);
			if (interval > 1) {
				return interval + " days";
			}
			interval = Math.floor(seconds / 3600);
			if (interval > 1) {
				return interval + " hours";
			}
			interval = Math.floor(seconds / 60);
			if (interval > 1) {
				return interval + " minutes";
			}
			return Math.floor(seconds) + " seconds";
		},
		image_url_resolve: function(image) {
			return Browser.url_base_get() + 'images/' + image;
		},
		file_load: function(file, callback) {
			if (window.chrome && chrome.runtime && chrome.runtime.id) {
				$.get(chrome.extension.getURL(file), function(data) {
					callback(data);
				});
			} else {
				$.get(Browser.url_base_get() + file, function(data) {
					callback(data);
				});
			}
		},
		link_open: function(link) {
			var win = window.open(link, '_blank');
			win.focus();
		},
		seconds_to_hmmss_convert: function(seconds) {
			var h = parseInt(seconds / 3600) % 24;
			var m = parseInt(seconds / 60) % 60;
			var s = seconds % 60;

			return (h) + ":" + (m < 10 ? "0" + m : m) + ":" + (s < 10 ? "0" + s : s);
		},
		ucfirst: function(string){
    		return string.replace(/\w\S*/g, function(txt){return txt.charAt(0).toUpperCase() + txt.substr(1).toLowerCase();});
		}
	};
	return {
		addFontToExtension: function(font_family, font_file) {
			_private.addFontToExtension(font_family, font_file);
		},
		obj_defined: function(object) {
			return _private.obj_defined(object);
		},
		url_parameter_get_byName: function(name) {
			return _private.url_parameter_get_byName(name);
		},
		html_template_replace: function(template, object, callback) {
			_private.html_template_replace(template, object, callback);
		},
		sort: function(objects, property, order) {
			return _private.sort(objects, property, order);
		},
		string_number_format: function(x) {
			return _private.string_number_format(x);
		},
		id_random_generate: function() {
			return _private.id_random_generate();
		},
		cursor_position_reset: function(html) {
			_private.cursor_position_reset(html);
		},
		time_since_calc: function(timestamp) {
			return _private.time_since_calc(timestamp);
		},
		image_url_resolve: function(image) {
			return _private.image_url_resolve(image);
		},
		file_load: function(file, callback) {
			_private.file_load(file, callback);
		},
		link_open: function(link) {
			_private.link_open(link);
		},
		seconds_to_hmmss_convert: function(seconds) {
			return _private.seconds_to_hmmss_convert(seconds);
		},
		ucfirst: function(string){
			return _private.ucfirst(string);
		}
	};
})();
if (typeof Display === 'undefined') Display = (function() {
	var _private = {
		disp_chain_add: function(chain, selector) {
			if (!Display[chain]) Display[chain] = selector;
			else Display[chain] = Display[chain] + ',' + selector;
			this.disp_chain_rebind(Display[chain]);
		},
		disp_chain_set: function(chain, selector) {
			Display[chain] = selector;
			this.disp_chain_rebind(Display[chain]);
		},
		disp_chain_rebind: function(selector) {
			$(selector).unbind('hover');
			$(selector).hover(function() {
				$(selector).addClass('hover');
			},
			function() {
				$(selector).removeClass('hover').removeClass('visible');
			});
			$(selector).addClass('visible');
		},
		disp_chain_reset: function() {
			for (key in Display) {
				if (Display.hasOwnProperty(key) && typeof Display[key] !== 'function')
					delete Display[key];
			}
		}
	};
	return {
		disp_chain_add: function(chain, selector) {
			_private.disp_chain_add(chain, selector);
		},
		disp_chain_set: function(chain, selector) {
			_private.disp_chain_set(chain, selector);
		},
		disp_chain_reset: function() {
			_private.disp_chain_reset();
		}
	};
})();
if (typeof Local === 'undefined') Local = (function() {
	var _private = {
		local_mine_is: function(n) {
			if (n.indexOf(User.user_id_get()) > -1) return true;
			return false;
		},
		local_thumb_clear: function() {
			var backup = {};
			for (var i = 0; i < localStorage.length; i++) {
				if (this.local_mine_is(localStorage.key(i)))
					backup[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
				if (localStorage.key(i) == 'user_id_registered' || localStorage.key(i) == 'user_id_anon')
					backup[localStorage.key(i)] = localStorage.getItem(localStorage.key(i));
			}
			localStorage.clear();
			localStorage.clear();
			localStorage.clear();
			for (var i in backup) {
				if (backup.hasOwnProperty(i)) {
					try {
						localStorage.setItem(i, backup[i]);
					} catch (e) {
						if (DEBUG) console.log('Unable to cache - ', i);
					}
				}
			}
		},
		local_all_clear: function() {
			var user_id_anon = localStorage.getItem('user_id_anon');
			var user_id_registered = localStorage.getItem('user_id_registered') ? localStorage.getItem('user_id_registered') : false;

			localStorage.clear();
			localStorage.clear();
			localStorage.clear();
			try {
				localStorage.setItem('user_id_anon', user_id_anon);
				if (user_id_registered)
					localStorage.setItem('user_id_registered', user_id_registered);
			} catch (e) {
				if (DEBUG) console.log('Critical Storage Error');
			}
		}
	};
	return {
		local_thumb_clear: function() {
			_private.local_thumb_clear();
		},
		local_all_clear: function() {
			_private.local_all_clear();
		}
	};
})();
if (typeof Events === 'undefined') Events = (function() {
	var _private = {
		event_post: function() {
			var that = this;
			if (!arguments[0]) return;
			if (!arguments[1]) return;
			if (!arguments[2]) arguments[2] = '';
			if (DEBUG) console.log(arguments);

			var g = [];
			g[0] = 'send';
			g[1] = 'event';
			g[2] = arguments[0];
			g[3] = arguments[1];
			g[4] = arguments[2];

			// Skip mPlay / watch
			if (!(g[2] == 'mPlay' && g[3] == 'watch'))
				ga.apply(null, g);

			that.queue = that.queue || [];
			that.queue.push(arguments);
			if (DEBUG) console.log(that.queue);
			if (!App.bootstrapped)
				return;
			if (!that.lock)
				f();

			function f() {
				that.lock = true;
				if (that.queue.length > 0) {
					var arg = that.queue.shift();
					$.ajax({
						url: App.api_root_get() + 'track',
						method: 'POST',
						data: {
							category: arg[0],
							action: arg[1],
							label: arg[2],
							auid: User.user_id_get(),
							fallback: User.user_id_anon_get()
						},
						complete: function() {
							f();
						}
					});
				} else
					that.lock = false;
			}
		}
	};
	return {
		event_post: function() {
			_private.event_post.apply(null, arguments);
		}
	};
})();
if (typeof Carousel === 'undefined') Carousel = (function() {
	var _private = {
		carousel_render: function(_selector, _items, callback, _refresh) {
			$(_selector).find('.items').empty();
			App.html_template_get('carousel.html', function(carousel_html) {
				var carousel_html = $.parseHTML(carousel_html);

				var selector_id = $(_selector).attr('id');
				var carousel_id = Utility.id_random_generate();
				if (!Carousel[selector_id])
					Carousel[selector_id] = _items;
				else
					_items = Carousel[selector_id];

				$(carousel_html).attr('id', carousel_id);
				$(carousel_html).find('.carousel-control').attr('href', '#' + carousel_id);

				$(carousel_html).appendTo($(_selector).find('.items'));

				var context = _selector == '#next_list' ? 'pNext' : '';
				var step = Browser.site_page_column_count(context);

				if (DEBUG) console.log(_selector, _items);
				for (var i = 0; i < _items.length; i = i + step) {
					var rowId = Utility.id_random_generate();
					var item = $('<div>', {
						class: 'item',
						id: 'row-' + rowId
					}).appendTo('#' + selector_id + ' .carousel-inner');

					for (var j = 0; j < step; j++) {
						if (!_items[i + j]) break;
						if (_items[i + j].mode)
							pMerch.pMerch_render(_items[i + j], '#row-' + rowId, {});
						else
							mMerch.mMerch_render(_items[i + j], '#row-' + rowId, {});
					}
					$(item).attr('data-items', j);

					//$('<li data-target="#'+id+'" data-slide-to="'+i+'"></li>').appendTo('#'+id+' .carousel-indicators')
				}
				$('#' + carousel_id + ' .item').first().addClass('active');
				$('#' + carousel_id + ' .carousel-indicators > li').first().addClass('active');
				$('#' + carousel_id).carousel({
					wrap: false,
					interval: false
				});
				$('#' + carousel_id).on('slid.bs.carousel', function() {
					Carousel.carousel_end_check(this);
				});
				if (_selector != '#next_list') {
					setTimeout(function() {
						$('#' + carousel_id + ' .carousel-control').height($('#' + carousel_id + ' .mthumbnail:visible').outerHeight(true) + 2 * BORDER_WIDTH).css('top', BORDER_WIDTH);
					}, 100);
				}

				if (typeof callback === 'function') callback(_selector, _items);
			});
		},
		carousel_refresh: function(callback) {
			$('.carousel').each(function() {
				var _parent_id = $(this).parent().parent().attr('id');
				if (_parent_id == 'content' || _parent_id == 'playlist_create') return;
				var _selector = '#' + _parent_id;
				var _items = Carousel[_parent_id];
				Carousel.carousel_render(_selector, _items, function() {
					$(_selector).removeClass('hidden');
					$(_selector).preloader();
					if (typeof callback === 'function') callback();
				}, true);
			});
		},
		carousel_end_check: function(carousel_html) {
			carousel_html = '#' + $(carousel_html).attr('id');
			var prev = $(carousel_html).find('.carousel-inner .item.active').prevAll().length;
			var next = $(carousel_html).find('.carousel-inner .item.active').nextAll().length;

			if (DEBUG) console.log(prev, next);

			if (prev == 0)
				$(carousel_html).find('.carousel-control.left').hide();
			else
				$(carousel_html).find('.carousel-control.left').show();

			if (next == 0)
				$(carousel_html).find('.carousel-control.right').hide();
			else
				$(carousel_html).find('.carousel-control.right').show();
		}
	};
	return {
		carousel_render: function(_selector, _items, callback, _refresh) {
			_private.carousel_render(_selector, _items, callback, _refresh);
		},
		carousel_refresh: function(callback) {
			_private.carousel_refresh(callback);
		},
		carousel_end_check: function(carousel_html) {
			_private.carousel_end_check(carousel_html);
		}
	};
})();

App.app_env_config_load(function() {
	App.table_data_load(function() {
		App.html_template_load(function() {
			App.site_page_populate();
		});
	});
});
