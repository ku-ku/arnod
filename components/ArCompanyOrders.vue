<template>
    <div class="ar-orders">
        <v-tabs v-model="tab"
                color="primary"
                density="compact">
            <v-tab v-for="t in tabs"
                   :key="'tab-' + t.value"
                   :value="t.value">
                {{ t.title }}
            </v-tab>
        </v-tabs>
        <v-data-table density="compact"
                      :loading="pending"
                      :items="orders"
                      items-per-page="-1"
                      :headers="hdrs"
                      hover
                      select-strategy="single"
                      return-object
                      v-on:click:row="select">
            <template v-slot:item.title="{ item }">
                {{ item.order.move_direction.title }}
                <div class="text-muted"
                     v-if="item.vehicles">
                    {{ item.vehicles.map( v => v.reg_number ).join(", ") }}
                </div>
            </template>
            <template v-slot:item.cargo_count="{ item }">
                {{ item.order.cargo_units_count}}
            </template>
            <template v-slot:item.distributed="{ item }">
                {{ item.distributed_cargo_count }} / {{ item.executed_cargo_count }}
            </template>
        </v-data-table>
    </div>    
</template>
<script>
import { profile } from "app-ext/composables/profile";
import { getorders } from "~/services/order";
    
const _NAVS = [
        {title: "в работе", icon: "mdi-truck-fast-outline", value: 0, filter: "in_execution"},
        {title: "завершенные", icon: "mdi-checkbox-marked-circle-outline", value: 1, filter: "allowed"},
        {title: "завершенные с возвратом", icon: "mdi-alert-circle-check-outline", value: 2, filter: "denied"},
        {title: "поиск...", icon: "mdi-magnify", value: 100}
];

const _HDRS = [
    {title: '№', key: 'order.number', sortable: false},
    {title: 'Направление', key: 'title', sortable: false},
    {title: 'Даты', key: 'order.period', sortable: false},
    {title: 'км.', key: 'order.move_direction.distance', sortable: false},
    {title: 'груз', key: 'order.cargo_name.title', sortable: false},
    {title: 'объем (т)', key: 'cargo_count', sortable: false},
    {title: 'распр/исп', key: 'distributed', sortable: false}
];

    
export default {
    name: 'ArCompanyOrders',
    setup(props, { emit }){
        const tab = ref(0),
              tabs = ref(_NAVS),
              orders = ref([]);
        
        const { pending, error } = useLazyAsyncData('company-orders', ()=>{
            return new Promise( (resolve, reject) => {
                try {
                    if ( orders.value.length > 0 ) {
                        resolve(true);
                        return;
                    }
                    
                    let val = tab.value;
                    val = tabs.value.findIndex( i => i.value === val);
                    val = (val < 0) ? "in_execution" : tabs.value[val].filter;

                    const filter = {
                        type: "and",
                        values: [
                            {type: "eq", field: "organizations_id", values: [profile.tenant?.id]},
                            {type: "like", field: "status", values: [ val ]}
                        ]
                    };

                    getorders(filter).then( res => {
                        console.log('orders-2', res);
                        orders.value = res;
                        $jet.worker.addEventListener("message", e => {
                            console.log('message', e);
                            if ( ("read" === e.data.type) && (e.data["active-order"]) ){
                                let n = res.findIndex( r => r.id == e.data["active-order"] );
                                if ( n > -1 ){
                                    emit('select', res[n]);
                                }
                            }
                        }, {once: true});
                        $jet.worker.postMessage({ type:"read", name: "active-order" });
                        resolve(true);
                    }).catch( e => {
                        console.log('ERR (orders)', e);
                        reject(e);
                    });
                } catch(e){
                    console.log('ERR (orders)', e);
                    reject(e);
                }
            });
        });
        
        return {
            hdrs: _HDRS,
            orders,
            pending,
            error,
            tab,
            tabs
        };
        
    },
    methods: {
        select(e, { item }){
            this.$emit('select', item);
            $jet.worker.postMessage({ type:"save", name: "active-order", data: item.id });
        }
    },
    watch: {
        tab(val){
            this.orders = [];
            refreshNuxtData('company-orders');
        }
    }
}    
</script>
<style lang="scss">
    .ar-orders{
        background: #fff;
        & .v-data-table{
            &-footer{
                display: none;
            }
        }
    }
</style>