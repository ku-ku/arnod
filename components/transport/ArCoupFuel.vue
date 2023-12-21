<template>
    <ar-simple-dialog title="Остаток топлива"
                      icon="mdi-gas-station-outline"
                      v-model="show"
                      :width="480"
                      :loading="pending"
                      v-on:save="save">
        <v-row>
            <v-col cols="12">
                <v-radio-group v-model="fuel.remain" inline
                               :messages="fuel.last||''">
                    <v-radio label="0"   :value="0"></v-radio>
                    <v-radio label="1/4" :value="0.25"></v-radio>
                    <v-radio label="1/2" :value="0.5"></v-radio>
                    <v-radio label="3/4" :value="0.75"></v-radio>
                    <v-radio label="Полный" :value="1"></v-radio>
                </v-radio-group>
            </v-col>
        </v-row>
    </ar-simple-dialog>
</template>
<script>
import { refs } from "~/services/other";
import ArSimpleDialog from "../ArSimpleDialog";
import JetInputDate from "app-ext/components/editors/JetInputDate";

export default {
    name: 'ArCoupOdo',
    components: {
        ArSimpleDialog,
        JetInputDate
    },
    emits: ['success'],
    data(){
        return {
            show: false,
            pending: false,
            fuel: null
        };
    },
    methods: {
        open(fuel){
            this.fuel = fuel;
            this.show = true;
        },
        async save(){
            if (!this.fuel){
                return false;
            }
            
            this.pending = true;
            
            try {
                const body = {
                    relative_remain: this.fuel.remain,
                    driver_id: this.fuel.driver_id,
                    vehicle: {id: this.fuel.vehicle_id}
                };
                let res = await $jet.api({
                    url: `/fuel`,
                    method: 'POST',
                    body
                });
                console.log('save', res);
                if (res.success){
                    this.$emit("success", res.result);
                    this.show = false;
                }
            } catch(e){
                console.log('ERR (odo)', e);
                $jet.msg({
                            text: `Ошибка записи топлива.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                this.pending = false;
            }
        }
    }
}
</script>

