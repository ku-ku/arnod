<template>
    <v-skeleton-loader type="list-item@3" 
                       v-if="pending" />
    <v-data-table v-else
                  density="compact"
                  ref="table"
                  class="ar-fuel"
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
        <template v-slot:item.fuel_remains_period_start="{ item }">
            {{ format(item.raw.fuel_remains_period_start, 0) }}
        </template>
        <template v-slot:item.fuel_remains_period_end="{ item }">
            {{ format(item.raw.fuel_remains_period_end, 0) }}
        </template>
        <template v-slot:item.refueled_for_period="{ item }">
            <v-chip v-if="item.raw.bad_fuel" color="red-accent-4">
                {{ format(item.raw.refueled_for_period, 0) || '' }}
                &nbsp;<small>({{ format(item.raw.consumption, 0) }} )</small>
            </v-chip>
            <template v-else>
                {{ item.raw.total ? item.raw.refueled_for_period : format(item.raw.refueled_for_period, 0) }}
            </template>
        </template>
        <template v-slot:item.odometer="{ item }">
            <v-chip v-if="item.raw.bad_odm" color="red-accent-4">
                {{ format(item.raw.odometer, 0) }}
            </v-chip>
            <template v-else>
                {{ item.raw.total ? item.raw.odometer : format(item.raw.odometer, 0) }}
            </template>
        </template>
    </v-data-table>
</template>
<script>
import ArBaseReport from "./ArBaseReport";
import { colorize } from "./ArBaseReport";
import { all } from "~/composables/data";
import { getfuel } from "~/services/company";

const _HDRS = [
    {title: 'ТС',  key: 'reg_number',    sortable: true, fixed: true, width: 100},
    {title: 'бак', key: 'fuel_capacity', sortable: true, width: 100},
    {title: 'остаток на начало',       key: 'fuel_remains_period_start', sortable: false, width: 100},
    {title: 'остаток на конец',        key: 'fuel_remains_period_end', sortable: false, width: 100},
    {title: 'заправлено за период',    key: 'refueled_for_period', sortable: true, width: 100},
    {title: 'пробег за период',        key: 'odometer', sortable: true, width: 100}
];

export default {
    name: 'ArFuel',
    extends: ArBaseReport,
    async setup(props, { emit }){
        const now = new Date();
        const {data: items, pending, error} = useLazyAsyncData('company', async ()=>{
            try {
                const res = await getfuel(all.period.start, all.period.end),
                    total = {
                        odometer: 0,
                        fuel_end: 0,
                        refueled: 0,
                        avgodometer: 0,
                        avgconsumption: 0
                    };
                emit('count', res.length);

                res.forEach( r => {
                    if (!r.odometer_period_start){
                        r.odometer = 0;
                    } else {
                        r.odometer = Number(r.odometer_period_end) - Number(r.odometer_period_start);
                    }
                    total.odometer += r.odometer;
                    
                    if (r.refueled_for_period){
                        total.refueled += Number(r.refueled_for_period);
                    }
                    if (r.fuel_remains_period_end){
                        total.fuel_end += Number(r.fuel_remains_period_end);
                    }
                    
                    r.consumption = Number(r.fuel_remains_period_end) + Number(r.refueled_for_period) - Number(r.fuel_remains_period_start);
                    if (r.avg_remain < r.consumption){
                        r.consumption = r.consumption-Number(r.avg_remain);
                    }
                    
                    //r.consumption -= 200;
                    r.consumption = (r.odometer > 0) ? Math.round(r.consumption*100.0/r.odometer) : 0;
                });
                
                /**
                 * ср.расход: 30% относительно медианы
                 */
                let medcons, cons = res.map( r => r.consumption || 0 )
                                       .filter( r => r > 10 )
                                       .sort( (c1, c2) => {
                    return (c1 < c2) ? -1 : c1 > c2 ? 1 : 0;
                });
                medcons = (cons.length > 1) ? cons[Math.trunc(cons.length / 2)] : 0;
                cons = cons.filter( c => (c > medcons*0.7) && (c < medcons*1.3) );
                if ( cons.length > 0 ){
                    cons.forEach( c => total.avgconsumption += c);
                    total.avgconsumption = Math.round(total.avgconsumption / cons.length);
                }
                
                /**
                 * ср.пробег: 100% относительно медианы
                 */
                let medods, ods = res.map( r => r.odometer || 0 ).filter( r => r > 0 ).sort( (o1, o2) => {
                    return (o1 < o2) ? -1 : o1 > o2 ? 1 : 0;
                } );
                medods = (ods.length > 1) ? ods[Math.trunc(ods.length / 2)] : 0;
                ods = ods.filter( o => (o > medods*0.5) && (o < medods*2) );
                if ( ods.length > 0 ){
                    ods.forEach( o => total.avgodometer += o);
                    total.avgodometer = total.avgodometer / ods.length;
                }
                
                total.odometer = 0;
                res.forEach( r => {
                    r.bad_fuel = (r.consumption) ? r.consumption > (total.avgconsumption*1.3) : false;
                    r.bad_odm  = (r.odometer) ? r.odometer > (total.avgodometer * 2) : false;
                    total.odometer += r.bad_odm ? total.avgodometer : r.odometer;
                });
                
                res.push({
                    total: true,
                    reg_number: 'ИТОГО',
                    fuel_remains_period_end: total.fuel_end,
                    refueled_for_period: Math.trunc(total.refueled) + ' (ср.: ' + Math.trunc(total.avgconsumption) + ' л./100км)',
                    odometer: Math.trunc(total.odometer) + ' (ср.: ' + Math.trunc(total.avgodometer) + ' км)'
                });
                
                colorize(".v-table.ar-fuel");
                return res;
            } catch(e){
                console.log('ERR (fuel)', e);
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
    .ar-fuel{
        & table {
            & tr{
                & th{
                    &:first-child{
                        text-align: left !important;
                    }
                }
                & td {
                    text-align: right;
                    &:first-child{
                        text-align: left;
                        font-weight: 600;
                        z-index: 1;
                        background-color: #fff !important;
                    }
                }
            }
        }
        & .v-data-table-footer{
            display: none;
        }
    }
</style>
