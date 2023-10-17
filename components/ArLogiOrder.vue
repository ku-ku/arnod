<template>
    <v-dialog fullscreen
              min-height="640"
              scrollable
              v-model="show"
              persistent
              content-class="ar-order">
        <v-toolbar color="primary"
                   flat
                   extension-height="auto"
                   density="compact">
            <v-toolbar-title v-if="order">
                {{ order.number + '. ' + order.move_direction?.title }}
                <div class="text-muted">
                    создан {{ order.at }}
                </div>
            </v-toolbar-title>
            <template v-slot:append>
                <v-btn rounded="0"
                       icon="mdi-close"
                       v-on:click="show = false"></v-btn>
            </template>
            <template v-slot:extension>
                <v-row class="ml-1">
                    <v-col cols="6" sm="3" class="text-truncate">
                        <div class="text-muted">Погрузка</div>
                        {{ order.period_loading }}&nbsp;({{ order.loading_days }}&nbsp;дн.)
                    </v-col>
                    <v-col cols="6" sm="3" class="text-truncate">
                        <div class="text-muted">Выгрузка</div>
                        {{ order.period_unloading }}&nbsp;({{ order.unloading_days }}&nbsp;дн.)
                    </v-col>
                </v-row>
            </template>
        </v-toolbar>
        <v-form ref="order_form"
                fast-fail
                :disabled="pending"
                v-on:submit.stop.prevent="save">
            <v-card rounded="0"
                    class="fill-height">
                <v-card-text class="d-flex flex-row">
                    <v-tabs density="compact"
                            direction="vertical"
                            v-model="tab">
                        <v-tab value="0">ОБЩЕЕ</v-tab>
                        <v-tab value="1">ПЕРЕВОЗЧИКИ</v-tab>
                        <v-tab value="2" disabled>ОТКЛИКИ</v-tab>
                    </v-tabs>
                    <v-window v-model="tab" class="w-100 py-3">
                        <v-window-item value="0">
                            <v-row>
                                <v-col cols="12" sm="4">
                                    <v-text-field label="Контрагент"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.contractor?.title"></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-autocomplete label="Направление"
                                                    v-model="order.move_directions_id"
                                                    clearable
                                                    density="compact"
                                                    item-title="title"
                                                    item-value="id"
                                                    :rules="[rules.empty]"
                                                    :hint="distance"
                                                    :items="routes">
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-autocomplete label="Статус"
                                                    :disable="order.status === 'COMPLETED'"
                                                    v-model="order.status"
                                                    density="compact"
                                                    item-title="title"
                                                    item-value="id"
                                                    :items="statuses">
                                    </v-autocomplete>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12" class="h5">Груз</v-col>
                                <v-col cols="12" sm="4">
                                    <v-text-field label="Наименование"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.cargo_name?.title"
                                                  hide-details></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-text-field label="Тип груза"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.cargo_type?.title"
                                                  hide-details></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-text-field label="Ед.изм."
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.cargo_unit?.title"
                                                  hide-details></v-text-field>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12" sm="4">
                                    <v-text-field label="Норма естественной убыли"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.cargo_decrease || 'не указано'"
                                                  hide-details></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="4">
                                    <v-text-field label="Количество единиц загрузки на ТС"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.vehicle_cargo_units_count || 'не указано'"
                                                  hide-details></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="2">
                                    <v-text-field label="Количество"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.cargo_units_count || 'не указано'"
                                                  hide-details></v-text-field>
                                </v-col>
                                <v-col cols="12" sm="2">
                                    <v-text-field label="Остаток"
                                                  readonly
                                                  density="compact"
                                                  :model-value="order.cargo_units_count_left || 0"
                                                  hide-details></v-text-field>
                                </v-col>
                            </v-row>
                            <v-row>
                                <v-col cols="12" class="h5">Расчет</v-col>
                                <v-col cols="12" sm="3">
                                    <jet-input-number :label="'Цена за ' + ((order.price_type || 0) === 0 ? 'единицу груза' : 'транспорт')"
                                                      name="price"
                                                      type="number"
                                                      v-model="order.price"
                                                      :disable="order.status === 'COMPLETED' || order.is_request_price"
                                                      density="compact"
                                                      :required="true"
                                                      :hint="order.is_request_price ? 'Указана ставка по запросу' : ''"
                                                      hide-details></jet-input-number>
                                </v-col>    
                                <v-col cols="12" sm="3">
                                    <jet-input-number :label="'Цена за ' + ((order.price_type || 0) === 0 ? 'единицу груза' : 'транспорт') + ' с НДС'"
                                                  type="number"
                                                  v-model="order.price_vat"
                                                  :disable="order.status === 'COMPLETED' || order.is_request_price"
                                                  density="compact"
                                                  :hint="order.is_request_price ? 'Указана ставка по запросу' : ''"
                                                  hide-details></jet-input-number>
                                </v-col>    
                                <v-col cols="12" sm="3">
                                    <v-autocomplete label="Тип оплаты"
                                                    :disable="order.status === 'COMPLETED'"
                                                    v-model="order.orders_payments_types_id"
                                                    density="compact"
                                                    hide-details
                                                    item-title="title"
                                                    item-value="id"
                                                    :items="paytypes">
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <jet-input-number label="Оплата простоя, руб/день"
                                                  type="number"
                                                  v-model="order.immobility_price"
                                                  :disable="order.status === 'COMPLETED' || order.is_request_price"
                                                  :required="true"
                                                  density="compact"
                                                  hide-details></jet-input-number>
                                </v-col>    
                            </v-row>
                            <v-row>
                                <v-col cols="12" class="h5">Транспорт</v-col>
                                <v-col cols="12" sm="3">
                                    <v-autocomplete label="Тип транспорта"
                                                    :disable="order.status === 'COMPLETED'"
                                                    v-model="order.vehicle_types"
                                                    density="compact"
                                                    hide-details
                                                    item-title="title"
                                                    item-value="id"
                                                    chips
                                                    multiple
                                                    return-object
                                                    :items="vehitypes">
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <v-autocomplete label="Тип загрузки"
                                                    :disable="order.status === 'COMPLETED'"
                                                    v-model="order.vehicles_loading_types"
                                                    density="compact"
                                                    hide-details
                                                    item-title="title"
                                                    item-value="id"
                                                    chips
                                                    return-object
                                                    multiple
                                                    :items="vehiloading">
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <v-autocomplete label="Тип выгрузки"
                                                    :disable="order.status === 'COMPLETED'"
                                                    v-model="order.vehicles_unloading_types"
                                                    density="compact"
                                                    hide-details
                                                    item-title="title"
                                                    item-value="id"
                                                    chips
                                                    return-object
                                                    multiple
                                                    :items="vehiunloading">
                                    </v-autocomplete>
                                </v-col>
                                <v-col cols="12" sm="3">
                                    <v-text-field label="Способ погрузки"
                                                  :model-value="order.method_of_loading?.title || 'не указано'"
                                                  density="compact"
                                                  hide-details></v-text-field>
                                </v-col>    
                            </v-row>
                            <v-row>
                                <v-col cols="12" sm="9">
                                    <v-textarea label="Комментарий"
                                                rows="2"
                                                v-model="order.comment"></v-textarea>
                                </v-col>
                            </v-row>
                        </v-window-item>
                        <v-window-item value="1">
                            <ar-order-carriers :order="order" 
                                               ref="carriers"
                                               v-on:assign="assDlg = true" />
                        </v-window-item>
                        <v-window-item value="2">
                        </v-window-item>
                    </v-window>    
                </v-card-text>
                <v-card-actions>
                    <v-spacer />
                    <v-btn variant="elevated"
                           prepend-icon="mdi-close"
                           v-on:click="show = false">
                        закрыть
                    </v-btn>
                    <v-btn type="submit"
                           variant="elevated"
                           color="primary"
                           :loading="pending"
                           append-icon="mdi-send">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
    <v-dialog v-model="assDlg"
              width="auto">
        <v-toolbar color="primary"
                   flat
                   density="compact"
                   title="Назначить заказ на собственный транспорт">
            <template v-slot:append>
                <v-btn icon="mdi-close"
                       v-on:click="assDlg = false"></v-btn>
            </template>
        </v-toolbar>
        <ar-assign-order :order="order" 
                         v-on:close="assDlg = false"
                         v-on:success="assDlg = false; $refs.carriers.reload()" />
    </v-dialog>
