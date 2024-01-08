<template>
    <teleport to="body">
        <ar-map-point ref="dlgPoint" 
                      v-on:success="reloadPoints" />
    </teleport>
    <v-dialog v-model="show"
              min-height="480"
              scrollable
              eager
              content-class="ar-route">
        <v-toolbar color="primary"
                   flat
                   density="compact">
            <v-toolbar-title>
                {{ route ? route.title : "Новое направление" }}
            </v-toolbar-title>
            <template v-slot:append>
                <v-btn rounded="0"
                       icon="mdi-close"
                       v-on:click="show = false"></v-btn>
            </template>
        </v-toolbar>
        <v-card rounded="0" class="pa-0" v-if="route">
            <v-card-text>
                <v-row>
                    <v-col cols="12" sm="4">
                        <div class="mb-3">
                            <v-text-field label="Наименование" 
                                          v-model="route.title"
                                          required />
                        </div>    
                        <div class="mb-5">
                            <v-autocomplete label="Пункт загрузки"
                                            v-model="route.loading_points_id"
                                            density="compact"
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            :items="loads"
                                            v-on:update:modelValue="reroute">
                                <template v-slot:append>
                                    <v-btn size="small"
                                           flat
                                           rounded="0"
                                           icon="mdi-dots-vertical"
                                           v-on:click="openPoint(true)"></v-btn>
                                </template>
                            </v-autocomplete>
                        </div>    
                        <div class="mb-5">
                            <v-autocomplete label="Пункт выгрузки"
                                            v-model="route.unloading_points_id"
                                            density="compact"
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            :items="unloads"
                                            v-on:update:modelValue="reroute">
                                <template v-slot:append>
                                    <v-btn size="small"
                                           flat
                                           rounded="0"
                                           icon="mdi-dots-vertical"
                                           v-on:click="openPoint(false)"></v-btn>
                                </template>
                            </v-autocomplete>
                        </div>    
                        <div class="mb-5">
                            <v-text-field label="Расстояние, км" 
                                          v-model="route.distance"
                                          read-only />
                        </div>    
                        <v-btn size="small" 
                               flat
                               variant="tonal"
                               color="indigo"
                               v-on:click="reroute">
                            перестроить трассу маршрута
                        </v-btn>
                    </v-col>
                    <v-col cols="12" sm="8" style="min-height: 480px;">
                        <ar-map :route="route.route" 
                                ref="map" />
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="elevated"
                       size="small"
                       prepend-icon="mdi-close"
                       v-on:click="show = false">
                    закрыть
                </v-btn>
                <v-btn variant="elevated"
                       size="small"
                       color="primary"
                       :loading="pending"
                       append-icon="mdi-send"
                       v-on:click="save">
                    сохранить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script setup>
    import { ref, nextTick, defineEmits } from "vue";
    import ArMap from "./ArMap";
    import ArMapPoint from "./refs/ArMapPoint";
    import { refs } from "~/services/other";
    import * as turf from '@turf/turf';
    
    const emit = defineEmits(["success"]);
    
    const show   = ref(false),
          route  = ref(null),
          map    = ref(null),
          loads  = ref([]),
          unloads= ref([]),
          dlgPoint=ref(null);
  
    const { pending } = useAsyncData('route-loads', async ()=>{    
        try {
            if (loads.value.length < 1){
                loads.value = await refs('loading_points');
            }
            if (unloads.value.length < 1){
                unloads.value = await refs('unloading_points');
            }
            return true;
        } catch(e){
            console.log('ERR (refs)', e);
        }
        return true;
    });
    
    
    const open = r => {
        var r = r || {id: 0, loading_points_id: null, end: null, title: null};
        show.value  = true;
        route.value = r;
    };
    
    const reroute = ()=>{
        let n, start, end;
        if (route.value.loading_points_id){
            n = loads.value.findIndex( l => l.id === route.value.loading_points_id );
            if ( n > -1 ){
                start = loads.value[n];
            }
        }
        if (route.value.unloading_points_id){
            n = unloads.value.findIndex( l => l.id === route.value.unloading_points_id );
            if ( n > -1 ){
                end = unloads.value[n];
            }
        }
        
        if ( !( (start)&&(end) ) ){
            console.log(`No coords at ${ route.value.loading_points_id}/${route.value.unloading_points_id}`, route);
            return;
        }
        pending.value = true;
        $.ajax({
            url: `https://router.project-osrm.org/route/v1/truck/${ start.lon },${ start.lat };${ end.lon },${ end.lat }?overview=full&geometries=geojson`,
            timeout: 30000,
            cors: true
        }).then(res=>{
            console.log('coords', res);
            if ( !(res.routes?.length > 0) ){
                throw {message: 'координаты трассы не определены'};
            }
            route.value.route = res.routes.at(0);
            route.value.route.geometry = turf.simplify(route.value.route.geometry, {tolerance: 0.0001, highQuality: false});
            route.value.distance = Math.round(route.value.route.distance/1000);
            nextTick(map.value.drawRoute);
        }).catch(e=>{
            console.log('ERR route', e);
            $jet.msg({text: `Не удается перестроить трассу маршрута:<br />${ e.message||e.statusText }`, color: 'warning'});
        }).always(()=>{
            pending.value = false;
        });
    };  //reroute
    
    const save = async ()=>{
        const add = !(route.value.id > 0);
        if (
                (route.value.loading_points_id > 0)
             && (route.value.unloading_points_id > 0)
           ){
            pending.value = true;
            try {
                let res = await $jet.api({
                    url: add ? '/refs/move_directions' : `/refs/move_directions/${route.value.id}`,
                    method: add ? 'POST' : 'PUT',
                    body: {
                        title: route.value.title,
                        loading_points_id: route.value.loading_points_id,
                        unloading_points_id: route.value.unloading_points_id,
                        distance: route.value.distance
                    }
                });
                if ( res.result?.id > 0 ){
                    route.value.id = res.result.id;
                    emit('success', route.value);
                    show.value = false;
                }
            } catch(e) {
                console.log('ERR (save)', e);
                $jet.msg({text: `Ошибка сохранения маршрута:<br />${ e.message }<br />${ $jet.api.$errm }`, color: 'warning'});
            } finally {
                pending.value = false;
            }
            
        } else {
            $jet.msg({text: 'Не все поля заполнены', color: 'warning'});
        }
    };  //save
    
    defineExpose({ open });
    
    function openPoint(load){
        let id = load ? route.value.loading_points_id : route.value.unloading_points_id;
        dlgPoint.value.open(id, load);
    };  //openPoint
    
    async function reloadPoints(id){
        const load = dlgPoint.value.loadType;
        const a = ( load ) ? loads : unloads;
        a.value = [];
        await refreshNuxtData("route-loads");
        route.value[load ? "loading_points_id" : "unloading_points_id"] = null;
        setTimeout(()=>{
            route.value[load ? "loading_points_id" : "unloading_points_id"] = id;
        }, 100);
    };  //reload
    
</script>
<script>
export default {
    name: 'ArRoute'
}    
</script>