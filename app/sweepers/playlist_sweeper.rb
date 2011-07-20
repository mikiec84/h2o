require 'sweeper_helper'
class PlaylistSweeper < ActionController::Caching::Sweeper
  include SweeperHelper
  observe Playlist

  def playlist_clear(record)
    Rails.cache.delete_matched(%r{playlists-search*})

    expire_fragment "playlist-all-tags"
    expire_fragment "playlist-#{record.id}-index"
    expire_fragment "playlist-#{record.id}-tags"
    expire_page :controller => :playlists, :action => :show, :id => record.id

    record.relation_ids.each do |p|
      expire_page :controller => :playlists, :action => :show, :id => p
    end

    users = record.accepted_roles.inject([]) { |arr, b| arr.push(b.user.id) if ['owner', 'creator'].include?(b.name); arr }.uniq
    users.push(current_user.id) if current_user
    users.each { |u| Rails.cache.delete("user-playlists-#{u}") }
  end

  def after_save(record)
    playlist_clear(record)
  end

  def before_destroy(record)
    playlist_clear(record)
  end

  def after_playlists_position_update
    expire_page :controller => :playlists, :action => :show, :id => params[:id]
  end
end