import { Component, EventEmitter, Input, Output } from "@angular/core";
import { CommonListing } from "../info/info.component";
import { PreferencesService } from "../preferences.service";

export interface ListingOptions {
  width: number,
  height: number
}

@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss']
})
export class ListingsComponent {
  @Input() listings: CommonListing[] = [ ];
  @Input() options: ListingOptions = { width: 60, height: 40 };
  @Input() hideSeen = false;
  @Output() listingClicked: EventEmitter<CommonListing> = new EventEmitter<CommonListing>();
  private _index = 0;

  seen: string[] = [];
  favorites: string[] = [];

  constructor(
    private preferences: PreferencesService
  ) {
    const savedPref = this.preferences.getPreferences();
    this.seen = savedPref.seen;
    this.favorites = savedPref.favorites;
    this.preferences.valueChanges.subscribe(pref => {
      if (!pref) return;
      if (pref.seen) this.seen = pref.seen;
      if (pref.favorites) this.favorites = pref.favorites;
    });
  }

  get visible() {
    return this.listings.filter(listing => this.isVisible(listing));
  }

  isSeen(listing: CommonListing) {
    return this.seen.includes(listing.id);
  }

  isFavorite(listing: CommonListing) {
    return this.favorites.includes(listing.id);
  }

  isVisible(listing: CommonListing) {
    if (!this.hideSeen) return true;
    if (!this.seen.includes(listing.id)) return true;
    if (this.favorites.includes(listing.id)) return true;
    return false;
  }

  get index() {
    this.updateIndex();
    return this._index;
  }

  get listing() { return this.visible[this.index] }

  get showNextBtn() { return this._index < this.visible.length - 1; }
  get showPrevBtn() { return this._index > 0; }

  onNext() {
    this._index++;
  }

  onPrev() {
    this._index--;
  }

  onListingClicked(listing: CommonListing) {
    this.listingClicked.next(listing);
    if (this.seen.includes(listing.id)) return;
    // if (listing.seen) return;
    // listing.seen = true;
    // const savedSeenJson = localStorage.getItem('seen');
    // const savedSeen = savedSeenJson ? JSON.parse(savedSeenJson) as string[] : [ ];
    // if (savedSeen.includes(listing.id)) return;
    // savedSeen.push(listing.id);
    // const toSave = JSON.stringify(savedSeen);
    // localStorage.setItem('seen', toSave);
    this.seen.push(listing.id);
    this.preferences.save('seen', this.seen);
    this.updateIndex();
  }

  getPublicationTimeInDays(listing: CommonListing) {
    if (!listing.lastPublicationDate) return;
    const timeDifference = Date.now() - listing.lastPublicationDate.getTime();
    return Math.round(timeDifference / (24 * 60 * 60 * 1000));
  }

  private updateIndex() {
    const vis = this.visible;
    if (this._index < 0) {
      this._index = 0;
    } else if(vis.length && this._index > vis.length - 1) {
      this._index = vis.length - 1;
    }
  }

}
