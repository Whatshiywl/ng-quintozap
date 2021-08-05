import { Injectable } from "@angular/core";
import { AngularFireAuth } from "@angular/fire/auth";
import { AngularFirestore, AngularFirestoreCollection } from "@angular/fire/firestore";
import { Subject, Subscription } from "rxjs";
import { first } from "rxjs/operators";
import { Filter } from "./app.component";
import { FirebaseUser } from "./auth/auth.service";

export interface Preferences {
  autoSearch: boolean,
  hideSeen: boolean,
  mapOptions: google.maps.MapOptions,
  filters: Filter,
  seen: string[],
  favorites: string[]
}

@Injectable()
export class PreferencesService {
  readonly valueChanges: Subject<Preferences> = new Subject<Preferences>();
  private collection: AngularFirestoreCollection<Preferences>;
  private prefSubscription!: Subscription;

  constructor (
    private auth: AngularFireAuth,
    private store: AngularFirestore
  ) {
    this.collection = this.store.collection<Preferences>('qz-preferences');

    this.auth.user.subscribe(user => {
      if (this.prefSubscription) this.prefSubscription.unsubscribe();
      if (user) {
        console.log('subscribe to preferences')
        this.prefSubscription = this.collection.doc(user.uid).valueChanges().subscribe(pref => {
          const savedPref = this.getPreferences();
          pref = { ...savedPref, ...pref };
          for (const key in pref) {
            const toSave = pref[key as keyof Preferences];
            localStorage.setItem(key, JSON.stringify(toSave));
          }
          this.valueChanges.next(pref);
        });
        this.registerUserIfNew(user).catch(err => {
          console.error(err);
        });
      } else {
        this.valueChanges.next(this.getPreferences());
      }
    });
  }

  registerUserIfNew(user: FirebaseUser) {
    return new Promise<void>(async (resolve, reject) => {
      const { uid } = user;
      this.collection.doc(uid).get().pipe(first()).subscribe(snapshot => {
        if (snapshot.exists) return resolve();
        const preferences = this.getPreferences();
        this.collection.doc(uid).set(preferences)
        .then(resolve)
        .catch(reject);
      });
    });
  }

  save<K extends keyof Preferences, V extends Preferences[K]>(key: K, value: V) {
    const toSave = JSON.stringify(value);
    localStorage.setItem(key, toSave);
    this.auth.user.pipe(
      first()
    ).subscribe(user => {
      if (!user) return;
      const data: Partial<Preferences> = { };
      data[key] = value;
      this.collection.doc(user.uid).update(data);
    });
  }

  getPreferences(): Preferences {
    const autoSearch = localStorage.getItem('autoSearch') || 'true';
    const hideSeen = localStorage.getItem('hideSeen') || 'true';
    const mapOptions = localStorage.getItem('mapOptions');
    const filters = localStorage.getItem('filters');
    const seen = localStorage.getItem('seen');
    const favorites = localStorage.getItem('favorites');
    return {
      autoSearch: JSON.parse(autoSearch),
      hideSeen: JSON.parse(hideSeen),
      mapOptions: mapOptions ? JSON.parse(mapOptions) : {
        center: { lat: -22.947852563718513, lng: -43.30149955088697 },
        mapTypeId: 'roadmap',
        zoom: 12
      },
      filters: filters ? JSON.parse(filters) : {
        minPrice: 0,
        maxPrice: 100000,
        maxArea: 0,
        minArea: 10000
      },
      seen: seen ? JSON.parse(seen) : [ ],
      favorites: favorites ? JSON.parse(favorites) : [ ]
    };
  }

}
