<template>
    <v-data-table density="compact"
                  :loading="pending"
                  :items="crrs"
                  items-per-page="-1"
                  :headers="hdrs"
                  hover
                  select-strategy="single"
                  return-object>
        <template v-slot:top>
            <div class="text-right mb-1">
                <v-btn size="small" 
                       append-icon="mdi-plus"
                       color="primary"
                       class="ml-auto"
                       variant="tonal"
                       v-on:click="$emit('assign')">
                    назначить
                </v-btn>
            </div>    
        </template>
        <template v-slot:item.actions="{ item }">
            <v-btn class="mr-3"
                   size="x-small"
                   prepend-icon="mdi-check-circle-outline"
                   variant="tonal"
                   color="primary"
                   v-on:click="allow(item)">
                принять       
            </v-btn>
            <v-btn size="x-small"
                   prepend-icon="mdi-close"
                   variant="tonal"
                   v-on:click="deny(item)">
                завершить
            </v-btn>
        </template>
    </v-data-table>
    <v-dialog v-model="dlgDeny"
              width="480">
        <v-card>
            <v-card-title>Отклонение исполнения заказа</v-card-title>
            <v-card-text>
                <jet-input-number label="остаток груза" 
                                  required
                                  type="float"
                                  autofocus
                                  v-model="deny_count" />
            </v-card-text>
            <v-card-actions>
                <v-spacer />
                <v-btn variant="elevated"
                       size="small"
                       prepend-icon="mdi-close"
                       v-on:click="dlgDeny = false">
                    закрыть
                </v-btn>
                <v-btn size="small"
                       variant="elevated"
                       color="primary"
                       append-icon="mdi-send"
                       v-on:click="ondeny">
                    ок
                </v-btn>
            </v-card-actions>
        </v-card>
    </v-dialog>
</template>
<script>
import { toRef } from 'vue';
import JetInputNumber from "app-ext/components/editors/JetInputNumber";

const _HDRS = [
    {title: 'Организация', key: 'legal_entity.title', sortable: true},
    {title: 'Количество', key: 'cargo_units_count', sortable: true},
    {title: 'Единица измерения', key: 'cargo_unit_type.title', sortable: false},
    {title: 'Цена', key: 'price', sortable: false},
    {title: 'Оплата за', key: 'price_type', sortable: false},
    {title: '...', key: 'actions', sortable: false}
];

export default {
    name: 'ArOrderCarriers',
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
    emits: ["assign"],
    async setup(props, {emit, expose}){
        const o = toRef(props, 'order');
        
        const crrs = ref([]);
        
        const { pending, error } = useAsyncData('order-carriers', async ()=>{
            let res = await $jet.api({
                    url: '/organizations_order',
                    params: {
                        page: 1,
                        perPage: -1,
                        filters: `orders_id:${o.value.id},status:IN_EXECUTION`,
                        include: '*'
                    }
            });
            
            if (res.success){
                crrs.value = res.result.items;
            } else {
                throw res.error;
            }
            
            return true;
        }, {
            watch: [o]
        });
        
        const reload = ()=>refreshNuxtData('order-carriers');
        
        expose({reload});
        
        return {
            crrs,
            pending, 
            error,
            reload
        };
    },
    data(){
        return {
            hdrs: _HDRS,
            dlgDeny: false,
            selected: null,
            deny_count: null
        };
    },
    methods: {
        async _change(allow = true, id, count){
            try {
                const res = await $jet.api({
                    url: `/organizations_order/${allow ? 'allow' : 'deny'}/${ id }`,
                    method: 'POST',
                    body: {
                        cargo_value_left: count
                    }
                });
                if (res.success){
                    $jet.msg({text: 'Заказ перевозчика успешно изменил статус!', color: "success", timeout: 6000});
                } else {
                    throw res.error;
                }
                this.reload();
            } catch(e){
                console.log('ERR (change)', e);
                $jet.msg({text: 'Не удалось изменить статус заказа перевозчика:<br />' + e.message, color: "warning"});
            }
        },
        allow(item){
            this.selected = item;
            $jet.msg({
                text: 'Подтвердите отмену завершения заказа перевозчика',
                timeout: 20000,
                color: 'indigo',
                click: ok => {
                    if (ok){
                        this._change(true, item.id, 0);
                    }
                },
                click_title: 'подтвердить'
            });
        },
        deny(item){
            this.selected = item;
            this.deny_count = item.cargo_value_left;
            this.dlgDeny = true;
        },   //deny
        ondeny(){
            this.dlgDeny = false;
            this._change(false, this.selected.id, this.deny_count);
        }   //ondeny
    }
}    
</script>    
