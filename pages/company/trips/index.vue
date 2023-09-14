<template>
    <v-skeleton-loader v-if="pending"
                       type="list-item@3" />
    <template v-else-if="has('orders')">
        <v-row class="ar-orders">
            <v-col cols="12" sm="4"
                   v-for="o in orders"
                   :key="'order-'+o.id"
                   class="align-center">
                <v-card class="ar-order"
                        elevation="3">
                    <div class="ar-order__dates">
                        {{ o.order.period }}
                    </div>
                    <v-card-title>
                        #<b>{{ o.order.number }}</b>. {{ o.order.move_direction.title }}
                    </v-card-title>
                    <v-card-text>
                        <v-list density="compact" class="ar-order__details">
                            <v-list-item prepend-icon="mdi-account-tie"
                                         :title="o.order.contractor.title">
                            </v-list-item>    
                            <v-list-item prepend-icon="mdi-seed-outline"
                                         :title="o.order.cargo_name?.title">
                                <template v-slot:append>
                                    {{o.order.cargo_units_count}}&nbsp;({{ o.order.cargo_unit.title }})
                                </template>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-truck-cargo-container"
                                         title="распределено">
                                <template v-slot:append>
                                    {{ o.distributed_cargo_count }}
                                    <v-progress-linear color="primary"
                                                       :model-value="o.order.pc_distributed" 
                                                       :height="7"></v-progress-linear>
                                </template>
                            </v-list-item>
                            <v-list-item prepend-icon="mdi-weight-lifter"
                                         title="исполнено">
                                <template v-slot:append>
                                    <v-progress-linear color="primary"
                                                       :model-value="o.order.pc_executed" 
                                                       :height="7"></v-progress-linear>
                                    {{ o.executed_cargo_count }}
                                </template>
                            </v-list-item>
                        </v-list>
                    </v-card-text>
                </v-card>
            </v-col>
        </v-row>
    </template>
</template>
<script>
import { profile } from "app-ext/composables/profile";
import { getorders } from "~/services/order";

export default {
    name: 'tripsPage',
    async setup(){
        const {data: orders, pending, error } = useAsyncData('company-orders', ()=>{
            return new Promise( (resolve, reject) => {
                let res = useNuxtData('company-orders');
                if ( res?.length > 0 ){
                    resolve(res);
                    return;
                }
                
                const filter = {
                    type: "and",
                    values: [
                        {type: "eq", field: "organizations_id", values: [profile.tenant?.id]},
                        {type: "like", field: "status", values: ["in_execution"]}
                    ]
                };
                
                getorders(filter).then( res => {
                    console.log('orders', res);
                    resolve(res);
                }).catch( e => {
                    console.log('ERR (orders)', e);
                    reject(e);
                });
            });
        });
        
        return {
            orders,
            pending,
            error
        };
    },
    methods: {
        has(q){
            switch(q){
                case 'orders':
                    return this.orders?.length > 0;
            }
            return false;
        }
    }
}
</script>
<style lang="scss">
    .ar-orders{
        .ar-order {
            margin-bottom: 2rem;
            overflow: unset;
            & .v-card-title, & .v-card-text{
                font-size: 0.9rem;
                white-space: normal;
                line-height: 1.125;
            }
            & .v-card-title{
                padding-top: 1rem;
                font-weight: 600;
                height: 3rem;
            }
            &__dates{
                position: absolute;
                font-size: 0.85rem;
                right: 0.85rem;
                top: -0.85rem;
                background: #fff;
                border: 1px solid rgba(var(--v-theme-primary), 0.3);
                border-radius: 6px;
                padding: 0.25rem 0.5rem;
                background: #E8F5E9;
                box-shadow: 1px 0 3px rgba(0,0,0,0.18);
            }
            &__details {
                & .v-list-item{
                    height: fit-content;
                    min-height: unset;
                    &-title {
                        font-size: 0.9rem;
                    }
                    &__append {
                        min-width: 5rem;
                        align-items: flex-end;
                        text-align: right;
                        flex-direction: column;
                    }
                    &__prepend{
                        & .v-icon{
                            font-size: 1rem;
                        }
                        & .v-list-item__spacer{
                            width: 8px !important;
                        }
                    }
                }
            }
        }
    }
</style>