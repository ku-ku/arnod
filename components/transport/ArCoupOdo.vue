<template>
    <ar-simple-dialog title="Пробег"
                      icon="mdi-truck-fast-outline"
                      v-model="show"
                      :width="480"
                      :loading="pending"
                      v-on:save="save">
        <v-row>
            <v-col cols="12">
                <jet-input-date v-model="odo.start"
                                type="date"
                                required
                                label="Дата" />
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <jet-input-number v-model="odo.distance"
                                  autofocus
                                  type="integer"
                                  name="distance"
                                  required
                                  :messages="odo.last"
                                  label="Пробег" />
            </v-col>
        </v-row>
        <v-row>
            <v-col cols="12">
                <v-autocomplete label="Водитель"
                                v-model="odo.driver_id"
                                clearable
                                density="compact"
                                hide-details
                                name="driver"
                                item-title="user.full_name"
                                item-value="id"
                                :items="drivers">
                </v-autocomplete>
            </v-col>
        </v-row>
    </ar-simple-dialog>
</template>
<script>
import { refs } from "~/services/other";
import ArSimpleDialog from "../ArSimpleDialog";
import JetInputDate from "app-ext/components/editors/JetInputDate";
import JetInputNumber from "app-ext/components/editors/JetInputNumber";

export default {
    name: 'ArCoupOdo',
    components: {
        ArSimpleDialog,
        JetInputDate,
        JetInputNumber
    },
    emits: ['success'],
    async setup(){
        const {data: drivers, pending} = useAsyncData('drivers', async ()=>{
            let res = [];
            try {
                res = await refs('drivers');
            } catch(e){
                console.log('ERR(drivers)', e);
            }
            return res;
        });
        return {
            drivers,
            pending
        };
    },
    data(){
        return {
            show: false,
            odo: null
        };
    },
    methods: {
        open(odo){
            this.odo = odo;
            if (!this.odo.start){
                this.odo.start = $moment().startOf('day').toDate();
            }
            if ( !(this.odo.id > 0) ){
                this.odo.distance = null;
            }
            this.show = true;
            this.$nextTick(()=>{
                $(this.$el).find("input[name=distance]").focus();
            });
        },
        async save(){
            if (!this.odo){
                return false;
            }
            
            this.pending = true;
            
            try {
                const body = {
                    date: $moment(this.odo.start).format('YYYY-MM-DD'),
                    distance: Number(this.odo.distance),
                    type: "km",
                    vehicle: {id: this.odo.vehicle_id}
                };
                if (this.odo.driver_id){
                    body.driver_id = this.odo.driver_id;
                }
                
                let res = await $jet.api({
                    url: (this.odo.id > 0) ? `/odometers/${this.odo.id}` : `/odometers`,
                    method: (this.odo.id > 0) ? 'PUT' : 'POST',
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
                            text: `Ошибка записи пробега.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                this.pending = false;
            }
        }
    }
}
</script>
