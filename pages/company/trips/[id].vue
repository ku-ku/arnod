<template>
    <Teleport to=".ar-title">
        <div class="ar-order__title">
            <v-badge :content="item.order.move_direction.distance + ' км'"
                     inline>
                #<b>{{ item.order.number }}</b>. {{ item.order.move_direction.title }}
            </v-badge>    
            <div class="text-muted">
                {{ item.order.period }}
            </div>
        </div>
    </Teleport>
    <v-row>
        <v-col cols="12" sm="6">
            <v-list density="compact" class="ar-order__details">
                <v-list-item prepend-icon="mdi-account-tie"
                             :title="item.order.contractor.title">
                </v-list-item>
                <v-list-item prepend-icon="mdi-seed-outline"
                             :title="item.order.cargo_name?.title">
                    <template v-slot:append>
                        <v-btn flat
                               append-icon="mdi-pencil">
                            {{item.order.cargo_units_count}}&nbsp;({{ item.order.cargo_unit.title }})
                        </v-btn>
                    </template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-truck-cargo-container"
                             title="распределено">
                    <template v-slot:append>
                        {{ item.distributed_cargo_count }}
                        <v-progress-linear color="primary"
                                           :model-value="item.order.pc_distributed" 
                                           :height="7"></v-progress-linear>
                    </template>
                </v-list-item>
                <v-list-item prepend-icon="mdi-weight-lifter"
                             title="исполнено">
                    <template v-slot:append>
                        <v-progress-linear color="primary"
                                           :model-value="item.order.pc_executed" 
                                           :height="7"></v-progress-linear>
                        {{ item.executed_cargo_count }}
                    </template>
                </v-list-item>
            </v-list>
        </v-col>
    </v-row>
    <v-tabs v-model="tab"
            color="primary">
        <v-tab :value="0">На исполнении</v-tab>
        <v-tab :value="1">Выполненные рейсы</v-tab>
    </v-tabs>
    <v-data-table density="compact"
                  class="ar-trips"
                  :loading="pending"
                  :items="data"
                  items-per-page="-1"
                  :headers="hdrs"
                  :group-by="[{ key: 'at'}]"
                  fixed-header
                  hover
                  select-strategy="single"
                  return-object>
        <template v-slot:item.status="{ item }">
            {{ item.status }}
            <div v-if="item.dt" class="text-muted">
                {{item.dt.format('DD.MM.YYYY HH:mm')}} / {{ item.duru }}
            </div>
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn size="small" flat icon="mdi-pencil"></v-btn>
            <v-btn size="small" flat icon="mdi-close"></v-btn>
        </template>
    </v-data-table>
</template>
<script>
import { all } from "~/composables/data";
import { getorderhst } from "~/services/order";

const _HDRS = [
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
    name: 'tripsPage',
    async setup(){
        const item = useState('company-order'),
              tab  = ref(0),
              data = ref([]);
      
        console.log('order', item);
        
        const {pending, error} = useAsyncData('company-order_trips', async ()=>{
            const filters = `organization_orders_id:${item.value.id},state:${ (0 === tab.value) ? 'IN_EXECUTION' : 'COMPLETED'}`;
            let res = true;
            try {
                data.value = await getorderhst(filters);
                console.log('trips', data);
            } catch(e){
                console.log('ERR (trips)', e);
                res = false;
            }
            setTimeout(()=>{
                $('.v-data-table-group-header-row button:has(.mdi-chevron-right)').trigger('click');
            }, 200);
            return res;
        }, { watch: [item, tab] });
        
        return {
            item,
            tab,
            data,
            pending,
            error
        };
    },
    data(){
        return {
            hdrs: _HDRS
        };
    },
    methods: {
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
        font-size: 0.75rem;
        & tr {
            & th, & th span, & td {
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;
                &:nth-child(2){
                    max-width: 15rem;
                }
                &:nth-child(5), &:nth-child(6){
                    max-width: 10rem;
                }
            }
            & th:first-child{
                & span{ display: none; }
            }
        }
        & tbody {
            & tr {
                & td:nth-child(5), & td:nth-child(7){
                    text-align: right;
                }
            }
        }
        
        & .v-data-table-footer{
            display: none;
        }
    }
</style>