</template>
<script>
import JetInputDate from "app-ext/components/editors/JetInputDate";
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import ArAssignOrder from "~/components/ArAssignOrder";
import ArOrderCarriers from "~/components/ArOrderCarriers";
import { empty } from "app-ext/utils";
import { refs } from "~/services/other";
import { getorders } from "~/services/orders";

const rules = {
    empty: val => !empty(val) || "Необходимо заполнить"
};

const _DEFS = {
    id: null,
}, 
statuses = [
        {title: 'На модерации', id: 'ON_MODERATE'},
        {title: 'Открыто на прием заявок', id: 'OPENED_BIDS'},
        {title: 'Закрыт прием заявок', id: 'CLOSED_BIDS'}
];


export default {
    name: 'ArCompanyOrder',
    components: {
        JetInputDate,
        JetInputNumber,
        ArAssignOrder,
        ArOrderCarriers
    },
    emits: ["success"],
    async setup(){
        const order = ref(null),
              routes        = ref([]),
              paytypes      = ref([]),
              vehitypes     = ref([]),
              vehiloading   = ref([]),
              vehiunloading = ref([]);
              
        useAsyncData('references', async ()=>{
            try {
                if (routes.value.length < 1){
                    routes.value = await refs('routes');
                }
                if (paytypes.value.length < 1){
                    paytypes.value = await refs('paytypes');
                }
                if (vehitypes.value.length < 1){
                    vehitypes.value = await refs('vehitypes');
                }
                if (vehiloading.value.length < 1){
                    vehiloading.value = await refs('vehiloading');
                }
                if (vehiunloading.value.length < 1){
                    vehiunloading.value = await refs('vehiunloading');
                }
            } catch(e){
                console.log('ERR (refs)', e);
            }
        }); //references
        
        
        const { data, pending, error } = useAsyncData('company-order', async ()=>{
            try {
                let _o;
                if ( order.value?.id ){
                    _o = await getorders({
                                perPage: -1,
                                filters: `id:${ order.value.id }`
                            });
                    _o = _o.result.items.at(0);
                }
                console.log('order', _o);
                order.value = _o;
            } catch(e){
                console.log('ERR (order)', e);
            }
            return true;
        });
        
        
        
        return {
            routes,
            paytypes,
            vehitypes,
            vehiloading,
            vehiunloading,
            pending,
            error,
            order
        };
    },
    data(){
        return {
            rules,
            tab: 0,
            show: false,
            statuses,
            assDlg: false
        };
    },
    computed: {
        distance(){
            let n = this.routes.findIndex( r => r.id == this.order.move_directions_id );
            return (n < 0) ? 'n/a' : `${ this.routes[n].distance } км`;
        }
    },
    methods: {
        has(q){
            switch(q){
                case 'order':
                    return Number(this.order?.id || 0) > 0;
            }
            return false;
        },
        open(order){
            this.order = {id: order?.id||0};
            refreshNuxtData('company-order');
            this.tab = 0;
            this.show = true;
            this.$nextTick(()=>{
                $("input[name=price]").trigger("focus");
            });
        },
        async save(){
            let { valid } = await this.$refs["order_form"].validate();
            if (!valid){
                return false;
            }
            this.pending = true;
            try {
                const res = await $jet.api({
                    url: `/orders_moderate/${ this.order.id }`,
                    method: 'PUT',
                    body: {
                        comment:            this.order.comment,
                        immobility_price:   this.order.immobility_price,
                        move_directions_id: this.order.move_directions_id,
                        orders_payments_types_id: this.order.orders_payments_types_id,
                        price:              this.order.price,
                        price_vat:          this.order.price_vat,
                        status:             this.order.status,
                        vehicle_types:      this.order.vehicle_types,
                        vehicles_loading_types: this.order.vehicles_loading_types,
                        vehicles_unloading_types: this.order.vehicles_unloading_types
                    }
                });
                if (res.success){
                    this.show = false;
                    this.$emit('success', res.result);
                } else {
                    throw {message: res.error};
                }
            } catch(e){
                console.log('ERR (save)', e);
                $jet.msg({text: `Ошибка сохранения изменений:<br />${ $jet.api.$errm }<br />${ e.message }`, color: 'warning', timeout: 6000});
            } finally {
                this.pending = false;
            }
            return false;
        }
    }
}
</script>
<style lang="scss">
    .ar-order{
        height: 100%;
        background: #fff;
        & form{
            height: 100%;
        }
    }
</style>