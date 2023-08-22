<template>
    <v-skeleton-loader type="list-item@3" 
                       v-if="pending" />
        <v-data-table v-else
                      density="compact"
                      ref="table"
                      class="ar-drivers"
                      fixed-header
                      disable-sort
                      no-filter
                      hover
                      :headers="headers"
                      :items="items"
                      :items-per-page="-1"
                      :model-value="selected"
                      item-value="driver"
                      single-select
                      disable-pagination
                      hide-default-footer
                      no-data-text="..."
                      return-object>
            <template v-slot:item.driver="{ item }">
                <div v-if="/^(итог)+/i.test(item.raw.driver)" class="font-weight-bold">
                    {{item.raw.driver}}
                </div>    
                <div v-else class="d-flex align-center justify-space-between w-100">    
                    {{item.raw.driver}}
                    <v-icon v-if="(item.raw.profit2 >= 50)" color="primary">
                        mdi-hand-pointing-up
                    </v-icon>
                    <v-icon v-else-if="(item.raw.profit2)&&(item.raw.profit2 < 50)" color="warning">
                        mdi-hand-pointing-down
                    </v-icon>
                </div>    
            </template>
            <template v-slot:item.gross="{ item }">
                {{ format(item.raw.gross, 0) }}
            </template>
            <template v-slot:item.gross_tonne="{ item }">
                {{ format(item.raw.gross_tonne, 0) }}
            </template>
            <template v-slot:item.expenses="{ item }">
                {{ format(item.raw.expenses, 0) }}
            </template>
            <template v-slot:item.profit="{ item }">
                <v-chip v-if="item.raw.profit < 0" color="red-accent-4">
                    {{ format(item.raw.profit, 0) }}
                </v-chip>
                <template v-else>
                    {{ format(item.raw.profit, 0) }}
                </template>
            </template>
        </v-data-table>
        <v-alert class="ar-drivers__empty"
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
        <div class="ar-drivers__chart">
            <canvas id="chart"></canvas>
        </div>
</template>
<script>
import Chart from 'chart.js/auto';    
import ArBaseReport from "./ArBaseReport";
import { all } from "~/composables/data";
import { getbydrivers } from "~/services/company";
import { colorize } from "./ArBaseReport";
import { onUnmounted } from "vue";

const _HDRS = [
    {title: 'водитель',     key: 'driver',     sortable: true, fixed: true, width: 130},
    {title: 'вал ₽',        key: 'gross',      sortable: true, width: 100},
    {title: 'вал тонно-км', key: 'gross_tonne',sortable: true, width: 100},
    {title: 'расходы',      key: 'expenses',   sortable: true, width: 100},
    {title: 'прибыль',      key: 'profit',     sortable: true, width: 100}
];

export default {
    name: 'ArDrivers',
    extends: ArBaseReport,
    async setup(props, { emit }){
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
                    bar: {
                        borderWidth: 2
                    }
                },
                plugins: {
                    legend: true
                },
                scales: {
                    x: {stacked: true},
                    y: {stacked: true}
                }
            }
        };
        
        let chart = null;
        
        const _buildChart = ()=>{
            const conte = $(".ar-drivers__chart");
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
        };
        
        onUnmounted(()=>{
            if (chart){
                chart.destroy();
                chart = null;
            }
        });
        
        const emptyEmps = ref([]),
              showEmpty = ref(true);
        
        const {data: items, pending, error} = useLazyAsyncData('company', async ()=>{
            try {
                const empty = [];
                let res = await getbydrivers(all.period.start, all.period.end);
                emit('count', res.length);
                const totals = {
                    driver: 'ИТОГО',
                    gross: 0,
                    gross_tonne: 0,
                    expenses: 0,
                    profit: 0,
                    valid: true
                };
                let profits = [], expenses = [], gross = [];
                res.forEach( r => {
                    r.profit2 = 0;
                    r.valid   = (r.gross)||(r.gross_tonne)||(r.expenses)||(r.profit);
                    if (!r.valid){
                        empty.push(r.driver);
                        return;
                    }
                    totals.gross       += Number(r.gross);
                    totals.gross_tonne += Number(r.gross_tonne);
                    totals.expenses    += Number(r.expenses);
                    totals.profit      += Number(r.profit);
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
                if ( profits.length > 1 ){
                    let medpro, medexp, medgross, all = 0, prev = Number.MAX_VALUE;
                    gross.forEach( g => { all += g; } );
                    medgross = gross.length > 0 ? all / gross.length : 0;
                    all = 0;
                    profits.forEach( p => { all += p; } );
                    medpro = all / profits.length;
                    all = 0;
                    expenses.forEach( e => { all += e; } );
                    medexp = expenses.length > 0 ? all / expenses.length : 0;
                    
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
                    
                    res.filter(r => r.profit)
                       .sort((r1,r2)=>{ return r1.profit > r2.profit ? -1 : 1; })
                       .forEach( r => {
                            r.profit2 = r.profit * 100 / medpro;
                            r.expenses2=r.expenses * 100 / medexp;
                            if (
                                    ( prev > medpro )
                                 && ( r.profit < medpro)
                               ){
                                chartConf.data.labels.push('СРЕДНЕЕ');
                                chartConf.data.datasets[0].data.push(medgross);
                                
                                chartConf.data.datasets[1].data.push(medpro);
                                chartConf.data.datasets[1].backgroundColor.push("#1DE9B6");
                                chartConf.data.datasets[1].borderColor.push("#00BFA5");
                                
                                chartConf.data.datasets[2].data.push(medexp);
                                chartConf.data.datasets[2].backgroundColor.push("#BA68C8");
                                chartConf.data.datasets[2].borderColor.push("#8E24AA");
                            }
                    
                            chartConf.data.labels.push(r.driver);
                            chartConf.data.datasets[0].data.push(r.gross);
                            
                            chartConf.data.datasets[1].data.push(r.profit);
                            chartConf.data.datasets[1].backgroundColor.push(
                                    (r.profit2 >= 50)
                                        ? (r.profit < medpro) ? "rgba(178,222,220,0.5)" : "rgba(78,182,172,0.5)" 
                                        : "rgba(255,204,128,0.5)"
                            );
                            chartConf.data.datasets[1].borderColor.push(
                                    (r.profit2 >= 50)
                                        ? (r.profit < medpro) ? "#80CBC4" : "#26A69A" 
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
                }
                _buildChart();
                emptyEmps.value = empty.sort( (s1, s2)=>{
                    return s1?.localeCompare(s2);
                });
                showEmpty.value = (emptyEmps.value.length > 0);
                
                res = res.filter(r => r.valid).sort((r1, r2) => {
                    return r1.driver?.localeCompare(r2.driver);
                });
                res.push(totals);
                colorize(".ar-drivers.v-data-table");
                
                return res;
            } catch(e){
                console.log('ERR (drivers)', e);
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
    }
};
</script>
<style lang="scss">
    .ar-drivers{
        height: fit-content;
        & table {
            font-size: 0.65rem;
            line-height: 1.115;
            & tr{
                & > th{
                    font-weight: 600 !important;
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
        &__chart{
            text-align: center;
            padding: 1rem;
            margin-top: 2rem;
            margin-bottom: 3rem;
            #chart {
                min-height: 280px;
                width: 100%;
                margin: 0 auto;
            }
        }
        &__empty{
            margin: 1rem;
            font-size: 0.75rem;
            line-height: 1.125;
            white-space: normal;
        }
    }
</style>
