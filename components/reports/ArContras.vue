<template>
    <v-skeleton-loader type="list-item@3" 
                       v-if="pending" />
    <v-data-table v-else
                  density="compact"
                  ref="table"
                  class="ar-contras"
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
        <template v-slot:item.contractor_name="{ item }">
            <span v-if="item.raw.sum_price===null" class="text-grey">
                {{ item.raw.contractor_name }}
            </span>
            <template v-else>
                {{ item.raw.contractor_name }}
            </template>    
        </template>
        <template v-slot:item.sum_price="{ item }">
            {{ format(item.raw.sum_price) }}
            <v-chip v-if="item.raw.trend !== null"
                    class="ml-3"
                    size="small"
                    :text="item.raw.trend + '%'"
                    :color="item.raw.trend > 0 ? 'primary' : 'red-accent-4' ">
            </v-chip>
        </template>
    </v-data-table>
</template>
<script>
import ArBaseReport from "./ArBaseReport";
import { all } from "~/composables/data";
import { getbycontras } from "~/services/company";

const _HDRS = [
    {title: 'организация',  key: 'contractor_name', sortable: true, fixed: true, width: 120},
    {title: 'сумма',        key: 'sum_price',       sortable: true, width: 120}
];

export default {
    name: 'ArContras',
    extends: ArBaseReport,
    async setup(props, { emit }){
        const items = ref([]);
             
        const {pending, error} = useAsyncData('company', async ()=>{
            try {
                const res = await getbycontras(all.period.start, all.period.end);
                emit('count', res.length);
                let now = new Date(),
                    s = 0;
                res.forEach( (r, n) => {
                    r.id = n;
                    r.trend = 100;
                    s += Number(r.sum_price);
                });
                res.push({contractor_name: 'ИТОГО', sum_price: s, trend: null});
                
                /* get prev`s */
                let d2 = $moment(all.period.start).add(-1, 'months'),
                    d3 = $moment(all.period.end).add(-1, 'months'),
                    item;
                let prevDays = d3.diff(d2, 'days'); 
                
                getbycontras(d2.toDate(), d3.toDate()).then( prev => {
                    let n, pc, total = 0,
                        k = ( now.getMonth() === all.period.start.getMonth() ) ? now.getDate()/prevDays : 1;
                    
                    prev.forEach( p => {
                        total += Number(p.sum_price);
                        n = res.findIndex( r => r.contractor_name == p.contractor_name );
                        if ( n >- 1){
                            item = res[n];
                            if (p.sum_price > 0){
                                pc = item.sum_price/(p.sum_price * k) * 100;
                                item.trend = Number(( pc > 100 ) ? pc - 100 : -(100 - pc)).toFixed(1);
                            } else {
                                item.trend = 100;
                            }
                            res.splice(n, 1, item);
                        } else {
                            p.sum_price = null;
                            p.trend = -100;
                            res.splice(res.length - 1, 0, p);
                        }
                    });
                    if ( total > 0 ){
                        n = res.findIndex( r => r.contractor_name == 'ИТОГО' );
                        item = res[n];
                        pc = item.sum_price/(total * k) * 100;
                        item.trend = Number(( pc > 100 ) ? pc - 100 : -(100 - pc)).toFixed(1);
                        res.splice(n, 1, item);
                    }
                    emit('count', res.length);
                    items.value = res;
                }).catch(e => {
                    items.value = res;
                    console.log('ERR (prev-per)', e);
                });
                return;
            } catch(e){
                console.log('ERR (contras)', e);
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
    .ar-contras{
        & table {
            & tr{
                & td {
                    text-align: right;
                    &:first-child{
                        text-align: left;
                    }
                }
                &:last-child{
                    & td{
                        font-weight: 600;
                    }
                }
            }
        }
        & .v-data-table-footer{
            display: none;
        }
    }
</style>