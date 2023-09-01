<template>
    <v-expansion-panels v-model="panel">
        <v-expansion-panel v-if="has('vehicle')"
                           class="ar-vehicle" 
                           color="green-lighten-5"
                           value="vehicle">
            <template v-slot:title>
                <v-icon v-if="!has('telemetry')"
                        class="mr-1">
                    mdi-map-marker-off-outline
                </v-icon>
                <div>
                    {{ vehicle.reg_number }}
                    <div class="text-muted">
                        {{ vehicle.name }}<template v-if="has('trailers')">, пр.:&nbsp;{{ trailers }}</template>
                    </div>
                </div>    
            </template>
            <template v-slot:text>
                <v-list>
                    <v-list-item prepend-icon="mdi-speedometer"
                                 append-icon="mdi-chevron-right"
                                 v-on:click="$emit('odometer')">
                        пробег: {{ odometer.km || 'не задан' }}
                        <div class="text-muted">
                            {{ odometer.updated }}
                        </div>
                    </v-list-item>
                    <ar-fuel v-on:update="refresh">
                        <template v-slot:activator="{props}">
                            <v-list-item prepend-icon="mdi-fuel"
                                         append-icon="mdi-chevron-right"
                                         v-bind="props">
                                топливо: {{ fuel.remain }}
                                <div class="text-muted">
                                    {{ fuel.updated }}
                                </div>
                            </v-list-item>
                        </template>
                    </ar-fuel>
                    <v-list-item>
                        <div class="py-3">
                            <v-btn :color="(18 == active_status.id) ? 'primary' : undefined"
                                   :prepend-icon="(18 == active_status.id) ? 'mdi-checkbox-outline' : undefined"
                                   v-on:click="onstatus('go')">
                                еду на ТО
                            </v-btn>
                            <v-btn :color="(19 == active_status.id) ? 'primary' : undefined"
                                   :prepend-icon="(19 == active_status.id) ? 'mdi-checkbox-outline' : undefined"
                                   v-on:click="onstatus('to')">
                                на ТО
                            </v-btn>
                            <v-btn v-on:click="onstatus('def')"
                                   :disabled="!has('vc-status')"
                                   :color="has('vc-status') ? 'orange-lighten-4' : undefined">
                                   <v-icon>mdi-close</v-icon>
                            </v-btn>
                        </div>
                    </v-list-item>
                </v-list>
            </template>
        </v-expansion-panel>
    </v-expansion-panels>
</template>
<script>
import { geo } from "app-ext/composables/geo";
import { all } from "~/composables/data";
import ArFuel from "~/components/ArFuel";

const _TANK_FUEL = [
    {name: '0',   val: 0},
    {name: '1/4', val: 0.25}, 
    {name: '1/2', val: 0.5},
    {name: '3/4', val: 0.75},
    {name: '1',   val: 1}
];

