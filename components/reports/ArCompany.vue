<template>
    <v-skeleton-loader type="list-item@3" 
                       v-if="pending" />
    <div v-else-if="has('data')" 
         class="ar-company">
        <v-list density="compact">
            <v-list-item title="Валовый доход"
                         class="text-h6">
                <template v-slot:append>
                        {{ format(totals.gross) }}
                    <v-chip v-if="totals.pc('gross')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('gross') + '%'"
                            :color="totals.pc('gross') > 0 ? 'primary' : 'red-accent-4'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item title="Валовый расход">
                <template v-slot:append>
                    {{ format(totals.expenses) }}
                    <v-chip v-if="totals.pc('expenses')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('expenses') + '%'"
                            :color="totals.pc('expenses') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item title="Вал зарплаты:"
                         style="border-bottom: 0 none;"
                         :class="{'text-h6': true, nouse: !totals.incSlr}">
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incSlr" 
                                color="primary" />
                </template>
            </v-list-item>
            <v-list-item title="на руки"
                         :class="{nouse: !totals.incSlrSlr}">
                <template v-slot:append>
                    {{ format(totals.expenses_driver) }}
                    <v-chip v-if="totals.pc('expenses_driver')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('expenses_driver') + '%'"
                            :color="totals.pc('expenses_driver') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incSlrSlr" 
                                color="primary" />
                </template>
            </v-list-item>
            <v-list-item title="налог"
                         :class="{nouse: !totals.incSlrVat}">
                <template v-slot:append>
                    {{ format(totals.expenses_driver_vat) }}
                    <v-chip v-if="totals.pc('expenses_driver_vat')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('expenses_driver_vat') + '%'"
                            :color="totals.pc('expenses_driver_vat') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incSlrVat" 
                                color="primary" />
                </template>
            </v-list-item>
            <v-list-item title="Вал расход ГСМ:"
                         style="border-bottom: 0 none;"
                         :class="{'text-h6': true, nouse: !totals.incFuel}">
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incFuel" 
                                color="primary" />
                </template>
            </v-list-item>
            <v-list-item title="фактический"
                         :class="{nouse: !totals.incFuelActual}">
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incFuelActual"  
                                color="primary"
                                true-icon="mdi-record-circle-outline"
                                false-icon="mdi-circle-outline" />
                </template>
                <template v-slot:append>
                    {{ format(totals.actual_fuel_expenses) }}
                    <v-chip v-if="totals.pc('actual_fuel_expenses')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('actual_fuel_expenses') + '%'"
                            :color="totals.pc('actual_fuel_expenses') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item title="расчётный"
                         :class="{nouse: !totals.incFuelEst}">
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incFuelEst"  
                                color="primary"
                                true-icon="mdi-record-circle-outline"
                                false-icon="mdi-circle-outline"  />
                </template>
                <template v-slot:append>
                    {{ format(totals.estimated_fuel_expenses) }}
                    <v-chip v-if="totals.pc('estimated_fuel_expenses')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('estimated_fuel_expenses') + '%'"
                            :color="totals.pc('estimated_fuel_expenses') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item title="отчётный"
                         :class="{nouse: !totals.incFuelRep}">
                <template v-slot:prepend>
                    <v-checkbox v-model="totals.incFuelRep"  
                                color="primary"
                                true-icon="mdi-record-circle-outline"
                                false-icon="mdi-circle-outline"  />
                </template>
                <template v-slot:append>
                    {{ format(totals.reported_fuel_expenses) }}
                    <v-chip v-if="totals.pc('reported_fuel_expenses')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('reported_fuel_expenses') + '%'"
                            :color="totals.pc('reported_fuel_expenses') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item title="ИТОГО расход"
                         class="text-h6">
                <template v-slot:append>
                    {{ format(totals.totalExp, 2) }}
                    <v-chip v-if="totals.pc('totalExp')!==null"
                            class="ml-3"
                            size="small"
                            :text="totals.pc('totalExp') + '%'"
                            :color="totals.pc('totalExp') > 0 ? 'red-accent-4' : 'primary'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item title="Вал прибыль"
                         class="text-h6">
                <template v-slot:append>
                    {{ format(totals.totalProfit, 2) }}
                    <v-chip v-if="totals.pc('totalProfit')!==null"
                            class="ml-3 px-3"
                            size="small"
                            :text="format(totals.pc('totalProfit')) + '%'"
                            :color="totals.pc('totalProfit') > 0 ? 'primary' : 'red-accent-4'">
                    </v-chip>
                </template>
            </v-list-item>
            <v-list-item>
                <template v-slot:prepend>
                    <v-chip class="mr-2"
                            size="small"
                            elevation="2"
                            rounded="rounded"
                            prepend-icon="mdi-truck-outline">
                        {{ totals.vehicles.num }}
                    </v-chip>
                </template>
                <div class="ar-stats">
                    <div>
                        тоннаж:&nbsp;{{ format(totals.vehicles.tonnage, 0) }}&nbsp;т.
                    </div>
                    <div>
                        перевезено:&nbsp;{{ format(totals.vehicles.unloaded, 1) }}&nbsp;т.
                    </div>
                    <div>
                        пробег:&nbsp;{{ format(totals.vehicles.distance,0) }}&nbsp;(ср.:{{ format(totals.vehicles.avg_distance, 0) }})&nbsp;км.
                    </div>
                    <div>
                        заправлено:&nbsp;{{ format(totals.vehicles.refueled,0) }}&nbsp;л.
                    </div>
                    <div>
                        ср.расход:&nbsp;{{ format(totals.vehicles.norm_consumption, 1) }}&nbsp;({{totals.vehicles.avg_consumption}})&nbsp;л/100км
                    </div>
                </div>
            </v-list-item>
        </v-list>
        <div class="ar-company__chart">
            <canvas id="chart"></canvas>
        </div>
        <v-list v-if="expences.show && (expences.items.length > 0)"
                class="ar-expences"
                density="compact">
            <v-list-subheader class="justify-end">Детализация затрат по статьям</v-list-subheader>
            <v-list-item v-for="e in expences.items"
                         :key="'exp-' + e.id">
                {{ e.name }}
                <template v-slot:append>
                    {{ format(e.cost) }}
                </template>
            </v-list-item>
        </v-list>
        <div v-else class="my-5 text-center">
            <v-btn :loading="expences.pending"
                   prepend-icon="mdi-format-list-bulleted"
                   color="amber"
                   variant="flat"
                   v-on:click="expencesShow">
                детализация затрат
            </v-btn>
        </div>
    </div>
