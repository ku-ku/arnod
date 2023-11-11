<template>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title v-if="order">
                {{ order.number + '. ' + order.move_direction?.title }}
            </v-toolbar-title>
        </v-toolbar>
        <v-form ref="form"
                v-on:submit.stop.prevent="save">
            <v-card rounded="0"
                    :loading="pending">
                <v-card-text class="pb-5">
                    <v-row>
                        <v-col cols="12" class="text-h6">
                            Параметры рейса
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-date v-model="trip.start"
                                            type="date"
                                            required
                                            name="start"
                                            label="Начало рейса" />
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-date v-model="trip.end"
                                            type="date"
                                            name="end"
                                            required
                                            label="Окончание рейса" />
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="8">
                            <v-autocomplete label="Транспорт"
                                            v-model="trip.vehicle_id"
                                            clearable
                                            density="compact"
                                            hide-details
                                            name="vehicle_id"
                                            item-title="title"
                                            item-value="id"
                                            :items="vehicles"
                                            :rules="[rules.empty]"
                                            v-on:update:modelValue="onvehicle">
                            </v-autocomplete>
                        </v-col>    
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="8">
                            <v-autocomplete label="Водитель"
                                            v-model="trip.driver_id"
                                            clearable
                                            density="compact"
                                            hide-details
                                            name="driver_id"
                                            item-title="title"
                                            item-value="id"
                                            :rules="[rules.empty]"
                                            :items="drivers">
                            </v-autocomplete>
                        </v-col>    
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Количество груза"
                                          v-model="trip.cargo_count"
                                          type="currency"
                                          clearable
                                          persistent-hint
                                          density="compact"
                                          name="cargo_count"
                                          :hint="defs('cargo_count')">
                            </jet-input-number>
                        </v-col>    
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Расстояние"
                                          v-model="trip.distance"
                                          type="integer"
                                          clearable
                                          density="compact"
                                          :hint="defs('distance')"
                                          persistent-hint
                                          name="distance">
                            </jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Ставка"
                                          type="currency"
                                          v-model="trip.price"
                                          clearable
                                          density="compact"
                                          :hint="defs('price')"
                                          persistent-hint
                                          name="price">
                            </jet-input-number>
                        </v-col>    
                    </v-row>
                    <v-row v-if="has('trip')">
                        <v-col cols="12" class="text-h6">
                            Дополнительно
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Загружено"
                                          type="currency"
                                          v-model="trip.loaded"
                                          clearable
                                          density="compact"
                                          name="loaded">
                            </jet-input-number>
                        </v-col>    
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Выгружено"
                                          type="currency"
                                          v-model="trip.unloaded"
                                          clearable
                                          density="compact"
                                          name="unloaded">
                            </jet-input-number>
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
                           append-icon="mdi-send">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>    
    </v-dialog>
</template>
<script>
import { forscheduling } from "~/services/vehicle";
import { getorderhst, savetrip } from "~/services/order";
import JetInputDate from "app-ext/components/editors/JetInputDate";
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import { empty } from "app-ext/utils";

const _DEFS = {
    id: null,
    start: null,
    end: null,
    vehicle_id: null,
    driver_id: null,
    cargo_count: 0,
    distance: null,
    price: null,
    loaded: null,
    unloaded: null,
    order_id: 0
};

const rules = {
    empty: val => !empty(val) || "Необходимо заполнить"
};


export default {
    name: 'ArTripDlg',
    components: {
        JetInputDate,
        JetInputNumber
    },
    async setup(){
        const trip = ref(null),
              start= computed(()=>{
                  return (trip.value?.start) ? trip.value.start : new Date();
              }),
              vehicles = ref([]);
        
        useAsyncData('vehicles', async ()=>{
            try {
                let res = await forscheduling(start.value);
                res.forEach( r => {
                    r.title = `${ r.reg_number } - ${ r.trailers.at(0)?.reg_number } (${ r.name })`;
                });
                console.log('vehicles', res);
                vehicles.value = res;
                return true;
            }catch(e){
                console.log('ERR(vehicles)', e);
                return false;
            }
        }, {
            watch: [start]
        });
        
        const { data, pending, error } = useAsyncData('vehicle-trip', async ()=>{
            let _trip = {..._DEFS};
            if ( trip.value?.id ){
                _trip = await getorderhst(`id:${ trip.value.id }`);
                _trip = _trip.at(0);
            } 
            if (_trip.id){
                
            } else {
                _trip.start = new Date();
                _trip.end   = new Date();
            }
            trip.value = _trip;
            
            return true;
        });
        
        return {
            trip,
            vehicles,
            pending,
            error
        };
    },
    data(){
        return {
            rules,
            show: false,
            order: null
        };
    },
    computed: {
        drivers(){
            if (
                    (this.trip)
                 && (this.trip.vehicle_id)
                 && (this.vehicles?.length > 0)
               ){
                let n = this.vehicles.findIndex( v => v.id === this.trip.vehicle_id );
                return ( n < 0 ) ? []
                                 : this.vehicles[n].drivers?.map( d => {
                                        return {
                                            id: d.id,
                                            title: d.user.full_name
                                        };
                                 });
            } else {
                return [];
            }
        }
    },
    methods: {
        has(q){
            switch(q){
                case 'trip':
                    return Number(this.trip?.id || 0) > 0;
            }
            return false;
        },
        defs(q){
            switch(q){
                case 'price':
                    return '' + this.order?.price;
                case 'distance':
                    return this.order ? `${this.order.move_direction?.distance} км.` : null;
                case 'cargo_count':
                    return this.order ? `доступно ${Number(this.order.cargo_units_count-this.order.distributed_cargo_count).toFixed(1)}` : null;
            }
            return null;
        },
        open(order, trip){
            this.order = order;
            this.trip = {id: trip?.id||0};
            refreshNuxtData('vehicle-trip');
            this.show = true;
            this.$nextTick(()=>{
                $("input[name=start]").trigger("focus");
            });
        },
        onvehicle(v){
            if ( v ){
                this.$nextTick(()=>{
                    if (this.drivers.length === 1){
                        this.trip.driver_id = this.drivers[0].id;
                        $("input[name=weight]").trigger("focus");
                    }
                });
            } else {
                this.trip.driver_id = null;
            }
        },
        async save(){
            let { valid } = await this.$refs["form"].validate();
            console.log('saving', this.order, this.trip, valid);
            if (!valid){
                $jet.msg({text: "Необходимо заполнить все поля", type: "warning"});
                return false;
            }
            this.trip.order_id = this.order.org_order_id;
            this.pending = true;
            try {
                let res = await savetrip(this.trip);
                valid = res.success;
                if ( valid ){
                    this.trip.id = res.result.id;
                    await refreshNuxtData('vehicle-trip');
                    this.$emit('trip', this.trip);
                }
            } catch(e){
                valid = false;
                console.log('ERR (save-trip)', e);
                $jet.msg({text: `Ошибка назначения рейса:<br />${e.message}`, color: 'warning', timeout: 20000});
            } finally {
                this.pending = false;
                if ( valid ){
                    this.show = false;
                }
            }
            return false;
        }   //save
    }
}
</script>
