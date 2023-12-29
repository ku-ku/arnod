<template>
    <ar-simple-dialog title="Статус"
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
                <v-autocomplete label="Статус"
                                v-model="day.status.id"
                                clearable
                                density="compact"
                                hide-details
                                name="status"
                                item-title="title"
                                item-value="id"
                                :items="statuces">
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
    name: 'ArCoupStatus',
    components: {
        ArSimpleDialog,
        JetInputDate
    },
    emits: ['success'],
    async setup(){
        const {data: statuces, pending} = useAsyncData('statuces', async ()=>{
            let res = [];
            try {
                res = await $jet.api({
                                url: '/vehicle/statuses/by/mechanic',
                                params: { columns: 'id,title' }
                });
                if (res.success){
                    res = res.result;
                }
            } catch(e){
                console.log('ERR(statuces)', e);
            }
            return res;
        });
        return {
            statuces,
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
                let $m = this.day?.status?.start || this.day?.day;
                return $m ? $m.toDate() : null;
            }, 
            set(val){
                this.day.status.start = (val) ? $moment(val) : null;
            }
        },
        end: {
            get(){
                let $m = this.day?.status?.end;
                return $m ? $m.toDate() : null;
            },
            set(val){
                this.day.status.end = (val) ? $moment(val) : null;
            }
        }
    },
    methods: {
        open(day){
            this.day = day;
            if (!this.day.status){
                this.day.status = {
                    id: null,
                    start: $moment(this.day.day),
                    end: null
                };
            }
            this.show = true;
        },
        async save(){
            if (!this.day.status){
                return false;
            }
            
            this.pending = true;
            
            try {
                const body = {
                    start_date: this.day.status.start.format('YYYY-MM-DD'),
                    status_id:  this.day.status.id
                };
                
                if (this.end){
                    body.end_date = this.day.status.end.format('YYYY-MM-DD');
                }
                
                let res = await $jet.api({
                    url: `/vehicles/${ this.day.vehicle_id }/attach/status`,
                    method: 'POST',
                    body
                });
                console.log('save', res);
                if (res.success){
                    this.$emit("success", this.day);
                    this.show = false;
                }
            } catch(e){
                console.log('ERR (status)', e);
                $jet.msg({
                            text: `Ошибка установки статуса.<br /><small>Информация для техподдержки: ${ e.message } ${$jet.api.$errm}`, 
                            color: 'warning'
                });
            } finally {
                this.pending = false;
            }
        }
    }
}
</script>
