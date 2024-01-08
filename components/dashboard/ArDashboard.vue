<template>
    <div class="ar-dashboard">
        <v-row v-if="has('chief')" justify="center">
            <v-col cols="12" sm="8">
                <v-card class="ar-totals"
                        color="green-lighten-5"
                        :loading="totals.pending">
                    <v-card-text>
                        <v-row align="center">
                            <v-col class="text-h5">
                                {{ company }}
                            </v-col>
                            <v-col cols="auto" class="text-muted text-end">
                                {{ dtformat(totals.at) }}
                            </v-col>
                        </v-row>
                        <v-row v-if="totals.vehicles"
                               class="ar-stats">
                            <v-col cols="6" sm="4">
                                <v-chip prepend-icon="mdi-truck-outline" 
                                        size="large"
                                        label
                                        color="primary">
                                    <b>{{ totals.vehicles.num }}</b>
                                    <div class="text-muted">
                                        транспорт
                                    </div>
                                </v-chip>
                            </v-col>
                            <v-col cols="6" sm="4">
                                <v-chip v-if="totals.vehicles.motodays"
                                        prepend-icon="mdi-calendar-month-outline" 
                                        size="large"
                                        label
                                        color="primary">
                                    <div><b>{{ totals.vehicles.motodays.pc }}</b>%</div>
                                    <div class="text-muted">
                                        %-выхода на рейс
                                    </div>
                                </v-chip>
                            </v-col>
                            <v-col cols="6" sm="4">
                                <v-chip prepend-icon="mdi-kettlebell" 
                                        size="large"
                                        label
                                        color="primary">
                                    <div><b>{{ format(totals.vehicles.tonnage, 0) }}</b>&nbsp;т.</div>
                                    <div class="text-muted">
                                        тоннаж
                                    </div>
                                </v-chip>
                            </v-col>    
                            <v-col cols="6" sm="4">
                                <v-chip prepend-icon="mdi-truck-check-outline" 
                                        size="large"
                                        label
                                        color="primary">
                                    <div><b>{{ format(totals.vehicles.unloaded, 1) }}</b>&nbsp;т.</div>
                                    <div class="text-muted">
                                        перевезено (рейсов {{ totals.vehicles.trips }})
                                    </div>
                                </v-chip>
                            </v-col>
                            <v-col cols="6" sm="4">
                                <v-chip prepend-icon="mdi-truck-fast-outline" 
                                        size="large"
                                        label
                                        color="primary">
                                    <div><b>{{ format(totals.vehicles.distance, 0) }}</b>&nbsp;км.</div>
                                    <div class="text-muted">
                                        пробег&nbsp;(ср.:{{ format(totals.vehicles.avg_distance, 0) }})
                                    </div>
                                </v-chip>
                            </v-col>
                            <v-col cols="6" sm="4">
                                <v-chip prepend-icon="mdi-gas-station-outline" 
                                        size="large"
                                        label
                                        color="primary">
                                    <div><b>{{ format(totals.vehicles.refueled,0) }}</b>&nbsp;л.</div>
                                    <div class="text-muted">
                                        заправлено&nbsp;(цена: {{ totals.vehicles.fuel_cost}}р.)
                                    </div>
                                </v-chip>
                            </v-col>
                            <v-col cols="6" sm="4">
                                <v-chip prepend-icon="mdi-water-outline" 
                                        size="large"
                                        label
                                        color="primary">
                                    <div><b>{{ format(totals.vehicles.norm_consumption, 1) }}</b>&nbsp;л/100км</div>
                                    <div class="text-muted">
                                        (расчетный:&nbsp;{{ totals.vehicles.avg_consumption }})
                                    </div>
                                </v-chip>
                            </v-col>
                        </v-row>
                        <v-row>
                            <v-col cols="12">
                                <v-chip class="py-3"
                                        prepend-icon="mdi-file-table-box-multiple-outline" 
                                        append-icon="mdi-chevron-right"
                                        size="large"
                                        label
                                        color="primary"
                                        :to="{name: 'reports'}">
                                    <b>Отчеты</b>
                                </v-chip>
                            </v-col>
                        </v-row>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row justify="center">
            <v-col cols="12" sm="8">
                <v-list class="ar-nav">
                    <v-list-item append-icon="mdi-chevron-right"
                                 prepend-icon="mdi-face-agent"
                                 title="заявки"
                                 subtitle="коммерсант"
                                 :to="{name: 'company-orders'}"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-order-bool-ascending-variant"
                                 title="заказы"
                                 subtitle="логист"
                                 :to="{name: 'company-logistician'}"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-truck-fast-outline"
                                 :to="{name: 'company-trips'}"
                                 title="рейсы"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-calculator-variant-outline"
                                 title="финансы"
                                 :to="{name: 'company-finance'}"
                                 subtitle="распределение затрат по объектам учета"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-truck-outline"
                                 :to="{name: 'company-transport'}"
                                 title="транспорт"
                                 subtitle="транспорт | прицепы | сцепки | водители"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-gauge"
                                 :to="{name: 'company-settings'}"
                                 title="нормативы"
                                 subtitle="нормартивы оплат | расход ГСМ | стоимость ГСМ..."></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-file-table-outline"
                                 :to="{name: 'company-refs'}"
                                 title="справочники"
                                 subtitle="типы груза | типы транспорта | маршруты | точки..."></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-account-multiple-outline"
                                 :to="{name: 'company-users'}"
                                 title="пользователи"
                                 subtitle="перевозчики | пользователи | заявки на регистрацию"></v-list-item>
                </v-list>
            </v-col>
        </v-row>
    </div>
