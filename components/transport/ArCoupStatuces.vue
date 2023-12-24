<template>
    <v-list class="pa-3">
        <v-list-item v-if="pending">
            <v-skeleton-loader type="list-item@3" />
        </v-list-item>
        <template v-else-if="!!statuces">
            <v-list-item>
                <div class="text-end">
                    <v-btn size="small"
                           prepend-icon="mdi-plus"
                           variant="tonal"
                           color="primary"
                           v-on:click="ontrip(null, false)">
                        назначить новый
                    </v-btn>
                </div>
            </v-list-item>
            <v-list-item v-for="s in statuces"
                         :key="'s-' + s.id"
                         class="ar-coupling__order"
                         elevation="2"
                         rounded>
                <v-list-item-title v-if="(s.organization_order?.order)">
                #{{ s.organization_order.order.number || ''}}&nbsp;
                 {{ s.organization_order.order.move_direction?.title || '' }}
                </v-list-item-title>
                <div class="ar-coupling__period" v-if="s.period">
                    {{ s.period }}
                </div>
                <div class="ar-coupling__contra">
                    Контрагент:&nbsp;{{ s.organization_order.order?.contractor?.title }}
                </div>    
                <div class="ar-coupling__cargo">
                    Груз:&nbsp;{{ s.organization_order.order?.cargo_name?.title }}, 
                        {{ s.cargo_count }} ({{s.organization_order.order?.cargo_unit?.title }}) / {{ s.loaded || 'не загружен' }} 
                </div>    
                <div class="ar-coupling__coup">
                    Прицеп:&nbsp;{{ s.vehicle?.trailers?.map( t => t.reg_number ).join(" | ")}}
                </div>    
                <div class="ar-coupling__driver">
                    Водитель:&nbsp;{{ s.driver?.user?.full_name }}
                </div>
                <div class="ar-coupling__status" v-if="s.last_status">
                    Статус:&nbsp;{{ s.last_status.title }} 
                    ({{ s.last_status.date }})
                </div>
                <div v-if="!(s.organization_order?.order?.status?.length>0)">
                    <v-icon size="small">mdi-information-outline</v-icon>&nbsp;водитель еще не принял заказ
                </div>
                <div v-if="!(s.loaded > 0)">
                    <v-btn size="small"
                           color="red"
                           append-icon="mdi-close"
                           variant="tonal"
                           v-on:click.stop="denyOrder(s)">
                        Отменить заказ
                    </v-btn>
                </div>
            </v-list-item>
        </template>
        <template v-else>
            <v-list-item class="ma-5">
                <v-alert type="info"
                         border="top"
                         elevation="3"
                         icon
                         variant="tonal">
                    На текущий для {{ coup.reg_number }} момент нет информации о назначенных/выполняемых рейсах
                </v-alert>
            </v-list-item>    
        </template>
    </v-list>
    <teleport to="body">
        <ar-trip-dlg ref="tripDlg" 
                     v-on:trip="ontrip($event, true)"/>
    </teleport>
</template>
<script setup>
    import { ref, toRef } from "vue";
    import { phpdate2m } from "app-ext/utils";
    import ArTripDlg from "../ArTripDlg";
    
    const props = defineProps({
        coupling: Object
    });
    
    const tripDlg = ref(null);
    const coup = toRef(props, 'coupling');
    
    const {data: statuces, pending} = useLazyAsyncData('co-statuces', async ()=>{
        try{
            let res = await $jet.api({
                url: '/vehicle_orders',
                params: {
                    include: '*',
                    filters: `vehicle_id:${ coup.value.id },state:IN_EXECUTION`
                }
            });
            console.log('statuces', res);
            if (res.success){
                res.result.items.forEach( item => {
                    if ( item.organization_order?.order ){
                        item.period = phpdate2m(item.organization_order.order.loading_start_date).format('DD.MM.YYYY') + ' - ' +
                                      phpdate2m(item.organization_order.order.unloading_end_date).format('DD.MM.YYYY');
                    }
                    if (item.last_status?.pivot){
                        item.last_status.date = phpdate2m(item.last_status.pivot.start_date).format('DD.MM.YYYY HH:mm');
                    }
                });
                return res.result.items;
            }
        } catch(e){
            console.log('ERR (statuces)', e);
            $jet.msg({
                        text: `Ошибка получения информации о статусах ТС.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                        color: 'warning'
            });
        }
    }, {
        watch: [coup]
    });
    
    
    function denyOrder(order){
        console.log('deleting', order);
        $jet.msg({
            text: `Подтвердите отмену выбранного заказа #${ order.organization_order.order.number || ''} ${ order.organization_order.order.move_direction?.title || '' }`,
            color: "indigo",
            location: "top",
            click: ok => {
                    if ( !ok ){
                        return;
                    }
                    const opts = {
                        url: `/vehicle_orders/${order.id}/close`,
                        method: 'POST',
                        body: {
                            cargo_count: order.loaded
                        }
                    };
                    $jet.api(opts).then( res => {
                        if (res.success){
                            refreshNuxtData('co-statuces');
                        }
                    }).catch(e =>{
                        console.log('ERR (del)', e);
                        $jet.msg({
                            text: `Ошибка удаления<br />${ $jet.api.$errm || e.message }`, 
                            color: 'warning'
                        });
                    });
            },
            click_title: 'подтвердить',
            timeout: 60000
        })
    };
    
    function ontrip(trip, refresh){
        if (refresh){
            refreshNuxtData('co-statuces');
            return;
        }
        var trip = trip || {
            vehicle_id: coup.value.id,
            driver_id:  coup.value.driver_id
        };
        tripDlg.value?.open(null, trip);
    };
    
</script>
<style lang="scss">
    .ar-coupling{
        &__order{
            font-size: 0.9rem;
            margin-bottom: 1rem;
            & .v-list-item-title{
                font-weight: 600;
            }
            & .v-list-item__content{
                & > div {
                    margin-bottom: 0.33rem;
                }
            }
        }
    }
</style>