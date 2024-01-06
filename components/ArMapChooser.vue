<template>
    <v-dialog v-model="show"
              fullscreen>
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <app-search-input v-on:search="searchAddr" 
                                  hide-details
                                  label="поиск"
                                  :loading="pending"
                                  :value="addr" />
            </v-toolbar-title>
            <v-spacer />
            <v-btn prepend-icon="mdi-check"
                   v-on:click="choose">
                Выбрать
            </v-btn>
            <v-btn icon="mdi-close"
                   rounded="0"
                   v-on:click="show = false">
            </v-btn>
        </v-toolbar>
        <v-card class="fill-height">
            <v-card-text class="fill-height pa-0">
                <ar-map :route="{}"
                        :center="center"
                        show-center
                        move-center
                        v-on:coords="center = $event"
                        v-on:address="addr = $event"></ar-map>
            </v-card-text>
        </v-card>
    </v-dialog>
</template>
<script setup>
    import AppSearchInput from "app-ext/components/AppSearchInput";
    import ArMap from "~/components/ArMap";
    import { empty } from "app-ext/utils";    
    
    const $emit = defineEmits(['success']);
    
    const show =  ref(false),
          center= ref(null),
          addr  = ref(null),
          pending=ref(false);
    
    function open(point){
        //Point [lon, lat]
        center.value = point.center;
        //String
        addr.value   = point.name;
        show.value = true;
    }
    
    defineExpose({
        open
    });
    
    
    async function searchAddr(s){
        var s = s?.split(/,+\s{0,}/);
        if ( !Array.isArray(s) ){
            return;
        }
        pending.value = true;
        try {
            let params = new URLSearchParams();
            params.append('country', 'Россия');
            params.append('city', s.at(0));
            if (s.length > 2 ){
                params.append('street', `${ s.at(1) }, ${ s.at(2) }`);
            } else if (s.length > 1 ){
                params.append('street', s.at(1));
            } 
            params.append('format', 'jsonv2');
            params.append('accept-language', 'ru');
            params.append('countrycodes', 'ru');
            params.append('limit', '3');
            let res = await $.getJSON(`https://nominatim.openstreetmap.org/search?${ params.toString() }`, {
                crossDomain: true,
                timeout:5000
            });
            if (res?.length > 0){
                addr.value = res[0].display_name;
                center.value = [ res[0].lon, res[0].lat ];
            } else {
                throw {message: "адрес не существует"};
            }
        } catch(e){
            $jet.msg({
                text: `Не удалось распознать введенный адрес "${ s }": ${ e.message }`,
                color: 'warning'
            });
        } finally {
            pending.value = false;
        }
    }
    
    function choose(){
        $emit("success", {
            center: center.value,
            addr:   addr.value
        });
        show.value = false;
    }
    
</script>