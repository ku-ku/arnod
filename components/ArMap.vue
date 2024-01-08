<template>
    <div class="ar-map">
        <div id="map" class="ar-map__map"></div>
        <v-btn v-if="coords.length > 0"
               class="a-b"
               position="absolute"
               icon
               size="small"
               :color="(ab) ? ('A'==ab) ? 'red-accent-4' : ('B'==ab) ? 'green-darken-2' : 'orange-darken-4' : undefined"
               v-on:click="gomap">
            <v-icon v-show="!ab">mdi-target</v-icon>
            <v-icon v-show="'V'===ab">mdi-truck-outline</v-icon>
            {{ ( !!ab && 'V'!==ab) ? ab : null }}
        </v-btn>
    </div>    
</template>

<script>
import 'ol/ol.css';
import {Map, View} from 'ol';
import Collection from 'ol/Collection.js';
import {Tile as TileLayer, Vector as VectorLayer} from 'ol/layer';
import {OSM, Vector as VectorSource} from 'ol/source';
import LineString from 'ol/geom/LineString';
import Feature from 'ol/Feature';
import Point from 'ol/geom/Point';
import {Circle as CircleStyle, Fill, Stroke, Style, Icon, Text, RegularShape} from 'ol/style';
import * as olExtent from 'ol/extent';
import Translate from 'ol/interaction/Translate.js';
import { geo } from "app-ext/composables/geo";
import * as turf from '@turf/turf';



const _DEF_COORDS = [
    38.977, 45.035
];

const _MAP_ICONS = {
        STARTING:'/map-images/map-a.png',
        ENDING:  '/map-images/map-b.png',
        TRUCK:   '/map-images/truck.png',
        POINT:   '/map-images/point.png'
};


const _routeStyle = feature => {
    const props = feature.getProperties();
    const { color } = props;
    
    //line
    const styles = [
        new Style({
            stroke: new Stroke({
                color: color,
                lineJoin: "bevel",
                width: 4
            })
        }),
        new Style({
                    geometry: new Point(feature.getGeometry().getFirstCoordinate()),
                    image: new Icon({
                        src: _MAP_ICONS.STARTING,
                        scale: [0.3, 0.3],
                        anchorOrigin: 'bottom-left',
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        anchor: [20, 12],
                        rotateWithView: true
                    })
                }),
        new Style({
                    geometry: new Point(feature.getGeometry().getLastCoordinate()),
                    image: new Icon({
                        src: _MAP_ICONS.ENDING,
                        scale: [0.3, 0.3],
                        anchorOrigin: 'bottom-left',
                        anchorXUnits: 'pixels',
                        anchorYUnits: 'pixels',
                        anchor: [20, 12],
                        rotateWithView: true
                    })
                })
    ];
    
    return styles;
};  //_routeStyle

const _truckStyle = feature => {
    if (!geo.coords.error){
        return new Style({
            geometry: new Point([geo.coords.longitude, geo.coords.latitude]),
            image: new Icon({
                        src: _MAP_ICONS.TRUCK,
                        scale: [0.6, 0.6],
                        rotateWithView: false
                    })
        });
    }
    return undefined;
};

const _centerStyle = feature => {
    return new Style({
                    geometry: new Point(feature.getGeometry().getCoordinates()),
                    image: new Icon({
                        src: _MAP_ICONS.POINT,
                        scale: [0.3, 0.3],
                        anchorOrigin: 'bottom-left',
                        anchor: [0.5, 0],
                        rotateWithView: true
                    })
                })    
};  //_centerStyle