</template>
<script>
import Chart from 'chart.js/auto';    
import { computed, onUnmounted } from "vue";
import { all } from "~/composables/data";
import { totals } from "~/composables/totals";
import { gettotals, getexpences } from "~/services/company";
import ArBaseReport from "./ArBaseReport";

let chart = null;

export default {
    name: 'ArCompany',
    extends: ArBaseReport,
    async setup(props, { emit }){
        onUnmounted(()=>{
            if (chart){
                chart.destroy();
                chart = null;
            }
        });
        const _buildChart = ()=>{
            const conte = $(".ar-company__chart");
            if (conte.length < 1){
                setTimeout(_buildChart, 300);
                return;
            }
            const w = conte.innerWidth() - 48;
            conte.find("canvas").css({width: w + "px", height: w + "px"});
            
            const data = [
                totals.value.totalProfit,
                totals.value.expenses,
                totals.value.expenses_driver + totals.value.expenses_driver_vat,
                0,
                totals.value.gross
            ];
            switch(totals.value.fuelMode){
                case 0:
                    data[3] = totals.value.actual_fuel_expenses;
                    break;
                case 1:
                    data[3] = totals.value.estimated_fuel_expenses;
                    break;
                case 2:
                    data[3] = totals.value.reported_fuel_expenses;
                    break;
            };
            
            const cfg = {
                        type: 'pie',
                        data: {
                                labels: ['Вал прибыль', 'Валовый расход', 'Вал зарплаты', 'Вал расход ГСМ', 'Валовый доход'],
                                datasets: [{
                                        clip: {left: 10, top: 10, right: 10, bottom: 10},
                                        label: 'Распределение доходов и расходов',
                                        backgroundColor: ['#80CBC4','#FFF59D','#FFD180','#BCAAA4','#B3E5FC'],
                                        borderColor: ['#B2DFDB','#FFFDE7','#FFCC80','#D7CCC8','#E1F5FE'],
                                        data,
                                        hoverOffset: 8
                               }]
                        },
                        options: {
                            responsive: true,
                            plugins: {
                                legend: {
                                    position: 'top'
                                },
                                title: {
                                    display: false,
                                    text: 'Распределение доходов и расходов'
                                }
                            }
                        }
            };
            
            if ( chart ){
                chart.config.data = cfg.data;
                chart.update();
            } else {
                chart = new Chart(conte.find("#chart").get(0), cfg);
            }
        };  //_buildChart
        
        let {pending, error} = useAsyncData('company', async ()=>{
            if (chart){
                chart.destroy();
                chart = null;
            }
            try {
                totals.value.load(all.period);
                return true;
            } catch(e){
                console.log('ERR (totals)', e);
                emit('error', e);
            }
        });
        
        useAsyncData('company-expences', ()=>{
            expences.value.items = [];
            if (!expences.value.show){
                return;
            }
            expences.value.pending = true;
            getexpences(all.period.start, all.period.end)
                .then( res => {
                    expences.value.items = res;
                    _exp_adds();
                    expences.value.pending = false;
                }).catch(e => {
                    expences.value.pending = false;
                    console.log('ERR (getexpences)', e);
                });
        });
        
        const expences = ref({
                show: false,
                pending: false,
                items: []
            });
            
        /**
         * Adding a exp-recalc & total values
         * @returns {undefined}
         */
        const _exp_adds = ()=>{
            if (!expences.value.show){
                return;
            }
            
            let n, cost = 0, res = expences.value.items;

            //clean
            [777777, 888888, 999999, 100000].forEach( id => {
                n = res.findIndex( r => r.id === id);
                if ( n > -1 ){
                    res.splice(n, 1);
                }
            });
            
            if ( totals.value.incSlrSlr ){
                res.push({
                            id: 777777,
                            name: 'Зарплата',
                            cost: totals.value.expenses_driver
                });
                    
            }
            if ( totals.value.incSlrVat ){
                res.push({
                            id: 888888,
                            name: 'Налог',
                            cost: totals.value.expenses_driver_vat
                });
            }
            switch(totals.value.fuelMode){
                case 0:
                    cost = totals.value.actual_fuel_expenses;
                    break;
                case 1:
                    cost = totals.value.estimated_fuel_expenses;
                    break;
                case 2:
                    cost = totals.value.reported_fuel_expenses;
                    break;
            };
            if ( cost > 0 ) {
                expences.value.items.push({
                        id: 999999,
                        name: 'ГСМ',
                        cost
                });
            }
            cost = 0;
            res = res.sort( (e1, e2) => {
                return (e1.cost > e2.cost) ? -1 : (e1.cost < e2.cost) ? 1 : 0;
            });
            res.forEach( r => {
                r.cost = Math.round(r.cost * 100) / 100;
                cost += r.cost;
            });
            res.push({id: 100000, name: 'ИТОГО', cost});
            
            expences.value.items = res;
            
        };  //_exp_adds
            
        const at = computed(()=>{ return totals.value.at; });
        
        watch(at, ()=>{
            _buildChart();
            _exp_adds();
        });
        
        return {
            pending,
            error,
            totals,
            expences
        };
    },
    methods: {
        has(q){
            switch(q){
                case 'data':
                    return (!!this.totals?.at);
            }
            return false;
        },
        refresh(){
            refreshNuxtData('company');
            refreshNuxtData('company-expences');
        },
        expencesShow(){
            this.expences.show = true;
            refreshNuxtData('company-expences');
        }
    }
}
    
</script>
<style lang="scss">
    .ar-company{
        & .v-list{
            &-item{
                font-size: 0.9rem;
                &:not(:last-child){
                    border-bottom: 1px solid rgba(0,0,0,0.18);
                }
                &.nouse{
                    color: #999;
                }
                &__prepend{
                    & .v-input{
                        display: flex !important;
                        --v-input-control-height: unset;
                        --v-input-padding-top: unset;
                    }
                }
            }
            & .ar-stats{
                display: flex;
                font-size: 0.75rem;
                align-items: center;
                flex-wrap: wrap;
                line-height: 1.125;
                & > * {
                    margin-right: 0.5rem;
                }
            }
        }
        &__chart{
            text-align: center;
            padding: 1rem;
            margin-bottom: 3rem;
            #chart {
                min-height: 280px;
                max-height: 420px;
                width: 100%;
                margin: 0 auto;
            }
        }
        & .ar-expences{
            margin-top: 2rem;
        }
    }
</style>