<template>
    <v-sheet class="ar-chief">
        <v-toolbar density="compact" 
                   flat 
                   class="py-2 px-sm-3"
                   absolute
                   height="48"
                   color="white"
                   elevation="1">
            <v-slide-group show-arrows
                           mandatory
                           selected-class="bg-primary"
                           v-model="report">
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-chart-pie' : undefined"
                           @click="toggle">Сводка</v-btn>
                </v-slide-group-item>
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-clock-check-outline' : undefined"
                           @click="toggle">
                        <v-badge inline
                                 color="green-lighten-5"
                                 :content="all[1].n"
                                 :class="{'empty': all[1].n==0}">
                            Статусы
                        </v-badge>
                    </v-btn>
                </v-slide-group-item>
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-truck-fast-outline' : undefined"
                           @click="toggle">
                        <v-badge inline
                                 color="green-lighten-5"
                                 :content="all[2].n"
                                 :class="{'empty': all[2].n==0}">
                            По ТС
                        </v-badge>
                    </v-btn>
                </v-slide-group-item>
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-account-cowboy-hat-outline' : undefined"
                           @click="toggle">
                        <v-badge inline
                                 color="green-lighten-5"
                                 :content="all[3].n"
                                 :class="{'empty': all[3].n==0}">
                            По водителям
                        </v-badge>
                    </v-btn>
                </v-slide-group-item>
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-account-multiple-outline' : undefined"
                           @click="toggle">
                        <v-badge inline
                                 color="green-lighten-5"
                                 :content="all[4].n"
                                 :class="{'empty': all[4].n==0}">
                            По контрагентам
                        </v-badge>
                    </v-btn>
                </v-slide-group-item>
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-gas-station-outline' : undefined"
                           @click="toggle">
                        <v-badge inline
                                 color="green-lighten-5"
                                 :content="all[5].n"
                                 :class="{'empty': all[5].n==0}">
                            ГСМ
                        </v-badge>
                    </v-btn>
                </v-slide-group-item>
                <v-slide-group-item v-slot="{ isSelected, toggle }">
                    <v-btn variant="text" size="small"
                           :color="isSelected ? 'primary' : undefined"
                           :prepend-icon="isSelected ? 'mdi-account-credit-card-outline' : undefined"
                           @click="toggle">
                        <v-badge inline
                                 color="green-lighten-5"
                                 :content="all[6].n"
                                 :class="{'empty': all[6].n==0}">
                            Начисления
                        </v-badge>
                    </v-btn>
                </v-slide-group-item>
            </v-slide-group>
        </v-toolbar>
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
import { useDisplay } from 'vuetify';    
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
    name: 'ArReports',
    components: {
        ArCompany,
        ArStatuses,
        ArVehicles,
        ArDrivers,
        ArContras,
        ArFuel,
        ArIncoms
    },
    setup(){
        const report = ref(0);
        return {
            report
        };
    },
    data(){
        return {
            _REP_COMPS,
            error: null
        };
    },
    computed: {
        all(){
            return this._REP_COMPS;
        },
        activeReport(){
            useHead({
                title: `${ profile.tenant?.title || ''} | ${_REP_COMPS[this.report]?.title || ''}`
            });
            return _REP_COMPS[this.report].comp;
        }
    },
    mounted(){
        this.$nextTick(()=>{
            $(".v-main").css({height: "calc(100vh - 118px)"});
        });
    },
    watch: {
        report(val){
            //reset error
            this.error = null;
        }
    }
}    
</script>
<style lang="scss">
    .ar-chief{
        & .v-toolbar{
            z-index: 9;
            .v-slide-group{
                margin: 0 -8px;
            }
        }
        background: #fff;
        height: calc(100vh - 78px);
        margin: -16px -16px 0 -16px;
        position: relative;
        &__conte{
            height: 100%;
            overflow-y: auto;
            padding-top: 52px;
            padding-bottom: 1rem;
        }
        & .v-badge.empty {
            & .v-badge__badge{
                display: none !important;
            }
        }
    }
</style>