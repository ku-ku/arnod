<template>
    <v-skeleton-loader type="list-item@3" 
                       v-if="pending" />
    <v-data-table v-else
                  density="compact"
                  ref="table"
                  class="ar-incoms"
                  fixed-header
                  disable-sort
                  no-filter
                  height="100%"
                  hover
                  :headers="headers"
                  :items="items"
                  :items-per-page="-1"
                  :model-value="selected"
                  single-select
                  disable-pagination
                  hide-default-footer
                  no-data-text="..."
                  return-object>
        <template v-slot:item.daily="{ item }">
            {{ format(item.raw.daily, 0) }}
        </template>
        <template v-slot:item.tonne_km="{ item }">
            {{ format(item.raw.tonne_km, 0) }}
        </template>
        <template v-slot:item.immobility="{ item }">
            {{ format(item.raw.immobility, 0) }}
        </template>
        <template v-slot:item.total_income_period="{ item }">
            {{ format(item.raw.total_income_period, 0) }}
        </template>
        <template v-slot:item.total_payed="{ item }">
            {{ format(item.raw.total_payed, 0) }}
        </template>
        <template v-slot:item.prepayment="{ item }">
            {{ format(item.raw.prepayment, 0) }}
        </template>
        <template v-slot:item.inventory_items="{ item }">
            {{ format(item.raw.inventory_items, 0) }}
        </template>
        <template v-slot:item.penalty="{ item }">
            {{ format(item.raw.penalty, 0) }}
        </template>
        <template v-slot:item.bonus="{ item }">
            {{ format(item.raw.bonus, 0) }}
        </template>
        <template v-slot:item.fuel_economy_income="{ item }">
            <v-chip v-if="item.raw.fuel_economy_income < 0" color="red-accent-4">
                {{ format(item.raw.fuel_economy_income, 0) }}
            </v-chip>
            <template v-else>
                {{ format(item.raw.fuel_economy_income, 0) }}
            </template>
        </template>
        <template v-slot:item.total="{ item }">
            {{ format(item.raw.total, 0) }}
        </template>
    </v-data-table>
</template>
<script>
import ArBaseReport from "./ArBaseReport";
import { all } from "~/composables/data";
import { getincoms } from "~/services/company";
import { colorize } from "./ArBaseReport";

const _HDRS = [
    {title: 'водитель',         key: 'driver',      sortable: true, fixed: true, width: 140},
    {title: 'суточные',         key: 'daily',       sortable: true, width: 100},
    {title: 'з/п тонно/км',     key: 'tonne_km',    sortable: true, width: 100},
    {title: 'простои',          key: 'immobility',  sortable: true, width: 100},
    {title: 'начислено',        key: 'total_income_period', sortable: true, width: 100},
    {title: 'выплачено',        key: 'total_payed', sortable: true, width: 100},
    {title: 'аванс',            key: 'prepayment',  sortable: true, width: 100},
    {title: 'ТМЦ',              key: 'inventory_items', sortable: true, width: 100},
    {title: 'штрафы',           key: 'penalty',     sortable: true, width: 100},
    {title: 'премия',           key: 'bonus',       sortable: true, width: 100},
    {title: '(де)премирование', key: 'fuel_economy_income', sortable: true, width: 100},
    {title: 'итого на руки',    key: 'total',       sortable: true, width: 100}
];

export default {
    name: 'ArIncoms',
    extends: ArBaseReport,
    async setup(props, { emit }){
        const {data: items, pending, error} = useLazyAsyncData('company', async ()=>{
            try {
                const res = await getincoms(all.period.start, all.period.end),
                    total = {
                                driver: 'ИТОГО',
                                daily: 0,
                                tonne_km: 0,
                                immobility: 0,
                                total_income_period: 0,
                                total_payed: 0,
                                prepayment: 0,
                                inventory_items: 0,
                                penalty: 0,
                                bonus: 0,
                                fuel_economy_income: 0,
                                total: 0
                            };
                emit('count', res.items?.length || 0);
                res.items.forEach( r => {
                    Object.keys(r).forEach( k => {
                        let n = Number( r[k] );
                        if ( !Number.isNaN(n) ){
                            total[k] += n;
                        }
                    });
                });
                res.items.push( total );
                colorize(".v-table.ar-incoms");
                return res.items;
            } catch(e){
                console.log('ERR (incoms)', e);
                emit('error', e);
            }
        });
        
        return {
            headers: _HDRS,
            selected: [],
            pending,
            error,
            items
        };
    }
    
};
</script>
<style lang="scss">
    .ar-incoms{
        & table {
            font-size: 0.75rem;
            line-height: 1.115;
            & tr{
                & > th{
                    font-weight: 600 !important;
                    text-align: center !important;
                    &:first-child{
                        text-align: left !important;
                    }
                }
                & > td {
                    text-align: right;
                    &:first-child{
                        text-align: left;
                        font-weight: 600;
                    }
                    & .v-chip{
                        --v-chip-size: 0.65rem;
                        --v-chip-height: 0;
                        padding: 0.25rem 0.5rem;
                        font-size: 0.65rem;
                        border-radius: 4px;
                        line-height: 1.115;
                    }
                }
            }
        }
        & .v-data-table-footer{
            display: none;
        }
    }
</style>