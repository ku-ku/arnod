<template>
    <ar-simple-dialog title="Водитель"
                      icon="mdi-account"
                      v-model="show"
                      :width="480"
                      :loading="pending"
                      v-on:save="save">
        <v-row dense>
            <v-col cols="12">
                <jet-input-date v-model="start"
                                type="date"
                                required
                                label="Дата начала" />
            </v-col>
        </v-row>
        <v-row dense>
            <v-col cols="12">
                <jet-input-date v-model="end"
                                type="date"
                                label="Дата окончания" />
            </v-col>
        </v-row>
        <v-row dense>
            <v-col cols="12">
                <v-autocomplete label="Водитель"
                                v-model="day.drivers.id"
                                clearable
                                density="compact"
                                hide-details
                                name="trailer"
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

export default {
    name: 'ArCoupDriver',
    components: {
        ArSimpleDialog,
        JetInputDate
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
        }
    },
    data(){
        return {
            show: false,
            day: null
        };
    },
    computed: {
        start: {
            get(){
                let $m = this.day?.drivers?.start || this.day?.day;
                return $m ? $m.toDate() : null;
            }, 
            set(val){
                this.day.drivers.start = (val) ? $moment(val) : null;
            }
        },
        end: {
            get(){
                let $m = this.day?.drivers?.end;
                return $m ? $m.toDate() : null;
            },
            set(val){
                this.day.drivers.end = (val) ? $moment(val) : null;
            }
        }
    },
    methods: {
        open(day){
            this.day = day;
            if (!this.day.drivers){
                this.day.drivers = {
                    id: null,
                    start: $moment(this.day.day),
                    end: null
                }
            }
            this.show = true;
        },
        async save(){
            if (!this.day.drivers){
                return false;
            }
            
            this.pending = true;
            
            try {
                const body = {
                        start_date: this.day.drivers.start.format('YYYY-MM-DD'),
                        driver_id:  this.day.drivers.id
                };
                
                if (this.end){
                    body.end_date = this.day.drivers.end.format('YYYY-MM-DD');
                }
                
                let res = await $jet.api({
                    url: `/vehicles/${ this.day.vehicle_id }/attach/driver`,
                    method: 'POST',
                    body
                });
                console.log('save', res);
                if (res.success){
                    this.$emit("success", this.day);
                    this.show = false;
                }
            } catch(e){
                console.log('ERR (driver)', e);
                $jet.msg({
                            text: `Ошибка назначения водителя.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                this.pending = false;
            }
        }
    }
}
</script>