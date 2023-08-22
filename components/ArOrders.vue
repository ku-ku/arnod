<template>
    <v-list class="ar-orders">
        <v-list-item v-if="pending">
            <v-skeleton-loader type="list-item@3" />
        </v-list-item>
        <template v-else>
            <v-list-item v-for="o in orders"
                         :key="'o-'+o.id"
                         class="ar-order">
                <v-row class="justify-space-between align-center">
                    <v-col class="ar-order__vehicle">
                        {{ o.vehicle.reg_number }}
                    </v-col>
                    <v-col cols="auto">
                        <v-btn rounded
                               class="ar-order__dt"
                               v-on:click="go(o)"
                               :color="delay(o) > 0 ? 'red-lighten-4' : undefined">
                            {{ o.start }} - {{ o.end }}
                            <v-icon>mdi-chevron-right</v-icon>
                        </v-btn>
                    </v-col>
                </v-row>    
                <v-row class="ar-order__road" 
                       v-if="!!o.organization_order?.order?.move_direction">
                    <v-col>{{ o.organization_order.order.move_direction.title }}</v-col>
                    <v-col cols="auto" class="text-right">
                        {{ o.organization_order.order.move_direction.distance }}&nbsp;km
                    </v-col>
                </v-row>
                <v-row class="ar-order__meta" v-if="!!o.organization_order?.order?.cargo_name">
                    <v-col cols="6">
                        {{ o.organization_order.order.cargo_name.title }} ({{o.organization_order.order.cargo_type.title}})
                    </v-col>
                    <v-col cols="6" v-if="!!o.vehicle_order_group"
                           class="text-right">
                        {{ o.vehicle_order_group.cargo_count }}
                        <span v-if="!!o.organization_order?.order?.cargo_unit">
                            {{ o.organization_order.order.cargo_unit.title }}
                        </span>
                    </v-col>
                </v-row>
                <v-row v-if="Number(o.loaded) > 0" 
                       class="ar-order__meta">
                    <v-col>
                        загружено
                    </v-col>
                    <v-col class="text-right">
                        {{ o.loaded }}
                        <span class="pc" v-if="o.pcloaded"
                              :style="{color: (o.pcloaded > 0) ? 'red' : 'orange'}">
                            ({{ o.pcloaded }}%)
                        </span>
                    </v-col>    
                </v-row>
                <v-row v-if="Number(o.unloaded) > 0"
                       class="ar-order__meta">
                    <v-col>
                        выгружено
                    </v-col>
                    <v-col class="text-right">
                        {{ o.unloaded }}
                    </v-col>    
                </v-row>
                <v-row class="ar-order__status justify-center pb-5" 
                       v-if="o.status?.length > 0">
                    <v-col cols="12">
                        <ar-ord-status :status="o.last_status" 
                                       v-on:change="changestatus(o, $event)" />
                    </v-col>
                </v-row>    
            </v-list-item>
        </template>
    </v-list>
</template>
<script>
import { all } from "~/composables/data";
import ArOrdStatus from "~/components/ArOrdStatus";

let hOrdersTimer = null;

export default {
    name: 'ArOrders',
    components: {
        ArOrdStatus
    },
    setup(){
        const {pending, error, data: orders} = useAsyncData('orders', all.getorders);
        
        return {
            pending,
            error,
            orders
        };
    },
    created(){
        hOrdersTimer = setInterval(()=>{
            refreshNuxtData('orders').then( () => {
                $jet.hint({hint: `обновлено ${$moment().format("HH:mm")} (${this.orders.length}&nbsp;записей)`, timeout: 10000});
            }).catch(e =>{
                $jet.hint({hint: `<i class="mdi mdi-alert-outline"></i>&nbsp;ошибка обновления заказов`, timeout: 10000});
            });
        }, 5*60*1000);
    },
    beforeDestroy(){
        if (hOrdersTimer){
            clearInterval(hOrdersTimer);
            hOrdersTimer = null;
        }
    },
    methods: {
        go(order){
            all.set({ order });
            navigateTo(`/orders/${order.id}`);
        },
        refresh(){
            $jet.isHydrating = false;   //TODO: (?)
            refreshNuxtData('orders');
        },
        delay(order){
            if (order.end_date){
                const diff = $moment().diff($moment(order.end_date, 'YYYY-MM-DD HH:mm:ss'), 'days');
                return diff > 0 ? diff : 0;
            }
            return 0;
        },
        async changestatus(order, to){
            try {
                const res = await $jet.api({
                    url: `/vehicle_orders/${order.id}/attach/status`,
                    method: 'POST',
                    body: {
                        status_id: to.code, 
                        data: to.data || {}
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
        }
    }
}
</script>
<style lang="scss">
    .ar-orders{
        margin-top: 1rem;
        font-size: 1rem;
        line-height: 1.115;
        & .ar-order{
            &:not(:last-child){
                padding-bottom: 0.5rem;
                margin-bottom: 0.5rem;
                border-bottom: 1px solid rgba(0,0,0,0.18);
            }
            & .v-col{
                padding-bottom: 0;
            }
            &__vehicle{
                font-weight: 600;
            }
            &__road{
            }
            &__status{
                text-align: center;
                & .v-btn{
                    height: auto !important;
                    & .v-btn__content{
                        line-height: 1.115;
                        flex-direction: column;
                        padding-top: 0.5rem;
                        padding-bottom: 0.5rem;
                    }
                }
            }
            &__dt{
                margin-right: 0.125rem;
            }
        }
    }
</style>