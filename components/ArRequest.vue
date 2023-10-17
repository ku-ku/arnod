<template>
    <v-dialog fullscreen
              min-height="640"
              scrollable
              v-model="show"
              persistent
              :open-delay="100"
              content-class="ar-order">
        <v-toolbar :color="(1==order?.is_priority) ? 'indigo' : 'primary'"
                   flat
                   extension-height="48px"
                   density="compact">
            <v-toolbar-title>
                <template v-if="has('order')">
                    {{ order.number + '. ' + (order.move_direction?.title || '')}}
                    <div class="text-muted">
                        создан {{ order.at }}
                    </div>
                </template>
                <template v-else>
                    Новый заказ
                </template>
            </v-toolbar-title>
            <template v-slot:append>
                <v-btn rounded="0"
                       icon="mdi-close"
                       v-on:click="show = false"></v-btn>
            </template>
            <template v-slot:extension>
                <v-row class="ml-1">
                    <v-col cols="6" sm="4">
                        <v-checkbox label="Приоритетный заказ"
                                    hide-details
                                    :false-value="0"
                                    :true-value="1"
                                    v-model="order.is_priority" />
                    </v-col>
                    <v-col cols="6" sm="4">
                        <v-autocomplete label="Статус"
                                        v-model="order.status"
                                        density="compact"
                                        item-title="title"
                                        item-value="id"
                                        :rules="[rules.empty]"
                                        :items="statuses">
                        </v-autocomplete>
                    </v-col>
                </v-row>
            </template>
            </v-toolbar>
            <v-form ref="form"
                    fast-fail
                    :disabled="pending"
                    :readonly="order.status === 'COMPLETED'"
                    v-on:submit.stop.prevent="save">
            <v-card rounded="0"
                    class="fill-height">
                <v-card-text>
                    <v-row>
                        <v-col cols="12" sm="4">
                            <v-autocomplete label="Контрагент"
                                            density="compact"
                                            v-model="order.contractors_id"
                                            item-title="title"
                                            item-value="id"
                                            name="contractors_id"
                                            :rules="[rules.empty]"
                                            :items="contractors"></v-autocomplete>
                        </v-col>
                        <v-col cols="12" sm="8">
                            <v-autocomplete label="Направление"
                                            v-model="order.move_direction"
                                            name="move_direction"
                                            clearable
                                            density="compact"
                                            item-title="title"
                                            item-value="id"
                                            return-object
                                            :rules="[rules.empty]"
                                            :hint="distance"
                                            :items="routes">
                                <template v-slot:append>
                                    <v-menu>
                                        <template v-slot:activator="{ props }">
                                            <v-btn size="small" 
                                                   flat
                                                   rounded="0"
                                                   icon="mdi-dots-vertical"
                                                   v-bind="props"></v-btn>
                                        </template>
                                        <v-list density="compact" nav>
                                            <v-list-item title="создать новое"
                                                         prepend-icon="mdi-plus"
                                                         v-on:click="onmap(null)"></v-list-item>
                                            <v-divider />
                                            <v-list-item title="открыть"
                                                         prepend-icon="mdi-map-marker-distance"
                                                         :disabled="!order.move_direction"
                                                         v-on:click="onmap(order.move_direction)"></v-list-item>
                                        </v-list>
                                    </v-menu>
                                </template>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row class="highlighted">
                        <v-col cols="12" class="text-subtitle-1">
                            <v-icon size="small">mdi-corn</v-icon>&nbsp;Груз
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-autocomplete label="Наименование"
                                            v-model="order.cargo_name_id"
                                            name="cargo_name_id"
                                            clearable
                                            density="compact"
                                            item-title="title"
                                            item-value="id"
                                            hide-details
                                            :rules="[rules.empty]"
                                            :items="cargo_names">
                            </v-autocomplete>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-autocomplete label="Тип груза"
                                            v-model="order.cargo_types_id"
                                            name="cargo_types_id"
                                            clearable
                                            density="compact"
                                            item-title="title"
                                            item-value="id"
                                            hide-details
                                            :rules="[rules.empty]"
                                            :items="cargo_types">
                            </v-autocomplete>
                        </v-col>
                        <v-col>
                            <v-autocomplete label="Ед.изм."
                                            v-model="order.cargo_units_id"
                                            name="cargo_units_id"
                                            clearable
                                            density="compact"
                                            item-title="title"
                                            item-value="id"
                                            hide-details
                                            :rules="[rules.empty]"
                                            :items="cargo_units">
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row class="highlighted">
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Норма естественной убыли"
                                          density="compact"
                                          type="currency"
                                          v-model="order.cargo_decrease"
                                          name="cargo_decrease"
                                          hide-details></jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Количество единиц загрузки на ТС"
                                          type="currency"
                                          density="compact"
                                          v-model="order.vehicle_cargo_units_count"
                                          name="vehicle_cargo_units_count"
                                          hide-details></jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="2">
                            <jet-input-number label="Количество"
                                          type="currency"
                                          density="compact"
                                          required
                                          v-model="order.cargo_units_count"
                                          name="cargo_units_count"
                                          hide-details></jet-input-number >
                        </v-col>
                    </v-row>
                    <v-row style="margin-bottom: -2rem;margin-top: 1rem;">
                        <v-col cols="8" class="text-subtitle-1">
                            <v-icon size="small">mdi-calculator-variant-outline</v-icon>&nbsp;Расчет
                        </v-col>
                        <v-col cols="4">
                            <v-checkbox label="Запрос ставки" 
                                        color="primary"
                                        density="compact"
                                        hide-details
                                        :false-value="0"
                                        :true-value="1"
                                        name="is_request_price"
                                        v-model="order.is_request_price" />
                        </v-col>
                    </v-row>    
                    <v-row>
                        <v-col cols="12" sm="4">
                            <v-btn-toggle v-model="order.price_type"
                                          :color="(1==order?.is_priority) ? 'indigo' : 'primary'"
                                          dark
                                          size="small"
                                          density="compact"
                                          variant="flat"
                                          rounded="0">
                                <v-btn :value="0">
                                    За ед.груза
                                </v-btn>
                                <v-btn :value="1">
                                    За машину
                                </v-btn>
                            </v-btn-toggle>     
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-autocomplete label="Тип оплаты"
                                            v-model="order.orders_payments_types_id"
                                            name="orders_payments_types_id"
                                            density="compact"
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            :items="paytypes">
                            </v-autocomplete>
                        </v-col>
                        <template v-if="1==order.is_request_price">
                            <v-col cols="12" sm="2">
                                <jet-input-number :label="'Цена за ' + ((order.price_type || 0) === 0 ? 'единицу груза' : 'транспорт')"
                                                  type="currency"
                                                  v-model="order.price"
                                                  name="price"
                                                  density="compact"
                                                  readonly
                                                  hide-details></jet-input-number>
                            </v-col>
                            <v-col cols="12" sm="2">
                                <jet-input-number label="Оплата простоя, руб/дн"
                                              type="currency"
                                              v-model="order.immobility_price"
                                              name="immobility_price"
                                              density="compact"
                                              readonly
                                              hide-details></jet-input-number>
                            </v-col>
                        </template>    
                    </v-row>
                    <v-row class="pt-5 highlighted">
                        <v-col cols="4" class="text-subtitle-1">
                            <v-badge :content="days('loading') + ' дн.'" 
                                     :offset-x="-16"
                                     color="grey">
                                <v-icon>mdi-download-outline</v-icon>&nbsp;Погрузка
                            </v-badge>
                        </v-col>
                        <v-col cols="8" class="text-subtitle-1">
                            <v-badge :content="days('unloading') + ' дн.'"
                                     :offset-x="-16"
                                     color="grey">
                                <v-icon>mdi-upload-outline</v-icon>&nbsp;Выгрузка
                            </v-badge>
                        </v-col>
                    </v-row>
                    <v-row class="highlighted">
                        <v-col cols="6" sm="2">
                            <jet-input-date label="Начало"
                                            type="date"
                                            required
                                            v-model="order.loading_start_date"
                                            name="loading_start_date"></jet-input-date>
                        </v-col>
                        <v-col cols="6" sm="2">
                            <jet-input-date label="Окончание"
                                            type="date"
                                            required
                                            v-model="order.loading_end_date"
                                            name="loading_end_date"></jet-input-date>
                        </v-col>
                        <v-col cols="6" sm="2">
                            <jet-input-date label="Начало"
                                            type="date"
                                            required
                                            v-model="order.unloading_start_date"
                                            name="unloading_start_date"></jet-input-date>
                        </v-col>
                        <v-col cols="6" sm="2">
                            <jet-input-date label="Окончание"
                                            type="date"
                                            required
                                            v-model="order.unloading_end_date"
                                            name="unloading_end_date"></jet-input-date>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" class="text-subtitle-1">
                            <v-icon size="small">mdi-truck-outline</v-icon>&nbsp;Транспорт
                        </v-col>
                        <v-col cols="12" sm="3">
                            <v-autocomplete label="Тип транспорта"
                                            :disable="order.status === 'COMPLETED'"
                                            v-model="order.vehicle_types"
                                            name="vehicle_types"
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
                                            v-model="order.vehicles_loading_types"
                                            name="vehicles_loading_types"
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
                            <v-autocomplete label="Способ погрузки"
                                            v-model="order.method_of_loading_id"
                                            name="method_of_loading_id"
                                            density="compact"
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            chips
                                            return-object
                                            multiple
                                            :items="method_of_loading">
                            </v-autocomplete>
                        </v-col>    
                        <v-col cols="12" sm="3">
                            <v-autocomplete label="Тип выгрузки"
                                            :disable="order.status === 'COMPLETED'"
                                            v-model="order.vehicles_unloading_types"
                                            name="vehicles_unloading_types"
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
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="9">
                            <v-textarea label="Комментарий"
                                        rows="2"
                                        name="comment"
                                        v-model="order.comment"></v-textarea>
                        </v-col>
                    </v-row>
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
                           :color="(1==order?.is_priority) ? 'indigo' : 'primary'"
                           :loading="pending"
                           append-icon="mdi-send">
                        сохранить
                    </v-btn>
                </v-card-actions>
            </v-card>
        </v-form>
    </v-dialog>
    <ar-route ref="aroute" 
              v-on:success="onroute" />
