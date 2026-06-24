import { LightningElement, track } from 'lwc';
import getUserPlaylists from '@salesforce/apex/SpotifyService.getUserPlaylists';
import getPlaylistTracks from '@salesforce/apex/SpotifyService.getPlaylistTracks';

export default class SpotifyMoodPlayer extends LightningElement {
    @track playlists = [];
    @track tracks = [];
    @track selectedPlaylist = null;
    @track isConnected = false;
    @track isLoading = false;
    @track errorMessage = '';

    connectedCallback() {
        this.loadPlaylists();
    }

    loadPlaylists() {
        this.isLoading = true;
        this.errorMessage = '';
        getUserPlaylists()
            .then(data => {
                this.isLoading = false;
                if (data && data.length > 0) {
                    this.playlists = data;
                    this.isConnected = true;
                } else {
                    this.isConnected = false;
                    this.errorMessage = 'No playlists found.';
                }
            })
            .catch(err => {
                this.isLoading = false;
                this.isConnected = false;
                this.errorMessage = err.body ? err.body.message : JSON.stringify(err);
            });
    }

    connectSpotify() {
        window.location.href =
            'https://orgfarm-49e2b0c7ba-dev-ed.develop.my.site.com/spotifyvforcesite/services/auth/sso/spotify';
    }

    openPlaylist(evt) {
        const id = evt.currentTarget.dataset.id;
        this.selectedPlaylist = this.playlists.find(p => p.id === id);
        this.tracks = [];
        this.isLoading = true;
        this.errorMessage = '';
        getPlaylistTracks({ playlistId: id })
            .then(data => {
                this.isLoading = false;
                this.tracks = data && data.length > 0 ? data : [];
                if (!data || data.length === 0) {
                    this.errorMessage = 'No tracks found in this playlist.';
                }
            })
            .catch(err => {
                this.isLoading = false;
                this.errorMessage = err.body ? err.body.message : JSON.stringify(err);
            });
    }

    goBack() {
        this.selectedPlaylist = null;
        this.tracks = [];
        this.errorMessage = '';
    }

    playTrack(evt) {
        const uri = evt.currentTarget.dataset.uri;
        const url = evt.currentTarget.dataset.url;
        // Try Spotify app first, fallback to web player
        window.location.href = uri;
        setTimeout(() => window.open(url, '_blank'), 1500);
    }
}