export default {
    name: "ArMap",
    props: {
        route: {
            type: Object,
            required: true,
            default: null
        },
        center: {
            type: Object,
            required: false,
            default: null
        },
        showCenter: {
            type: Boolean,
            required: false,
            default: false
        },
        moveCenter: {
            type: Boolean,
            required: false,
            default: false
        }
    },
    emits: ['distance', 'coords', 'address'],
    data(){
        return {
            map: null,
            ab: null
        };
    },
    mounted(){
        const config = useRuntimeConfig();
        if (config.app.baseURL.length > 1){
            Object.keys(_MAP_ICONS).forEach( async k => {
                try {
                    // @vite-ignore 
                    _MAP_ICONS[k] = config.app.baseURL + _MAP_ICONS[k];
                } catch(e) {
                    console.log('ERR(image load)', e);
                }
            });
        }
        this.$nextTick(this.initMap);
    },
    computed: {
        coords(){
            if (this?.route?.geometry){
                return this.route.geometry.coordinates;
            } else {
                return [];
            }
        }
    },
    methods: {
        initMap(){
            const target = $(this.$el).find("#map").get(0);
            
            const map = new Map({
                target,
                layers: [
                  new TileLayer({
                    source: new OSM()
                  })
                ],
                controls: [],
                view: new View({
                    projection: 'EPSG:4326',
                    center: this.center || _DEF_COORDS,
                    zoom: 9,
                    enableRotation: false,
                    constrainResolution: true
                })
            });
            
            map.on('error', e => {
                console.log('ERR (map init)', e);
            });
            
            this.map = map;
            
            this.drawRoute();
            
            if (this.showCenter){
                this.drawCenter();
            }
        },
        _routeStyle(feature){
            const props = feature.getProperties();
            const { color } = props;
            //line
            const styles = [
                new Style({
                    stroke: new Stroke({
                        color: color,
                        lineJoin: "bevel",
                        width: 8
                    })
                })
            ];
            
            return styles;
        },  //_routeStyle
        _getLayer(name){
            let layer = null;
            this.map?.getLayers().forEach( l => {
                if ( name === l.get('name') ){
                    layer = l;
                }
            });
            if ((this.map) && ( !layer )){
                layer = new VectorLayer();
                layer.set('name', name);
                this.map.addLayer(layer);
            }
            return layer;
        },  //_getLayer
        drawRoute(){
            if (this.coords.length < 1){
                console.log('map: no coords for route', this.route);
                return;
            }
            console.log('map: route', this.route);
            
            let line = this._getLayer("route-layer");
            line.setStyle( _routeStyle );
            let source = new VectorSource();
            source.addFeature(
                    new Feature({   
                                geometry: new LineString(this.coords),
                                color: "#8BC34A"
                    })
            );
            line.setSource(source);
            const bounds = source.getExtent();
            if ( !olExtent.isEmpty(bounds) ){
                const view = this.map.getView();
                view.setCenter(olExtent.getCenter(bounds));
                view.fit(bounds, {padding: [20, 20, 20, 20]});
            } else {
                console.log('empty extent from source', source);
            }
            this.map.updateSize();
            
            if ( geo.coords.timestamp > 0 ){
                let truck = this._getLayer("truck-layer");
                source = truck.getSource();
                if (!source){
                    source = new VectorSource();
                    truck.setSource(source);
                }
                source.addFeature(
                        new Feature({   
                                    geometry: new Point([geo.coords.longitude, geo.coords.latitude]),
                        })
                );
                truck.setStyle( _truckStyle );
                setTimeout(()=>{
                    let pt = turf.point(truck.getSource().getFeatures().at(0).getGeometry().getCoordinates()),
                      _line = turf.lineString(line.getSource().getFeatures().at(0).getGeometry().getCoordinates());
                    console.log('point/line', pt, _line);
                    let distance = turf.pointToLineDistance(pt, _line);
                    console.log('distance', distance);
                    this.$emit('distance', distance);
                }, 300);
            }
        },   //drawRoute
        drawCenter(zoom = true){
            const center = (Array.isArray(this.center) && this.center.at(0)) ? this.center : _DEF_COORDS;
            console.log('center', this.center, center);
            let layer = this._getLayer("center-layer");
            if ( !layer ){
                return false;
            }
            layer.setStyle( _centerStyle );
            
            let marker, source = layer.getSource();
            if ( !source ){
                source = new VectorSource();
                layer.setSource(source);
                marker = new Feature({   
                                    geometry: new Point(center)
                        });
                marker.setId("map-center-marker");
                source.addFeature(marker);
                if ( this.moveCenter ){
                    let translate = new Translate({
                        features: new Collection([marker])
                    });
                    translate.on('translateend', e => {
                        this.$emit("coords", e.coordinate);
                        this.getaddr(e.coordinate);
                    });
                    this.map.addInteraction(translate);
                }
            } else {
                marker = source.getFeatureById("map-center-marker");
                marker.getGeometry().setCoordinates(center);
            }
            
            const view = this.map.getView();
            if (view){
                view.setCenter(center);
                if (zoom){
                    view.setZoom(13);
                }
            }
        },  //drawCenter
        gomap(){
            let point;
            if (!this.ab){
                this.ab = 'A';
                point = this.coords[0];
            } else if ('A'===this.ab){
                this.ab = 'B';
                point = this.coords[this.coords.length - 1];
            } else if (('B' === this.ab) && (geo.coords.timestamp>0)){
                this.ab = 'V';
                point = [geo.coords.longitude, geo.coords.latitude];
            } else {
                this.ab = null
            }
            const view = this.map.getView();
            if (point){
                view.animate({zoom: 17, center: point, duration: 600});
            } else {
                const layer = this._getLayer("route-layer");
                const source = layer.getSource();
                const bounds = source?.getExtent();
                if ( !olExtent.isEmpty(bounds) ){
                    view.fit(bounds, {
                        padding: [20, 20, 20, 20],
                        callback: ()=>{
                            view.setCenter(olExtent.getCenter(bounds));
                        }
                    });
                }
            }
        },   //gomap
        getaddr(ll){
            if ( Array.isArray(ll) ) {
                $.getJSON(`https://nominatim.openstreetmap.org/reverse?format=json&lon=${ ll.at(0) }&lat=${ ll.at(1) }&zoom=18&addressdetails=1`)
                        .then(res => {
                            console.log('address', res);
                            this.$emit('address', res.display_name);
                        })
                        .catch( e => {
                            console.log('ERR (addr)', e);
                        });
            }
        }   //addr
    },
    watch: {
        center(val){
            if ( Array.isArray(val) ){
                setTimeout(()=>{ this.drawCenter(false); }, 555);
            }
        },
        route(val){
            if (val){
                setTimeout(this.drawRoute, 555);
            }
        }
    }
};
</script>
<style lang="scss" scoped>
    .ar-map{
        height: 100%;
        position: relative;
        &__map{
            height: 100%;
        }
        & .a-b{
            z-index: 1001;
            right: 1rem;
            bottom: 1.5rem;
            font-size: 1rem;
        }
        & canvas, & img {
            image-rendering: optimizeQuality;
            image-rendering: -moz-crisp-edges;
            image-rendering: -webkit-optimize-contrast;
            image-rendering: optimize-contrast;
            -ms-interpolation-mode: nearest-neighbor;
        }        
    }
</style>