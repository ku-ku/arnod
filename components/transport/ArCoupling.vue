<template>
    <v-dialog v-model="show"
              fullscreen
              persistent>
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                <v-icon size="small">mdi-dump-truck</v-icon>&nbsp;
                {{ coupling?.id > 0 ? `Транспорт ${ coupling.reg_number || ''} ${ coupling.name || '' }` : 'Новая запись' }}
            </v-toolbar-title>
            <v-spacer />
            <v-btn append-icon="mdi-close"
                   flat
                   v-on:click="show = false">
                       закрыть
            </v-btn>
        </v-toolbar>
            <v-card rounded="0"
                    :loading="pending"
                    class="ar-coupling">
                <v-card-text class="pb-5">
                    <v-row dense>
                        <v-col cols="auto" style="width:320px;">
                            <v-tabs density="compact">
                                <v-tab text="Текущие данные ТС"></v-tab>
                            </v-tabs>    
                            <v-list>
                                <v-list-item>
                                    <v-text-field label="Прицеп"
                                                  readonly
                                                  :model-value="coupling?.trailer?.reg_number"
                                                  :messages="'c ' + (coupling?.trailer_at || '')">
                                    </v-text-field>
                                    <template v-slot:append>
                                        <v-btn size="small"
                                               variant="flat"
                                               icon="mdi-pencil"
                                               v-on:click="ontrailer(false)"></v-btn>
                                    </template>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field label="Водитель"
                                                  readonly
                                                  :model-value="coupling?.driver"
                                                  :messages="'c ' + (coupling?.driver_at || '')">
                                    </v-text-field>
                                    <template v-slot:append>
                                        <v-btn size="small"
                                               variant="flat"
                                               icon="mdi-pencil"
                                               v-on:click="ondriver(false)"></v-btn>
                                    </template>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field label="Пробег"
                                                  readonly
                                                  :model-value="coupling?.odometer"
                                                  :messages="'дата ' + (coupling?.odometer_at || '')">
                                    </v-text-field>
                                    <template v-slot:append>
                                        <v-btn size="small"
                                               variant="flat"
                                               icon="mdi-pencil"
                                               v-on:click="onodo(false)"></v-btn>
                                    </template>
                                </v-list-item>
                                <v-list-item>
                                    <v-text-field label="Остаток топлива"
                                                  readonly
                                                  :model-value="coupling?.fuel"
                                                  :messages="'дата ' + (coupling?.fuel_at || '')">
                                    </v-text-field>
                                    <template v-slot:append>
                                        <v-btn size="small"
                                               variant="flat"
                                               icon="mdi-pencil"
                                               v-on:click="onfuel(false)"></v-btn>
                                    </template>
                                </v-list-item>
                                <v-list-item>
                                    <v-textarea label="Примечание" 
                                                rows="2"
                                                readonly
                                                :model-value="coupling?.description"></v-textarea>
                                </v-list-item>
                            </v-list>
                        </v-col>
                        <v-col style="width:calc(100% - 322px);">
                            <v-tabs density="compact"
                                    v-model="tab">
                                <v-tab text="Календарь" :value="0"></v-tab>
                                <v-tab text="Рейсы"     :value="1"></v-tab>
                                <v-tab text="Пробег"    :value="2"></v-tab>
                            </v-tabs>
                            <v-window v-model="tab">
                                <v-window-item :value="0">
                                    <ar-coup-schedule :coupling="coupling" 
                                              ref="schedule" />
                                </v-window-item>
                                <v-window-item :value="1">
                                    <ar-coup-statuces :coupling="coupling" />
                                </v-window-item>
                                <v-window-item :value="2">
                                    <ar-coup-odometers :coupling="coupling" />
                                </v-window-item>
                            </v-window>    
                        </v-col>
                    </v-row>
                </v-card-text>
            </v-card>
            <ar-coup-trailer ref="trailerDlg" 
                             v-on:save="ontrailer(true)" />
            <ar-coup-driver ref="driverDlg" 
                            v-on:save="ondriver(true)" />
            <ar-coup-odo ref="odoDlg"
                         v-on:save="onodo($event)" />
            <ar-coup-fuel ref="fuelDlg"
                          v-on:save="onfuel($event)" />
    </v-dialog>
</template>
<script>
import { phpdate2m } from "app-ext/utils";
import ArCoupSchedule from "./ArCoupSchedule";
import ArCoupOdometers from "./ArCoupOdometers";
import ArCoupStatuces from "./ArCoupStatuces";
import ArCoupTrailer from "./ArCoupTrailer";
import ArCoupDriver from "./ArCoupDriver";
import ArCoupOdo from "./ArCoupOdo";
import ArCoupFuel from "./ArCoupFuel";