</template>
<script>
import JetInputDate from "app-ext/components/editors/JetInputDate";
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import ArRoute from "~/components/ArRoute";
import { empty } from "app-ext/utils";
import { profile } from "app-ext/composables/profile";
import { refs } from "~/services/other";
import { getorders } from "~/services/orders";

const rules = {
    empty: val => !empty(val) || "Необходимо заполнить"
};

const _DEFS = {
    id: 0,
    contractors_id: null,
    move_direction: null,
    is_priority: 0,
    cargo_name_id: null,
    cargo_types_id: null,
    cargo_units_id: null,
    cargo_units_count_left: 0,
    cargo_decrease: null,
    vehicle_cargo_units_count: null,
    loading_start_date: null,
    loading_end_date: null,
    unloading_start_date: null,
    unloading_end_date: null,
    vehicle_types: null,
    vehicles_loading_types: null,
    vehicles_unloading_types: null,
    method_of_loading: null,
    comment: null,
    is_request_price: 0,
    price_type: 0,
    prev_units_count: 0,
    status: 'OPENED_BIDS'
}, 
statuses = [
        {title: 'На модерации', id: 'ON_MODERATE'},
        {title: 'Открыто на прием заявок', id: 'OPENED_BIDS'},
        {title: 'Закрыт прием заявок', id: 'CLOSED_BIDS'},
        {title: 'Заказа завершен', id: 'COMPLETED'}
];  //statuses