export default {
    name: 'ArVehicle',
    emits: ['odometer'],
    components: {
        ArFuel
    },
    async setup(){
        const {data: vehicle, pending, error} = useAsyncData('vehicle', all.getvehicle, {immediate: true});

        watch(vehicle, ()=>{
            useHead({
                title: `${ vehicle.value?.reg_number || ''} | ${ vehicle.value?.name || ''}`
            });
            if (
                    (typeof window["ym"] !== "undefined")
                 && (vehicle.value?.reg_number)
               ){
                    ym($jet.YM_ID, 'hit', window.location.href, {title: vehicle.value.reg_number});
            }
        });

        return {
            pending,
            error,
            vehicle
        };
    },
    data(){
        return {
            _TANK_FUEL,
            panel: ['vehicle']  //def expend pane
        };
    },
    computed: {
        active_status(){
            const empty = {id: -1, pivot:{id: -1}},
                  status = this.vehicle?.active_status;
            if (!status){
                return empty;
            }
            let end = status.pivot.end_date;
            return (!end) ? status 
                          : $moment(end, 'YYYY-MM-DD HH:mm:ss').isAfter(new Date())
                          ? status : empty;
        },
        trailers(){
            return this.vehicle?.trailers?.map( t => t.reg_number ).join(", ");
        },
        odometer(){
            if (this.vehicle?.odometers?.length > 0){
                const res = this.vehicle.odometers[0];
                res.km = `${new Intl.NumberFormat("ru").format(res.distance)} ${res.type}`;
                res.updated  = $moment(res.updated_at, 'YYYY-MM-DD').format('DD.MM.YYYY');
                return res;
            }
            return {};
        },
        fuel(){
            const fuel = (this.vehicle?.fuel_remains_journal?.length > 0) ? this.vehicle.fuel_remains_journal[0] : {};
            if (fuel){
                const remain = Number(fuel.relative_remain);
                if (remain < 0.25){
                    fuel.remain = 'нет';
                } else if (remain >= 0.25 && remain < 0.5){
                    fuel.remain = '1/4 бака';
                } else if (remain >= 0.5 && remain < 0.75){
                    fuel.remain = '1/2 бака';
                } else if (remain >= 0.75 && remain < 1){
                    fuel.remain = '3/4 бака';
                } else {
                    fuel.remain = 'полный бак ';
                }
                fuel.updated = $moment(fuel.updated_at).format('DD.MM.YYYY HH:mm');
            }
            return fuel;
        }
    },
    methods: {
        has(q){
            switch(q){
                case "vehicle":
                    return !!this.vehicle;
                case "trailers":
                    return this.vehicle?.trailers?.length > 0;
                case "vc-status":
                    return [18, 19].indexOf(this.active_status.id) > -1;
                case "telemetry":
                    return geo.coords.timestamp > 0;
            }
            return false;
        },
        refresh(){
            $jet.isHydrating = false;   //TODO: (?)
            refreshNuxtData('vehicle');
        },
        onstatus(q){
            const _STATUSES = {
                "go":  {title: "ЕДУ НА ТО", val: 18},
                "to":  {title: "НА ТО",     val: 19},
                "def": {title: "СБРОСИТЬ",  val: 0}
            };
            const status = _STATUSES[q];
            const _change = async e => {
                if (!e){
                    return;
                }
                
                const all = [];
                
                try {
                    
                    if ( 
                            (status.val > 0)
                         && (this.active_status?.pivot?.id > 0)
                    ) {
                        /* detach active status before */
                        all.push($jet.api({
                                                url: `/vehicles/${this.vehicle.id}/detach/status`,
                                                key: 'status-detach',
                                                method: 'POST',
                                                body: {
                                                            status_journal_id: this.active_status.pivot.id, 
                                                            end_date: $moment().format('YYYY-MM-DD HH:mm:ss')
                                                }
                                })
                        );
                    }
                    
                    let opts = {
                        status_id: status.val, 
                        start_date: null
                    };
                    if ( 0 === status.val ){
                        opts = {
                                    status_journal_id: this.active_status.pivot.id, 
                                    end_date: $moment().format('YYYY-MM-DD HH:mm:ss')
                               };
                    }
                    
                    all.push($jet.api({
                                        url: (status.val > 0) 
                                                ? `/vehicles/${this.vehicle.id}/attach/status` 
                                                : `/vehicles/${this.vehicle.id}/detach/status`,
                                        key: (status.val > 0) ? 'status-attach' : 'status-detach',
                                        method: 'POST',
                                        body: opts
                            }));
                    let res = await Promise.all(all);
                    for (let i = 0; i < res.length; i++){
                        if ( !res[i].success ){
                            throw {message: res[i].error};
                        }
                    }
                    this.refresh();
                } catch(e) {
                    console.log('ERR(status)', e);
                    $jet.msg({text: `Не удается изменить статус, попробуйте еще раз<br /><small>${ e.message }</small>`, color: 'warning'});
                }
                
            };  //_change
            
            $jet.msg({
                        text: (status.val === 0) 
                                ? 'Сбросить статус?'
                                :`ВНИМАНИЕ! Подтвердите смену статуса "${status.title}"`,
                        click: _change,
                        click_title: "Подтвердить", 
                        timeout:  300000,
                        color: "yellow-lighten-5"
                    });
        }   //status
    }       //methods
}
</script>
<style lang="scss">
.v-expansion-panel.ar-vehicle{
    & .v-expansion-panel-title{
        line-height: 1.115;
        min-height: 32px !important;
    }
    & .v-expansion-panel-text{
        &__wrapper{
            padding: 0 !important;
        }
        & .v-list{
            background-color: #E8F5E9; /*green-lighten-5*/
            &-item{
                &__prepend{
                    & > .v-icon{
                        margin-inline-end: 0.5rem;
                    }
                }
            }
        }
        & .v-btn{
            &:not(:last-child){
                margin-right: 0.5rem;
            }
        }
    }
}
</style>