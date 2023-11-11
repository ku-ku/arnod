<template>
    <v-menu :close-on-content-click="false"
            v-model="menu"
            content-class="ar-fuel">
        <template v-slot:activator="props">
            <slot name="activator"
                  v-bind="props"></slot>
        </template>
        <v-progress-linear color="primary" 
                           indeterminate
                           v-if="loading"></v-progress-linear>
        <v-list nav
                density="compact">
            <template v-if="full">
                <v-list-item>
                    <jet-input-number v-model="remain"
                                      type="integer"
                                      label="количество литров" />
                </v-list-item>    
                <v-divider />
            </template>
            <v-list-subheader>{{ full ? 'стало в баке' : 'остаток'}}</v-list-subheader>
            <v-list-item v-for="(v, n) in _TANK_FUEL" 
                         :key="'fuel-' + n"
                         :title="(1==v.val) ? vehicle.fuel_capacity + ' л.': v.name"
                         :value="v.val"
                         color="primary"
                         v-on:click="onrelative(v)">
                <template v-slot:prepend>
                    <v-icon :style="{opacity: (v.val==0) ? 0.1 : v.val}">mdi-water</v-icon>
                </template>
            </v-list-item>
            <v-divider />
            <v-list-item title="заправка" prepend-icon="mdi-gas-station"
                         v-show="!full"
                         v-on:click.stop.prevent="full = true"></v-list-item>
            <template v-if="full">
                <v-divider />
                <v-list-item class="justify-end">
                    <v-btn size="small" flat 
                           v-on:click="full = false"><v-icon>mdi-close</v-icon>
                    </v-btn>
                    <v-btn size="small" 
                           color="primary"
                           :loading="loading"
                           append-icon="mdi-send"
                           v-on:click="onfull">
                        сохранить
                    </v-btn>
                </v-list-item>
            </template>    
        </v-list>
    </v-menu>
</template>
<script>
import JetInputNumber from "app-ext/components/editors/JetInputNumber";
import { profile } from "app-ext/composables/profile";
import { all } from "~/composables/data";

const _TANK_FUEL = [
    {name: '0',   val: 0},
    {name: '1/4', val: 0.25}, 
    {name: '1/2', val: 0.5},
    {name: '3/4', val: 0.75},
    {name: '1',   val: 1}
];

export default {
    name: 'ArFuel',
    emits: ['update'],
    components: {
        JetInputNumber
    },
    data(){
        return {
            _TANK_FUEL,
            loading: false,
            menu: false,
            full: false,
            remain: 0,
            relremain: 0
        };
    },
    computed: {
        vehicle(){
            return all.vehicle;
        }
    },
    methods: {
        onrelative(val){
            this.relremain = val.val;
            if (!this.full){
                this.sendrelative();
            }
        },
        async _send(params){
            this.loading = true;
            try {
                params.vehicle = {id: this.vehicle.id};
                params.user_id = profile.subject.id;
                params.id = 0;
                let res = await $jet.api({
                    url: this.full ? '/refills' : '/fuel',
                    key: this.full ? 'refills' : 'fuel',
                    method: 'POST',
                    body: params
                });
                console.log('saved', res);
                if (res.success){
                    this.$emit('update');
                } else {
                    throw {message: res.error};
                }
            } catch(e){
                console.log('ERR(relative)', e);
                $jet.msg({text: `Не удается сохранить информацию о топливе, попробуйте еще раз<br /><small>${ e.message }</small>`, type: 'warning'});
            } finally {
                this.menu = false;
                this.loading = false;
            }
        },  //_send
        sendrelative(){
            this._send({ relative_remain: this.relremain });
        },
        onfull(){
            this._send({
                            fuel_amount: this.relremain, 
                            refueled: this.remain
                        });
        }
    },
    watch: {
        full(val){
            if (val){
                this.$nextTick(()=>{
                    $(".ar-fuel input").focus();
                });
            }
        }
    }
}
</script>