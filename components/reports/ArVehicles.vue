<template>
    <v-data-table density="compact"
                  ref="table"
                  class="ar-vehicles"
                  fixed-header
                  disable-sort
                  no-filter
                  hover
                  :headers="headers"
                  :items="items"
                  :items-per-page="-1"
                  :model-value="selected"
                  :loading="pending"
                  item-value="vehicle"
                  single-select
                  disable-pagination
                  hide-default-footer
                  no-data-text="..."
                  return-object>
        <template v-slot:item.vehicle="{ item }">
            <div v-if="/^(итог)+/i.test(item.vehicle)" class="font-weight-bold">
                {{ item.vehicle }}
            </div>    
            <div v-else class="d-flex align-center justify-space-between w-100">    
                <span class="ar-vehicles_vc" 
                      v-html="item.vehicle.replace('/', '<br />')">
                </span>
                <v-icon v-if="(item.profit2 >= 50)" color="primary">
                    mdi-hand-pointing-up
                </v-icon>
                <v-icon v-else-if="(item.profit2)&&(item.profit2 < 50)" color="warning">
                    mdi-hand-pointing-down
                </v-icon>
            </div>
        </template>
        <template v-slot:item.gross="{ item }">
            {{ format(item.gross, 0) }}
        </template>    
        <template v-slot:item.gross_tonne="{ item }">
            {{ format(item.gross_tonne, 0) }}
        </template>    
        <template v-slot:item.expenses="{ item }">
            <v-btn variant="text" 
                   size="small"
                   v-on:click="dodetails(item)">
                {{ format(item.expenses, 0) }}
            </v-btn>
        </template>    
        <template v-slot:item.profit="{ item }">
            <v-chip v-if="item.profit < 0" color="red-accent-4">
                {{ format(item.profit,0) }}
            </v-chip>
            <template v-else>
                {{ format(item.profit,0) }}
            </template>
        </template>
        <template v-slot:item.odometer="{ item }">
            {{ format(item.odometer, 0) }}
        </template>    
    </v-data-table>
    <div class="ar-vehicles__chart">
        <canvas id="chart"></canvas>
    </div>
    <ar-vehicle-expences ref="details" />
</template>
<script>
import Chart from 'chart.js/auto';    
import ArBaseReport from "./ArBaseReport";
import ArVehicleExpences from "./ArVehicleExpences";
import { all } from "~/composables/data";
import { getbyvehicles } from "~/services/company";
import { colorize } from "./ArBaseReport";

const _HDRS = [
    {title: 'ТС',             key: 'vehicle',    sortable: true, fixed: true, width: 96},
    {title: 'вал ₽',          key: 'gross',      sortable: true, width: 100},
    {title: 'вал тонно-км',   key: 'gross_tonne',sortable: true, width: 100},
    {title: 'расходы',        key: 'expenses',   sortable: true, width: 100},
    {title: 'прибыль',        key: 'profit',     sortable: true, width: 100},
    {title: 'пробег',         key: 'odometer',   sortable: true, width: 100}
];

