import { environment } from '../../environments/environment';
import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import * as mapboxgl from 'mapbox-gl';
import MapboxDirections from '@mapbox/mapbox-gl-directions/dist/mapbox-gl-directions';
import MapboxTraffic from '@mapbox/mapbox-gl-traffic';
import { GeojsonService } from '../services/geojson.service';
import { map, withLatestFrom } from 'rxjs/operators';
import { AngularFireDatabase } from '@angular/fire/database';

@Component({
  selector: 'app-map',
  templateUrl: './map.component.html',
  styleUrls: ['./map.component.css']
})

export class MapComponent implements OnInit {

  //map settings
  map: mapboxgl.Map;
  style = 'mapbox://styles/mapbox/streets-v11';
  lat = 1.346170;
  lng = 103.898630;
  // map data
  source: any;
  retrievedData: any;
  toggleableLayerIds = new Array;
  selectedTasks = {};

  constructor(private db: AngularFireDatabase, private geoJsonService: GeojsonService) {
  }

  ngOnInit() {
    this.buildMap();
  }

  buildMap() {
    Object.getOwnPropertyDescriptor(mapboxgl, "accessToken").set(environment.mapbox.accessToken);
    this.map = new mapboxgl.Map({
      container: 'map',
      style: this.style,
      zoom: 13,
      center: [this.lng, this.lat]
    });

    // Add map controls
    var directions = new MapboxDirections({
      accessToken: environment.mapbox.accessToken
    });
    this.map.addControl(directions, 'top-right');
    this.map.addControl(new mapboxgl.NavigationControl(), 'bottom-right');

    // Initialize the GeolocateControl.
    const geolocate = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      trackUserLocation: true
    });
    // Add the control to the map.
    this.map.addControl(geolocate, 'bottom-right');
    this.map.addControl(new MapboxTraffic(), 'bottom-right');
    // Set an event listener that fires when a geolocate event occurs.
    function success(pos) {
      directions.setOrigin([pos.coords.longitude, pos.coords.latitude]);
    }
    geolocate.on('geolocate', success);
    this.map.on('load', () => {
      this.retrieveData();
    });
    directions.on('route', () => {
      this.directionToggle();
    });
  }

  // Toggle Data visibility and retrieve data from firebase
  retrieveData() {
    this.geoJsonService.getAll().snapshotChanges().pipe(
      map(changes =>
        changes.map(c =>
          ({ key: c.payload.key, ...c.payload.val() })
        )
      )
    ).subscribe(data => {
      this.retrievedData = data;
      this.retrievedData.forEach(e => {
        this.toggleableLayerIds.push(e.key);
        //Turn retrieved data into map Data Source and Layers
        this.map.addSource(e.key, {
          type: 'geojson',
          data: {
            "type": e.type,
            "features": e.features
          }
        });
        this.map.addLayer({
          'id': e.key,
          'type': 'fill',
          'source': e.key,
          'paint': {
            'fill-color': e.layerColor,
            'fill-opacity': 0.4
          },
          'filter': ['==', '$type', 'Polygon'],
          'layout': {
            // Make the layer visible by default.
            'visibility': 'visible'
          },
        });
        this.map.addLayer({
          'id': e.key + 'Point',
          'type': 'circle',
          'source': e.key,
          'paint': {
            'circle-radius': 4,
            'circle-color': e.layerColor,
          },
          'filter': ['==', '$type', 'Point'],
          'layout': {
            // Make the layer visible by default.
            'visibility': 'visible'
          },
        });
        this.map.addLayer({
          'id': e.key + 'Line',
          'type': 'line',
          'source': e.key,
          'paint': {
            'line-color': e.layerColor,
            'line-width': 2
          },
          'filter': ['==', '$type', 'LineString'],
          'layout': {
            'line-join': 'round',
            'line-cap': 'round',
            // Make the layer visible by default.
            'visibility': 'visible'
          },
        });

        // Create a popup, but don't add it to the map yet.
        const popup = new mapboxgl.Popup({
          closeButton: false,
          closeOnClick: false
        });

        //Map layer hover

        this.map.on('mouseenter', e.key, (f) => {
          this.map.getCanvas().style.cursor = 'pointer';
          // Populate the popup and set its coordinates based on the feature found.
          popup.setLngLat(f.lngLat).setHTML(e.key).addTo(this.map);
        });
        this.map.on('mouseenter', e.key + 'Point', (f) => {
          this.map.getCanvas().style.cursor = 'pointer';
          // Populate the popup and set its coordinates based on the feature found.
          popup.setLngLat(f.lngLat).setHTML(e.key).addTo(this.map);
        });
        this.map.on('mouseenter', e.key + 'Line', (f) => {
          this.map.getCanvas().style.cursor = 'pointer';
          // Populate the popup and set its coordinates based on the feature found.
          popup.setLngLat(f.lngLat).setHTML(e.key).addTo(this.map);
        });
        this.map.on('mouseleave', e.key, () => {
          this.map.getCanvas().style.cursor = '';
          popup.remove();
        });
        this.map.on('mouseleave', e.key + 'Point', () => {
          this.map.getCanvas().style.cursor = '';
          popup.remove();
        });
        this.map.on('mouseleave', e.key + 'Line', () => {
          this.map.getCanvas().style.cursor = '';
          popup.remove();
        });

      });
    });
  }

  openNav() {
    document.getElementById("sideNavigation").style.width = "250px";
  }

  closeNav() {
    document.getElementById("sideNavigation").style.width = "0";
  }

  directionToggle() {
    var toggleElement = document.createElement("Button");
    toggleElement.innerHTML = "Toggle Directions";
    toggleElement.style.backgroundColor="#fff";
    toggleElement.onclick = function () {
      document.querySelector('.mapbox-directions-instructions').id = 'mapbox-directions-instructions';
      let directionValue: string = document.getElementById("mapbox-directions-instructions").style.display;
      if (directionValue !== "none") {
        document.getElementById("mapbox-directions-instructions").style.display = "none";
      } else {
        document.getElementById("mapbox-directions-instructions").style.display = "block";
      };
    };
    document.querySelector('.mapbox-directions-route-summary').id = 'mapbox-directions-route-summary';
    document.getElementById('mapbox-directions-route-summary').appendChild(toggleElement)
  }

  downloadFile(key) {
    let fileName = key;
    this.db.database.ref("geojson/").child(key).once("value", (key) => {
      this.geoJsonService.download(fileName, key.val());
    });
  }

  flyTo(retrieveData) {
    if (retrieveData.features[0].geometry.type == "Point") {
      this.map.flyTo({
        center: retrieveData.features[0].geometry.coordinates
      });
    } else if (retrieveData.features[0].geometry.type == "LineString") {
      this.map.flyTo({
        center: retrieveData.features[0].geometry.coordinates[0]
      });
    } else if (retrieveData.features[0].geometry.type == "Polygon") {
      this.map.flyTo({
        center: retrieveData.features[0].geometry.coordinates[0][0]
      });
    };
  }

  toggleVisibility(key) {
    var visibility = this.map.getLayoutProperty(key, 'visibility');
    console.log(this.retrievedData);
    if (visibility === 'visible') {
      this.selectedTasks[key] = true;
      this.map.setLayoutProperty(key, 'visibility', 'none');
      this.map.setLayoutProperty(key + 'Point', 'visibility', 'none');
      this.map.setLayoutProperty(key + 'Line', 'visibility', 'none');
    } else {
      this.selectedTasks[key] = false;
      this.map.setLayoutProperty(key, 'visibility', 'visible');
      this.map.setLayoutProperty(key + 'Point', 'visibility', 'visible');
      this.map.setLayoutProperty(key + 'Line', 'visibility', 'visible');
    };
  }

  deleteData(key) {
    this.geoJsonService.delete(key).subscribe(() => {
      this.retrievedData.splice(this.retrievedData.findIndex(function (i) {
        return i.key === key;
      }), 1);
      //Remove source and layers
      this.map.removeLayer(key);
      this.map.removeLayer(key + 'Point');
      this.map.removeLayer(key + 'Line');
      this.map.removeSource(key);
      console.log('Deleted' + key);
    });
  }
}
