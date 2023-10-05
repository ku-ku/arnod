<template>
    <div class="order-details">
        <splitpanes class="default-theme" horizontal>
            <pane>
                <ar-map :route="route" 
                        v-on:distance="ondistance" />
            </pane>
            <pane max-size="70">
                <v-card class="fill-height pa-0"
                        flat>
                    <v-card-text>
                        <v-list>
                            <v-list-item>
                                <v-chip size="small"
                                        :color="(delay > 0) ? 'red' : undefined">{{ dates }}</v-chip>
                                <div style="padding-right: 3rem;">
                                    <v-badge :content="distance + ' km'"
                                             :color="(route_distance > 20) ? 'red' : 'primary'">
                                        {{ title }}
                                    </v-badge>
                                    <div v-if="route_distance > 20" class="my-1 text-red">
                                        <v-icon size="small">mdi mdi-alert-outline</v-icon>
                                        до маршрута более {{ route_distance }} км.
                                    </div>
                                </div>
                            </v-list-item>
                            <v-divider />
                            <v-list-item v-if="!!order.organization_order?.order?.cargo_name">
                                <h4>груз</h4>
                                <v-row>
                                    <v-col cols="6">
                                        {{ order.organization_order.order.cargo_name.title }} ({{order.organization_order.order.cargo_type.title}})
                                    </v-col>
                                    <v-col cols="6" v-if="!!order.vehicle_order_group"
                                           class="text-right">
                                        {{ order.vehicle_order_group.cargo_count }}
                                        <span v-if="!!order.organization_order?.order?.cargo_unit">
                                            {{ order.organization_order.order.cargo_unit.title }}
                                        </span>
                                    </v-col>
                                </v-row>
                            </v-list-item>
                            <v-divider />
                            <v-list-item>
                                <h4 class="d-flex justify-space-between">
                                    погрузка
                                    <div v-if="Number(loading.loaded) > 0"
                                         class="text-right">
                                        {{ loading.loaded }}
                                        <span class="pc" v-if="loading.pcloaded">
                                            ({{o.pcloaded > 0 ? "+" : ""}} {{ loading.pcloaded }}%)
                                        </span>
                                    </div>    
                                </h4>
                                <v-row>
                                    <v-col cols="4">
                                        начало<br />
                                        {{ loading.start }}
                                    </v-col>
                                    <v-col cols="4">
                                        окончание<br />
                                        {{ loading.end }}
                                    </v-col>
                                    <v-col cols="4">
                                        дней<br />
                                        {{ loading.days }}
                                    </v-col>
                                </v-row>    
                            </v-list-item>
                            <v-divider />
                            <v-list-item>
                                <h4>выгрузка</h4>
                                <v-row>
                                    <v-col cols="4">
                                        начало<br />
                                        {{ unloading.start }}
                                    </v-col>
                                    <v-col cols="4">
                                        окончание<br />
                                        {{ unloading.end }}
                                    </v-col>
                                    <v-col cols="4">
                                        дней<br />
                                        {{ unloading.days }}
                                    </v-col>
                                </v-row>    
                            </v-list-item>
                            <v-divider />
                            <v-list-item height="48">
                                <ar-ord-status :status="order.last_status" 
                                               v-on:change="changestatus" />
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </pane>
        </splitpanes>
    </div>
</template>
<script>
import { ref, computed } from "vue";
import 'splitpanes/dist/splitpanes.css';
import { Splitpanes, Pane } from 'splitpanes';
import ArOrdStatus from "~/components/ArOrdStatus";
import ArMap from "~/components/ArMap";
import { all } from "~/composables/data";

export default {
    name: 'order',
    components: {
        Splitpanes, 
        Pane,
        ArOrdStatus,
        ArMap
    },
    async setup(){
        if (!all.order){
            await navigateTo('/', {replace: true});
        }
        console.log('order', all.order);
        
        useHead({
            title: `${ all.order.organization_order?.order?.move_direction?.title || 'ЗАКАЗ'}`
        });
        
        if (
                (typeof window["ym"] !== "undefined")
             && (all.order.organization_order?.order?.move_direction?.title)
           ){
                ym($jet.YM_ID, 'hit', window.location.href, {title: all.order.organization_order.order.move_direction.title});
        }
        
        return {
            orderId: computed(()=>{return all.order.id;}),
            order: all.order
        };
    },
    data(){
        return {
            ab: null,
            route_distance: 0
        };
    },
    computed:{
        title(){
            return this.order?.organization_order?.order?.move_direction?.title || '';
        },
        distance(){
            return this.order?.organization_order?.order?.move_direction?.distance || '';
        },
        dates(){
            return `${ this.order.start } - ${ this.order.end }`;
        },
        route(){
            return this.order?.organization_order?.order?.move_direction?.route;
        },
        loading(){
            let res = {
                start: null,
                end: null,
                days: null,
                loaded: 0,
                pcloaded: null,
            };
            if (this.order?.organization_order?.order){
                let start = $moment(this.order.organization_order.order.loading_start_date, 'YYYY-MM-DD'),
                    end   = $moment(this.order.organization_order.order.loading_end_date, 'YYYY-MM-DD'),
                    days  = this.order.organization_order.order.loading_days;
            
                if (!days) {
                    days = $moment.duration(end.toDate()-start.toDate(), 'days') + 1;
                }
                res.start = start.format('DD.MM');
                res.end = end.format('DD.MM');
                res.days = days;
            }
            if (this.order){
                res.loaded = this.order.loaded;
                res.pcloaded = this.order.pcloaded;
            }
            return res;
        },   //loading
        unloading(){
            let res = {
                start: null,
                end: null,
                days: null
            };
            if (this.order?.organization_order?.order){
                let start = $moment(this.order.organization_order.order.unloading_start_date, 'YYYY-MM-DD'),
                    end   = $moment(this.order.organization_order.order.unloading_end_date, 'YYYY-MM-DD'),
                    days  = this.order.organization_order.order.unloading_days;
                if (!days) {
                    days = $moment.duration(end.toDate()-start.toDate(), 'days') + 1;
                }
                res.start = start.format('DD.MM');
                res.end = end.format('DD.MM');
                res.days = days;
            }
            return res;
        },   //unloading
        delay(){
            if (this.order?.end_date){
                const diff = $moment().diff($moment(this.order.end_date, 'YYYY-MM-DD HH:mm:ss'), 'days');
                return diff > 0 ? diff : 0;
            }
            return 0;
        }   //delay
    },
    methods: {
        refresh(){
            $jet.isHydrating = false;   //TODO: (?)
            refreshNuxtData('orders');
        },
        async changestatus(to){
            try {
                const res = await $jet.api({
                    url: `/vehicle_orders/${this.order.id}/attach/status`,
                    method: 'POST',
                    body: {
                            status_id: to.code, 
                            data: {}
                    }
                });
                if (res.success){
                    this.refresh();
                } else {
                    throw {message: res.error};
                }
            } catch(e){
                console.log('ERR(status)', e);
                $jet.msg({text: `Не удается изменить статус, попробуйте еще раз<br /><small>${ e.message }</small>`, color: 'warning'});
            }
        },
        ondistance(dist){
            this.route_distance = Number(dist).toFixed(1);
        }
    }
}
</script>
<style lang="scss">
    .splitpanes{
        height: calc(100vh - 86px);
    }
    .order-details{
        & .v-card{
            height: 100%;
            &-text{
                height: 100%;
                overflow-y: auto;
            }
        }
    }
</style>