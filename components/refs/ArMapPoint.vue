<template>
    <teleport to="body">
        <ar-map-chooser ref="chooser" 
                        v-on:success="onpoint" />
    </teleport>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon v-if="loadType">mdi-arrow-down-bold-box-outline</v-icon>
                <v-icon v-else>mdi-arrow-up-bold-box-outline</v-icon>
                &nbsp;{{ loadType ? 'ПОГРУЗКА' : 'ВЫГРУЗКА' }}
                &nbsp;({{ pointId > 0 ? 'редактирование' : 'добавление' }})
            </v-toolbar-title>
        </v-toolbar>
        <v-form ref="form"
                v-on:submit.stop.prevent="save">
            <v-card rounded="0"
                    :loading="pending">
                <v-card-text class="pb-5">
                    <v-row>
                        <v-col cols="8">
                            <v-row dense>
                                <v-col cols="12">
                                    <jet-input-string v-model="item.title"
                                                      label="Наименование"
                                                      type="text"
                                                      required />
                                </v-col>
                            </v-row>
                            <v-row dense>
                                <v-col cols="12">
                                    <jet-input-string v-model="coords"
                                                      label="координаты"
                                                      type="text"
                                                      required />
                                </v-col>
                            </v-row>
                            <v-row dense>
                                <v-col cols="12">
                                    <jet-input-string v-model="item.comment"
                                                      type="text"
                                                      label="примечание" />
                                </v-col>
                            </v-row>
                        </v-col>
                        <v-col cols="4" style="position:relative;">
                            <ar-map :center="[item.lon, item.lat]"
                                    show-center
                                    :route="{}" />
                            <v-btn position="absolute"
                                   elevation="2"
                                   style="right:1.25rem;bottom:1.25rem;"
                                   size="x-small"
                                   variant="elevated"
                                   icon="mdi-arrow-expand"
                                   v-on:click="openPoint"></v-btn>
                        </v-col>
                    </v-row>
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn size="small"
                           variant="elevated"
                           prepend-icon="mdi-close"
                           v-on:click="show = false">
                        закрыть
                    </v-btn>
                    <v-btn size="small"
                           type="submit"
                           variant="elevated"
                           color="primary"
                           append-icon="mdi-send"
                           :loading="pending">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
</template>
<script>
import { computed } from "vue";
import { empty } from "app-ext/utils";
import JetInputString from "app-ext/components/editors/JetInputString";
import ArMap from "~/components/ArMap";
import ArMapChooser from "~/components/ArMapChooser";

const _DEFS = {
    id: 0,
    lat: 0,
    lon: 0,
    title: null,
    comments: null,
    coords: null
};

export default {
    name: 'ArMapPoint',
    emits: ['success'],
    components: {
        JetInputString,
        ArMap,
        ArMapChooser
    },
    async setup(){
        const show     = ref(false),
              loadType = ref(true),
              pointId  = ref(0),
              form     = ref(null),
              item     = ref({..._DEFS});
        
        const { pending } = useAsyncData('ar-map-point', async ()=>{
            let res;
            
            if (pointId.value > 0){
                res = await $jet.api({
                    url: loadType.value ? `/loading_points/${pointId.value}` : `/unloading_points/${pointId.value}`
                });
                if (res.success){
                    res = res.result;
                }
            } else {
                res = { ..._DEFS };
            }
            
            item.value = res;
            
            return true;
        });
        
        
        const coords = computed(({
            get(){
                const s = `${ item.value.lon || '-' }, ${ item.value.lat || '-' }`;
                return s;
            },
            set(val){
                const c = val?.split(/,+\s{0,}/);
                if ( Array.isArray(c) ){
                    item.value.lon = Number.parseFloat( c.at(0) );
                    item.value.lat = Number.parseFloat( c.at(1) );
                } else {
                    item.value.lon = null;
                    item.value.lat = null;
                }
            }
        }));
        
        return {
            show,
            loadType,
            pointId,
            item,
            coords,
            form,
            pending
        };
    },
    methods: {
        open(id, load = true){
            this.pointId = id;
            this.loadType= load;
            this.show = true;
            refreshNuxtData('ar-map-point');
        },
        openPoint(){
            this.$refs["chooser"].open({
                center: [this.item.lon, this.item.lat],
                name: this.item.title
            });
        },
        onpoint(point){
            this.item.title = point.addr;
            this.item.lon   = point.center.at(0);
            this.item.lat   = point.center.at(1);
        },
        async save(){
            this.pending = true;
            let url = this.loadType ? '/loading_points' : '/unloading_points';
            if ( this.item.id > 0 ){
                url += '/' + this.item.id;
            }
            const opts = {
                url,
                method: ( this.item.id > 0 ) ? 'PUT' : 'POST',
                body: this.item
            };
            try {
                let res = await $jet.api(opts);
                if (res.success){
                    this.pointId = res.result.id;
                    await refreshNuxtData("ar-map-point");
                    this.$emit("success", this.item);
                    this.show = false;
                }
            } catch(e){
                $jet.msg({
                    text: `Ошибка сохранения изменений: ${ e.message }`,
                    color: 'warning'
                });
            } finally {
                this.pending = false;
            }
        }
    }
}    
</script>