</template>
<script>
import { watch, computed } from "vue";
import { profile } from "app-ext/composables/profile";
import { all } from "~/composables/data";
import { totals } from "~/composables/totals";
import ArBaseReport from "~/components/reports/ArBaseReport";
    
export default {
    name: 'ArDashboard',
    extends: ArBaseReport,
    setup(){
        
        totals.value.pre();
        
        const at = computed({
            get(){return all.period.start;}
        });
        
        const _read = ()=>{
            totals.value.load(all.period);
            totals.value.incFuel = true;
            if (totals.value.actual_fuel_expenses < 1){
                totals.value.fuelMode = 1;
            }
        };  //_read
        
        watch(at, _read);
        
        if ( 0 === totals.value.at) {
            _read();
        }
        
        return {
            totals
        };
    },
    computed: {
        company(){
            return profile.subject?.tenant?.title;
        }
    },
    methods: {
        $moment,
        has(q){
            switch(q){
                case "chief":
                    return profile.hasrole("руководитель");
                case "driver":
                    return false;
            }
            return false;
        }   //has
    }
}    
</script>
<style lang="scss">
    $color-primary: rgb(76,175,80);
    .ar-dashboard {
        margin-bottom: 5rem;
        & .v-list{
            & .v-list-item {
                & .v-icon.text-primary{
                    padding: 1rem;
                    background: #d5ecd7;
                }
            }
            &.ar-nav{
                & .v-list-item {
                    border-top: 1px solid #eee;
                }
            }
        }
        & .v-col-sm-4, & .v-col-12 {
            padding: 6px !important;
        }
        & .v-chip{
            width: 100%;
            --v-chip-height: unset;
            padding-top: 0.5rem;
            padding-bottom: 0.5rem;
            font-size: 0.85rem;
            border: 1px solid lighten($color-primary, 30%);
            &:not(:last-child){
                margin-right: 0.75rem;
            }
            &__content {
                line-height: 1.115;
                align-items: flex-start;
                flex-direction: column;
                width: fit-content;
                white-space: nowrap;
                & b{
                    font-size: 1.2rem;
                }
            }
            &__append{
                margin-left: auto;
            }
            & .v-icon{
                opacity: 0.7;
            }
        }
    }
</style>