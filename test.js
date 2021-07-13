const { interval, Observable } = require("rxjs");
const { takeWhile, map, tap, switchMap } = require("rxjs/operators");

const mock = [
  300, 300, 300, 190
];

function getValue(i) {
  return new Observable(subscriber => {
    subscriber.next(mock[i]);
  });
}

const source = interval(1000)
.pipe(
  tap(i => console.log(i)),
  switchMap(val => getValue(val)),
  takeWhile(result => result === 300, true)
);

let subs = source.subscribe(result => console.log(result));

setTimeout(_ => {
  console.log('reset');
  subs.unsubscribe();
  subs = source.subscribe(result => console.log(result));
}, 4000);
