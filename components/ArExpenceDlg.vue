<template>
    <v-dialog max-width="800"
              min-height="640"
              scrollable
              v-model="show">
        <v-toolbar color="primary"
                   density="compact">
            <v-toolbar-title>
                {{ exp.id > 0 ? 'редактирование' : 'новая запись' }}
            </v-toolbar-title>
            <template v-slot:append>
                <v-btn rounded="0"
                       icon="mdi-close"
                       v-on:click="show = false"></v-btn>
            </template>
        </v-toolbar>
        <v-form ref="form"
                v-on:submit.stop.prevent="save">
            <v-card rounded="0">
                <v-card-text class="pb-5">
                    <v-row>
                        <v-col cols="12" sm="4">
                            <jet-input-date label="Дата"
                                            type="date"
                                            v-model="exp.date" />
                        </v-col>
                        <v-col cols="12" sm="8">
                            <v-autocomplete label="Статья расходов"
                                            v-model="exp.expenses_type"
                                            density="compact"
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            :items="exp_types"
                                            return-object>
                                <template v-slot:item="{item, props}">
                                    <v-list-item v-bind="props"
                                                 :prepend-icon="('VEHICLE_TYPE'==item.raw.expenses_type) ? 'mdi-truck-outline' : ('DRIVER_TYPE'==item.raw.expenses_type) ? 'mdi-account-cowboy-hat-outline' : 'mdi-shopping-outline'"
                                                 :title="item.title">
                                    </v-list-item>
                                </template>
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row v-if="'VEHICLE_TYPE' === exp.expenses_type?.expenses_type">
                        <v-col cols="12">
                            <v-autocomplete label="Транспорт"
                                            v-model="exp.entity_id"
                                            density="compact"
                                            hide-details
                                            item-title="reg_number"
                                            item-value="id"
                                            :items="vehicles"
                                            v-on:update:modelValue="set('vehicle', $event)">
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row v-if="'DRIVER_TYPE' === exp.expenses_type?.expenses_type">
                        <v-col cols="12">
                            <v-autocomplete label="Водитель"
                                            v-model="exp.entity_id"
                                            density="compact"
                                            hide-details
                                            item-title="user.full_name"
                                            item-value="id"
                                            :items="drivers">
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12">
                            <v-autocomplete label="Юр.лицо"
                                            v-model="exp.legal_entity_id"
                                            density="compact"
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            :items="legals">
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12">
                            <v-textarea label="Комментарий"
                                        rows="1"
                                        v-model="exp.description"></v-textarea>
                        </v-col>
                    </v-row>
                    <v-row>
                        <v-col cols="12" sm="4">
                            <jet-input-number label="Сумма"
                                              name="price"
                                              type="currency"
                                              v-model="exp.cost_original"
                                              density="compact"
                                              :required="true"
                                              hide-details></jet-input-number>
                        </v-col>
                        <v-col cols="12" sm="4">
                            <v-checkbox label="Добавить % налога к сумме"
                                        v-model="isTax">
                            </v-checkbox>
                        </v-col>
                        <v-col cols="12" sm="4" v-if="isTax">
                            <jet-input-number label="Налог, %"
                                              type="currency"
                                              v-model="exp.tax"
                                              density="compact"
                                              name="tax"
                                              hide-details></jet-input-number>
                        </v-col>    
                        <v-col cols="12" sm="4" v-else>
                            <v-autocomplete label="Ставка НДС"
                                            v-model="exp.vat_rate_id"
                                            density="compact"
                                            clearable
                                            hide-details
                                            item-title="title"
                                            item-value="id"
                                            :items="vats">
                            </v-autocomplete>
                        </v-col>
                    </v-row>
                    <v-table density="compact"
                             class="mt-3">
                        <thead>
                          <tr>
                            <th class="text-center">Сумма</th>
                            <th class="text-center">{{ isTax ? 'Налог' : 'НДС' }}</th>
                            <th class="text-center">Итог</th>
                          </tr>
                        </thead>
                        <tbody v-show="all.cost">
                            <tr>
                                <td class="text-right">{{ currformat(all.cost) }}</td>
                                <td class="text-right">{{ currformat(all.tax) }}</td>
                                <td class="text-right">{{ currformat(all.total) }}</td>
                            </tr>
                        </tbody>
                    </v-table>
                    <v-checkbox label="Разделить на всех"
                                v-model="shareAll">
                    </v-checkbox>
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
</template>
<script setup>
    import { ref, computed, watch, defineEmits, nextTick } from 'vue';
    import JetInputDate from "app-ext/components/editors/JetInputDate";
    import JetInputNumber from "app-ext/components/editors/JetInputNumber";
    import { currformat, date2php } from "app-ext/utils";
    import { profile } from "app-ext/composables/profile";
    import { refs } from "~/services/other";
    
    const emit = defineEmits(['success']);
    
    const _DEFS = {
        id: 0,
        expenses_type: null,
        entity_id: null,
        legal_entity: null,
        description: null,
        cost_original: 0,
        tax: null,
        vat_rate_id: null
    };
    
    /* references */
    const exp_types = ref([]),
          vehicles  = ref([]),
          drivers   = ref([]),
          legals    = ref([]),
          vats      = ref([]);
    
    const form = ref(null),
          show = ref(false),
          exp  = ref(null),
          pending= ref(false),
          isTax  = ref(false),
          shareAll=ref(false);
    
    const all = computed(()=>{
        const res = {
            cost: 0,
            vat: 0,     //ставка
            tax: 0,     //сумма налога
            total: 0
        };
        if (exp.value){
            let tax  = exp.value.tax || 0;
            if ( !isTax.value ){
                let n = vats.value.findIndex( v => v.id === (exp.value.vat_rate_id||-1) );
                tax = n < 0 ? 0 : vats.value[n].size;
            }
            res.vat = tax;
            
            res.cost = exp.value.cost_original || 0;
            res.tax  = ( isTax.value ) ? (res.cost / 100) * tax : res.cost / (100 + tax) * tax;
            res.tax  = Math.floor(res.tax*100)/100;
            res.cost = Math.floor((( isTax.value ) ? res.cost : res.cost - res.tax)*100)/100;
            res.total= res.cost + res.tax;
        }
        return res;
    });
    
    watch(isTax, val => {
        if ( val ) {
            exp.value.vat_rate = null;
            nextTick(()=>{$('input[name="tax"]').trigger("focus");});
        }
    });
    
    defineExpose({
        open: e => {
            var e = ( e ) ? {...e} : Object.assign( {..._DEFS}, {date: new Date()});
            if ( e?.expenses_type ){
                if ( "VEHICLE_TYPE" === e.expenses_type.expenses_type ){
                    e.entity_id = e.vehicles.at(0)?.id;
                } else if ( "DRIVER_TYPE" === e.expenses_type.expenses_type ){
                    e.entity_id = e.drivers.at(0)?.id;
                }
            }
            isTax.value = false;
            shareAll.value=false;
            exp.value = e;
            show.value = true;
        }
    });
    
    useAsyncData('references', async ()=>{
        pending.value = true;
        try {
            if (exp_types.value.length < 1){
                exp_types.value = await refs('exp_types');
            }
            if (vehicles.value.length < 1){
                vehicles.value = await refs('vehicles');
            }
            if (drivers.value.length < 1){
                drivers.value = await refs('drivers');
            }
            if (legals.value.length < 1){
                legals.value = await refs('legals');
            }
            if (vats.value.length < 1){
                vats.value = await refs('vat_rates');
            }
        } catch(e){
            console.log('ERR (refs)', e);
        } finally {
            pending.value = false;
        }
    }); //references
        
    const set = (q, item) => {
        console.log('set', item);
        switch(q){
            case 'vehicle':
                let n = vehicles.value.findIndex( v => v.id === item );
                if ( n > -1 ){
                    exp.value.legal_entity_id = vehicles.value[n].legal_entity_id;
                }
                break;
                
        }
    };  //set
    
    const save = async e => {
        let ok = await form.value.validate();
        if (!ok){
            return;
        }
        
        pending.value = true;
        
        try {
            const opts = {
                method: (exp.value.id > 0) ? "PUT" : "POST",
                url: '/expenses',
                body: {...exp.value}
            };
            opts.body.date = date2php(exp.value.date);
            opts.body.expenses_type_id = exp.value.expenses_type.id;
            
            if (exp.value.id > 0){
                opts.url += `/${exp.value.id}`;
            } else {
                delete opts.body.id;
            }
            
            if (shareAll.value) {
                opts.body.for_all = true;
            }
            if (exp.value.legal_entity_id){
                opts.body.legal_entity = {id: exp.value.legal_entity_id};
            }
            if ('VEHICLE_TYPE' === exp.value.expenses_type.expenses_type){
                opts.body.vehicles = [{id: exp.value.entity_id}];
            } else if ('DRIVER_TYPE' === exp.value.expenses_type.expenses_type){
                opts.body.drivers = [{id: exp.value.entity_id}];
            }
            
            delete opts.body.vat_rate;
            if (isTax.value) {
                delete opts.body.vat_rate_id;
                opts.body.cost_tax = all.value.tax;
                opts.body.cost = all.value.total;
                opts.body.cost_original = all.value.cost;
            } else {
                delete opts.body.tax;
                opts.body.cost = all.value.cost;
                opts.body.cost_original = all.value.total;
            }
            const res = await $jet.api(opts);
            if ( res.success ){
                emit("success", res.result.id);
                show.value = false;
            } else {
                throw {message: res.error};
            }
        } catch(e){
            console.log('ERR (save)', e);
            $jet.msg({text: `Ошибка сохранения:<br />${ e.message }<br />${$jet.api.$errm}`, color: 'warning'});
        } finally {
            pending.value = false;
        }
    };  //save
    
    
    const log = item => console.log(item);
</script>
<style lang="scss" scoped>
    .v-table{
        background-color: #f5f5f5;
        font-size: 0.9rem;
        border: 1px solid #ccc;
        box-shadow: 2px 2px 4px rgba(0,0,0,0.09);
        & tr {
            & th {
                text-align: center;
                width: calc(100% / 3 - 2px);
            }
            & td{
                font-weight: 600;
                &:not(:first-child){
                    border-left: 1px solid #ccc;
                }
            }
        }
    }
</style>