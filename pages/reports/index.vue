<template>
    <teleport v-if="isMounted" to="#ar-title">
        <v-menu>
            <template v-slot:activator="{ props }">
                <v-btn variant="tonal"
                       color="primary"
                       v-bind="props"
                       flat
                       append-icon="mdi-chevron-down">
                    {{ activeTitle }}
                </v-btn>
            </template>
            <v-list density="compact"
                    v-on:update:selected="selReport">
                <v-list-item :value="0"
                    prepend-icon="mdi-chart-pie">
                    Сводка
                </v-list-item>
                <v-list-item :value="1"
                             prepend-icon="mdi-clock-check-outline">
                    <v-badge inline
                             color="green-lighten-5"
                             :content="all[1].n"
                             :class="{'empty': all[1].n==0}">
                        Статусы
                    </v-badge>
                </v-list-item>    
                <v-list-item :value="2"
                             prepend-icon="mdi-truck-fast-outline">
                    <v-badge inline
                             color="green-lighten-5"
                             :content="all[2].n"
                             :class="{'empty': all[2].n==0}">
                        По ТС
                    </v-badge>
                </v-list-item>    
                <v-list-item :value="3"
                             prepend-icon="mdi-account-cowboy-hat-outline">
                    <v-badge inline
                             color="green-lighten-5"
                             :content="all[3].n"
                             :class="{'empty': all[3].n==0}">
                        По водителям
                    </v-badge>
                </v-list-item>
                <v-list-item :value="4"
                             prepend-icon="mdi-account-multiple-outline">
                    <v-badge inline
                             color="green-lighten-5"
                             :content="all[4].n"
                             :class="{'empty': all[4].n==0}">
                        По контрагентам
                    </v-badge>
                </v-list-item>
                <v-list-item :value="5"
                             prepend-icon="mdi-gas-station-outline">
                    <v-badge inline
                             color="green-lighten-5"
                             :content="all[5].n"
                             :class="{'empty': all[5].n==0}">
                        ГСМ
                    </v-badge>
                </v-list-item>
                <v-list-item :value="6"
                             prepend-icon="mdi-account-credit-card-outline">
                    <v-badge inline
                             color="green-lighten-5"
                             :content="all[6].n"
                             :class="{'empty': all[6].n==0}">
                        Начисления
                    </v-badge>
                </v-list-item>
            </v-list>
        </v-menu>
    </teleport>    
    <v-sheet class="ar-chief">
        <div class="ar-chief__conte">
            <div class="pa-5" v-if="error">
                <v-alert border="start"
                         border-color="orange"
                         density="compact"
                         icon="mdi-alert-outline"
                         elevation="2">
                    При формировании отчета возникла ошибка: <br />
                    <small>{{ error.message }}</small>
                    <br />попробуйте обновить страницу
                </v-alert>
            </div>
            <component :is="activeReport"
                       :key="'rep-' + report"
                       v-on:error="error = $event"
                       v-on:count="all[report].n = $event"></component>
        </div>
    </v-sheet>
</template>
<script>
import { profile } from "app-ext/composables/profile";
    
import ArCompany from  "~/components/reports/ArCompany";
import ArStatuses from  "~/components/reports/ArStatuses";
import ArVehicles from  "~/components/reports/ArVehicles";
import ArDrivers from  "~/components/reports/ArDrivers";
import ArContras from  "~/components/reports/ArContras";
import ArFuel from  "~/components/reports/ArFuel";
import ArIncoms from  "~/components/reports/ArIncoms";

const _REP_COMPS = {
    0: {title: 'Сводка', comp: ArCompany, n: 0}, 
    1: {title: 'Статусы', comp: ArStatuses, n: 0}, 
    2: {title: 'По ТС', comp: ArVehicles, n: 0}, 
    3: {title: 'По водителям', comp: ArDrivers, n: 0}, 
    4: {title: 'По контрагентам', comp: ArContras, n: 0}, 
    5: {title: 'ГСМ', comp: ArFuel, n: 0}, 
    6: {title: 'Начисления', comp: ArIncoms, n: 0}
};

export default {
    name: 'ArReportsPage',
    components: {
        ArCompany,
        ArStatuses,
        ArVehicles,
        ArDrivers,
        ArContras,
        ArFuel,
        ArIncoms
    },
    data(){
        return {
            report: 0,
            _REP_COMPS,
            error: null,
            isMounted: false
        };
    },
    computed: {
        all(){
            return this._REP_COMPS;
        },
        activeTitle(){
            return _REP_COMPS[this.report].title;
        },
        activeReport(){
            useSeoMeta({
                title: `${ profile.tenant?.title || ''} | ${_REP_COMPS[this.report]?.title || ''}`
            });
            return _REP_COMPS[this.report].comp;
        }
    },
    mounted(){
        this.isMounted = true;
        this.$nextTick(()=>{
            $(".v-main").css({height: "calc(100vh - 92px)"});
        });
    },
    methods: {
        selReport(e){
            this.error = null;
            this.report = e.at(0) || 0;
        }
    }
}    
</script>
<style lang="scss">
    .ar-chief {
    }
</style>
