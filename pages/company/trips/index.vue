<template>
    <Teleport to=".ar-title">
        <v-menu min-height="400"
                eager
                :close-on-content-click="false"
                v-model="menu">
            <template v-slot:activator="{ props }">
                <v-btn append-icon="mdi-chevron-down"
                       flat
                       class="mr-3"
                       v-bind="props">
                    {{ direction }}
                </v-btn>
            </template>
            <v-card elevated="3">
                <v-card-text>
                    <ar-company-orders v-on:select="use" />
                </v-card-text>
            </v-card>
        </v-menu>
    </Teleport>
    <teleport to="body">
        <ar-trip-dlg ref="dlg" 
                     v-on:trip="onmodify" />
    </teleport>
    <v-data-table density="compact"
                  class="ar-trips"
                  :loading="pending"
                  :items="trips"
                  items-per-page="-1"
                  :headers="hdrs"
                  :group-by="[{ key: 'at'}]"
                  fixed-header
                  hover
                  item-key="id"
                  select-strategy="single"
                  :model-value="selected"
                  v-on:click:row="onclickrow">
        <template v-slot:top>
            <v-tabs v-model="tab"
                    density="compact"            
                    color="primary">
                <v-tab :value="0">На исполнении</v-tab>
                <v-tab :value="1">Выполненные рейсы</v-tab>
                <v-btn variant="tonal"
                       size="small"
                       append-icon="mdi-plus"
                       v-on:click="ontrip(null)"
                       style="justify-self:flex-end;margin-left:auto;"
                       color="primary">
                    добавить рейс
                </v-btn>
            </v-tabs>
        </template>
        <template v-slot:item.diff="{ item }">
            <template v-if="(item.diffCapacity > 0)||(item.diffCapacity <= -3)">
                <v-tooltip :text="item.diffCapacity + '%'">
                    <template v-slot:activator="{props}">
                        <v-chip pill size="small" 
                                :color="(item.diffCapacity > 0) ? 'red' : 'orange'"
                                v-bind="props">
                            <v-icon size="small">
                                mdi-truck-alert-outline
                            </v-icon>
                        </v-chip>
                    </template>
                </v-tooltip>
            </template>    
        </template>    
        <template v-slot:item.status="{ item }">
            {{ item.status }}
            <div v-if="item.dt" class="text-muted">
                {{item.dt.format('DD.MM.YYYY HH:mm')}} / {{ item.duru }}
            </div>
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn size="x-small" flat icon="mdi-pencil"
                   v-on:click="ontrip(item)"></v-btn>
            <v-btn size="x-small" flat icon="mdi-close"
                   v-on:click="deltrip(item)"></v-btn>
        </template>
    </v-data-table>
</template>
<script>
import { profile } from "app-ext/composables/profile";
import { all } from "~/composables/data";
import { getorderhst, deltrip } from "~/services/order";
import ArCompanyOrders from "~/components/ArCompanyOrders";
import ArTripDlg from "~/components/ArTripDlg";

const _HDRS = [
    {title: ' ',       key: 'diff', sortable: false},
    {title: 'ТС',      key: '$vehicle', sortable: false},
    {title: 'Водитель',key: 'driver', sortable: false},
    {title: 'Даты',    key: 'period', sortable: false},
    {title: 'Грузоподьемность',  key: 'capacity', sortable: false},
    {title: 'Назначено/Загружено/Выгружено',  key: 'tonnage', sortable: false},
    {title: 'Цена',    key: 'price', sortable: false},
    {title: 'Статус',  key: 'status', sortable: false},
    {title: 'Действия',key: 'actions', sortable: false}
];


