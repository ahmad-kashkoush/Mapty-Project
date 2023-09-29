'use strict';

// prettier-ignore
const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const form = document.querySelector('.form');
const containerWorkouts = document.querySelector('.workouts');
const inputType = document.querySelector('.form__input--type');
const inputDistance = document.querySelector('.form__input--distance');
const inputDuration = document.querySelector('.form__input--duration');
const inputCadence = document.querySelector('.form__input--cadence');
const inputElevation = document.querySelector('.form__input--elevation');
class Workout {
    #distance; #duration;
    #coords;
    #date = new Date();
    #id = (Date.now() + '').slice(-10);
    constructor(options) {
        this.#distance = options.distance ?? 0;
        this.#duration = options.duration ?? 0;
        this.#coords = options.coords ?? [30, 30];// [lat, lng]

    }

    get dateFormatted() {
        const dateOptions = {
            day: 'numeric',
            month: 'long'
        }
        return new Intl.DateTimeFormat("en-US", dateOptions).format(this.date)

    }
    _setDescreption() {
        this.descreption = `${this.capitalized} on ${this.dateFormatted}`;
    }
    get capitalized() {
        return this.name.replace(this.name[0], this.name[0].toUpperCase())
    }
    get duration() { return this.#duration; }
    get distance() { return this.#distance; }
    get coords() { return this.#coords; }
    get date() { return this.#date; }

};
class Running extends Workout {
    #name; #cadence;
    #pace;
    constructor(options) {
        super(options);
        this.#name = options.name ?? 'running';
        this.#cadence = options.cadence ?? 0;
        this.calcPace();
        this._setDescreption();
    }
    calcPace() {
        this.#pace = this.duration / this.distance;
        return Number(this.#pace).toFixed(2);
    }
    // get capitalized() {
    //     return this.name.replace(this.name[0], this.name[0].toUpperCase())
    // }

    get name() { return this.#name; }
    get cadence() { return this.#cadence; }

};

class Cycling extends Workout {
    #name; #elevationGain;
    #speed;
    constructor(options) {
        super(options);
        this.#name = options.name ?? 'cycling';
        this.#elevationGain = options.elevationGain;
        this.calcSpeed();
        this._setDescreption();
    }

    // get capitalized() {
    //     return this.name.replace(this.name[0], this.name[0].toUpperCase())
    // }
    calcSpeed() {
        this.#speed = this.distance / (this.duration / 60);
        return this.#speed;
    }
    get name() { return this.#name; }
    get elevationGain() { return this.#elevationGain; }

};
const runOptions = {
    distance: 10,
    duration: 60,
    cadence: 60,

}
const run = new Running(runOptions);
console.log(run);
const cycleOptions = {
    distance: 50,
    duration: 60,
    elevationGain: 40
}


const cycle = new Cycling(cycleOptions);
console.log(cycle);
class App {
    #map;
    #mapEvent;
    #workouts = [];
    constructor() {
        this._getPosition();
        form.addEventListener('submit', this._newWorkout.bind(this));
        inputType.addEventListener('change', this._changeFields.bind(this));
    }
    _getPosition() {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                // It is a callback, which doesn't need an argument
                this._loadMap.bind(this),
                function () {
                    console.log("The second funciton will be used if the first didn't apply");
                }
            );
        }
    }



    _loadMap(position) {
        const coordinates = [position.coords.latitude, position.coords.longitude];
        // Getting the map From leaflet
        this.#map = L.map('map').setView(coordinates, 13);

        L.tileLayer('https://tile.openstreetmap.fr/hot/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        }).addTo(this.#map);

        L.marker(coordinates).addTo(this.#map)
            .bindPopup('A pretty CSS popup.<br> Easily customizable.')
            .openPopup();
        // to identify the click coords in the map
        this.#map.on('click', this._showForm.bind(this));

    }
    _showForm(mapE) {
        this.#mapEvent = mapE;
        form.classList.remove('hidden');
        inputDistance.value = inputDuration.value = inputCadence.value = '';
        inputDistance.focus();
    }

    _changeFields(e) {
        // change field based on type
        //  he has done it using toggeling
        // But I think it's better to keep it as generic as possible
        e.preventDefault();
        if (inputType.value.toLowerCase() === 'cycling') {
            inputElevation.closest('.form__row').classList.remove('form__row--hidden');
            inputCadence.closest('.form__row').classList.add('form__row--hidden');
        } else if (inputType.value.toLowerCase() === 'running') {
            inputElevation.closest('.form__row').classList.add('form__row--hidden');
            inputCadence.closest('.form__row').classList.remove('form__row--hidden');
        }

    }
    _newWorkout(e) {
        e.preventDefault();
        //  get addicted to creating helper functions
        const valid = (...inputs) => (inputs.every(inp => Number.isFinite(inp)));
        const allPositive = (...inputs) => (inputs.every(inp => inp > 0));
        // get data from fields
        const type = inputType.value.toLowerCase();
        const distance = +inputDistance.value;
        const duration = +inputDuration.value;
        let workout;
        const { lat, lng } = this.#mapEvent.latlng;
        if (type === 'running') {
            const cadence = +inputCadence.value;
            if (!valid(distance, duration, cadence) || !allPositive(distance, duration, cadence)) return alert('All inputs must be positive numbers ⚠️');
            workout = new Running({
                coords: [lat, lng],
                distance: distance,
                cadence: cadence,
                duration: duration
            });
        }
        if (type === 'cycling') {
            const elevationGain = +inputElevation.value;
            if (!valid(distance, duration, elevationGain) || !allPositive(distance, duration))
                return alert('All inputs must be positive numbers ⚠');
            workout = new Cycling({
                coords: [lat, lng],
                distance: distance,
                duration: duration,
                elevationGain: elevationGain
            });
        }

        this.#workouts.push(workout)
        this._renderWorkoutMarker(workout);
        this._renderWorkoutList(workout);

    }
    _renderWorkoutMarker(workout) {
        // display Marker
        const markerOptions = {
            autoClose: false,
            maxWidth: 250,
            maxHeight: 100,
            closeOnClick: false,
            className: `${workout.name}-popup`

        }
        let popUpContent = `${workout.name === 'running' ? '🏃' : '🚴'} ${workout.capitalized
            } on ${workout.dateFormatted} `;


        L
            .marker(workout.coords).addTo(this.#map)
            .bindPopup(L.popup(markerOptions)).setPopupContent(popUpContent)
            .openPopup();
    }

    _renderWorkoutList(workout) {

        let html = `
        <li class="workout workout--${workout.name}" data - id="1234567890" >
        <h2 class="workout__title">
            ${workout.descreption}
        </h2>
        <div class="workout__details">
          <span class="workout__icon">${workout.name === 'running' ? '🏃' : '🚴'}</span>
                <span span class="workout__value" > ${workout.distance}</span >
                    <span class="workout__unit">km</span>
        </div >
            <div class="workout__details">
                <span class="workout__icon">⏱</span>
                <span class="workout__value">${workout.duration}</span>
                <span class="workout__unit">min</span>
            </div>
        `;
        if (workout.name === 'cycling') {
            html += `
                <div class="workout__details">
                    <span class="workout__icon">⚡️</span>
                    <span class="workout__value">${workout.calcSpeed()}</span>
                    <span class="workout__unit">km/h</span>
                </div>
                <div class="workout__details">
                    <span class="workout__icon">⛰</span>
                    <span class="workout__value">${workout.elevationGain}</span>
                    <span class="workout__unit">m</span>
                </div>
          </li> 
        `
        } else {
            html += `
            <div class="workout__details">
                <span class="workout__icon">⚡️</span>
                <span class="workout__value">${workout.calcPace()}</span>
                <span class="workout__unit">min/km</span>
          </div>
          <div class="workout__details">
                <span class="workout__icon">🦶🏼</span>
                <span class="workout__value">${workout.cadence}</span>
                <span class="workout__unit">spm</span>
          </div>
        </li>
            `
        }
        containerWorkouts.insertAdjacentHTML('beforeend', html);
    }
}

const app = new App();
//  What I've Done is
// 1. I've written spaggettie code by 
// 2. I should've writen marker and map code at submit from event
