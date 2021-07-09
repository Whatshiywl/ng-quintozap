import { Component } from '@angular/core';
import { ZapListing, ZapService } from './zap.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  title = 'ng-quintozap';
  listings!: ZapListing[];

  constructor(
    private zapService: ZapService
  ) { }

  onBoundsChanged(map: google.maps.Map<Element>) {
    const center = map.getCenter().toJSON();
    const bounds = map.getBounds()?.toJSON();
    console.log('center', center);
    console.log('bounds', bounds);
    this.zapService.getZap(center).subscribe(result => {
      const withPoint = result.filter(el => el.listing.address.point);
      console.log(withPoint);
      this.listings = withPoint;
    });
  }
}