export default {
    name: 'ordersPage',
    components: {
        ArCompanyOrders,
        ArTripDlg
    },
    async setup(){
        const order = ref(null),
              tab   = ref(0),
              trips = ref([]);

        definePageMeta({
            key: 'ordersPage',
            keepalive: true
        });
        
        const at = computed( ()=>all.at ); //for reloading
        
        console.log('order', order);
        
        useHead({
            title: order.value ? `${ order.value.order.number }}. ${ order.value.order.move_direction?.title} ` : "Заказы"
        });
        
        const { pending, error } = useAsyncData('company-order_trips', async ()=>{
            if (!order.value){
                trips.value = [];
                return false;
            }
            const filters = `organization_orders_id:${order.value.id},state:${ (0 === tab.value) ? 'IN_EXECUTION' : 'COMPLETED'}`;
            let res = true;
            try {
                trips.value = await getorderhst(filters);
                console.log('trips', trips);
            } catch(e){
                console.log('ERR (trips)', e);
                res = false;
            }
            setTimeout(()=>{
                $('.v-data-table-group-header-row button:has(.mdi-chevron-right)').trigger('click');
            }, 200);
            return res;
        }, { watch: [order, tab, at] });
        
        return {
            order,
            trips,
            pending,
            error,
            tab
        };
    },
    data(){
        return {
            hdrs: _HDRS,
            menu: false,
            selected: []
        };
    },
    computed: {
        direction(){
            return this.has('order') 
                    ? this.order.order.number + '. ' + this.order.order.move_direction?.title 
                    : 'выбрать направление'
        }
    },
    methods: {
        has(q){
            switch(q){
                case 'order':
                    return !!this.order?.order;
            }
            return false;
        },
        use(order){
            this.menu = false;
            this.order = order;
        },
        ontrip(trip){
            console.log('trip (edit)', this.order, trip);
            if (!this.order){
                $jet.msg({text: "Необходимо выбрать направление", color: "warning", imeout: 10000});
                return;
            }
            const order = this.order.order;
            order.org_order_id = this.order.id;
            order.price = this.order.price;
            order.distributed_cargo_count = this.order.distributed_cargo_count;
            this.$refs["dlg"].open(order, trip);
        },  //ontrip
        onmodify(trip){
            console.log('refresh by', trip);
            let n = this.trips.findIndex( t => (t.id === trip.id) );
            if ( n < 0 ){
                this.trips.push(trip);
            } else {
                this.trips.splice(n, 1, trip);
            }            
        },   //onmodify
        deltrip(trip){
            $jet.msg({
                text: `<b>Подтвердите удаление рейса</b><br />${ this.direction }<br />транспорт: ${ trip.$vehicle }<br />период: ${ trip.period }`, 
                color: 'indigo',
                click: ok => {
                    if ( !ok ){
                        return;
                    }
                    deltrip(trip).then( res => {
                        if (res.success){
                            let n = this.trips.findIndex( t => (t.id === trip.id) );
                            if ( n > -1 ){
                                this.trips.splice(n, 1);
                            }
                        }
                    }).catch( e => {
                        console.log('ERR (del)', e);
                        $jet.msg({
                            text: `Ошибка удаления рейса:<br />${ $jet.api.$errm || e.message }`, 
                            color: 'warning'
                        });
                    });
                },
                click_title: 'удалить',
                timeout: 60000
            });
        },
        onclickrow(e, {item}){
            this.selected = [item.id];
            $('.ar-trips table tr.v-data-table__selected').removeClass('v-data-table__selected');
            $(e.target).closest('tr').addClass('v-data-table__selected');
        }
    }
}
</script>
<style lang="scss">
    .ar-order{
        &__title{
            padding: 0 1rem;
        }
        &__details {
            & .v-list-item {
                height: fit-content;
                min-height: unset;
                &__append {
                    min-width: 7rem;
                    align-items: center;
                    text-align: right;
                    justify-content: center;
                    &:has(.v-progress-linear){
                        align-items: flex-end;
                        flex-direction: column;
                    }
                }
            }
        }
    }
    .ar-trips{
        font-size: 0.85rem;
        & tr {
            & th, & th span, & td {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                &:nth-child(3){
                    max-width: 15rem;
                }
                &:nth-child(6), &:nth-child(8){
                    max-width: 10rem;
                }
            }
            & th:first-child{
                & span{ display: none; }
            }
        }
        & tbody {
            & tr {
                & td:first-child{
                    padding: 0 !important;
                }
                & td:nth-child(6), & td:nth-child(8){
                    text-align: right;
                }
            }
        }
        & .v-data-table{
            &__selected{
                & td{
                    background: #FFFDE7 !important;
                    border-bottom: 1px solid #FFB300 !important;
                }
            }
            &-footer{
                display: none;
            }
        }
        &_add {
            right: 1rem;
            bottom: 4rem;
        }
    }
</style>