export default {
    name: 'ArVehicles',
    extends: ArBaseReport,
    async setup(props, { emit }){
        
        let chart = null;

        const chartConf = {
            data: {
                labels: [],
                datasets: [{type: 'bar'},{type: 'bar'},{type: 'line'}]
            },
            options: {
                indexAxis: 'y',
                responsive: true,
                intersect: false,
                padding: 18,
                maintainAspectRatio: false,
                interaction: {
                    mode: 'index',
                    axis: 'y'
                },
                elements: {
                    bar: {borderWidth: 2}
                },
                plugins: {legend: true},
                scales: {
                    x: {stacked: true},
                    y: {stacked: true}
                }
            }
        };
        
        const _buildChart = ()=>{
            const conte = $(".ar-vehicles__chart");
            if (conte.length < 1){
                setTimeout(_buildChart, 300);
                return;
            }
            const w = conte.width(),
                  h = chartConf.data.labels.length * 24,
                  c = conte.find("canvas");
            c.removeAttr("height");
            c.css({height: h + "px"});
            if (chart){
                chart.config.data = chartConf.data;
                chart.update();
                chart.resize();
            } else {
                chart = new Chart(c.get(0), chartConf);
            }
            //chart.resize(w, h);
        };
        
        onUnmounted(()=>{
            if (chart){
                chart.destroy();
                chart = null;
            }
        });

        const items = ref([]);
        
        const { pending, error } = useLazyAsyncData('company', async ()=>{
            try {
                chartConf.data.labels = [];
                chartConf.data.datasets[0] = {
                    type: 'bar',
                    label: 'вал',
                    order: 3,
                    data: [],
                    borderColor: "#1E88E5",
                    backgroundColor: "rgba(100,182,246,0.5)",
                    borderWidth: 1
                };
                chartConf.data.datasets[1] = {
                    type: 'bar',
                    label: 'прибыль',
                    order: 2,
                    data: [],
                    borderColor: [],
                    backgroundColor: [],
                    borderWidth: 1
                };
                chartConf.data.datasets[2] = {
                    type: 'line',
                    label: 'расходы',
                    data: [],
                    borderColor: [],
                    backgroundColor: [],
                    pointRadius: 4,
                    order: 1
                };
                
                const res = await getbyvehicles(all.period.start, all.period.end);
                emit('count', res.length);
                const totals = {
                    vehicle: 'ИТОГО',
                    gross: 0,
                    gross_tonne: 0,
                    expenses: 0,
                    profit: 0,
                    odometer: 0
                }, 
                profits = [],
                expenses= [],
                gross   = [];
                
                let medgross, medprof, medexp, x, prev = Number.MAX_VALUE;;
                res.forEach( r => {
                    totals.gross       += Number(r.gross);
                    totals.gross_tonne += Number(r.gross_tonne);
                    totals.expenses    += Number(r.expenses);
                    totals.profit      += Number(r.profit);
                    totals.odometer    += Number(r.odometer);
                    if (
                            ( r.gross )
                         && ( r.gross > 0)
                       ){
                        gross.push(r.gross);
                    }
                    if (
                            ( r.profit )
                         && ( r.profit > 0)
                       ){
                        profits.push(r.profit);
                    }
                    if (
                            ( r.expenses )
                         && ( r.expenses > 0)
                       ){
                        expenses.push(r.expenses);
                    }
                });
                if (gross.length > 0){
                    x = 0;
                    gross.forEach( g => x += g );
                    medgross = Number(x / gross.length).toFixed(2);
                }
                
                if (profits.length > 0){
                    x = 0;
                    profits.forEach( p => x += p );
                    medprof = Number(x / profits.length).toFixed(2);
                }
                if (expenses.length > 0){
                    x = 0;
                    expenses.forEach( e => x += e );
                    medexp = Number(x / expenses.length).toFixed(2);
                }
                if ( (medprof > 0) && (medexp > 0) ){
                    res.filter(r => r.profit||r.expenses)
                       .sort((r1,r2)=>{ return r1.profit > r2.profit ? -1 : 1; })
                       .forEach( r => {
                            r.profit2 = r.profit * 100 / medprof;
                            r.expenses2=r.expenses * 100 / medexp;
                            if (
                                    ( prev > medprof )
                                 && ( r.profit < medprof)
                               ){
                                chartConf.data.labels.push('СРЕДНЕЕ');
                                chartConf.data.datasets[0].data.push(medgross);
                                
                                chartConf.data.datasets[1].data.push(medprof);
                                chartConf.data.datasets[1].backgroundColor.push("#1DE9B6");
                                chartConf.data.datasets[1].borderColor.push("#00BFA5");
                                
                                chartConf.data.datasets[2].data.push(medexp);
                                chartConf.data.datasets[2].backgroundColor.push("#BA68C8");
                                chartConf.data.datasets[2].borderColor.push("#8E24AA");
                            }
                    
                            chartConf.data.labels.push(r.vehicle);
                            
                            chartConf.data.datasets[0].data.push(r.gross);
                            
                            chartConf.data.datasets[1].data.push(r.profit);
                            chartConf.data.datasets[1].backgroundColor.push(
                                    (r.profit2 >= 50)
                                        ? (r.profit < medprof) ? "rgba(178,222,220,0.5)" : "rgba(78,182,172,0.5)" 
                                        : "rgba(255,204,128,0.5)"
                            );
                            chartConf.data.datasets[1].borderColor.push(
                                    (r.profit2 >= 50)
                                        ? (r.profit < medprof) ? "#80CBC4" : "#26A69A" 
                                        : "#FFB74D"
                            );
                            chartConf.data.datasets[2].data.push(r.expenses);
                            chartConf.data.datasets[2].backgroundColor.push(
                                    (r.expenses2 >= 50)
                                        ? (r.expenses > medexp) ? "#E53935" : "#E57373" 
                                        : "#BA68C8"
                            );
                            chartConf.data.datasets[2].borderColor.push(
                                    (r.expenses2 >= 50)
                                        ? (r.expenses > medexp) ? "#C62828" : "#E53935" 
                                        : "#8E24AA"
                            );
                            prev = r.profit;
                    });
                    res.push(totals);
                }
                
                colorize(".v-table.ar-vehicles");
                items.value = res;
                
                _buildChart();
                
                return true;
            } catch(e){
                console.log('ERR (vehicles)', e);
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
    },
    components: {
        ArVehicleExpences
    },
    methods: {
        dodetails(vehicle){
            this.$refs["details"].open(vehicle);
        }
    }
};
</script>
<style lang="scss">
    .ar-vehicles{
        height: fit-content;
        & table {
            & tr{
                & td {
                    text-align: right;
                    &:first-child{
                        text-align: left;
                        font-weight: 600;
                    }
                    & .v-btn {
                        &__content{
                            border-bottom: 1px solid navy;
                        }
                    }
                }
            }
        }
        & .v-data-table-footer{
            display: none;
        }
        &__chart{
            text-align: center;
            padding: 1rem;
            margin-top: 2rem;
            margin-bottom: 3rem;
            #chart {
                min-height: 120px;
                width: 100%;
                margin: 0 auto;
            }
        }
    }
</style>