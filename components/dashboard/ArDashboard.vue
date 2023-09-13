<template>
    <div class="ar-dashboard">
        <v-row v-if="has('chief')" justify="center">
            <v-col cols="12" sm="8">
                <v-card class="ar-totals"
                        color="green-lighten-5"
                        :loading="totals.pending">
                    <v-card-text>
                        <v-list>
                            <v-list-item class="text-h5 justify-end">
                                {{ company }}
                                <div class="text-muted text-end">
                                    {{ dtformat(totals.at) }}
                                </div>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-arrow-top-right text-primary"
                                         title="доход">
                                <template v-slot:append>
                                    {{ format(totals.gross, 0) }}
                                    <v-chip v-if="totals.pc('gross')!==null"
                                            class="ml-3"
                                            size="small"
                                            :text="totals.pc('gross') + '%'"
                                            :color="totals.pc('gross') > 0 ? 'primary' : 'red-accent-4'">
                                    </v-chip>
                                </template>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-arrow-bottom-right text-primary"
                                         title="расход">
                                <template v-slot:append>
                                     {{ format(totals.totalExp, 0) }}
                                    <v-chip v-if="totals.pc('totalExp')!==null"
                                            class="ml-3"
                                            size="small"
                                            :text="totals.pc('totalExp') + '%'"
                                            :color="totals.pc('totalExp') > 0 ? 'red-accent-4' : 'primary'">
                                    </v-chip>
                                </template>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-finance text-primary"
                                         title="прибыль">
                                <template v-slot:append>
                                     {{ format(totals.totalProfit, 0) }}
                                    <v-chip v-if="totals.pc('totalProfit')!==null"
                                            class="ml-3 px-3"
                                            size="small"
                                            :text="format(totals.pc('totalProfit')) + '%'"
                                            :color="totals.pc('totalProfit') > 0 ? 'primary' : 'red-accent-4'">
                                    </v-chip>
                                </template>
                            </v-list-item>
                            <v-divider />
                            <v-list-item v-if="totals.vehicles"
                                         class="ar-stats">
                                <v-slide-group>
                                    <v-chip prepend-icon="mdi-truck-outline" size="large"
                                            color="primary">
                                        <b>{{ totals.vehicles.num }}</b>
                                        <div class="text-muted">
                                            транспорт
                                        </div>
                                    </v-chip>
                                    <v-chip prepend-icon="mdi-kettlebell" size="large"
                                            color="primary">
                                        <div><b>{{ format(totals.vehicles.tonnage, 0) }}</b>&nbsp;т.</div>
                                        <div class="text-muted">
                                            тоннаж
                                        </div>
                                    </v-chip>
                                    <v-chip prepend-icon="mdi-truck-check-outline" size="large"
                                            color="primary">
                                        <div><b>{{ format(totals.vehicles.unloaded, 1) }}</b>&nbsp;т.</div>
                                        <div class="text-muted">
                                            перевезено
                                        </div>
                                    </v-chip>
                                    <v-chip prepend-icon="mdi-truck-fast-outline" size="large"
                                            color="primary">
                                        <div><b>{{ format(totals.vehicles.distance, 0) }}</b>&nbsp;км.</div>
                                        <div class="text-muted">
                                            пробег&nbsp;(ср.:{{ format(totals.vehicles.avg_distance, 0) }})
                                        </div>
                                    </v-chip>
                                    <v-chip prepend-icon="mdi-gas-station-outline" size="large"
                                            color="primary">
                                        <div><b>{{ format(totals.vehicles.refueled,0) }}</b>&nbsp;л.</div>
                                        <div class="text-muted">
                                            заправлено&nbsp;(цена: {{ totals.vehicles.fuel_cost}}р.)
                                        </div>
                                    </v-chip>
                                    <v-chip prepend-icon="mdi-water-outline" size="large"
                                            color="primary">
                                        <div><b>{{ format(totals.vehicles.norm_consumption, 1) }}</b>&nbsp;л/100км</div>
                                        <div class="text-muted">
                                            ср.расход&nbsp;(расчетный:&nbsp;{{ totals.vehicles.avg_consumption }})
                                        </div>
                                    </v-chip>
                                </v-slide-group>
                            </v-list-item>
                            <v-divider />
                            <v-list-item append-icon="mdi-chevron-right" 
                                         prepend-icon="mdi-file-table-box-multiple-outline text-primary"
                                         :to="{name: 'reports'}"
                                         title="отчеты"></v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
        <v-row justify="center">
            <v-col cols="12" sm="8">
                <v-list class="ar-nav">
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-order-bool-ascending-variant"
                                 title="заказы"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-truck-fast-outline"
                                 :to="{name: 'company-trips'}"
                                 title="рейсы"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-calculator-variant-outline"
                                 title="финансы"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-file-table-outline"
                                 title="справочники"></v-list-item>
                    <v-list-item append-icon="mdi-chevron-right" 
                                 prepend-icon="mdi-account-multiple-outline"
                                 title="пользватели"></v-list-item>
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
    .ar-dashboard{
        & .v-list{
            background: transparent;
            & .v-list-item {
                padding-inline-start: 0;
                padding-inline-end: 0;
                & .v-icon.text-primary{
                    padding: 1rem;
                    background: #d5ecd7;
                    border: 1px solid lighten($color-primary, 30%);
                    border-radius: 6px;
                }
                &.ar-stats{
                    padding-top: 1rem;
                    padding-bottom: 1rem;
                    & .v-chip{
                        --v-chip-height: unset;
                        border-radius: 6px;
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
                        & .v-icon{
                            opacity: 0.7;
                        }
                    }
                }
            }
            &.ar-nav{
                & .v-list-item {
                    border-top: 1px solid #eee;
                }
            }
        }
    }
</style>