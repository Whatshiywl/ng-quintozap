import { Component, EventEmitter, Input, Output } from "@angular/core";
import { GoogleMap } from "@angular/google-maps";
import { CommonListing } from "../info/info.component";

@Component({
  selector: 'app-listings',
  templateUrl: './listings.component.html',
  styleUrls: ['./listings.component.scss']
})
export class ListingsComponent {
  @Input() listings: CommonListing[] = [ ];
  @Input() hideSeen = false;
  @Output() listingClicked: EventEmitter<CommonListing> = new EventEmitter<CommonListing>();
  private _index = 0;

  get visible() {
    return this.listings.filter(listing => {
      return !this.hideSeen || !listing.seen || listing.favorite;
    });
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
    if (listing.seen) return;
    listing.seen = true;
    const savedSeenJson = localStorage.getItem('seen');
    const savedSeen = savedSeenJson ? JSON.parse(savedSeenJson) as string[] : [ ];
    if (savedSeen.includes(listing.id)) return;
    savedSeen.push(listing.id);
    const toSave = JSON.stringify(savedSeen);
    localStorage.setItem('seen', toSave);
    this.updateIndex();
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