export default {
    name: 'ArRequest',
    components: {
        JetInputDate,
        JetInputNumber,
        ArRoute
    },
    emits: ["success"],
    async setup(){
        const order = ref(null),
              contractors   = ref([]),
              routes        = ref([]),
              cargo_names   = ref([]),
              cargo_types   = ref([]),
              cargo_units   = ref([]),
              paytypes      = ref([]),
              vehitypes     = ref([]),
              vehiloading   = ref([]),
              vehiunloading = ref([]),
              method_of_loading = ref([]);
              
        useAsyncData('references', async ()=>{
            try {
                if (contractors.value.length < 1){
                    contractors.value = await refs('contractors');
                }
                if (routes.value.length < 1){
                    routes.value = await refs('routes');
                }
                if (cargo_names.value.length < 1){
                    cargo_names.value = await refs('cargo_names');
                }
                if (cargo_types.value.length < 1){
                    cargo_types.value = await refs('cargo_types');
                }
                if (cargo_units.value.length < 1){
                    cargo_units.value = await refs('cargo_units');
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
                if (method_of_loading.value.length < 1){
                    method_of_loading.value = await refs('method_of_loading');
                }
            } catch(e){
                console.log('ERR (refs)', e);
            }
            return true;
        }); //references
        
        const { data, pending, error } = useAsyncData('company-order', async ()=>{
            try {
                let _o;
                if ( order.value?.id ){
                    _o = await getorders({
                                perPage: -1,
                                filters: `id:${ order.value.id }`
                            }, false);
                    _o = _o.result.items.at(0);
                    _o.prev_units_count = _o.cargo_units_count; //prev for calc left
                } else {
                    _o = { ..._DEFS };
                    const now = new Date();
                    _o.loading_start_date = new Date(now.getFullYear(), now.getMonth(), now.getDay());
                    _o.loading_end_date = new Date(now.getFullYear(), now.getMonth(), now.getDay());
                    _o.unloading_start_date = new Date(now.getFullYear(), now.getMonth(), now.getDay());
                    _o.unloading_end_date = new Date(now.getFullYear(), now.getMonth(), now.getDay());
                }
                console.log('order', _o);
                order.value = _o;
            } catch(e){
                console.log('ERR (order)', e);
            }
            return true;
        });
        
        return {
            contractors,
            routes,
            cargo_types,
            cargo_names,
            cargo_units,
            paytypes,
            vehitypes,
            vehiloading,
            vehiunloading,
            method_of_loading,
            pending,
            error,
            order
        };
    },
    data(){
        return {
            rules,
            show: false,
            statuses
        };
    },
    computed: {
        distance(){
            if (this.has('order')){
                let n = this.routes.findIndex( r => r.id == this.order.move_directions_id );
                return (n < 0) ? 'n/a' : `${ this.routes[n].distance } км`;
            }
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
        days(q){
            let d1, d2;
            if ( this.order ){
                switch(q){
                    case 'loading':
                        d1 = this.order.loading_start_date;
                        d2 = this.order.loading_end_date;
                        break;
                    case 'unloading':
                        d1 = this.order.unloading_start_date;
                        d2 = this.order.unloading_end_date;
                        break;
                }
            }
            if ( (d1)&&(d2) ){
                return $moment(d2).diff(d1, 'days') + 1;
            }
            return '-';
        },
        open(order){
            this.order = {id: order?.id||0};
            refreshNuxtData('company-order');
            this.show = true;
            setTimeout(()=>{
                $(`input[name=${this.has('order') ? "cargo_units_count" : "contractors_id"}]`).trigger("focus");
            }, 666);
        },
        onmap(route){
            this.$refs["aroute"].open(route);
        },
        onroute(route){
            let n = this.routes.findIndex( r => r.id === route.id );
            if ( n < 0 ){
                this.routes.splice(0, 0, route);
            } else {
                this.routes.splice(n, 0, route);
            }
            this.order.move_direction = route;
        },
        async save(){
            let { valid } = await this.$refs["form"].validate();
            if (!valid){
                return false;
            }
            let add = !(this.order.id > 0);
            this.pending = true;
            try {
                let cargo_units_count_left;
                if (add) {
                    cargo_units_count_left = this.order.cargo_units_count;
                } else {
                    if (this.order.prev_units_count !== this.order.cargo_units_count) {
                        let diff = Math.max(this.order.prev_units_count - this.order.cargo_units_count_left, 0);
                        cargo_units_count_left = Math.max(this.order.cargo_units_count - diff, 0);
                    } else {
                        cargo_units_count_left = Math.min(this.order.cargo_units_count_left, this.order.cargo_units_count);
                    }
                }
                
                const res = await $jet.api({
                    url:    add ? '/orders' : `/orders/${ this.order.id }`,
                    method: add ? 'POST' : 'PUT',
                    body: {
                        contractors_id:       this.order.contractors_id,
                        move_directions_id:   this.order.move_direction?.id || null,
                        is_priority:          this.order.is_priority,
                        cargo_name_id:        this.order.cargo_name_id,
                        cargo_types_id:       this.order.cargo_types_id,
                        cargo_units_id:       this.order.cargo_units_id,
                        cargo_units_count:    this.order.cargo_units_count,
                        cargo_units_count_left: cargo_units_count_left,
                        cargo_decrease:       this.order.cargo_decrease,
                        vehicle_cargo_units_count: this.order.vehicle_cargo_units_count,
                        loading_start_date:   $moment(this.order.loading_start_date).format('YYYY-MM-DD'),
                        loading_end_date:     $moment(this.order.loading_end_date).format('YYYY-MM-DD'),
                        loading_days:         this.days('loading'),
                        unloading_start_date: $moment(this.order.unloading_start_date).format('YYYY-MM-DD'),
                        unloading_end_date:   $moment(this.order.unloading_end_date).format('YYYY-MM-DD'),
                        unloading_days:       this.days('unloading'),
                        vehicle_types:        this.order.vehicle_types || null,
                        vehicles_loading_types: this.order.vehicles_loading_types || null,
                        vehicles_unloading_types: this.order.vehicles_unloading_types || null,
                        method_of_loading:    this.order.method_of_loading || null,
                        comment:              this.order.comment,
                        is_request_price:     this.order.is_request_price,
                        price_type:           this.order.price_type,
/*                        
                        price:                this.order.price,
                        immobility_price:     this.order.immobility_price,
* 
*/
                        status:               this.order.status,
                        users_id:             profile.subject.id,
                    }
                });
                console.log('save', res);
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
            & .v-input--density-compact:has(.v-checkbox-btn){
                line-height: 1;
                -v-input-control-height: fit-content !important;
                --v-input-padding-top: unset;
                --v-input-chips-margin-bottom: unset;
                --v-input-chips-margin-top: unset;
            }
        }
        & .highlighted{
            background-color: #ECEFF1;
        }
        & .text-subtitle-1{
            & .v-icon{
                font-size: 1.5rem;
                color: grey;
            }
        }
    }
</style>