export default {
    name: 'ArCoupling',
    components: {
        ArCoupSchedule,
        ArCoupStatuces,
        ArCoupOdometers,
        ArCoupTrailer,
        ArCoupDriver,
        ArCoupOdo,
        ArCoupFuel        
    },
    async setup(){
        const coupling = ref(null),
              show     = ref(false),
              tab      = ref(0),
              pending  = ref(false);
      
        const { error } = useAsyncData('transport-coupling', async ()=>{
            if (
                    ( !show.value )
                || !( coupling.value?.id > 0)
               ){
                return false;
            }
            
            pending.value = true;
            
            try {
                let res = await $jet.api({url: `/vehicles/${ coupling.value.id }`});
                if ( res.success ) {
                    coupling.value = res.result;
                    if (res.result.trailers?.length > 0){
                        coupling.value.trailer = res.result.trailers[0];
                        coupling.value.trailer_at = phpdate2m(res.result.trailers[0].pivot.start_date).format('DD.MM.YYYY');
                    }
                    if (res.result.drivers?.length > 0){
                        coupling.value.driver = res.result.drivers[0].user.full_name;
                        coupling.value.driver_at = phpdate2m(res.result.drivers[0].pivot.start_date).format('DD.MM.YYYY');
                    }
                    if (res.result.odometers?.length > 0){
                        coupling.value.odometer = res.result.odometers[0].distance;
                        coupling.value.odometer_at = phpdate2m(res.result.odometers[0].date).format('DD.MM.YYYY');
                    }
                    if (res.result.fuel_remains_journal?.length > 0){
                        coupling.value.fuel = `${res.result.fuel_remains_journal[0].absolute_remain} л. (${res.result.fuel_remains_journal[0].relative_remain}), всего: ${res.result.fuel_capacity}`;
                        coupling.value.fuel_at = phpdate2m(res.result.fuel_remains_journal[0].created_at).format('DD.MM.YYYY');
                    } else {
                        coupling.value.fuel = `всего: ${res.result.fuel_capacity}`;
                    }
                    
                }
            } catch(e){
                console.log('ERR (coupling)', e);
                $jet.msg({
                            text: `Ошибка получения данных сцепки.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                pending.value = false;
            }
        });
        
        
        return {
            show,
            tab,
            pending,
            coupling
        };
    },  //setup
    methods: {
        open(item){
            this.coupling = {id: item?.id || 0};
            this.show = true;
            refreshNuxtData('transport-coupling');
        },
        ontrailer(refresh){
            if (refresh){
                refreshNuxtData('transport-coupling');
                this.$refs["schedule"].refresh();
                return;
            }
            let day = {
                day: $moment().startOf('day'),
                vehicle_id: this.coupling.id,
                trailers: this.coupling.trailer || {
                    id: null
                }
            };
            day.trailers.start = day.day;
            this.$refs["trailerDlg"].open(day);
        },  //ontrailer
        ondriver(refresh){
            if (refresh){
                refreshNuxtData('transport-coupling');
                this.$refs["schedule"].refresh();
                return;
            }
            
            //editing
            console.log('coupling', this.coupling);
            let day = {
                day: $moment().startOf('day'),
                vehicle_id: this.coupling.id,
                drivers: {id: null}
            };
            day.drivers.start = day.day;
            
            this.$refs["driverDlg"].open(day);
        },  //ondriver
        onodo(refresh){
            if (refresh){
                this.coupling.odometer = refresh.distance;
                this.coupling.odometer_at=phpdate2m(refresh.created_at).format('DD.MM.YYYY');
                return;
            }

            let odo = {
                distance: null,
                vehicle_id: this.coupling.id,
                driver_id: this.coupling.drivers?.at(0)?.id,
                last: `${this.coupling.odometer||''} от ${this.coupling.odometer_at|| '-'}`
            };
            this.$refs["odoDlg"].open(odo);

        },   //onodo
        onfuel(refresh){
            if (refresh){
                this.coupling.fuel = `${refresh.absolute_remain} л. (${refresh.relative_remain})`;
                this.coupling.fuel_at = phpdate2m(refresh.created_at).format('DD.MM.YYYY HH:mm');
                return;
            }

            let fuel = {
                vehicle_id: this.coupling.id,
                driver_id: this.coupling.drivers?.at(0)?.id,
                last: `${this.coupling.fuel||''} от ${this.coupling.fuel_at|| '-'}`
            };
            this.$refs["fuelDlg"].open(fuel);
        }
    }
}    
</script>    
