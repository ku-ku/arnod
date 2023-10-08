<template>
    <v-form ref="form"
            v-on:submit.stop.prevent="ordering">
        <v-card rounded="0"
                width="640">
            <v-card-text class="mb-5">
                <v-row>
                    <v-col cols="12" class="text-h6">
                        Подтвердите, что передаёте заказ 
                        №&nbsp;{{ order.number + '. ' + order.move_direction?.title }}
                        перевозчику&nbsp;<b>{{ org?.title }}</b>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="4">
                        <jet-input-number label="количество"
                                          type="number"
                                          v-model="count"
                                          required
                                          :hint="`Доступно ${order.cargo_units_count_left}`"
                                          persistent-hint>
                        </jet-input-number>
                    </v-col>
                    <v-col style="align-self: center;">
                        <v-btn size="small"
                               color="primary"
                               variant="tonal"
                               v-on:click.prevent="count = order.cargo_units_count_left">
                               выдать максимум
                        </v-btn>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="4">
                        <jet-input-number label="цена"
                                          v-model="price"
                                          type="currency"
                                          required
                                          :hint="order.price"
                                          persistent-hint>
                        </jet-input-number>
                    </v-col>
                </v-row>
                <v-row>
                    <v-col cols="8">
                        <v-autocomplete label="Организация"
                                        v-model="org_to"
                                        density="compact"
                                        required
                                        hide-details
                                        item-title="title"
                                        item-value="id"
                                        :items="orgs">
                        </v-autocomplete>
                    </v-col>
                </v-row>
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="elevated"
                       size="small"
                       prepend-icon="mdi-close"
                       v-on:click="$emit('close')">
                    закрыть
                </v-btn>
                <v-btn type="submit"
                       size="small"
                       variant="elevated"
                       color="primary"
                       append-icon="mdi-send">
                    назначить
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-form>    
</template>
<script>
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import { profile } from "app-ext/composables/profile";

export default {
    name: 'ArAssignOrder',
    props: {
        order: {
            type: Object,
            required: true,
            default: null
        }
    },
    components: {
        JetInputNumber
    },
    emits: ["close", "success"],
    async setup(){
        const org = ref(null),
             orgs = ref([]);
        
        const {pending, error} = useAsyncData('company-orgs', async ()=>{
            let res;
            if (!org.value){
                res = await $jet.api({url: '/organizations/' + profile.tenant.id});
                console.log('org', res);
                if (res.success){
                    org.value = res.result;
                }
            }
            if (orgs.value.length < 1){
                res = await $jet.api({url: '/refs/legal_entity'});
                console.log('orgs', res);
                if (res.success){
                    orgs.value = res.result.items;
                } else {
                    throw {message: res.error};
                }
            }
        });
        
        return {
            org,
            orgs,
            pending,
            error
        };
    },
    data(){
        return {
            count: null,
            price: 0,
            org_to: null
        };
    },
    methods: {
        async ordering(){
            let { valid } = await this.$refs["form"].validate();
            if (!valid){
                $jet.msg({text: "Необходимо заполнить все поля", type: "warning"});
                return false;
            }        
            this.pending = true;

            try {
                const res = await $jet.api({
                            url: '/organizations_order/own', 
                            method: 'POST',
                            body: {
                                orders_id: this.order.id,
                                cargo_units_count: this.count,
                                price: this.price || 1,
                                legal_entity_id: this.org_to
                            }
                });
                console.log('assign', res);
                $jet.msg({text: `Заказ № ${this.order.number} успешно назначен`, color:'success'});
                this.$emit("success");
            } catch(e){
                console.log('ERR (assign)', e);
                $jet.msg({text: `Не удалось назначить заказ:<br />${ e.message }`, color:'warning'});
            } finally {
                this.pending = false;
            }
        }   //ordering
    },
    watch: {
        order(val){
            this.price = val?.price;
        }
    }
};
</script>