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
            <v-btn size="small"
                   variant="text" 
                   class="text-decoration-underline"
                   v-on:click="dodetails(item.raw)">
                {{ format(item.raw.total_income_period, 0) }}
            </v-btn>
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
    <v-alert v-if="!pending"
             class="ar-drivers__empty"
             :title="'не в списке (' + emptyEmps.length + '):'"
             closable
             v-model="showEmpty"
             icon="mdi-account-alert-outline">
        {{ emptyEmps.join(", ") }}
    </v-alert>
    <div v-if="(emptyEmps.length > 0) && !showEmpty" class="text-right ma-3">
        <v-btn size="small" v-on:click="showEmpty = true">
            <v-badge :content="emptyEmps.length"
                     inline
                     color="grey">
                не в списке
            </v-badge>
        </v-btn>
    </div>
    <ar-income-details ref="details" />
</template>
<script>
import ArBaseReport from "./ArBaseReport";
import ArIncomeDetails from "./ArIncomeDetails";
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
    components: {
        ArIncomeDetails
    },    
    async setup(props, { emit }){
        
        const emptyEmps = ref([]),
              showEmpty = ref(true);
        
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
                            },
                    empty = [];
                    
                emit('count', res.items?.length || 0);
                
                res.items.forEach( r => {
                    r.valid = false;
                    Object.keys(r).forEach( k => {
                        let n = (k !== 'driver_id') && (r[k]) ?  Number( r[k] ) : Number.NaN;
                        if ( !Number.isNaN(n) ){
                            total[k] += n;
                            r.valid = true;
                        }
                    });
                    if ( !r.valid ){
                        empty.push(r.driver);
                    }
                });
                
                console.log('empty', empty, res.items);
                
                emptyEmps.value = empty.sort( (s1, s2)=>{
                    return s1?.localeCompare(s2);
                });
                showEmpty.value = (emptyEmps.value.length > 0);
                
                res.items = res.items.filter(r => r.valid).sort((r1, r2) => {
                    return r1.driver?.localeCompare(r2.driver);
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
            items,
            emptyEmps,
            showEmpty
        };
    },
    methods: {
        dodetails(driver){
            this.$refs["details"].open(driver);
        }
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
    .ar-drivers__empty{
        margin: 1rem;
        font-size: 0.75rem;
        line-height: 1.125;
        white-space: normal;
    }

</style>