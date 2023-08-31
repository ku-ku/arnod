<template>
    <v-dialog v-model="show"
              scrollable
              max-width="720"
              content-class="ar-vehicle__expdetails"
              :fullscreen="mobile">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title><b>{{ vehicle?.vehicle }}</b>&nbsp;(расшифровка затрат)</v-toolbar-title>
            <v-spacer />
            <v-btn size="small"
                   icon="mdi-close"
                   v-on:click="show = false"></v-btn>
        </v-toolbar>
        <v-card flat
                rounded="0">
            <v-card-text v-if="pending">
                <v-skeleton-loader type="list-item@3" />
            </v-card-text>
            <v-card-text v-else-if="error">
            </v-card-text>
            <v-card-text v-else>
                <v-data-table density="compact"
                            fixed-header
                            disable-sort
                            no-filter
                            hover
                            :headers="_HDRS"
                            :items="data"
                            :items-per-page="-1"
                            :model-value="selected"
                            item-value="vehicle"
                            single-select
                            disable-pagination
                            hide-default-footer
                            no-data-text="...">
                    <template v-slot:item.cost_original="{ item }">
                        {{ format(item.raw.cost_original, 2) }}
                    </template>    
                </v-data-table>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn size="small"
                       variant="elevated"
                       prepend-icon="mdi-close"
                       v-on:click="show = false">
                    закрыть
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { all } from "~/composables/data";
import { getexpences } from "~/services/vehicle";
import { useDisplay } from 'vuetify';

const _HDRS = [
    {title: 'Дата',    key: 'date',         width: '20px'},
    {title: 'Статья',  key: 'exp_type',     width: 'auto'},
    {title: 'Описание',key: 'description',  width: 'auto'},
    {title: 'Юр.лицо', key: 'contra',       width: 'auto'},
    {title: 'Сумма',   key: 'cost_original',width: '20px'}
];

    
export default {
    name: 'ArVehicleExpences',
    async setup(){
        const vehicle = ref({id: -1});
        const {data, pending, error} = useAsyncData('vehicle-expences', async ()=>{
            console.log('vehicle', vehicle);
            
            if ( !(vehicle.value?.id > 0) ){
                return [];
            }
            const res = await getexpences(vehicle.value.id, all.period.start, all.period.end);
            console.log('expences', res);
            return res;
        }, {
            watch: [vehicle]
        });
        
        return {
            vehicle,
            data,
            pending,
            error
        };
        
    },
    data(){
        return {
            _HDRS,
            show: false,
            mobile: useDisplay().mobile
        };
    },
    methods: {
        open(vehicle){
            this.vehicle = vehicle;
            this.show = true;
        },
        format(n, digits = 2){
            if ( n ){
                var n = Number(n);
                return Number.isNaN(n) ? '' : new Intl.NumberFormat("ru-RU", {minimumFractionDigits: digits}).format(n);
            }
            return '';
        }
    }
}    
</script>
<style lang="scss">
    .ar-vehicle{
        &__expdetails{
            & .v-toolbar{
                &-title{
                    font-size: 0.9rem;
                }
            }
            & .v-data-table{
                & table {
                    & tr{
                        & td:last-child{
                            text-align: right;
                        }
                        &:last-child{
                            font-weight: bold;
                        }
                    }
                }
                &-footer{
                    display: none !important;
                }
            }
        }
        
    }
</style>